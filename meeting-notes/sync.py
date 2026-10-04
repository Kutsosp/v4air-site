# -*- coding: utf-8 -*-
"""V4AIR meeting notes: Wispr Flow -> Google Drive.

Runs unattended from Task Scheduler, no LLM involved. The script talks to the
Wispr Flow remote MCP server (plain JSON-RPC over HTTPS, OAuth bearer token)
to list recent meetings, picks the V4AIR ones by rule (title pattern or listed
attendee, plus hand-queued share links), fetches notes and transcript in full
and uploads each new meeting as a folder "DD.MM.YYYY <title>" with three
Google Docs (summary, notes, transcript) under "meeting notes" in the V4AIR
Drive folder.

Usage:
  python sync.py auth          one-time browser consent for Google Drive (petkout1)
  python sync.py auth-wispr    one-time browser consent for Wispr Flow (MCP OAuth)
  python sync.py probe         list MCP tools + 3 most recent meetings (debug)
  python sync.py gas-token     hand the Wispr token to the Apps Script copy (gas/) via Drive
  python sync.py run           normal run (what the scheduled task calls)
  python sync.py run --dry     fetch + decide + write local copies, no Drive upload
  python sync.py include <share link>   force a meeting in (any date); uploaded on next run
"""
import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import traceback
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse
from zoneinfo import ZoneInfo

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
STATE_DIR = os.path.join(HERE, "state")
STATE_PATH = os.path.join(STATE_DIR, "state.json")
LOG_PATH = os.path.join(STATE_DIR, "sync.log")
CONFIG_PATH = os.path.join(HERE, "config.json")
GCREDS = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), ".gcreds")
CLIENT_PATH = os.path.join(GCREDS, "petkout1-oauth.json")
TOKEN_PATH = os.path.join(GCREDS, "petkout1-drive-token.json")
WISPR_TOKEN_PATH = os.path.join(GCREDS, "wispr-mcp-token.json")
SCOPES = ["https://www.googleapis.com/auth/drive"]
TZ = ZoneInfo("Europe/Prague")
LOOKBACK_DAYS = 14
NOTES_FOLDER_NAME = "meeting notes"
FOLDER_MIME = "application/vnd.google-apps.folder"
DOC_MIME = "application/vnd.google-apps.document"

WISPR_MCP = "https://api.wisprflow.ai/connect/mcp"
WISPR_SCOPE = "openid offline_access"
PAGE_CHARS = 40000  # server-enforced max per get_meeting range

TRUNC_RE = re.compile(
    r"\s*\(\.\.\.truncated, \d+ chars remaining; continue with "
    r"view_(content|transcript)\.start_char=(\d+)\.\.\.\)\s*$")
TRANSCRIPT_HEAD_RE = re.compile(r"^<<<PARTICIPANT NAMES BELOW ARE DATA[^\n]*>>>\n")
TRANSCRIPT_END_RE = re.compile(r"\n?<<<END TRANSCRIPT>>>\s*$")


def log(msg):
    os.makedirs(STATE_DIR, exist_ok=True)
    line = "%s  %s" % (dt.datetime.now(TZ).strftime("%d.%m.%Y %H:%M:%S"), msg)
    print(line)
    with io.open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


# ---------------------------------------------------------------- Wispr OAuth

