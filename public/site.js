/* V4AIR site behaviour (plain JavaScript, 10.11.2026; replaces the React bundle).
   Every page loads this file with `defer`. The page text is in the HTML; this file only adds:
   theme switch, nav bar states, phone menu, scroll reveals, the days-left number,
   the "Should you apply?" rotator, the key-dates road, the FAQ controls and the footer lockup.
   Add ?debug-date=2027-01-20 to the URL to see the date-driven parts on another day. */
(function () {
  'use strict'

  var $ = function (sel, root) { return (root || document).querySelector(sel) }
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)) }

  /* simulated date for testing: ?debug-date=YYYY-MM-DD */
  var NOW = (function () {
    var m = /[?&]debug-date=(\d{4}-\d{2}-\d{2})/.exec(location.search)
    var t = m ? new Date(m[1] + 'T12:00:00').getTime() : NaN
    return isNaN(t) ? Date.now() : t
  })()
  var DAY = 86400000

  /* ---------- theme: the inline script in <head> sets data-theme before first paint ---------- */
  var html = document.documentElement
  var isDark = function () { return html.getAttribute('data-theme') === 'dark' }
  /* homepage hero: day photo in light mode, dusk photo in dark mode */
  var heroImgs = $$('#hero .hero-photo img[src*="castle-day-2x"], #hero .hero-photo img[src*="castle-dusk-2x"]')
  function syncHero() {
    var src = isDark() ? '/assets/castle-dusk-2x.jpg' : '/assets/castle-day-2x.jpg'
    heroImgs.forEach(function (img) { if (img.getAttribute('src') !== src) img.setAttribute('src', src) })
  }
  syncHero()
  var sw = $('.switch__input')
  if (sw) {
    sw.checked = !isDark()
    sw.addEventListener('change', function () {
      var next = sw.checked ? 'light' : 'dark'
      if (next === 'dark') html.setAttribute('data-theme', 'dark')
      else html.removeAttribute('data-theme')
      /* the choice is saved only when the visitor switches (cookies policy) */
      try { localStorage.setItem('v4air-theme', next) } catch (e) { /* storage unavailable */ }
      syncHero()
    })
  }

  /* ---------- Motion helpers: same parameters as the former React components ---------- */
  var M = window.Motion
  var spring = function (stiffness, damping, mass) { return { type: 'spring', stiffness: stiffness, damping: damping, mass: mass || 1 } }
  /* TextMorph ("AIR" <-> "AI"): the R fades in, or leaves the layout at once and fades out (popLayout) */
  function morphR(r, show, transition) {
    if (!r) return
    if (show) {
      r.style.position = ''
      r.style.left = ''
      r.style.display = 'inline-block'
      M.animate(r, { opacity: [0, 1] }, transition)
    } else if (r.style.display !== 'none' && r.style.position !== 'absolute') {
      r.style.left = r.offsetLeft + 'px'
      r.style.position = 'absolute'
      M.animate(r, { opacity: 0 }, transition).then(function () { if (r.style.position === 'absolute') r.style.display = 'none' })
    }
  }
  /* width: 0 <-> auto, measured (the words have overflow clipped, so scrollWidth is the full width) */
  function openWidth(el, open, extra, transition) {
    var vals = { width: (open ? el.scrollWidth : 0) + 'px' }
    for (var k in extra) vals[k] = extra[k]
    return M.animate(el, vals, transition)
  }

  /* ---------- nav: transparent over a hero photo, solid once scrolled; the wordmark folds later ---------- */
  var nav = $('.nav2')
  var brand = $('.nav2 .brand')
  if (nav && M) {
    var overPhoto = nav.getAttribute('data-scrolled') === 'false'
    var hovered = false
    var folded = true
    var shownFolded = true
    /* the entrance (links, wordmark, Apply pill) plays on the first page of a visit only; moving between
       pages keeps the bar still. The <head> script sets html.nav-entrance from the same sessionStorage key. */
    var entrance = html.classList.contains('nav-entrance')
    try { sessionStorage.setItem('v4air-nav-seen', '1') } catch (e) { /* storage unavailable: always play */ }
    var instant = !entrance
    var NOW_T = { duration: 0 }
    var brandR = $('.brand-air .air-r')
    var brandWords = $('.brand-words')
    if (brandWords) M.animate(brandWords, { opacity: 0, width: '0px', x: -6 }, { duration: 0 })
    var paintBrand = function () {
      var f = folded && !hovered
      if (f === shownFolded) return
      shownFolded = f
      /* TextMorph transition: slower spring when folding back */
      morphR(brandR, f, instant ? NOW_T : f ? spring(120, 24, 0.8) : spring(280, 18, 0.3))
      if (brandWords) {
        openWidth(brandWords, !f, f ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 },
          instant ? NOW_T : f ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] })
      }
    }
    /* Apply pill: pops in with a spring once the bar is solid (AnimatePresence) */
    var pill = $('.nav-apply-real')
    var pillShown = false
    if (pill) M.animate(pill, { opacity: 0, scale: 0.6, y: -10 }, { duration: 0 })
    var setPill = function (show) {
      if (!pill || show === pillShown) return
      pillShown = show
      if (show) pill.style.visibility = 'visible'
      M.animate(pill, show ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: -10 }, instant ? NOW_T : spring(380, 22))
        .then(function () { if (!pillShown) pill.style.visibility = 'hidden' })
    }
    var setScrolled = function () {
      var s = !overPhoto || window.scrollY > 40
      nav.setAttribute('data-scrolled', String(s))
      setPill(s)
    }
    var onScroll = function () {
      setScrolled()
      folded = window.scrollY > 160
      paintBrand()
    }
    /* bar state syncs at once; the wordmark starts folded and unfolds a beat later, as an entrance */
    if (entrance) {
      setScrolled()
      setTimeout(onScroll, 400)
    } else {
      onScroll()
      instant = false
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    if (brand) {
      ;['mouseenter', 'focus'].forEach(function (ev) { brand.addEventListener(ev, function () { hovered = true; paintBrand() }) })
      ;['mouseleave', 'blur'].forEach(function (ev) { brand.addEventListener(ev, function () { hovered = false; paintBrand() }) })
    }
    /* links: AnimatedGroup stagger (0.07 s apart, 0.05 s start; Motion's default spring for y, 0.3 s tween for opacity and blur) */
    var linkSpans = $$('.nav2-links > span')
    if (linkSpans.length && !entrance) M.animate(linkSpans, { opacity: 1, y: 0, filter: 'blur(0px)' }, NOW_T)
    else if (linkSpans.length) {
      M.animate(linkSpans, { opacity: [0, 1], y: [-12, 0], filter: ['blur(4px)', 'blur(0px)'] }, {
        duration: 0.3,
        ease: [0.25, 0.1, 0.35, 1],
        delay: M.stagger(0.07, { startDelay: 0.05 }),
        y: { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
      })
    }
    /* phones: Menu button opens the link panel */
    var menuBtn = $('.nav-menu-btn')
    var panel = $('#nav-menu')
    if (menuBtn && panel) {
      var setMenu = function (open) {
        panel.hidden = !open
        menuBtn.setAttribute('aria-expanded', String(open))
        menuBtn.textContent = open ? 'Close' : 'Menu'
      }
      menuBtn.addEventListener('click', function () { setMenu(panel.hidden) })
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setMenu(false) })
      $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { setMenu(false) }) })
    }
  }

  /* ---------- scroll reveals (InView: once, 15 % visible; "Yes." 35 %) ---------- */
  $$('.reveal').forEach(function (el) {
    var yes = el.classList.contains('reveal-yes')
    var delay = parseFloat(el.style.getPropertyValue('--d')) || 0
    if (!M) { el.style.opacity = '1'; el.style.transform = 'none'; return }
    var stop = M.inView(el, function () {
      M.animate(el, { opacity: [0, 1], y: [yes ? 18 : 22, 0] },
        yes ? { duration: 1.2, ease: 'easeOut', delay: delay } : { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: delay })
      stop()
    }, { amount: yes ? 0.35 : 0.15 })
  })

  /* ---------- days-left bands (two on the homepage, one on each subpage) ---------- */
  var DEADLINE = new Date('2027-01-15T23:59:59').getTime()
  $$('.apply-band').forEach(function (band) {
    if (NOW > DEADLINE) { band.remove(); return }
    var d = new Date(NOW)
    var today = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    var n = Math.round((new Date(2027, 0, 15).getTime() - today) / DAY)
    var box = $('.days-left', band)
    if (!box) return
    box.innerHTML = n === 0
      ? '<span class="days-last">Last day to apply</span>'
      : '<span class="days-n">' + n + '</span><span class="days-label">' + (n === 1 ? 'day left' : 'days left') + '</span>'
  })

  /* ---------- "Should you apply?": X and Y rotate as matched pairs, 5 s each ---------- */
  var PAIRS = [
    ['a biologist training models on field data', 'your daily tool'],
    ['a sociologist studying how people use chatbots', 'your research subject'],
    ['a PhD student building new architectures', 'your whole field'],
    ['a linguist probing what models learn', 'your object of study'],
    ['an economist forecasting with neural nets', 'your unfair advantage'],
    ['a historian mining digitized archives', 'your reading assistant'],
    ['a medical researcher classifying scans', 'your second opinion'],
    ['a chemist screening candidate molecules', 'your lab partner'],
    ['a lawyer-to-be studying algorithmic decisions', 'your case study'],
    ['a master’s student who just met LLMs', 'your next step'],
  ]
  var who = $('.who-doubt[tabindex]')
  if (who && M) {
    var slots = $$('.slot-loop', who)
    slots.forEach(function (s) { s.innerHTML = '<span class="sl-item">' + s.textContent + '</span>' })
    var idx = 0
    var paused = false
    var timer = null
    /* TextLoop (popLayout): the old phrase leaves upwards out of the layout while the new one rises in */
    var LOOP = { duration: 0.45, ease: [0.65, 0, 0.35, 1] }
    var show = function (i) {
      idx = (i + PAIRS.length) % PAIRS.length
      slots.forEach(function (s, k) {
        var old = s.querySelector('.sl-item:not(.leaving)')
        if (old) {
          old.classList.add('leaving')
          old.style.position = 'absolute'
          old.style.left = '0'
          old.style.top = '0'
          M.animate(old, { y: -20, opacity: 0 }, LOOP).then(function () { old.remove() })
        }
        var item = document.createElement('span')
        item.className = 'sl-item'
        item.textContent = PAIRS[idx][k]
        s.appendChild(item)
        M.animate(item, { y: [20, 0], opacity: [0, 1] }, LOOP)
      })
    }
    var restart = function () {
      clearInterval(timer)
      if (!paused) timer = setInterval(function () { show(idx + 1) }, 5000)
    }
    ;['pointerenter', 'focus'].forEach(function (ev) { who.addEventListener(ev, function () { paused = true; restart() }) })
    ;['pointerleave', 'blur'].forEach(function (ev) { who.addEventListener(ev, function () { paused = false; restart() }) })
    var arrows = $$('.who-arrows button')
    if (arrows[0]) arrows[0].addEventListener('click', function () { show(idx - 1); restart() })
    if (arrows[1]) arrows[1].addEventListener('click', function () { show(idx + 1); restart() })
    restart()
  }

  /* ---------- key dates: the road with the walker (homepage) ---------- */
  var tl = $('.timeline')
  if (tl) timeline(tl)

  function timeline(section) {
    /* locked visual settings (Peter, 26.08.2026) */
    var CASTLE = { scale: 240, lift: 24, glow: 0.79 }
    var WALKER = { scale: 32, lift: 3 }
    var VICTORY = { scale: 40, lift: -11 }
    var STOPS = [
      { date: '2026-09-01', label: '1 Sep 2026', what: 'Applications open', sub: 'No CV or motivation letter needed.' },
      { date: '2027-01-15', label: '15 Jan 2027', what: 'Application deadline', sub: 'Take your time with the form.' },
      { date: '2027-02-15', label: 'Feb 2027', what: 'Selection results', sub: 'Everyone hears from us, either way.' },
      { date: '2027-03-10', label: 'March 2027', what: 'Keynote speakers and draft program', sub: 'Built from participants’ answers.' },
      { date: '2027-04-14', label: 'Apr 2027', what: 'Final program', sub: 'With everything you need for the trip.' },
      { date: '2027-04-28', label: '28-30 Apr 2027', what: 'V4AIR at Kostelec Castle' } /* no subline (10.11.2026): it overflowed the card */,
      { date: '2027-05-01', label: 'And beyond', what: 'Follow-up activities', sub: 'Activities that keep participants in touch after the meetup.' },
    ]
    var T = STOPS.map(function (s) { return new Date(s.date + 'T00:00:00').getTime() })
    var END_OF_EVENT = new Date('2027-04-30T23:59:59').getTime()
    var A = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"'
    /* Phosphor person-simple-walk + person-simple-run (MIT), 2-frame gait */
    var WALK_SVG = '<svg viewBox="0 0 256 256"><circle cx="152" cy="48" r="24" ' + A + '/><path d="M48,129s56-52.65,88-24.87C153.94,119.67,168,144,208,144" ' + A + '/><polyline points="152 232 152 176 109.54 145.67" ' + A + '/><line x1="129.53" y1="99.69" x2="72" y2="232" ' + A + '/></svg>'
    var RUN_SVG = '<svg viewBox="0 0 256 256"><circle cx="152" cy="56" r="24" ' + A + '/><path d="M56,105.6s32-25.67,80,7c50.47,34.3,80,20.85,80,20.85" ' + A + '/><path d="M110.64,161.16C128.47,165,176,180,176,232" ' + A + '/><path d="M134.44,111.51C128.37,135.24,98.81,206.68,32,200" ' + A + '/></svg>'
    /* Phosphor person-simple-tai-chi (MIT), victory pose */
    var TAICHI_SVG = '<svg width="' + VICTORY.scale + '" height="' + VICTORY.scale + '" viewBox="0 0 256 256"><circle cx="128" cy="48" r="24" ' + A + '/><line x1="40" y1="104" x2="216" y2="104" ' + A + '/><polyline points="128 104 128 144 48 216" ' + A + '/><polyline points="128 144 184 168 184 216" ' + A + '/></svg>'
    var glow = function (g) {
      return 'drop-shadow(0 0 2px rgb(var(--accent-glow) / ' + (0.9 * g).toFixed(2) + ')) drop-shadow(0 0 8px rgb(var(--accent-glow) / ' + (0.6 * g).toFixed(2) + '))'
    }

    var road = $('.road', section)
    var svg = $('.road svg', section)
    var stopsEl = $('.road-stops', section)
    var countdownEl = $('.countdown', section)
    var list = $('.tl-list', section)
    if (!road || !svg || !stopsEl || !countdownEl || !list) return
    section.classList.add('js')

    /* phase copy */
    var now = NOW
    var fmtD = function (n) { return n === 1 ? '1 day' : n + ' days' }
    var dTo = function (k) { return Math.ceil((T[k] - now) / DAY) }
    var last = -1
    T.forEach(function (t, k) { if (t <= now) last = k })
    var eventLive = last === 5 && now <= END_OF_EVENT
    var sign = true
    var line
    if (last === -1) line = 'Applications open in ' + fmtD(dTo(0)) + '.'
    else if (last === 0) line = 'Applications are open. ' + fmtD(dTo(1)) + ' left to apply.'
    else if (last === 1) line = 'Applications are closed. Selection is underway; results in February.'
    else if (last === 2) line = 'Results are out. We are building the program from participants’ answers.'
    else if (last === 3) line = 'Keynotes and preliminary programme are out. Final programme lands in April.'
    else if (last === 4) line = 'V4AIR starts in ' + fmtD(dTo(5)) + '.'
    else if (eventLive) line = 'V4AIR is happening right now. Why are you looking at this?'
    else { line = 'The three days are over; the group keeps working together.'; sign = false }
    countdownEl.textContent = line

    /* the plain list (shown without JavaScript) gets the same state */
    $$('li', list).forEach(function (li, k) {
      li.classList.toggle('past', k < last)
      li.classList.toggle('current', k === last)
    })

    function build() {
      var w = road.clientWidth
      if (!w) return
      $$('.castle, .now-tag, .marker, .dot', road).forEach(function (n) { n.remove() })
      /* narrow screens: the same road squeezed to the viewport, one tappable caption under it */
      var compact = w < 640
      road.classList.toggle('compact', compact)
      var castleDim = compact ? { h: 78, lift: 14 } : { h: Math.round(CASTLE.scale * 0.52), lift: CASTLE.lift }
      var pad = compact ? 26 : 75
      var H = 90
      var amp = compact ? 12 : 14
      var mid = 48
      var pts = STOPS.map(function (_, k) {
        return { x: pad + (w - 2 * pad) * (k / (STOPS.length - 1)), y: mid + (k % 2 ? amp : -amp) }
      })
      var d = 'M ' + pts[0].x + ' ' + pts[0].y
      for (var k = 1; k < pts.length; k++) {
        var a = pts[k - 1], b = pts[k], mx = (a.x + b.x) / 2
        d += ' C ' + mx + ' ' + a.y + ', ' + mx + ' ' + b.y + ', ' + b.x + ' ' + b.y
      }
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + H)
      svg.style.height = H + 'px'
      var le = pts[pts.length - 1]
      var tail = 'M ' + le.x + ' ' + le.y + ' C ' + (le.x + 40) + ' ' + le.y + ', ' + (le.x + 55) + ' ' + (le.y - 10) + ', ' + (w + 20) + ' ' + (le.y - 16)
      svg.innerHTML =
        '<defs><linearGradient id="tailFade" gradientUnits="userSpaceOnUse" x1="' + le.x + '" y1="0" x2="' + w + '" y2="0">' +
        '<stop offset="0" stop-color="#4a6367"/><stop offset="1" stop-color="#4a6367" stop-opacity="0"/></linearGradient></defs>' +
        '<path class="track" d="' + d + '"/>' +
        '<path d="' + tail + '" fill="none" stroke="url(#tailFade)" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>' +
        '<path class="prog" d="' + d + '"/>'
      var track = $('.track', svg)
      var prog = $('.prog', svg)
      var L = track.getTotalLength()
      var samples = []
      for (var i = 0; i <= 400; i++) samples.push(track.getPointAtLength((L * i) / 400))
      prog.style.strokeDasharray = L + ' ' + L

      stopsEl.innerHTML = ''
      var dotEls = []
      var stopEls = []
      var selectCaption = function () {}
      if (compact) {
        var caption = document.createElement('div')
        caption.className = 'stop-caption'
        stopsEl.appendChild(caption)
        selectCaption = function (k) {
          var s = STOPS[k]
          caption.innerHTML = '<span class="date">' + s.label + '</span><span class="what">' + s.what + '</span>'
          dotEls.forEach(function (el, j) { el.classList.toggle('sel', j === k) })
        }
      }
      STOPS.forEach(function (s, k) {
        var isMain = k === 5
        if (!compact) {
          var div = document.createElement('div')
          div.className = 'stop' + (isMain ? ' main' : '')
          div.style.left = pts[k].x + 'px'
          div.style.top = pts[k].y + 18 + 'px'
          div.innerHTML = '<span class="date">' + s.label + '</span><span class="what">' + s.what + '</span>' + (s.sub ? '<span class="sub">' + s.sub + '</span>' : '')
          div.tabIndex = 0
          stopsEl.appendChild(div)
          stopEls.push(div)
        }
        var el = document.createElement('span')
        el.className = isMain ? 'castle' : 'dot'
        el.style.left = pts[k].x + 'px'
        el.style.top = (isMain ? pts[k].y - 8 : pts[k].y) + 'px'
        road.appendChild(el)
        dotEls.push(el)
        if (compact) el.addEventListener('click', function () { selectCaption(k) })
      })
      if (compact) selectCaption(Math.min(Math.max(last, 0), STOPS.length - 1))

      var lengthAtX = function (x) {
        var best = 0, bestDx = Infinity
        samples.forEach(function (p, j) { var dx = Math.abs(p.x - x); if (dx < bestDx) { bestDx = dx; best = j } })
        return (L * best) / 400
      }

      STOPS.forEach(function (_, k) {
        if (dotEls[k].classList.contains('dot')) {
          dotEls[k].classList.toggle('past', k < last)
          dotEls[k].classList.toggle('now-dot', k === last)
        }
        if (stopEls[k]) stopEls[k].classList.toggle('done', k < last)
      })

      if (last >= 0 && !eventLive && sign) {
        var tag = document.createElement('span')
        tag.className = 'now-tag'
        tag.textContent = 'happening now'
        tag.style.left = pts[last].x + 'px'
        tag.style.top = pts[last].y - 60 + 'px'
        road.appendChild(tag)
      }

      var x
      if (last === -1) x = pts[0].x - (compact ? 18 : 40)
      else if (last >= STOPS.length - 2) x = pts[5].x
      else {
        var f = (now - T[last]) / (T[last + 1] - T[last])
        x = pts[last].x + (pts[last + 1].x - pts[last].x) * Math.min(1, Math.max(0, f))
      }
      prog.style.strokeDashoffset = String(last === -1 ? L : L - lengthAtX(x))

      if (sign) {
        var m = document.createElement('span')
        m.className = 'marker'
        m.style.filter = glow(CASTLE.glow)
        if (eventLive) {
          m.classList.add('m-victory')
          m.style.left = pts[5].x + 'px'
          m.style.top = pts[5].y - 8 - castleDim.h - castleDim.lift - 4 - VICTORY.lift + 'px'
          m.innerHTML = TAICHI_SVG
        } else {
          m.classList.add('m-walk')
          var wx = Math.max(compact ? 8 : 60, x)
          var my = 48, bd = Infinity
          samples.forEach(function (p) { var dx = Math.abs(p.x - wx); if (dx < bd) { bd = dx; my = p.y } })
          m.style.left = wx + 'px'
          m.style.top = my - 4 - WALKER.lift + 'px'
          m.style.width = WALKER.scale + 'px'
          m.style.height = WALKER.scale + 'px'
          m.innerHTML = '<span class="frame f1">' + WALK_SVG + '</span><span class="frame f2">' + RUN_SVG + '</span>'
        }
        road.appendChild(m)
      }
    }
    build()
    window.addEventListener('resize', build)
  }

  /* ---------- FAQ: expand all, deep links (#faq-xyz), shareable URL ---------- */
  var faqList = $('.faq-list')
  if (faqList) {
    var details = $$('details', faqList)
    var expandBtn = $('.expand-all')
    var openFromHash = function () {
      var id = location.hash.slice(1)
      var el = id && document.getElementById(id)
      if (el && el.tagName === 'DETAILS' && faqList.contains(el)) {
        el.open = true
        el.scrollIntoView({ block: 'center' })
      }
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        var expand = expandBtn.getAttribute('aria-expanded') !== 'true'
        details.forEach(function (d) { d.open = expand })
        expandBtn.setAttribute('aria-expanded', String(expand))
        expandBtn.textContent = expand ? 'Collapse all' : 'Expand all'
      })
    }
    details.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) history.replaceState(null, '', '#' + d.id)
        else if (location.hash === '#' + d.id) history.replaceState(null, '', location.pathname + location.search)
      })
    })
  }

  /* ---------- footer: the lockup arrives as AIR, unfolds once seen (60 %), then "See you there." ---------- */
  var lockup = $('.footer-lockup')
  var invite = $('.footer-invite')
  if (lockup && M) {
    var flR = $('.fl-ai .air-r', lockup)
    var flWords = $('.fl-words', lockup)
    var castle = $('.footer-castle')
    var chars = []
    if (flWords) M.animate(flWords, { opacity: 0, width: '0px', x: -10 }, { duration: 0 })
    if (castle) {
      castle.loading = 'eager'
      M.animate(castle, { opacity: 0, width: '0px', x: -40, scale: 0.7 }, { duration: 0 })
    }
    if (invite) {
      invite.setAttribute('aria-label', invite.textContent)
      invite.innerHTML = invite.textContent.split('').map(function (c) { return '<span class="ch" aria-hidden="true">' + c + '</span>' }).join('')
      chars = $$('.ch', invite)
      M.animate(chars, { opacity: 0, y: 20, filter: 'blur(12px)' }, { duration: 0 })
    }
    var UNFOLD = { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
    var unfold = function () {
      morphR(flR, false, spring(110, 22, 0.7))
      if (flWords) {
        /* release the width once open: a width measured before the display font loads would clip the text */
        openWidth(flWords, true, { opacity: 1, x: 0 }, UNFOLD).then(function () { flWords.style.width = 'auto' })
      }
      if (castle) {
        var go = function () {
          var w = castle.naturalHeight ? Math.round((castle.naturalWidth / castle.naturalHeight) * castle.offsetHeight) : 0
          M.animate(castle, { opacity: 0.9, width: w + 'px', x: 0, scale: 1 }, UNFOLD).then(function () { castle.style.width = 'auto' })
        }
        if (castle.complete) go()
        else castle.addEventListener('load', go, { once: true })
      }
      /* TextEffect fade-in-blur, per character: 0.03 s apart, 0.3 s each, starting 0.7 s in */
      if (chars.length) {
        M.animate(chars, { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0.3, ease: 'easeInOut', delay: M.stagger(0.03, { startDelay: 0.7 }) })
      }
    }
    var stopF = M.inView(lockup, function () { stopF(); setTimeout(unfold, 600) }, { amount: 0.6 })
  }
})()
