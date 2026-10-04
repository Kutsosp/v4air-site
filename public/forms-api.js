/* Client for the V4AIR forms backend (backend/Code.gs, an Apps Script web app).
   URL is the /exec address of the web app deployment; empty means answers stay in this browser only. */
(function () {
  'use strict';
  var URL = 'https://script.google.com/macros/s/AKfycbwQ_K5-V5ijWyg4R3KeTtCBNHm2rbTzFoK2AtC1W0pxSZSObD6rHeoZ5yM9G_kufW1j/exec';

  /* text/plain keeps the request "simple", so the browser sends no CORS preflight (Apps Script cannot answer one) */
  function post(payload) {
    if (!URL) return Promise.reject(new Error('no_backend'));
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, payload.file ? 120000 : 20000) : null;
    return fetch(URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
      .then(function (j) { if (timer) clearTimeout(timer); if (!j || !j.ok) throw new Error((j && j.error) || 'server'); return j; },
            function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  window.V4AIR_API = {
    enabled: function () { return !!URL; },
    /* extra: { file: {name, type, data(base64)} } to upload, { removeFile: true } to delete the stored file */
    save: function (form, id, token, answers, final, hp, extra) {
      var p = { action: 'save', form: form, id: id || '', token: token || '', answers: answers, final: !!final, hp: hp || '' };
      if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
      return post(p);
    },
    load: function (form, id, token) { return post({ action: 'load', form: form, id: id, token: token }); }
  };
})();
