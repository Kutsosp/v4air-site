/* Client for the V4AIR forms backend (backend/Code.gs, an Apps Script web app).
   URL is the /exec address of the web app deployment; empty means answers stay in this browser only. */
(function () {
  'use strict';
  var URL = 'https://script.google.com/macros/s/AKfycbwQ_K5-V5ijWyg4R3KeTtCBNHm2rbTzFoK2AtC1W0pxSZSObD6rHeoZ5yM9G_kufW1j/exec';
  /* Fast path (backend-worker/, Cloudflare Worker, about 0.5 s per save) for load and save. File uploads stay on
     Apps Script. Empty = everything goes to Apps Script. If the Worker fails, the request is repeated on Apps Script. */
  var WORKER = '';

  /* text/plain keeps the request "simple", so the browser sends no CORS preflight (Apps Script cannot answer one).
     script.google.com answers in 1 s most of the time and in 10 to 25 s some of the time (measured 06.10.2026), so the
     timeout is generous and a timed-out or dropped request is retried once before the caller sees an error. */
  function postWorker(payload) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    return fetch(WORKER, { method: 'POST', body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (j) {
        if (timer) clearTimeout(timer);
        if (!j || !j.ok) { var e = new Error((j && j.error) || 'server'); e.final = j && /^(not_found|email|bad_request|too_large)$/.test(j.error); throw e; }
        return j;
      }, function (e) { if (timer) clearTimeout(timer); throw e; })
      .catch(function (e) { if (e && e.final) throw e; return post(payload); });
  }
  function send(payload) {
    if (!WORKER) return post(payload);
    if (!payload.file && !payload.removeFile) return postWorker(payload);
    /* uploads: make sure the record exists first (created by the Worker), so the two backends never both append a row */
    if (payload.id) return post(payload);
    var bare = {}; Object.keys(payload).forEach(function (k) { if (k !== 'file' && k !== 'removeFile') bare[k] = payload[k]; });
    return postWorker(bare).then(function (j) { payload.id = j.id; payload.token = j.token; return post(payload); });
  }

  function post(payload, attempt) {
    if (!URL) return Promise.reject(new Error('no_backend'));
    attempt = attempt || 1;
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, payload.file ? 120000 : 45000) : null;
    return fetch(URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (j) { if (timer) clearTimeout(timer); if (!j || !j.ok) throw new Error((j && j.error) || 'server'); return j; },
            function (e) {
              if (timer) clearTimeout(timer);
              var transient = !e || e.name === 'AbortError' || e.name === 'TypeError' || /^http_5/.test(e.message || '');
              if (transient && attempt < 2) return post(payload, attempt + 1);
              throw e;
            });
  }

  /* GA4 client id from the _ga cookie ("GA1.1.<id>"); empty when the tag never ran (blocked, or no consent) */
  function gaClientId() {
    var m = /(?:^|;\s*)_ga=GA1\.\d\.([0-9.]+)/.exec(document.cookie || '');
    return m ? m[1] : '';
  }

  window.V4AIR_API = {
    enabled: function () { return !!URL; },
    /* extra: { file: {name, type, data(base64)} } to upload, { removeFile: true } to delete the stored file */
    save: function (form, id, token, answers, final, hp, extra) {
      var p = { action: 'save', form: form, id: id || '', token: token || '', answers: answers, final: !!final, hp: hp || '' };
      if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
      var ga = gaClientId(); if (ga) p.ga_cid = ga;
      return send(p);
    },
    load: function (form, id, token) { return send({ action: 'load', form: form, id: id, token: token }); }
  };
})();
