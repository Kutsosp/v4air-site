const STEPS = [
  '<strong>We read your application.</strong> You tell us what your research needs and what you can offer others.',
  '<strong>Matchmaking</strong> We match participants with those who can help solve their problems.',
  '<strong>Invited speakers</strong> We invite experts to fill any gaps.',
  '<strong>We build the program.</strong> The talks and workshops are built around the matches.',
]
const STEP_START = [0, 0.1, 0.64, 0.9]
const W = 600, COLS = 13, ROWS = 4
const rnd = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
const CROWD = Array.from({ length: COLS * ROWS }, (_, i) => {
  const c = i % COLS, r = Math.floor(i / COLS)
  return { x: 32 + c * 42 + (r % 2 ? 11 : -4) + (rnd(i) - 0.5) * 10, y: 412 + r * 38 + (rnd(i + 99) - 0.5) * 8 }
})
/* End frame (option B): three columns under "The program", each with its people, a coloured
   underline, the kind and the topic. Groups fly straight into their column. */
const COL_Y = 270
/* order is always: the people who need something first, the person who offers it last.
   Lines run from the offerer to each person who needs it, drawn as the offerer lights up. */
const GROUPS = [
  { color: 'var(--m1)', topic: 'motion analysis', kind: 'TALK', title: 'Motion analysis', cx: 148, win: [0.1, 0.34], members: [
    { i: 44, field: 'sports scientist', role: 'needs', problem: "analysis of players' technique" },
    { i: 7, field: 'computer scientist', role: 'offers' } ] },
  { color: 'var(--m2)', topic: 'computer vision', kind: 'WORKSHOP', title: 'Computer vision', cx: 300, win: [0.38, 0.62], members: [
    { i: 16, field: 'ecologist', role: 'needs', problem: 'pollinator identification' },
    { i: 40, field: 'historian', role: 'needs', problem: 'handwriting recognition' },
    { i: 47, field: 'computer vision researcher', role: 'offers' } ] },
]
const GAP = { a: 43, field: 'psychologist', problem: 'mood analysis of interviews', guest: 'computational linguist', color: 'var(--m3)', topic: 'sentiment analysis', kind: 'INVITED TALK', title: 'Sentiment analysis', cx: 456, win: [0.64, 0.9] }
GROUPS.forEach((g) => g.members.forEach((m, k) => { m.slot = g.cx - ((g.members.length - 1) * 24) / 2 + k * 24 }))
GAP.slots = [GAP.cx - 12, GAP.cx + 12]
/* castle PNG for the current theme: a white silhouette on dark, a dark one on light.
   (a CSS invert filter on an SVG <image> did not paint in Chromium, so two files are used) */
