/* Cookie notice: Google Consent Mode v2, all four signals granted by default; OK only dismisses the banner.
   Loaded synchronously in <head> before the GA4 snippet on every page, so the default
   is in the dataLayer before gtag('config'). The choice is kept in localStorage. */
(function () {
  var KEY = 'v4air-consent';
  var GRANTED = { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* storage unavailable: ask every visit */ }

  gtag('consent', 'default', GRANTED);
  if (stored === 'granted') return;

  function show() {
    var css = document.createElement('style');
    css.textContent =
      '.v4c{position:fixed;left:1rem;bottom:1rem;z-index:70;display:flex;align-items:center;gap:1rem;max-width:calc(100vw - 2rem);' +
      'padding:.75rem .75rem .75rem 1.1rem;border:1px solid #d3d5c8;border-radius:12px;background:#f9f9f4;color:#161616;' +
      'font:500 .95rem/1.4 Satoshi,"Segoe UI",system-ui,sans-serif;box-shadow:0 8px 24px rgb(0 0 0/.12)}' +
      '[data-theme="dark"] .v4c{border-color:#24383b;background:#111d20;color:#e9f1f0;box-shadow:0 8px 24px rgb(0 0 0/.4)}' +
      '.v4c button{flex:none;padding:.45rem 1.1rem;border:0;border-radius:999px;background:#dd7f3e;color:#221304;font:700 .9rem/1.2 Satoshi,"Segoe UI",system-ui,sans-serif;cursor:pointer}' +
      '[data-theme="dark"] .v4c button{background:#e9a24f}' +
      '.v4c button:hover{filter:brightness(1.08)}' +
      '.v4c button:focus-visible{outline:2px solid #4f8c88;outline-offset:2px}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.className = 'v4c';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookies');
    var text = document.createElement('span');
    text.textContent = 'This site uses cookies';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'OK';
    ok.addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'granted'); } catch (e) { /* not persisted: banner returns next visit */ }
      box.remove();
    });
    box.appendChild(text);
    box.appendChild(ok);
    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
