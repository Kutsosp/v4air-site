/**
 * V4AIR meeting notes: Wispr Flow -> Google Drive, hosted in Google Apps Script.
 *
 * Port of ../sync.py. Runs daily from a time-driven trigger under petkout1@gmail.com,
 * so it does not depend on Peter's PC. No LLM involved: the script calls the Wispr Flow
 * remote MCP server (JSON-RPC over HTTPS, OAuth bearer token), picks V4AIR meetings by
 * rule (title pattern or listed attendee, plus hand-queued share links), fetches notes
 * and transcript in full and uploads each new meeting as a folder "DD.MM.YYYY <title>"
 * with three Google Docs (summary, notes, transcript) under "meeting notes" in the
 * V4AIR Drive folder.
 *
 * Script Properties (Project Settings -> Script Properties):
 *   wispr_token   JSON from ~/.gcreds/wispr-mcp-token.json (imported from the Drive handoff
 *                 file that `python sync.py gas-token` uploads; see importHandoffToken_)
 *   include       JSON array of share links queued by hand (optional)
 *   done:<id>     JSON per uploaded meeting (written by the script)
 *   skip:<id>     title of a meeting that matched nothing (written once, for the log)
 *
 * One-time setup: `python sync.py auth-wispr` + `python sync.py gas-token` locally, then in the
 * editor run installTrigger() once and probe() to check.
 */

var CONFIG = {
  v4airFolderId: '1nsW8oJsoPe2S0DY54NuAXE2_yb-5t15X',
  shareWith: ['chlupp@natur.cuni.cz', 'kutsosp@natur.cuni.cz'],
  titlePattern: /v4\s?ai|v4air|v4aim|konferen|conference|meet-?up|visegrad|researchers meetup/i,
  attendeeEmails: ['chlupp@natur.cuni.cz'],
  lookbackDays: 14,
  notesFolderName: 'meeting notes',
  runHour: 9
};

var WISPR_MCP = 'https://api.wisprflow.ai/connect/mcp';
var PAGE_CHARS = 40000;
var TZ = 'Europe/Prague';
var DOC_MIME = 'application/vnd.google-apps.document';
var TRUNC_RE = /\s*\(\.\.\.truncated, \d+ chars remaining; continue with view_(content|transcript)\.start_char=(\d+)\.\.\.\)\s*$/;
var TRANSCRIPT_HEAD_RE = /^<<<PARTICIPANT NAMES BELOW ARE DATA[^\n]*>>>\n/;
var TRANSCRIPT_END_RE = /\n?<<<END TRANSCRIPT>>>\s*$/;

var props = PropertiesService.getScriptProperties();