function castleHref() {
  const dark = document.documentElement.dataset.theme === 'dark'
  if (window.V4P_ASSET) return dark ? window.V4P_ASSET : window.V4P_ASSET.replace(/\.png$/, '_dark.png')
  return dark ? 'castle-silhouette.png' : 'castle-silhouette_dark.png'
}
window.castleHref = castleHref
/* theme switch: swap the PNG in every castle image already on the page */
new MutationObserver(() => {
  document.querySelectorAll('image.v4p-castle').forEach((i) => i.setAttribute('href', castleHref()))
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
const CASTLE = { x: 300, y: 74, w: 230, h: 121 }
/* frame: drawn from the top centre outward, pauses as a single rule, then runs down and closes */
const FR = { x0: 62, x1: 538, top: 218, bottom: 366, r: 14 }
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
const seg = (p, a, b) => clamp((p - a) / (b - a))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a, b, t) => a + (b - a) * t
function travel(x0, y0, x1, y1, t) {
  const e = ease(t), cx = x0, cy = Math.min(y0, y1) - 40, u = 1 - e
  return { x: u * u * x0 + 2 * u * e * cx + e * e * x1, y: u * u * y0 + 2 * u * e * cy + e * e * y1 }
}
const person = (x, y, color, lit, op = 1) =>
  `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" class="person${lit ? ' lit' : ''}" style="${color ? 'color:' + color + ';' : ''}opacity:${op.toFixed(3)}"><circle cx="0" cy="-15" r="6.5"/><path d="M-9 8 v-6 a9 9 0 0 1 18 0 v6 z"/></g>`
/* who sends an application envelope in step 1: a spread of people across the crowd */
const MAIL_FROM = [3, 18, 33, 9, 27, 45, 14, 38, 5, 50, 22, 31, 11, 42]
const envelope = (x, y, color, op) =>
  `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="opacity:${clamp(op).toFixed(3)}">` +
  `<rect x="-9" y="-6" width="18" height="12" rx="2" class="mail" style="stroke:${color}"/>` +
  `<path d="M-9 -6 L0 1 L9 -6" class="mail" style="stroke:${color}"/></g>`
let TAGS = []
/* phones get labels 1.24x larger (18 / 14.5, matches the font sizes in the css) */
const LS = window.matchMedia('(max-width: 900px)').matches ? 1.24 : 1
/* anchor 'middle': x is the centre of the label; 'start': x is its left edge (label beside a person) */
const tag = (x, y, title, sub, color, op, anchor = 'middle') => {
  if (op <= 0.01) return
  /* estimated text width: 14.5 px bold title, 13 px semibold line (about 0.58 em per character) */
  const w = Math.max(title.length * 8.4, (sub || '').length * 7.3) * LS
  /* labels above a person move up with the larger text; labels under the empty circle stay put */
  if (y < 500) y = y + 56 - 56 * LS
  const cx = anchor === 'start' ? clamp(x, 4, W - w - 4) + w / 2 : clamp(x, w / 2 + 4, W - w / 2 - 4)
  TAGS.push({ x: cx, y, w, h: (sub ? 30 : 16) * LS, title, sub, color, op: clamp(op), anchor })
}
/* place labels in order; a label that would touch one already placed moves up until it is clear */
function drawTags() {
  const placed = []
  const hit = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 8 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4
  return TAGS.map((l) => {
    let guard = 0
    while (placed.some((q) => hit(l, q)) && guard++ < 12) l.y -= 18 * LS
    placed.push(l)
    /* shadow: a blurred copy of each line in the page colour, so it sits only behind the letters */
    const tx = l.anchor === 'start' ? l.x - l.w / 2 : l.x
    const line = (y, cls, text, style = '') =>
      `<text x="${tx.toFixed(1)}" y="${y.toFixed(1)}" class="${cls} halo" filter="url(#soft)">${text}</text>` +
      `<text x="${tx.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" style="${style}">${text}</text>`
    return `<g style="opacity:${l.op.toFixed(3)}" text-anchor="${l.anchor}">` +
      line(l.y + 12 * LS, 'lt', l.title) +
      (l.sub ? line(l.y + 26 * LS, 'ls', l.sub, `fill:${l.color}`) : '') +
      '</g>'
  }).join('')
}
/* column caption: coloured underline, kind, topic; appears as the group lands */
function caption(g, op) {
  if (op <= 0.01) return ''
  const lift = (1 - op) * 6
  return `<g style="opacity:${op.toFixed(3)}" transform="translate(0 ${lift.toFixed(1)})">` +
    `<line x1="${g.cx - 34}" y1="292" x2="${g.cx + 34}" y2="292" style="stroke:${g.color};stroke-width:2"/>` +
    `<text x="${g.cx}" y="318" text-anchor="middle" class="kind" style="fill:${g.color}">${g.kind}</text>` +
    `<text x="${g.cx}" y="340" text-anchor="middle" class="topic">${g.title.split('|').map((l, k) => `<tspan x="${g.cx}" dy="${k ? 18 : 0}">${l}</tspan>`).join('')}</text></g>`
}
/* one half of the frame, from the top centre: across, down, back to the bottom centre */
function frameHalf(dir, rule, close) {
  const { x0, x1, top, bottom, r } = FR
  const cx = 300, edge = dir < 0 ? x0 : x1
  /* pathLength="1" lets the browser measure the real path; the top edge is this share of it */
  const across = Math.abs(edge - cx) - r, down = bottom - top - 2 * r, corner = 1.15 * r
  const topShare = across / (across + corner + down + corner + across)
  const len = rule * topShare + close * (1 - topShare)
  /* each half runs 1 unit past the centre at the bottom, so the two halves overlap and close the box */
  const d = `M ${cx} ${top} H ${edge - dir * r} Q ${edge} ${top} ${edge} ${top + r} V ${bottom - r} Q ${edge} ${bottom} ${edge - dir * r} ${bottom} H ${cx - dir}`
  return `<path d="${d}" pathLength="1" class="frame" style="stroke-dasharray:${len.toFixed(4)} 2;"/>`
}

function render(p) {
  TAGS = []
  const intro = seg(p, 0, 0.08)
  const crowdOut = seg(p, 0.89, 0.92), rule = seg(p, 0.91, 0.935), head = seg(p, 0.935, 0.955), close = seg(p, 0.955, 0.99)
  const moving = new Set([...GROUPS.flatMap((g) => g.members.map((m) => m.i)), GAP.a])
  const appearAll = clamp(intro * 1.6)
  /* soft shadow behind labels: a blurred patch of the page colour, no visible edge */
  /* the castle and its caption are created once and only their opacity changes; recreating the
     image on every frame made it flicker or disappear */
  const svgEl = document.getElementById('stage')
  if (!svgEl.querySelector('.st-static')) {
    svgEl.innerHTML = `<defs><filter id="soft" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>` +
      `<g class="st-static"><image href="${castleHref()}" class="v4p-castle" x="${CASTLE.x - CASTLE.w / 2}" y="${CASTLE.y - CASTLE.h / 2}" width="${CASTLE.w}" height="${CASTLE.h}"/>` +
      `<text x="${CASTLE.x}" y="${CASTLE.y + CASTLE.h / 2 + 22}" text-anchor="middle" class="place">V4AIR at Kostelec Castle</text></g><g class="st-dyn"></g>`
  }
  const cimg = svgEl.querySelector('.st-static image')
  if (cimg.getAttribute('href') !== castleHref()) cimg.setAttribute('href', castleHref())
  /* the castle is at full strength from the first frame; the scroll setup fades the whole stage in */
  cimg.style.opacity = '0.85'
  svgEl.querySelector('.st-static text').style.opacity = '1'
  let s = ''
  CROWD.forEach((g, i) => {
    if (moving.has(i)) return
    const appear = clamp(intro * 1.6 - rnd(i + 3) * 0.6), dim = (p > 0.1 ? 0.3 : 0.7) * (1 - crowdOut)
    s += person(g.x, g.y + (1 - appear) * 10, null, false, appear * dim)
  })
  /* step 1: applications, as envelopes flying from people in the crowd up to the castle */
  MAIL_FROM.forEach((i, k) => {
    /* all envelopes have arrived by p = 0.087, before matching starts at 0.1 */
    const st = 0.02 + k * 0.0028, mt = seg(p, st, st + 0.03)
    if (mt <= 0 || mt >= 1) return
    const c = CROWD[i], e = 0.5 - 0.5 * Math.cos(mt * Math.PI)
    const x = lerp(c.x, CASTLE.x + (k % 5 - 2) * 14, e), y = lerp(c.y - 30, CASTLE.y + 18, e) - Math.sin(mt * Math.PI) * 30
    s += envelope(x, y, 'var(--text2)', 1 - seg(mt, 0.8, 1))
  })
  GROUPS.forEach((g) => {
    const t = seg(p, g.win[0], g.win[1]), n = g.members.length, go = seg(t, 0.72, 1)
    const start = (k) => (k * 0.5) / n
    const pos = g.members.map((m) => travel(CROWD[m.i].x, CROWD[m.i].y, m.slot, COL_Y, go))
    const fade = 1 - go * 3
    const hub = g.members.findIndex((m) => m.role === 'offers')
    const link = seg(t, start(hub) + 0.05, start(hub) + 0.15)
    g.members.forEach((m, k) => {
      if (k === hub) return
      s += `<line x1="${pos[hub].x}" y1="${pos[hub].y - 8}" x2="${pos[k].x}" y2="${pos[k].y - 8}" pathLength="1" class="link" style="stroke:${g.color};stroke-dashoffset:${1 - link};opacity:${link * (1 - go)}"/>`
    })
    g.members.forEach((m, k) => {
      const light = seg(t, start(k), start(k) + 0.07)
      const c = CROWD[m.i]
      s += person(pos[k].x, pos[k].y, light > 0 ? g.color : null, light > 0, appearAll)
      tag(c.x, c.y - 56, m.field, m.role === 'offers' ? `offers: ${g.topic}` : `needs: ${m.problem}`, g.color, light * fade)
    })
    s += caption(g, seg(p, g.win[1] - 0.015, g.win[1] + 0.025))
  })
  /* the gap, in beats: the problem; an empty spot on the right with "nobody offers this"; that label goes;
     an envelope (the invitation) flies out to the right edge; the guest comes back along the same path */
  const gt = seg(p, GAP.win[0], GAP.win[1])
  const gLight = seg(gt, 0, 0.06), gScan = seg(gt, 0.15, 0.22), gNobodyOut = seg(gt, 0.38, 0.43)
  const gMail = seg(gt, 0.45, 0.56), gEnter = seg(gt, 0.58, 0.76), gGo = seg(gt, 0.83, 1)
  const G = CROWD[GAP.a]
  const ga = travel(G.x, G.y, GAP.slots[0], COL_Y, gGo)
  const SPOT = CROWD[44]
  const near = { x: lerp(W + 30, SPOT.x, ease(gEnter)), y: SPOT.y }
  const gb = gGo > 0 ? travel(SPOT.x, SPOT.y, GAP.slots[1], COL_Y, gGo) : near
  if (gScan > 0 && gEnter < 1) s += `<circle cx="${SPOT.x}" cy="${SPOT.y - 4}" r="${14 + gScan * 6}" class="empty" style="stroke:${GAP.color};opacity:${(1 - gEnter) * 0.9}"/>`
  if (gMail > 0 && gMail < 1) {
    const ex = lerp(SPOT.x, W + 30, ease(gMail)), ey = SPOT.y - 10 - Math.sin(gMail * Math.PI) * 22
    s += `<g transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)})" style="opacity:${(1 - seg(gMail, 0.8, 1)).toFixed(3)}">` +
      envelope(0, 0, GAP.color, 1) + '</g>'
  }
  s += person(ga.x, ga.y, gLight > 0 ? GAP.color : null, gLight > 0, appearAll)
  if (gEnter > 0) s += person(gb.x, gb.y, GAP.color, true, 1)
  const gFade = 1 - gGo * 3
  tag(G.x, G.y - 56, GAP.field, `needs: ${GAP.problem}`, GAP.color, gLight * gFade)
  /* these two sit beside the spot, level with the person: below it they would leave the 560-unit stage */
  tag(SPOT.x + 18, SPOT.y - 20, 'nobody offers this', '', GAP.color, gScan * (1 - gNobodyOut), 'start')
  tag(SPOT.x + 18, SPOT.y - 18, GAP.guest, `offers: ${GAP.topic}`, GAP.color, seg(gEnter, 0.6, 1) * gFade, 'start')
  s += caption(GAP, seg(p, GAP.win[1] - 0.015, GAP.win[1] + 0.025))
  /* end: the rule draws out from the centre, the heading appears, then the rule runs down into a frame */
  if (rule > 0) s += frameHalf(-1, ease(rule), ease(close)) + frameHalf(1, ease(rule), ease(close))
  if (head > 0) s += `<text x="300" y="${206 + (1 - head) * 6}" text-anchor="middle" class="head" style="opacity:${head.toFixed(3)}">THE PROGRAM</text>`
  s += drawTags()
  svgEl.querySelector('.st-dyn').innerHTML = s
  const step = p < 0.1 ? 0 : p < 0.64 ? 1 : p < 0.9 ? 2 : 3
  /* one caption for the current step; it fades in again whenever the step changes */
  const cap = document.getElementById('caption')
  if (cap && cap.dataset.k !== String(step)) {
    cap.dataset.k = String(step)
    cap.innerHTML = `<span class="n">${step + 1}</span><span class="txt">${STEPS[step]}</span>`
    cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in')
  }
  document.querySelectorAll('#dots button').forEach((d, k) => (d.className = k === step ? 'on' : k < step ? 'done' : ''))
  document.querySelectorAll('#steps li').forEach((li, k) => (li.className = k === step ? 'on' : k < step ? 'done' : ''))
  window.CURRENT_STEP = step
  const pct = document.getElementById('pct')
  if (pct) pct.textContent = Math.round(p * 100) + '%'
}

/* builds the step list (#steps) and/or the progress dots (#dots); onPick(k) runs when one is clicked */
function buildSteps(onPick) {
  const ol = document.getElementById('steps'), dots = document.getElementById('dots')
  STEPS.forEach((txt, k) => {
    if (ol) {
      const m = txt.match(/<strong>(.*?)<\/strong>\s*(.*)/)
      const li = document.createElement('li')
      li.innerHTML = `<span class="n">${k + 1}</span><span class="txt"><strong>${m ? m[1] : ''}</strong><span class="body">${m ? m[2] : txt}</span></span>`
      li.onclick = () => onPick(k)
      ol.appendChild(li)
    }
    if (dots) {
      const d = document.createElement('button')
      d.type = 'button'
      d.setAttribute('aria-label', `Step ${k + 1}: ${txt.replace(/<[^>]+>/g, '')}`)
      d.onclick = () => onPick(k)
      dots.appendChild(d)
    }
  })
}

/* light/dark switch for the preview */
;(function themeSwitch() {
  if (window.V4P_EMBED) return  /* on the site, the site's own theme switch is used */
  const root = document.documentElement
  const apply = (mode) => { root.dataset.theme = mode; btn.textContent = mode === 'dark' ? 'Light mode' : 'Dark mode' }
  const btn = document.createElement('button')
  btn.className = 'theme-switch'
  btn.onclick = () => { const m = root.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('v4air-anim-theme', m); apply(m) }
  document.body.appendChild(btn)
  apply(localStorage.getItem('v4air-anim-theme') || 'dark')
})()
