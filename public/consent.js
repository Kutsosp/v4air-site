/* Cookie consent. Google Analytics 4 loads only after the visitor clicks "Accept all"; before that nothing goes to Google Analytics.
   "Accept essential" and "Reject" do the same thing: essential items only (stored as 'denied').
   Loaded synchronously in <head> on every page, before any page script calls gtag().
   The choice is kept in localStorage for 12 months, then the banner asks again.
   Any element with data-cookie-settings reopens the banner (footer links, the policy page). */
(function () {
  var KEY = 'v4air-consent', GA = 'G-37S10LBELM', MAX_AGE = 365 * 24 * 3600 * 1000;

  /* the applicant's name, email and ID (nomination form prefill) are kept 60 days, as the cookies page says;
     runs on every page before the page scripts. Items from before the date stamp count as expired. */
  try {
    var who = JSON.parse(localStorage.getItem('v4air-applicant'));
    if ((who || localStorage.getItem('v4air-application-id')) && !(who && Date.now() - who.at < 60 * 24 * 3600 * 1000)) {
      localStorage.removeItem('v4air-applicant'); localStorage.removeItem('v4air-application-id');
    }
  } catch (e) { /* storage unavailable or unreadable */ }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  /* ad signals stay denied for good: the site runs no ads */
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && (c.choice === 'granted' || c.choice === 'denied') && Date.now() - c.at < MAX_AGE) return c.choice;
    } catch (e) { /* unset, unavailable, or the old banner's plain 'granted' (not valid consent): ask again */ }
    return null;
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() })); } catch (e) { /* not persisted: banner returns next visit */ }
  }

  var loaded = false;
  function load() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
    gtag('js', new Date());
    /* email links carry a personal token, which must not reach Analytics; campaign tags stay */
    var page = new URL(location.href); page.searchParams.delete('t'); page.searchParams.delete('id');
    gtag('config', GA, { page_location: page.href });
  }
  /* withdrawal: GA sets its cookies on the top domain, so try every domain they can sit on */
  function dropCookies() {
    var parts = location.hostname.split('.'), domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      domains.forEach(function (d) { document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); });
    });
  }

  var box = null;
  function hide() { if (box) { box.remove(); box = null; } }
  function choose(choice) {
    save(choice);
    if (choice === 'granted') load();
    else { gtag('consent', 'update', { analytics_storage: 'denied' }); dropCookies(); }
    hide();
  }

  function style() {
    if (document.getElementById('v4c-style')) return;
    var css = document.createElement('style');
    css.id = 'v4c-style';
    css.textContent =
      '.v4c{position:fixed;left:1rem;bottom:1rem;z-index:70;width:min(30rem,calc(100vw - 2rem));padding:1.1rem 1.2rem 1.2rem;' +
      'border:1px solid #d3d5c8;border-radius:12px;background:#f9f9f4;color:#161616;' +
      'font:400 .95rem/1.5 Satoshi,"Segoe UI",system-ui,sans-serif;box-shadow:0 8px 24px rgb(0 0 0/.12)}' +
      '[data-theme="dark"] .v4c{border-color:#24383b;background:#111d20;color:#e9f1f0;box-shadow:0 8px 24px rgb(0 0 0/.4)}' +
      '.v4c h2{margin:0 0 .35rem;font:700 1rem/1.3 Satoshi,"Segoe UI",system-ui,sans-serif}' +
      '.v4c p{margin:0 0 .9rem}' +
      '.v4c a{color:#b35c1f;text-underline-offset:3px}[data-theme="dark"] .v4c a{color:#e9a24f}' +
      '.v4c .v4c-now{font-size:.85rem;color:#52564a;margin:-.4rem 0 .9rem}[data-theme="dark"] .v4c .v4c-now{color:#a7bcbb}' +
      '.v4c-row{display:flex;gap:.5rem}' +
      /* very narrow screens: an equal stack, so no button ends up alone on a wider row */
      '@media (max-width:359px){.v4c-row{flex-direction:column}}' +
      /* all buttons look the same on purpose: no choice may be easier to make */
      '.v4c button{flex:1 1 auto;min-height:44px;padding:.5rem .75rem;white-space:nowrap;border:0;border-radius:999px;background:#dd7f3e;color:#221304;font:700 .9rem/1.2 Satoshi,"Segoe UI",system-ui,sans-serif;cursor:pointer}' +
      '[data-theme="dark"] .v4c button{background:#e9a24f}' +
      '.v4c button:hover{filter:brightness(1.08)}' +
      '.v4c button:focus-visible{outline:2px solid #4f8c88;outline-offset:2px}';
    document.head.appendChild(css);
  }

  function show() {
    style();
    hide();
    var current = read();
    box = document.createElement('section');
    box.className = 'v4c';
    box.setAttribute('aria-labelledby', 'v4c-title');
    box.innerHTML =
      '<h2 id="v4c-title">Cookies</h2>' +
      '<p>Essential items are always on: they remember your cookie choice and your unfinished form answers, and show the Google map on the venue page. ' +
      'With your consent we would also use Google Analytics cookies to see how visitors use this site. <a href="/policy/cookies/">Details</a></p>' +
      (current ? '<p class="v4c-now">Your current choice: ' + (current === 'granted' ? 'all cookies' : 'essential cookies only') + '.</p>' : '') +
      '<div class="v4c-row"><button type="button" data-v4c="granted">Accept all</button><button type="button" data-v4c="denied">Accept essential</button><button type="button" data-v4c="denied">Reject</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v4c]');
      if (b) choose(b.getAttribute('data-v4c'));
    });
    document.body.appendChild(box);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!t) return;
    e.preventDefault();
    show();
    box.querySelector('button').focus();
  });

  var choice = read();
  if (choice === 'granted') load();
  else if (!choice) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
    else show();
  }
})();