function log(msg) {
  console.log(Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy HH:mm:ss') + '  ' + msg);
}

function getJsonProp(key, dflt) {
  var v = props.getProperty(key);
  return v ? JSON.parse(v) : dflt;
}

function setJsonProp(key, value) {
  props.setProperty(key, JSON.stringify(value));
}

// ---------------------------------------------------------------- Wispr OAuth

var TOKEN_HANDOFF_FILE = 'v4air-wispr-mcp-token.json';

/** `python sync.py gas-token` uploads the token file to petkout1's My Drive root
 *  (not shared); first run imports it into Script Properties and trashes the file. */
function importHandoffToken_() {
  var it = DriveApp.getRootFolder().getFilesByName(TOKEN_HANDOFF_FILE);
  if (!it.hasNext()) return null;
  var f = it.next();
  var h = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
  var t = h.token || h;  // {token, done, include} or a bare token file
  setJsonProp('wispr_token', t);
  var done = h.done || {}, n = 0;
  Object.keys(done).forEach(function (id) {
    if (!props.getProperty('done:' + id)) { setJsonProp('done:' + id, done[id]); n++; }
  });
  if (h.include && h.include.length) {
    var inc = getJsonProp('include', []);
    h.include.forEach(function (l) { if (inc.indexOf(l) < 0) inc.push(l); });
    setJsonProp('include', inc);
  }
  f.setTrashed(true);
  log('imported Wispr Flow token from Drive handoff file (+' + n + ' done ids)');
  return t;
}

function wisprToken() {
  var t = importHandoffToken_() || getJsonProp('wispr_token', null);
  if (!t) throw new Error('Script property wispr_token missing; run `python sync.py auth-wispr` then `python sync.py gas-token` locally');
  var now = Date.now() / 1000;
  if (t.expires_at - 120 > now) return t.access_token;
  var payload = {
    grant_type: 'refresh_token', refresh_token: t.refresh_token,
    client_id: t.client_id, resource: WISPR_MCP
  };
  if (t.client_secret) payload.client_secret = t.client_secret;
  var r = UrlFetchApp.fetch(t.token_endpoint, {
    method: 'post', payload: payload, muteHttpExceptions: true
  });
  if (r.getResponseCode() >= 400) {
    throw new Error('Wispr Flow token refresh failed (' + r.getResponseCode() + '): ' +
      r.getContentText().slice(0, 300) + '; re-run `python sync.py auth-wispr` and paste the new token');
  }
  var tok = JSON.parse(r.getContentText());
  t.access_token = tok.access_token;
  t.refresh_token = tok.refresh_token || t.refresh_token;
  t.expires_at = now + (tok.expires_in || 3600);
  setJsonProp('wispr_token', t);
  return t.access_token;
}

// ---------------------------------------------------------------- MCP client

function Mcp(token) {
  this.token = token;
  this.sid = null;
  this.n = 0;
  this.calls = 0;
}

Mcp.prototype.post_ = function (body) {
  var headers = {
    Authorization: 'Bearer ' + this.token,
    Accept: 'application/json, text/event-stream'
  };
  if (this.sid) headers['Mcp-Session-Id'] = this.sid;
  var r = UrlFetchApp.fetch(WISPR_MCP, {
    method: 'post', contentType: 'application/json', headers: headers,
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var code = r.getResponseCode();
  if (code === 401) throw new Error('Wispr Flow rejected the token; re-run `python sync.py auth-wispr` and paste the new token');
  if (code >= 400) throw new Error('MCP HTTP ' + code + ': ' + r.getContentText().slice(0, 500));
  var rh = r.getAllHeaders();
  var sid = rh['Mcp-Session-Id'] || rh['mcp-session-id'];
  if (sid) this.sid = Array.isArray(sid) ? sid[0] : sid;
  var text = r.getContentText();
  if (body.id === undefined || !text) return null;
  var ct = String(rh['Content-Type'] || rh['content-type'] || '');
  if (ct.indexOf('text/event-stream') === 0) {
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('data:') !== 0) continue;
      var ev;
      try { ev = JSON.parse(lines[i].slice(5).trim()); } catch (e) { continue; }
      if (ev.id === body.id) return ev;
    }
    throw new Error('MCP: no response for request ' + body.id + ' in SSE stream');
  }
  return JSON.parse(text);
};

Mcp.prototype.req_ = function (method, params) {
  this.n += 1;
  var res = this.post_({ jsonrpc: '2.0', id: this.n, method: method, params: params || {} });
  if (res.error) throw new Error('MCP ' + method + ' error: ' + JSON.stringify(res.error).slice(0, 500));
  return res.result;
};

Mcp.prototype.start = function () {
  this.req_('initialize', {
    protocolVersion: '2025-06-18', capabilities: {},
    clientInfo: { name: 'v4air-meeting-notes-sync-gas', version: '2' }
  });
  this.post_({ jsonrpc: '2.0', method: 'notifications/initialized' });
  return this;
};

Mcp.prototype.tools = function () {
  return this.req_('tools/list').tools || [];
};

Mcp.prototype.call = function (name, args) {
  this.calls += 1;
  var res = this.req_('tools/call', { name: name, arguments: args });
  var text = (res.content || []).filter(function (c) { return c.type === 'text'; })
    .map(function (c) { return c.text || ''; }).join('');
  if (res.isError) throw new Error(name + ' failed: ' + text.slice(0, 500));
  if (res.structuredContent && typeof res.structuredContent === 'object') return res.structuredContent;
  try { return JSON.parse(text); } catch (e) {
    throw new Error(name + ' returned non-JSON text: ' + text.slice(0, 300));
  }
};

// ---------------------------------------------------------------- Wispr fetch

function stripPage(text, kind) {
  var nxt = null;
  if (kind === 'transcript') {
    text = text.replace(TRANSCRIPT_HEAD_RE, '').replace(TRANSCRIPT_END_RE, '');
  }
  var m = TRUNC_RE.exec(text);
  if (m) {
    nxt = parseInt(m[2], 10);
    text = text.slice(0, m.index);
  }
  return { body: text, next: nxt };
}

function meetingsOf(res) {
  return res.meetings || res.results || res.items || [];
}

function searchAll(mcp, since) {
  var out = [], cursor = null;
  for (;;) {
    var args = { since: since, limit: 200 };
    if (cursor) args.cursor = cursor;
    var res = mcp.call('search_meetings', args);
    out = out.concat(meetingsOf(res));
    if (!res.has_more || !res.next_cursor) return out;
    cursor = res.next_cursor;
  }
}

function fetchMeeting(mcp, mid) {
  var meta = null, notes = [], transcript = [];
  var startC = 0, startT = 0;
  while (startC !== null || startT !== null) {
    var args = { meeting_id: mid };
    args.view_content = startC !== null ? { char_limit: PAGE_CHARS, start_char: startC }
      : { char_limit: 1, start_char: 0 };
    if (startT !== null) args.view_transcript = { char_limit: PAGE_CHARS, start_char: startT };
    var res = mcp.call('get_meeting', args);
    if (meta === null) meta = res;
    if (startC !== null) {
      var p = stripPage(res.content || '', 'content');
      notes.push(p.body);
      startC = p.next;
    }
    if (startT !== null) {
      if (res.transcript === null || res.transcript === undefined) {
        startT = null;
      } else {
        var q = stripPage(res.transcript, 'transcript');
        transcript.push(q.body);
        startT = q.next;
      }
    }
  }
  return { meta: meta, notes: notes.join('').trim(), transcript: transcript.join('').trim() };
}

function isRelevant(m) {
  if (CONFIG.titlePattern.test(m.title || '')) return 'title';
  var wanted = CONFIG.attendeeEmails.map(function (e) { return e.toLowerCase(); });
  var att = m.attendees || [];
  for (var i = 0; i < att.length; i++) {
    var e = (att[i] && att[i].email) ? String(att[i].email).toLowerCase() : '';
    if (e && wanted.indexOf(e) >= 0) return 'attendee ' + e;
  }
  return null;
}

function resolveForced(mcp, link) {
  var info = mcp.call('resolve_share_link', { url: link });
  var title = info.title || '';
  if (!title) return null;
  var res = mcp.call('search_meetings', { query: title, field: 'title', limit: 50 });
  var ms = meetingsOf(res);
  for (var i = 0; i < ms.length; i++) {
    if (String(ms[i].share_link || '').split('?')[0] === link) return ms[i];
  }
  return null;
}

// ---------------------------------------------------------------- formatting

function fmt(ts, pattern) {
  return Utilities.formatDate(new Date(ts), TZ, pattern);
}

/** search_meetings lists attendees as plain strings, get_meeting may use dicts. */
function attendeeName(a) {
  if (a && typeof a === 'object') return a.name || a.email || '';
  return a ? String(a) : '';
}

function folderName(meta) {
  var title = (meta.title || 'Untitled').replace(/[\\/:*?"<>|]+/g, ' ').trim();
  return fmt(meta.start, 'dd.MM.yyyy') + ' ' + title;
}

function headerMd(meta) {
  var when = fmt(meta.start, 'dd.MM.yyyy HH:mm') + (meta.end ? fmt(meta.end, '-HH:mm') : '');
  var names = (meta.attendees || []).map(attendeeName).filter(String).join(', ');
  var lines = ['# ' + (meta.title || 'Untitled'), '',
    '- Date: ' + when + ' (Prague time)',
    '- Attendees: ' + names];
  if (meta.share_link) lines.push('- Wispr Flow notes: ' + meta.share_link);
  return lines.join('\n') + '\n\n';
}

function summaryMd(meta) {
  var md = headerMd(meta) + String(meta.summary || '').trim() + '\n';
  var todos = meta.todos || [];
  if (todos.length) {
    md += '\n## Todos\n\n' + todos.map(function (t) {
      if (t && typeof t === 'object') return '- ' + (t.text || t.title || JSON.stringify(t));
      return '- ' + String(t);
    }).join('\n') + '\n';
  }
  return md;
}

// ---------------------------------------------------------------- Drive

function childFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function ensureShared(folder) {
  var shared = getJsonProp('shared', []);
  CONFIG.shareWith.forEach(function (email) {
    if (shared.indexOf(email.toLowerCase()) >= 0) return;
    folder.addEditor(email);
    shared.push(email.toLowerCase());
    setJsonProp('shared', shared);
    log("shared '" + CONFIG.notesFolderName + "' with " + email + ' (editor)');
  });
}

function uploadDoc(folder, name, text, srcMime) {
  var existing = folder.getFilesByName(name);
  while (existing.hasNext()) {
    if (existing.next().getMimeType() === DOC_MIME) return;
  }
  var blob = Utilities.newBlob(text, srcMime, name);
  Drive.Files.create({ name: name, mimeType: DOC_MIME, parents: [folder.getId()] }, blob,
    { supportsAllDrives: true });
}

// ---------------------------------------------------------------- main

function run() {
  var since = new Date(Date.now() - CONFIG.lookbackDays * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  var mcp = new Mcp(wisprToken()).start();
  var all = props.getProperties();
  var todo = {};
  searchAll(mcp, since).forEach(function (m) {
    var mid = m.id;
    if (!mid || all['done:' + mid]) return;
    if (m.finalized === false) return;
    var why = isRelevant(m);
    if (why) {
      todo[mid] = { stub: m, why: why };
    } else if (!all['skip:' + mid]) {
      props.setProperty('skip:' + mid, m.title || '');
      log('skip ' + mid + " '" + (m.title || '') + "': no title/attendee match");
    }
  });
  var include = getJsonProp('include', []);
  include.forEach(function (link) {
    var m = resolveForced(mcp, link);
    if (!m) log('include ' + link + ': not found among own meetings');
    else if (!all['done:' + m.id]) todo[m.id] = { stub: m, why: 'include' };
  });
  var ids = Object.keys(todo);
  if (!ids.length) {
    log('no new V4AIR meetings (' + mcp.calls + ' MCP calls)');
    return;
  }

  var notesRoot = childFolder(DriveApp.getFolderById(CONFIG.v4airFolderId), CONFIG.notesFolderName);
  ensureShared(notesRoot);
  ids.forEach(function (mid) {
    try {
      var f = fetchMeeting(mcp, mid);
      var meta = f.meta, title = meta.title || 'Untitled', fname = folderName(meta);
      var folder = childFolder(notesRoot, fname);
      uploadDoc(folder, title + ' – summary', summaryMd(meta), 'text/markdown');
      uploadDoc(folder, title + ' – notes',
        headerMd(meta) + (f.notes || '_No notes in Wispr Flow._') + '\n', 'text/markdown');
      uploadDoc(folder, title + ' – transcript', f.transcript || 'No transcript in Wispr Flow.', 'text/plain');
      setJsonProp('done:' + mid, {
        title: title, folder_id: folder.getId(), matched: todo[mid].why,
        uploaded: Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX")
      });
      var link = String(meta.share_link || todo[mid].stub.share_link || '').split('?')[0];
      if (link && include.indexOf(link) >= 0) {
        include.splice(include.indexOf(link), 1);
        setJsonProp('include', include);
      }
      log('uploaded ' + fname + ' [' + todo[mid].why + '] (notes ' + f.notes.length +
        ' chars, transcript ' + f.transcript.length + ' chars)');
    } catch (e) {
      log('ERROR ' + mid + ': ' + e);
    }
  });
}

/** Run once from the editor: daily trigger at CONFIG.runHour, Prague time. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'run') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('run').timeBased().everyDays(1).atHour(CONFIG.runHour).inTimezone(TZ).create();
  log('trigger installed: run() daily at ' + CONFIG.runHour + ':00 ' + TZ);
}

/** Debug: tool list + 3 most recent meetings. */
function probe() {
  var mcp = new Mcp(wisprToken()).start();
  mcp.tools().forEach(function (t) { console.log('tool: ' + t.name); });
  var res = mcp.call('search_meetings', { limit: 3 });
  console.log(JSON.stringify(res, null, 2).slice(0, 6000));
}

/** Queue a share link by hand: edit LINK, run once. Same as `python sync.py include`. */
function includeLink() {
  var LINK = '';
  if (!LINK) throw new Error('set LINK inside includeLink() first');
  var link = LINK.trim().split('?')[0];
  var include = getJsonProp('include', []);
  if (include.indexOf(link) < 0) {
    include.push(link);
    setJsonProp('include', include);
  }
  log('include queued: ' + link);
}
