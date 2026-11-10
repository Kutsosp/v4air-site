/* Phone version of the program section (below 760 px).
   One pinned screen driven by scroll: heading, intro, a reading hold, then chapters 1-4.
   The chapter text changes; the stage underneath is one continuous scene:
   - the castle stays at the top the whole time
   - a row of people sits at the bottom; their applications fly to the castle as envelopes
   - matched people step up from the row, link, and fly as a group to their place under the castle
   - the invited speaker arrives from the right edge and joins the psychologist
   - in chapter 4 the row fades and the program is assembled under the castle.
   Without scroll (the autoplay page) the same timeline plays on a loop.
   Reduced motion: a static list with each chapter's final frame. Uses STEPS from anim.js. */
;(function phoneProgram() {
  const host = document.getElementById('phone')
  /* only on phones; on wider screens the desktop section runs and nothing here is set up */
  if (!host || !window.matchMedia('(max-width: 760px)').matches) return
  const PW = 360, PH = 428
  const C1 = 'var(--m1)', C2 = 'var(--m2)', C3 = 'var(--m3)'
  const clamp01 = (v) => Math.max(0, Math.min(1, v))
  const sg = (t, a, b) => clamp01((t - a) / (b - a))
  const ez = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const mix = (a, b, t) => a + (b - a) * t
  /* move with a lift: up out of the row first, then across */
  function fly(a, b, t) {
    const e = ez(t), u = 1 - e, cy = Math.min(a.y, b.y) - 30
    return { x: u * u * a.x + 2 * u * e * a.x + e * e * b.x, y: u * u * a.y + 2 * u * e * cy + e * e * b.y }
  }

  const man = (x, y, color, op = 1, lit = false) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.1)" class="person${lit ? ' lit' : ''}" style="${color ? 'color:' + color + ';' : ''}opacity:${clamp01(op).toFixed(3)}"><circle cx="0" cy="-15" r="6.5"/><path d="M-9 8 v-6 a9 9 0 0 1 18 0 v6 z"/></g>`
  const mail = (x, y, color, op) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="opacity:${clamp01(op).toFixed(3)}">` +
    `<rect x="-10" y="-7" width="20" height="14" rx="2" class="mail" style="stroke:${color}"/>` +
    `<path d="M-10 -7 L0 1 L10 -7" class="mail" style="stroke:${color}"/></g>`
  /* label to the right of a person: field on top, need or offer under it */
  const label = (x, y, title, sub, color, op) => op <= 0.01 ? '' :
    `<g style="opacity:${clamp01(op).toFixed(3)}"><text x="${x}" y="${y}" class="plt">${title}</text>` +
    (sub ? `<text x="${x}" y="${y + 18}" class="pls" style="fill:${color}">${sub}</text>` : '') + '</g>'
  const link = (a, b, color, t, op = 1) => t <= 0 || op <= 0 ? '' :
    `<line x1="${a.x}" y1="${a.y - 8}" x2="${b.x}" y2="${b.y - 8}" pathLength="1" class="link" style="stroke:${color};stroke-dashoffset:${1 - t};opacity:${op}"/>`

  /* ---- fixed places ---- */
  const CASTLE = { x: 80, y: 2, w: 200, h: 105 }
  const ROW = Array.from({ length: 9 }, (_, i) => ({ x: 24 + i * 39, y: 410 }))      /* the row of people */
  const SLOT_Y = 184                                                                /* places under the castle */
  const SLOTS = { g1: [62, 86], g2: [156, 180, 204], g3: [276, 300] }
  const UP = (y) => ({ x: 46, y })                                                  /* where people step up to */
  /* who comes from which place in the row, and where they end up */
  const G1 = [{ i: 1, color: C1, field: 'sports scientist', sub: "needs: analysis of players' technique", up: UP(238), slot: SLOTS.g1[0] },
              { i: 6, color: C1, field: 'computer scientist', sub: 'offers: motion analysis', up: UP(322), slot: SLOTS.g1[1] }]
  const G2 = [{ i: 3, color: C2, field: 'ecologist', sub: 'needs: pollinator identification', up: UP(230), slot: SLOTS.g2[0] },
              { i: 7, color: C2, field: 'historian', sub: 'needs: handwriting recognition', up: UP(288), slot: SLOTS.g2[1] },
              { i: 4, color: C2, field: 'computer vision researcher', sub: 'offers: computer vision', up: UP(346), slot: SLOTS.g2[2] }]
  const PSY = { i: 2, color: C3, field: 'psychologist', sub: 'needs: mood analysis of interviews', up: UP(238), slot: SLOTS.g3[0] }
  const GUEST = { up: UP(330), slot: SLOTS.g3[1] }
  const USED = [G1, G2, [PSY]]                                                       /* by chapter: 2a, 2b, 3 */

  const castle = () =>
    `<image href="${window.castleHref ? window.castleHref() : 'castle-silhouette.png'}" x="${CASTLE.x}" y="${CASTLE.y}" width="${CASTLE.w}" height="${CASTLE.h}" class="v4p-castle" style="opacity:.85"/>` +
    `<text x="${PW / 2}" y="${CASTLE.y + CASTLE.h + 22}" text-anchor="middle" class="pplace">V4AIR at Kostelec Castle</text>`
  /* the row, without people who have already stepped up (gone = set of row indices) */
  const row = (gone, op) => ROW.map((p, i) => gone.has(i) ? '' : man(p.x, p.y, null, op * 0.55)).join('')
  const seated = (list, color) => list.map((x) => man(x, SLOT_Y, color, 1, true)).join('')

  /* one member of a group: lights in the row, steps up, then flies to its place under the castle */
  function member(m, light, up, go) {
    const from = ROW[m.i]
    let p = up > 0 ? fly(from, m.up, up) : from
    if (go > 0) p = fly(m.up, { x: m.slot, y: SLOT_Y }, go)
    const lit = ez(light)
    return { p, s: man(p.x, p.y, null, 0.55 * (1 - lit)) + (lit > 0 ? man(p.x, p.y, m.color, lit, true) : '') }
  }

  /* ---- the four chapters: draw(t), t = 0..1 ---- */
  const CHAPTERS = [
    { dur: 6500, beats: [0.15, 1], draw(t) {
      /* applications: the row appears and every person sends an envelope to the castle */
      let s = row(new Set(), sg(t, 0, 0.25))
      ROW.forEach((p, k) => {
        const st = 0.18 + k * 0.06, mt = sg(t, st, st + 0.3)
        if (mt > 0 && mt < 1) {
          const e = ez(mt)
          s += mail(mix(p.x, PW / 2 + (k - 4) * 8, e), mix(p.y - 34, CASTLE.y + 70, e) - Math.sin(mt * Math.PI) * 26, 'var(--text2)', 1 - sg(mt, 0.8, 1))
        }
      })
      return s
    } },
    { dur: 12000, beats: [0.07, 0.2, 0.3, 0.46, 0.56, 0.65, 0.76, 0.86, 1], draw(t) {
      /* matchmaking: one to one, then one to many. Needs light first, the offer last, then the line, then the castle */
      let s = ''
      if (t < 0.48) {
        const u = t / 0.48
        s += row(new Set(G1.map((m) => m.i)), 1)
        const timing = [[0, 0.14], [0.28, 0.42]], go = sg(u, 0.72, 1)
        const ms = G1.map((m, k) => member(m, sg(u, timing[k][0], timing[k][0] + 0.1), sg(u, timing[k][0] + 0.04, timing[k][1]), go))
        s += link(ms[1].p, ms[0].p, C1, sg(u, 0.5, 0.64), 1 - go)
        ms.forEach((x, k) => {
          s += x.s
          s += label(76, G1[k].up.y - 14, G1[k].field, G1[k].sub, C1, sg(u, timing[k][1] - 0.02, timing[k][1] + 0.1) * (1 - sg(go, 0, 0.3)))
        })
      } else {
        const u = (t - 0.48) / 0.52
        s += seated(SLOTS.g1, C1)
        s += row(new Set([...G1, ...G2].map((m) => m.i)), 1)
        const timing = [[0, 0.14], [0.18, 0.32], [0.36, 0.5]], go = sg(u, 0.75, 1)
        const ms = G2.map((m, k) => member(m, sg(u, timing[k][0], timing[k][0] + 0.1), sg(u, timing[k][0] + 0.04, timing[k][1]), go))
        const ln = sg(u, 0.56, 0.7)
        s += link(ms[2].p, ms[0].p, C2, ln, 1 - go) + link(ms[2].p, ms[1].p, C2, ln, 1 - go)
        ms.forEach((x, k) => {
          s += x.s
          s += label(76, G2[k].up.y - 14, G2[k].field, G2[k].sub, C2, sg(u, timing[k][1] - 0.02, timing[k][1] + 0.1) * (1 - sg(go, 0, 0.3)))
        })
      }
      return s
    } },
    { dur: 13000, beats: [0.1, 0.24, 0.42, 0.58, 0.76, 0.86, 1], draw(t) {
      /* invited speakers: the need, an empty spot, the invitation goes out, the guest arrives, both go to the castle */
      let s = seated(SLOTS.g1, C1) + seated(SLOTS.g2, C2)
      s += row(new Set([...G1, ...G2, PSY].map((m) => m.i)), 1)
      const go = sg(t, 0.86, 1)
      const psy = member(PSY, sg(t, 0, 0.06), sg(t, 0.02, 0.12), go)
      const empty = sg(t, 0.14, 0.22), nobodyOut = sg(t, 0.38, 0.42)
      const mailT = sg(t, 0.44, 0.58), enter = sg(t, 0.6, 0.76)
      if (empty > 0 && enter < 1) s += `<circle cx="${GUEST.up.x}" cy="${GUEST.up.y - 10}" r="${(17 + empty * 5).toFixed(1)}" class="empty" style="stroke:${C3};opacity:${(0.9 * (1 - enter)).toFixed(3)}"/>`
      s += label(76, GUEST.up.y - 4, 'nobody offers this', '', C3, empty * (1 - nobodyOut))
      if (mailT > 0 && mailT < 1) s += mail(mix(GUEST.up.x, PW + 30, ez(mailT)), GUEST.up.y - 14 - Math.sin(mailT * Math.PI) * 30, C3, 1 - sg(mailT, 0.85, 1))
      let g = null
      if (enter > 0) {
        g = go > 0 ? fly(GUEST.up, { x: GUEST.slot, y: SLOT_Y }, go) : { x: mix(PW + 30, GUEST.up.x, ez(enter)), y: GUEST.up.y }
        s += link(g, psy.p, C3, sg(t, 0.78, 0.86), 1 - go)
        s += man(g.x, g.y, C3, 1, true)
      }
      s += psy.s
      s += label(76, PSY.up.y - 14, PSY.field, PSY.sub, C3, sg(t, 0.09, 0.16) * (1 - sg(go, 0, 0.3)))
      s += label(76, GUEST.up.y - 14, 'computational linguist', 'offers: sentiment analysis', C3, sg(enter, 0.7, 1) * (1 - sg(go, 0, 0.3)))
      return s
    } },
    { dur: 8000, beats: [0.15, 0.45, 0.62, 0.7, 1], draw(t) {
      /* the program: the row fades, the sessions appear under the castle, then the line, the heading and the box */
      let s = seated(SLOTS.g1, C1) + seated(SLOTS.g2, C2) + seated(SLOTS.g3, C3)
      s += row(new Set([...G1, ...G2, PSY].map((m) => m.i)), 1 - sg(t, 0, 0.15))
      const rows = [
        { color: C1, kind: 'TALK', title: 'Motion analysis' },
        { color: C2, kind: 'WORKSHOP', title: 'Computer vision' },
        { color: C3, kind: 'INVITED TALK', title: 'Sentiment analysis' },
      ]
      rows.forEach((r, k) => {
        const op = sg(t, 0.15 + k * 0.1, 0.3 + k * 0.1), y = 278 + k * 52 + (1 - op) * 8
        s += `<g style="opacity:${op.toFixed(3)}"><rect x="34" y="${y - 22}" width="4" height="34" rx="2" style="fill:${r.color}"/>` +
          `<text x="52" y="${y - 6}" class="pkind" style="fill:${r.color}">${r.kind}</text>` +
          `<text x="52" y="${y + 13}" class="ptitle">${r.title}</text></g>`
      })
      const rule = ez(sg(t, 0.5, 0.62)), head = sg(t, 0.62, 0.7), close = ez(sg(t, 0.7, 0.95))
      const half = (dir) => {
        const cx = PW / 2, edge = dir < 0 ? 16 : PW - 16, top = 232, bottom = 422, r = 12
        const across = Math.abs(edge - cx) - r, corner = 1.15 * r, down = bottom - top - 2 * r
        const share = across / (2 * across + 2 * corner + down)
        const len = rule * share + close * (1 - share)
        const d = `M ${cx} ${top} H ${edge - dir * r} Q ${edge} ${top} ${edge} ${top + r} V ${bottom - r} Q ${edge} ${bottom} ${edge - dir * r} ${bottom} H ${cx - dir}`
        return `<path d="${d}" pathLength="1" class="frame" style="stroke-dasharray:${len.toFixed(4)} 2"/>`
      }
      if (rule > 0) s += half(-1) + half(1)
      if (head > 0) s += `<text x="${PW / 2}" y="${224 + (1 - head) * 6}" text-anchor="middle" class="head" style="opacity:${head.toFixed(3)}">THE PROGRAM</text>`
      return s
    } },
  ]

  const intro = document.querySelector('.lefthead .expl')
  const parsed = STEPS.map((txt) => { const m = txt.match(/<strong>(.*?)<\/strong>\s*(.*)/); return { title: m ? m[1] : '', body: m ? m[2] : txt } })
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* reduced motion: a plain list with each chapter's final frame */
  if (reduce || typeof gsap === 'undefined') {
    let html = `<h2 class="big">The program</h2><div class="expl">${intro ? intro.innerHTML : ''}</div>`
    parsed.forEach((s, k) => {
      html += `<article class="pstep"><div class="ptext"><span class="n">${k + 1}</span><div><strong>${s.title}</strong><p>${s.body}</p></div></div>` +
        `<svg class="pstage" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="${s.title}">${castle()}${CHAPTERS[k].draw(1)}</svg></article>`
    })
    host.innerHTML = html
    return
  }

  /* 09.11.2026 player mode (redesign doc point 12): no pin, normal page flow. Heading and intro in the flow,
     the stage plays like a video once in view (real seconds: dur / 1000), all four steps listed under it,
     the current one highlighted; tap a step to jump there. Stops on the last frame. */
  if (window.V4P_PLAYER) {
    host.classList.add('pplayer')
    host.innerHTML =
      `<h2 class="big">The program</h2>` +
      `<div class="expl">${intro ? intro.innerHTML : ''}</div>` +
      `<svg class="pstage" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="How the program is built: applications go to the castle, people are matched and go to the castle as groups, an invited expert fills a gap, and the program is assembled."><g class="pstatic">${castle()}</g><g class="pdyn"></g></svg>` +
      `<ol class="psteps">${parsed.map((s, k) => `<li><span class="n">${k + 1}</span><div><strong>${s.title}</strong><p>${s.body}</p></div></li>`).join('')}</ol>`
    const dyn = host.querySelector('.pdyn'), items = host.querySelectorAll('.psteps li')
    dyn.innerHTML = CHAPTERS[0].draw(0)
    const ptl = gsap.timeline({ paused: true })
    const starts = []
    CHAPTERS.forEach((ch, k) => {
      const proxy = { t: 0 }, at = ptl.duration()
      starts.push(at)
      ptl.addLabel(`c${k}`, at)
      ptl.to(proxy, { t: 1, duration: ch.dur / 1000, ease: 'none', onUpdate: () => (dyn.innerHTML = ch.draw(proxy.t)) }, at)
      if (k < CHAPTERS.length - 1) ptl.to({}, { duration: 0.8 })     /* short hold between chapters */
    })
    const mark = () => {
      const t = ptl.time(); let cur = 0
      starts.forEach((st, k) => { if (t >= st) cur = k })
      items.forEach((li, k) => li.classList.toggle('on', k === cur))
    }
    ptl.eventCallback('onUpdate', mark)
    mark()
    let started = false
    items.forEach((li, k) => li.addEventListener('click', () => { started = true; ptl.play(`c${k}`) }))
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !started) { started = true; ptl.play() } }), { threshold: 0.4 })
    io.observe(host.querySelector('.pstage'))
    window.V4P_TL = ptl
    return
  }

  /* one pinned screen: the intro on its own, then the chapter text above one continuous stage */
  host.classList.add('pscroll')
  host.innerHTML =
    `<div class="ppin">` +
      `<h2 class="big phead">The program</h2>` +
      `<div class="pintro"><div class="expl">${intro ? intro.innerHTML : ''}</div></div>` +
      `<div class="pchap">` +
        `<div class="ptexts">${parsed.map((s, k) => `<div class="ptext"><span class="n">${k + 1}</span><div><strong>${s.title}</strong><p>${s.body}</p></div></div>`).join('')}</div>` +
        `<svg class="pstage" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="How the program is built: applications go to the castle, people are matched and go to the castle as groups, an invited expert fills a gap, and the program is assembled."><g class="pstatic">${castle()}</g><g class="pdyn"></g></svg>` +
        `<div class="pdots">${parsed.map(() => '<span></span>').join('')}</div>` +
      `</div>` +
    `</div>`
  /* only the moving layer is redrawn; the castle layer is drawn once and never replaced */
  const texts = host.querySelectorAll('.ptext'), stage = host.querySelector('.pdyn'), dots = host.querySelectorAll('.pdots span')
  stage.innerHTML = CHAPTERS[0].draw(0)

  const scroll = window.V4P_SCROLL || document.body.dataset.scroll === '1'
  if (scroll) {
    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.config({ ignoreMobileResize: true })
    /* no normalizeScroll: it takes over scrolling for the whole page, not just this section */
  }
  /* timeline in "scroll time" units; each chapter's length follows its scene length */
  const tl = gsap.timeline(scroll ? {
    scrollTrigger: {
      trigger: '.ppin', start: 'top top', end: '+=3600%', pin: true, scrub: 1.5,
      snap: { snapTo: 'labelsDirectional', inertia: false, duration: { min: 0.4, max: 1.2 }, delay: 0.2, ease: 'power1.inOut' },
    },
  } : { repeat: -1, repeatDelay: 1.5 })
  tl.addLabel('start')
  /* the heading appears first and stays at the top for the whole section */
  /* the heading first appears just above the intro text (as before), then moves up and stays at the top */
  const headEl = host.querySelector('.phead'), explEl = host.querySelector('.pintro .expl')
  const above = explEl.offsetTop - headEl.offsetTop - headEl.offsetHeight - 30
  tl.fromTo(headEl, { autoAlpha: 0, y: above + 24 }, { autoAlpha: 1, y: above, duration: 0.06, ease: 'power2.out' })
  tl.addLabel('headRead')
  tl.to({}, { duration: 0.08 })                                   /* pause: read the heading */
  /* the three intro paragraphs appear one by one, each followed by a pause for reading */
  const PREAD = [0.12, 0.17, 0.13]
  host.querySelectorAll('.pintro .expl p').forEach((el, k) => {
    tl.from(el, { autoAlpha: 0, y: 16, duration: 0.07, ease: 'power2.out' })
    tl.addLabel(`p${k}`)
    tl.to({}, { duration: PREAD[k] || 0.13 })
  })
  tl.addLabel('read')
  /* then both move up together, at the speed of the scroll (no easing), as if the page itself scrolled;
     the heading stops at the top and the intro text carries on and fades out */
  tl.to(headEl, { y: 0, duration: 0.2, ease: 'none' })
  tl.to('.pintro', { y: -above - 40, duration: 0.26, ease: 'none' }, '<')
  tl.to('.pintro', { autoAlpha: 0, duration: 0.12, ease: 'none' }, '<0.14')
  tl.fromTo('.pchap', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 })
  CHAPTERS.forEach((ch, k) => {
    const d = ch.dur / 10000, proxy = { t: 0 }
    tl.fromTo(texts[k], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.09, ease: 'power3.out',
      onStart: () => dots.forEach((dot, i) => dot.classList.toggle('on', i === k)),
      onReverseComplete: () => dots.forEach((dot, i) => dot.classList.toggle('on', i === k - 1)) })
    tl.addLabel(`c${k}text`)
    tl.to({}, { duration: 0.12 })                                 /* pause: read the chapter text before its animation */
    const at = tl.duration()
    tl.addLabel(`c${k}`, at)
    tl.to(proxy, { t: 1, duration: d, ease: 'none', onUpdate: () => (stage.innerHTML = ch.draw(proxy.t)) }, at)
    ch.beats.forEach((b, i) => tl.addLabel(`c${k}b${i}`, at + b * d))
    if (k < CHAPTERS.length - 1) {
      tl.to({}, { duration: 0.04 })                               /* a short hold at the end of the chapter */
      tl.to(texts[k], { autoAlpha: 0, y: -10, duration: 0.07, ease: 'power2.in' })
    }
  })
  tl.to({}, { duration: 0.22 })                                  /* the finished program stays on screen for a while */
  tl.addLabel('end')
  window.V4P_TL = tl
  if (scroll) {
    /* the page above may still be loading (photos, fonts); measure again once it has */
    const remeasure = () => ScrollTrigger.refresh()
    window.addEventListener('load', remeasure)
    if (document.fonts) document.fonts.ready.then(remeasure)
    setTimeout(remeasure, 1500)
  }
})()