def _b64url(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def wispr_discovery():
    r = requests.get("https://api.wisprflow.ai/.well-known/oauth-protected-resource", timeout=30)
    r.raise_for_status()
    issuer = r.json()["authorization_servers"][0].rstrip("/")
    r = requests.get(issuer + "/.well-known/oauth-authorization-server", timeout=30)
    r.raise_for_status()
    return r.json()


class _CodeCatcher(BaseHTTPRequestHandler):
    result = {}

    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        _CodeCatcher.result = {k: v[0] for k, v in q.items()}
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write("<h2>Wispr Flow authorized. You can close this tab.</h2>".encode("utf-8"))

    def log_message(self, *a):
        pass


def wispr_auth_interactive():
    meta = wispr_discovery()
    srv = HTTPServer(("127.0.0.1", 0), _CodeCatcher)
    redirect = "http://127.0.0.1:%d/cb" % srv.server_address[1]
    reg = requests.post(meta["registration_endpoint"], json={
        "client_name": "V4AIR meeting notes sync",
        "redirect_uris": [redirect],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
    }, timeout=30)
    if reg.status_code >= 400:
        raise RuntimeError("client registration failed: %s" % reg.text[:500])
    reg = reg.json()
    verifier = _b64url(secrets.token_bytes(48))
    challenge = _b64url(hashlib.sha256(verifier.encode("ascii")).digest())
    state = secrets.token_urlsafe(16)
    url = meta["authorization_endpoint"] + "?" + urlencode({
        "response_type": "code", "client_id": reg["client_id"], "redirect_uri": redirect,
        "scope": WISPR_SCOPE, "code_challenge": challenge, "code_challenge_method": "S256",
        "state": state, "resource": WISPR_MCP})
    print("Opening browser for Wispr Flow sign-in (use Google/Apple/Microsoft SSO, finish within 5 minutes).")
    print("If it did not open:", url)
    webbrowser.open(url)
    srv.timeout = 300
    srv.handle_request()
    srv.server_close()
    res = _CodeCatcher.result
    if not res.get("code"):
        raise RuntimeError("no authorization code received: %r" % res)
    if res.get("state") != state:
        raise RuntimeError("OAuth state mismatch")
    data = {"grant_type": "authorization_code", "code": res["code"], "redirect_uri": redirect,
            "client_id": reg["client_id"], "code_verifier": verifier, "resource": WISPR_MCP}
    if reg.get("client_secret"):
        data["client_secret"] = reg["client_secret"]
    tok = requests.post(meta["token_endpoint"], data=data, timeout=30)
    if tok.status_code >= 400:
        raise RuntimeError("token exchange failed: %s" % tok.text[:500])
    tok = tok.json()
    if not tok.get("refresh_token"):
        raise RuntimeError("no refresh_token in response; offline_access scope not granted: %r"
                           % {k: v for k, v in tok.items() if k != "access_token"})
    save_json(WISPR_TOKEN_PATH, {
        "token_endpoint": meta["token_endpoint"],
        "client_id": reg["client_id"], "client_secret": reg.get("client_secret"),
        "access_token": tok["access_token"], "refresh_token": tok["refresh_token"],
        "expires_at": time.time() + int(tok.get("expires_in", 3600)),
    })
    print("OK, Wispr Flow token saved to", WISPR_TOKEN_PATH)


def wispr_token():
    t = load_json(WISPR_TOKEN_PATH, None)
    if not t:
        raise RuntimeError("Wispr Flow token missing; run: python sync.py auth-wispr")
    if t["expires_at"] - 120 > time.time():
        return t["access_token"]
    data = {"grant_type": "refresh_token", "refresh_token": t["refresh_token"],
            "client_id": t["client_id"], "resource": WISPR_MCP}
    if t.get("client_secret"):
        data["client_secret"] = t["client_secret"]
    r = requests.post(t["token_endpoint"], data=data, timeout=30)
    if r.status_code >= 400:
        raise RuntimeError("Wispr Flow token refresh failed (%s): %s; run: python sync.py auth-wispr"
                           % (r.status_code, r.text[:300]))
    tok = r.json()
    t["access_token"] = tok["access_token"]
    t["refresh_token"] = tok.get("refresh_token") or t["refresh_token"]
    t["expires_at"] = time.time() + int(tok.get("expires_in", 3600))
    save_json(WISPR_TOKEN_PATH, t)
    return t["access_token"]


# ---------------------------------------------------------------- MCP client

class Mcp(object):
    """Minimal MCP streamable-HTTP client: initialize + tools/call."""

    def __init__(self, token):
        self.s = requests.Session()
        # The server drops idle keep-alive sockets after an SSE reply, which
        # surfaced as RemoteDisconnected on the next call; one socket per request.
        self.s.headers.update({"Authorization": "Bearer " + token,
                               "Accept": "application/json, text/event-stream",
                               "Content-Type": "application/json",
                               "Connection": "close"})
        self.sid = None
        self.n = 0
        self.calls = 0

    def _post(self, body):
        h = {"Mcp-Session-Id": self.sid} if self.sid else {}
        try:
            r = self.s.post(WISPR_MCP, json=body, headers=h, timeout=180)
        except requests.exceptions.ConnectionError:
            time.sleep(2)
            r = self.s.post(WISPR_MCP, json=body, headers=h, timeout=180)
        if r.status_code == 401:
            raise RuntimeError("Wispr Flow rejected the token; run: python sync.py auth-wispr")
        if r.status_code >= 400:
            raise RuntimeError("MCP HTTP %s: %s" % (r.status_code, r.text[:500]))
        if r.headers.get("Mcp-Session-Id"):
            self.sid = r.headers["Mcp-Session-Id"]
        if "id" not in body or not r.content:
            return None
        if r.headers.get("Content-Type", "").startswith("text/event-stream"):
            for line in r.text.splitlines():
                if line.startswith("data:"):
                    try:
                        ev = json.loads(line[5:].strip())
                    except ValueError:
                        continue
                    if ev.get("id") == body["id"]:
                        return ev
            raise RuntimeError("MCP: no response for request %s in SSE stream" % body["id"])
        return r.json()

    def _req(self, method, params=None):
        self.n += 1
        res = self._post({"jsonrpc": "2.0", "id": self.n, "method": method, "params": params or {}})
        if "error" in res:
            raise RuntimeError("MCP %s error: %s" % (method, json.dumps(res["error"])[:500]))
        return res["result"]

    def start(self):
        self._req("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                 "clientInfo": {"name": "v4air-meeting-notes-sync", "version": "2"}})
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized"})
        return self

    def tools(self):
        return self._req("tools/list").get("tools", [])

    def call(self, name, args):
        self.calls += 1
        res = self._req("tools/call", {"name": name, "arguments": args})
        text = "".join(c.get("text", "") for c in res.get("content") or [] if c.get("type") == "text")
        if res.get("isError"):
            raise RuntimeError("%s failed: %s" % (name, text[:500]))
        if isinstance(res.get("structuredContent"), dict):
            return res["structuredContent"]
        try:
            return json.loads(text)
        except ValueError:
            raise RuntimeError("%s returned non-JSON text: %r" % (name, text[:300]))


# ---------------------------------------------------------------- Wispr fetch

def strip_page(text, kind):
    """Strip wrappers from one page; return (body, next_offset or None)."""
    nxt = None
    if kind == "transcript":
        text = TRANSCRIPT_HEAD_RE.sub("", text)
        text = TRANSCRIPT_END_RE.sub("", text)
    m = TRUNC_RE.search(text)
    if m:
        nxt = int(m.group(2))
        text = text[:m.start()]
    return text, nxt


def search_all(mcp, since):
    out, cursor = [], None
    while True:
        args = {"since": since, "limit": 200}
        if cursor:
            args["cursor"] = cursor
        res = mcp.call("search_meetings", args)
        out.extend(res.get("meetings") or res.get("results") or res.get("items") or [])
        if not res.get("has_more") or not res.get("next_cursor"):
            return out
        cursor = res["next_cursor"]


def fetch_meeting(mcp, mid):
    """Full notes + transcript via paged get_meeting. Returns (meta, notes, transcript)."""
    meta, notes, transcript = None, [], []
    start_c, start_t = 0, 0
    while start_c is not None or start_t is not None:
        args = {"meeting_id": mid}
        if start_c is not None:
            args["view_content"] = {"char_limit": PAGE_CHARS, "start_char": start_c}
        else:
            args["view_content"] = {"char_limit": 1, "start_char": 0}
        if start_t is not None:
            args["view_transcript"] = {"char_limit": PAGE_CHARS, "start_char": start_t}
        res = mcp.call("get_meeting", args)
        if meta is None:
            meta = res
        if start_c is not None:
            body, start_c = strip_page(res.get("content") or "", "content")
            notes.append(body)
        if start_t is not None:
            if res.get("transcript") is None:
                start_t = None
            else:
                body, start_t = strip_page(res["transcript"], "transcript")
                transcript.append(body)
    return meta, "".join(notes).strip(), "".join(transcript).strip()


def is_relevant(m, cfg):
    if re.search(cfg["title_pattern"], m.get("title") or "", re.I):
        return "title"
    wanted = {e.lower() for e in cfg.get("attendee_emails", [])}
    for a in m.get("attendees") or []:
        e = (a.get("email") if isinstance(a, dict) else None) or ""
        if e.lower() in wanted:
            return "attendee " + e
    return None


def resolve_forced(mcp, link):
    """Share link -> meeting id, by title search; None if not among own meetings."""
    info = mcp.call("resolve_share_link", {"url": link})
    title = info.get("title") or ""
    if not title:
        return None
    res = mcp.call("search_meetings", {"query": title, "field": "title", "limit": 50})
    for m in res.get("meetings") or res.get("results") or []:
        if (m.get("share_link") or "").split("?")[0] == link:
            return m
    return None


# ---------------------------------------------------------------- formatting

def local(ts):
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(TZ)


def attendee_name(a):
    """search_meetings lists attendees as plain strings, get_meeting may use dicts."""
    if isinstance(a, dict):
        return a.get("name") or a.get("email") or ""
    return str(a or "")


def folder_name(meta):
    title = re.sub(r'[\\/:*?"<>|]+', " ", meta.get("title") or "Untitled").strip()
    return "%s %s" % (local(meta["start"]).strftime("%d.%m.%Y"), title)


def header_md(meta):
    s, e = local(meta["start"]), local(meta["end"]) if meta.get("end") else None
    when = s.strftime("%d.%m.%Y %H:%M") + (e.strftime("-%H:%M") if e else "")
    names = ", ".join(attendee_name(a) for a in meta.get("attendees") or [] if attendee_name(a))
    lines = ["# " + (meta.get("title") or "Untitled"), "",
             "- Date: %s (Prague time)" % when,
             "- Attendees: " + names]
    if meta.get("share_link"):
        lines.append("- Wispr Flow notes: " + meta["share_link"])
    return "\n".join(lines) + "\n\n"


def summary_md(meta):
    md = header_md(meta) + (meta.get("summary") or "").strip() + "\n"
    todos = meta.get("todos") or []
    if todos:
        md += "\n## Todos\n\n" + "\n".join(
            "- " + (t.get("text") or t.get("title") or json.dumps(t, ensure_ascii=False))
            if isinstance(t, dict) else "- " + str(t) for t in todos) + "\n"
    return md


# ---------------------------------------------------------------- Drive

def force_ipv4():
    orig = socket.getaddrinfo

    def v4_first(*a, **kw):
        res = orig(*a, **kw)
        return [r for r in res if r[0] == socket.AF_INET] or res
    socket.getaddrinfo = v4_first


def get_drive(interactive=False):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    force_ipv4()
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        elif interactive:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_PATH, SCOPES)
            creds = flow.run_local_server(port=0, login_hint="petkout1@gmail.com")
        else:
            raise RuntimeError("Drive token missing or revoked; run: python sync.py auth")
        with io.open(TOKEN_PATH, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def find_child(drive, parent, name, mime=FOLDER_MIME):
    q = ("'%s' in parents and name = '%s' and mimeType = '%s' and trashed = false"
         % (parent, name.replace("\\", "\\\\").replace("'", "\\'"), mime))
    r = drive.files().list(q=q, fields="files(id)", supportsAllDrives=True,
                           includeItemsFromAllDrives=True).execute()
    return r["files"][0]["id"] if r["files"] else None


def ensure_folder(drive, parent, name):
    fid = find_child(drive, parent, name)
    if fid:
        return fid
    return drive.files().create(body={"name": name, "mimeType": FOLDER_MIME, "parents": [parent]},
                                fields="id", supportsAllDrives=True).execute()["id"]


def ensure_shared(drive, fid, emails, state):
    # Google may resolve an alias (chlupp@) to the primary address, so the
    # permission list can't be matched by email; remember what we shared instead.
    shared = state.setdefault("shared", [])
    for email in emails:
        if email.lower() not in shared:
            drive.permissions().create(fileId=fid, body={"type": "user", "role": "writer",
                                       "emailAddress": email}, supportsAllDrives=True).execute()
            shared.append(email.lower())
            save_json(STATE_PATH, state)
            log("shared '%s' with %s (writer)" % (NOTES_FOLDER_NAME, email))


def upload_doc(drive, parent, name, text, src_mime):
    from googleapiclient.http import MediaIoBaseUpload
    if find_child(drive, parent, name, DOC_MIME):
        return
    media = MediaIoBaseUpload(io.BytesIO(text.encode("utf-8")), mimetype=src_mime, resumable=False)
    drive.files().create(body={"name": name, "mimeType": DOC_MIME, "parents": [parent]},
                         media_body=media, fields="id", supportsAllDrives=True).execute()


# ---------------------------------------------------------------- main

GAS_HANDOFF_FILE = "v4air-wispr-mcp-token.json"


def cmd_gas_token():
    """Upload the Wispr token plus local done/include state to petkout1's My Drive
    root (not shared). The Apps Script copy (gas/Code.gs) imports it into Script
    Properties on its next run and trashes the file."""
    from googleapiclient.http import MediaIoBaseUpload
    t = load_json(WISPR_TOKEN_PATH, None)
    if not t:
        raise RuntimeError("Wispr Flow token missing; run: python sync.py auth-wispr")
    wispr_token()  # make sure what we hand over is fresh
    t = load_json(WISPR_TOKEN_PATH, None)
    drive = get_drive()
    r = drive.files().list(q="name = '%s' and 'root' in parents and trashed = false" % GAS_HANDOFF_FILE,
                           fields="files(id)").execute()
    for f in r.get("files", []):
        drive.files().delete(fileId=f["id"]).execute()
    state = load_json(STATE_PATH, {"done": {}})
    payload = {"token": t, "done": state.get("done", {}), "include": state.get("include", [])}
    media = MediaIoBaseUpload(io.BytesIO(json.dumps(payload, ensure_ascii=False).encode("utf-8")),
                              mimetype="application/json", resumable=False)
    drive.files().create(body={"name": GAS_HANDOFF_FILE, "parents": ["root"]},
                         media_body=media, fields="id").execute()
    print("OK, uploaded %s to My Drive root; the Apps Script run() imports and trashes it." % GAS_HANDOFF_FILE)


def cmd_probe():
    mcp = Mcp(wispr_token()).start()
    for t in mcp.tools():
        print("tool:", t["name"])
    res = mcp.call("search_meetings", {"limit": 3})
    print(json.dumps(res, ensure_ascii=False, indent=2)[:6000])


def cmd_run(args):
    cfg = load_json(CONFIG_PATH, None)
    if cfg is None:
        raise RuntimeError("config.json missing")
    state = load_json(STATE_PATH, {"done": {}})
    seen = state.setdefault("skipped", {})
    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=LOOKBACK_DAYS)
             ).strftime("%Y-%m-%dT%H:%M:%SZ")

    mcp = Mcp(wispr_token()).start()
    todo = {}  # id -> (meeting stub, reason)
    for m in search_all(mcp, since):
        mid = m.get("id")
        if not mid or mid in state["done"]:
            continue
        if m.get("finalized") is False:
            continue
        why = is_relevant(m, cfg)
        if why:
            todo[mid] = (m, why)
        elif mid not in seen:
            seen[mid] = m.get("title") or ""
            log("skip %s %r: no title/attendee match" % (mid, seen[mid]))
    for link in list(state.get("include", [])):
        m = resolve_forced(mcp, link)
        if m is None:
            log("include %s: not found among own meetings" % link)
        elif m.get("id") not in state["done"]:
            todo[m["id"]] = (m, "include")
    save_json(STATE_PATH, state)
    if not todo:
        log("no new V4AIR meetings (%d MCP calls)" % mcp.calls)
        return

    drive = None if args.dry else get_drive()
    notes_root = None
    for mid, (stub, why) in todo.items():
        try:
            meta, notes, transcript = fetch_meeting(mcp, mid)
            title, fname = meta.get("title") or "Untitled", folder_name(meta)
            docs = [(title + " – summary", summary_md(meta), "text/markdown"),
                    (title + " – notes", header_md(meta) + (notes or "_No notes in Wispr Flow._") + "\n",
                     "text/markdown"),
                    (title + " – transcript", transcript or "No transcript in Wispr Flow.", "text/plain")]
            if args.dry:
                out = os.path.join(STATE_DIR, "dry", fname)
                os.makedirs(out, exist_ok=True)
                for name, text, mime in docs:
                    ext = ".md" if mime == "text/markdown" else ".txt"
                    with io.open(os.path.join(out, name + ext), "w", encoding="utf-8") as f:
                        f.write(text)
                log("dry: wrote %s [%s] (notes %d chars, transcript %d chars)"
                    % (fname, why, len(notes), len(transcript)))
                continue
            if notes_root is None:
                notes_root = ensure_folder(drive, cfg["v4air_folder_id"], NOTES_FOLDER_NAME)
                ensure_shared(drive, notes_root, cfg.get("share_with", []), state)
            folder = ensure_folder(drive, notes_root, fname)
            for name, text, mime in docs:
                upload_doc(drive, folder, name, text, mime)
            state["done"][mid] = {"title": title, "folder_id": folder, "matched": why,
                                  "uploaded": dt.datetime.now(TZ).isoformat(timespec="seconds")}
            link = (meta.get("share_link") or stub.get("share_link") or "").split("?")[0]
            if link in state.get("include", []):
                state["include"].remove(link)
            save_json(STATE_PATH, state)
            log("uploaded %s [%s] (notes %d chars, transcript %d chars)"
                % (fname, why, len(notes), len(transcript)))
        except Exception as e:
            log("ERROR %s: %s" % (mid, e))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auth")
    sub.add_parser("auth-wispr")
    sub.add_parser("probe")
    sub.add_parser("gas-token")
    r = sub.add_parser("run")
    r.add_argument("--dry", action="store_true")
    inc = sub.add_parser("include")
    inc.add_argument("link", help="Wispr Flow share link of a meeting to upload regardless of date/relevance")
    args = ap.parse_args()
    try:
        if args.cmd == "include":
            state = load_json(STATE_PATH, {"done": {}})
            link = args.link.strip().split("?")[0]
            if link not in state.setdefault("include", []):
                state["include"].append(link)
                save_json(STATE_PATH, state)
            log("include queued: " + link)
        elif args.cmd == "auth":
            d = get_drive(interactive=True)
            print("OK, authorized as", d.about().get(fields="user(emailAddress)").execute()["user"]["emailAddress"])
        elif args.cmd == "auth-wispr":
            wispr_auth_interactive()
        elif args.cmd == "probe":
            cmd_probe()
        elif args.cmd == "gas-token":
            cmd_gas_token()
        else:
            cmd_run(args)
    except Exception as e:
        log("FATAL %s\n%s" % (e, traceback.format_exc()))
        sys.exit(1)


if __name__ == "__main__":
    main()
