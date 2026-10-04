import socket, os, sys, json
orig = socket.getaddrinfo
def v4(*a, **k):
    r = orig(*a, **k); return sorted(r, key=lambda x: x[0] != socket.AF_INET)
socket.getaddrinfo = v4
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
T = os.path.expanduser("~/.gcreds/petkout1-drive-token.json")
c = Credentials.from_authorized_user_file(T, ["https://www.googleapis.com/auth/drive"])
if not c.valid:
    c.refresh(Request()); open(T, "w").write(c.to_json())
drive = build("drive", "v3", credentials=c)
sheets = build("sheets", "v4", credentials=c)
docs = build("docs", "v1", credentials=c)
def ls(fid):
    out, tok = [], None
    while True:
        r = drive.files().list(q=f"'{fid}' in parents and trashed=false", fields="nextPageToken, files(id,name,mimeType,modifiedTime,owners(emailAddress))", pageToken=tok, supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
        out += r["files"]; tok = r.get("nextPageToken")
        if not tok: return out
def tree(fid, ind=0):
    for f in ls(fid):
        print("  "*ind + f"{f['name']}  [{f['mimeType'].split('.')[-1]}] {f['id']} {f['modifiedTime'][:10]} {f.get('owners',[{}])[0].get('emailAddress','')}")
        if f["mimeType"].endswith("folder"): tree(f["id"], ind+1)
if __name__ == "__main__":
    root = "1IGG6_qt1dK6iKH7l7Y38dBuL5LbsBiD3"
    m = drive.files().get(fileId=root, fields="name,owners(emailAddress)", supportsAllDrives=True).execute(); print(m)
    tree(root)
