import { useEffect, useRef } from 'react'
import { useNow } from '@/lib/time'
import { Reveal } from './Reveal'

/* Locked visual settings (Peter, 2026-08-26):
   castle scale 240 / lift 24 / glow 79; walker 32/+3 phosphor; victory tai-chi 40/-11 */
const CASTLE = { scale: 240, lift: 24, glow: 0.79 }
const WALKER = { scale: 32, lift: 3 }
const VICTORY = { scale: 40, lift: -11 }

const STOPS = [
  { date: '2026-09-01', label: '1 Sep 2026', what: 'Applications open', sub: 'Three questions, no CV, no motivation letter.' },
  { date: '2027-01-15', label: '15 Jan 2027', what: 'Application deadline', sub: 'Careful answers beat fast ones.' },
  { date: '2027-02-15', label: 'Feb 2027', what: 'Selection results', sub: 'Everyone hears from us, either way.' },
  { date: '2027-03-10', label: 'March 2027', what: 'Keynotes + preliminary programme', sub: 'Built to fit you.' },
  { date: '2027-04-14', label: 'Apr 2027', what: 'Final programme', sub: 'With everything you need for the trip.' },
  { date: '2027-04-28', label: '28-30 Apr 2027', what: 'V4AIR at Kostelec Castle', sub: 'Three days, one roof.' },
  { date: '2027-05-01', label: 'And beyond', what: 'Follow-up activities', sub: 'The connections made over three days keep working together.' },
]
const T = STOPS.map((s) => new Date(`${s.date}T00:00:00`).getTime())
const DAY = 86400000
const END_OF_EVENT = new Date('2027-04-30T23:59:59').getTime()

const SVG_ATTRS =
  'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"'
/* Phosphor person-simple-walk + person-simple-run (MIT), 2-frame gait */
const WALK_SVG = `<svg viewBox="0 0 256 256"><circle cx="152" cy="48" r="24" ${SVG_ATTRS}/><path d="M48,129s56-52.65,88-24.87C153.94,119.67,168,144,208,144" ${SVG_ATTRS}/><polyline points="152 232 152 176 109.54 145.67" ${SVG_ATTRS}/><line x1="129.53" y1="99.69" x2="72" y2="232" ${SVG_ATTRS}/></svg>`
const RUN_SVG = `<svg viewBox="0 0 256 256"><circle cx="152" cy="56" r="24" ${SVG_ATTRS}/><path d="M56,105.6s32-25.67,80,7c50.47,34.3,80,20.85,80,20.85" ${SVG_ATTRS}/><path d="M110.64,161.16C128.47,165,176,180,176,232" ${SVG_ATTRS}/><path d="M134.44,111.51C128.37,135.24,98.81,206.68,32,200" ${SVG_ATTRS}/></svg>`
/* Phosphor person-simple-tai-chi (MIT), victory pose */
const TAICHI_SVG = `<svg width="${VICTORY.scale}" height="${VICTORY.scale}" viewBox="0 0 256 256"><circle cx="128" cy="48" r="24" ${SVG_ATTRS}/><line x1="40" y1="104" x2="216" y2="104" ${SVG_ATTRS}/><polyline points="128 104 128 144 48 216" ${SVG_ATTRS}/><polyline points="128 144 184 168 184 216" ${SVG_ATTRS}/></svg>`

const glow = (g: number) =>
  `drop-shadow(0 0 2px rgb(var(--accent-glow) / ${(0.9 * g).toFixed(2)})) drop-shadow(0 0 8px rgb(var(--accent-glow) / ${(0.6 * g).toFixed(2)}))`

function phaseCopy(now: number) {
  const fmtD = (n: number) => (n === 1 ? '1 day' : `${n} days`)
  const dTo = (k: number) => Math.ceil((T[k] - now) / DAY)
  let last = -1
  STOPS.forEach((_, k) => {
    if (T[k] <= now) last = k
  })
  const eventLive = last === 5 && now <= END_OF_EVENT
  let line: string
  let sign = true
  if (last === -1) line = `Applications open in ${fmtD(dTo(0))}.`
  else if (last === 0) line = `Applications are open. ${fmtD(dTo(1))} left to apply.`
  else if (last === 1) line = 'Applications are closed. Selection is underway; results in February.'
  else if (last === 2) line = "Results are out. We're working hard on building the ideal programme based on your answers."
  else if (last === 3) line = 'Keynotes and preliminary programme are out. Final programme lands in April.'
  else if (last === 4) line = `V4AIR starts in ${fmtD(dTo(5))}.`
  else if (eventLive) line = 'V4AIR is happening right now. Why are you looking at this?'
  else {
    line = 'The three days are over; the group keeps working together.'
    sign = false
  }
  return { last, eventLive, line, sign }
}

export function Timeline() {
  const now = useNow()
  const roadRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const stopsRef = useRef<HTMLDivElement>(null)
  const countdownRef = useRef<HTMLParagraphElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const road = roadRef.current
    const svg = svgRef.current
    const stopsEl = stopsRef.current
    const countdownEl = countdownRef.current
    const list = listRef.current
    const section = sectionRef.current
    if (!road || !svg || !stopsEl || !countdownEl || !list || !section) return
    section.classList.add('js')

    const state = phaseCopy(now)
    countdownEl.textContent = state.line

    /* mobile list state works with or without the road */
    Array.from(list.querySelectorAll('li')).forEach((li, k) => {
      li.classList.toggle('past', k < state.last)
      li.classList.toggle('current', k === state.last)
    })

    function build() {
      if (!road || !svg || !stopsEl) return
      const w = road.clientWidth
      if (!w) return
      road
        .querySelectorAll('.castle, .now-tag, .marker, .dot')
        .forEach((n) => n.remove())
      /* narrow screens: same horizontal road squeezed to the viewport, with a
         single tappable caption under it instead of seven side-by-side cards */
      const compact = w < 640
      road.classList.toggle('compact', compact)
      const castleDim = compact
        ? { h: 78, lift: 14 }
        : { h: Math.round(CASTLE.scale * 0.52), lift: CASTLE.lift }
      const pad = compact ? 26 : 75
      const H = 90
      const amp = compact ? 12 : 14
      const mid = 48
      const pts = STOPS.map((_, k) => ({
        x: pad + (w - 2 * pad) * (k / (STOPS.length - 1)),
        y: mid + (k % 2 ? amp : -amp),
      }))
      let d = `M ${pts[0].x} ${pts[0].y}`
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1]
        const b = pts[k]
        const mx = (a.x + b.x) / 2
        d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
      }
      svg.setAttribute('viewBox', `0 0 ${w} ${H}`)
      svg.style.height = `${H}px`
      const le = pts[pts.length - 1]
      const tail = `M ${le.x} ${le.y} C ${le.x + 40} ${le.y}, ${le.x + 55} ${le.y - 10}, ${w + 20} ${le.y - 16}`
      svg.innerHTML =
        `<defs><linearGradient id="tailFade" gradientUnits="userSpaceOnUse" x1="${le.x}" y1="0" x2="${w}" y2="0">` +
        `<stop offset="0" stop-color="#4a6367"/><stop offset="1" stop-color="#4a6367" stop-opacity="0"/></linearGradient></defs>` +
        `<path class="track" d="${d}"/>` +
        `<path d="${tail}" fill="none" stroke="url(#tailFade)" stroke-width="1.5" stroke-dasharray="2 7" stroke-linecap="round"/>` +
        `<path class="prog" d="${d}"/>`
      const track = svg.querySelector<SVGPathElement>('.track')!
      const prog = svg.querySelector<SVGPathElement>('.prog')!
      const L = track.getTotalLength()
      const samples: DOMPoint[] = []
      for (let i = 0; i <= 400; i++) samples.push(track.getPointAtLength((L * i) / 400))
      prog.style.strokeDasharray = `${L} ${L}`

      const { last, eventLive, sign } = state

      stopsEl.innerHTML = ''
      const dotEls: HTMLElement[] = []
      const stopEls: HTMLElement[] = []
      let selectCaption = (_k: number) => {}
      if (compact) {
        const caption = document.createElement('div')
        caption.className = 'stop-caption'
        stopsEl.appendChild(caption)
        selectCaption = (k: number) => {
          const s = STOPS[k]
          caption.innerHTML = `<span class="date">${s.label}</span><span class="what">${s.what}</span>`
          dotEls.forEach((el, i) => el.classList.toggle('sel', i === k))
        }
      }
      STOPS.forEach((s, k) => {
        const isMain = k === 5
        if (!compact) {
          const div = document.createElement('div')
          div.className = `stop${isMain ? ' main' : ''}`
          div.style.left = `${pts[k].x}px`
          div.style.top = `${pts[k].y + 18}px`
          div.innerHTML = `<span class="date">${s.label}</span><span class="what">${s.what}</span><span class="sub">${s.sub}</span>`
          div.tabIndex = 0
          stopsEl.appendChild(div)
          stopEls.push(div)
        }
        if (isMain) {
          const c = document.createElement('span')
          c.className = 'castle'
          c.style.left = `${pts[k].x}px`
          c.style.top = `${pts[k].y - 8}px`
          road.appendChild(c)
          dotEls.push(c)
        } else {
          const dot = document.createElement('span')
          dot.className = 'dot'
          dot.style.left = `${pts[k].x}px`
          dot.style.top = `${pts[k].y}px`
          road.appendChild(dot)
          dotEls.push(dot)
        }
        if (compact) dotEls[k].addEventListener('click', () => selectCaption(k))
      })
      if (compact) selectCaption(Math.min(Math.max(last, 0), STOPS.length - 1))

      const lengthAtX = (x: number) => {
        let best = 0
        let bestDx = Infinity
        samples.forEach((p, i) => {
          const dx = Math.abs(p.x - x)
          if (dx < bestDx) {
            bestDx = dx
            best = i
          }
        })
        return (L * best) / 400
      }

      STOPS.forEach((_, k) => {
        if (dotEls[k].classList.contains('dot')) {
          dotEls[k].classList.toggle('past', k < last)
          dotEls[k].classList.toggle('now-dot', k === last)
        }
        if (stopEls[k]) stopEls[k].classList.toggle('done', k < last)
      })

      if (last >= 0 && !eventLive && sign) {
        const tag = document.createElement('span')
        tag.className = 'now-tag'
        tag.textContent = 'happening now'
        tag.style.left = `${pts[last].x}px`
        tag.style.top = `${pts[last].y - 26}px`
        road.appendChild(tag)
      }

      let x: number
      if (last === -1) x = pts[0].x - (compact ? 18 : 40)
      else if (last >= STOPS.length - 2) x = pts[5].x
      else {
        const f = (now - T[last]) / (T[last + 1] - T[last])
        x = pts[last].x + (pts[last + 1].x - pts[last].x) * Math.min(1, Math.max(0, f))
      }
      prog.style.strokeDashoffset = `${last === -1 ? L : L - lengthAtX(x)}`

      if (sign) {
        const m = document.createElement('span')
        m.className = 'marker'
        m.style.filter = glow(CASTLE.glow)
        if (eventLive) {
          m.classList.add('m-victory')
          m.style.left = `${pts[5].x}px`
          m.style.top = `${pts[5].y - 8 - castleDim.h - castleDim.lift - 4 - VICTORY.lift}px`
          m.innerHTML = TAICHI_SVG
        } else {
          m.classList.add('m-walk')
          const mx = Math.max(compact ? 8 : 60, x)
          let my = 48
          let bestDx = Infinity
          samples.forEach((p) => {
            const dx = Math.abs(p.x - mx)
            if (dx < bestDx) {
              bestDx = dx
              my = p.y
            }
          })
          m.style.left = `${mx}px`
          m.style.top = `${my - 4 - WALKER.lift}px`
          m.style.width = `${WALKER.scale}px`
          m.style.height = `${WALKER.scale}px`
          m.innerHTML = `<span class="frame f1">${WALK_SVG}</span><span class="frame f2">${RUN_SVG}</span>`
        }
        road.appendChild(m)
      }
    }

    build()
    window.addEventListener('resize', build)
    return () => window.removeEventListener('resize', build)
  }, [now])

  return (
    <section className="timeline" id="timeline" ref={sectionRef}>
      <Reveal className="wrap">
        <h2>The road to Kostelec</h2>
        <p className="muted intro">
          Seven dates. Only the first two need anything from you; the rest is on us.
        </p>
        <p className="countdown" ref={countdownRef}></p>
        <div className="road-wrap">
          <div className="road" ref={roadRef}>
            <svg ref={svgRef} preserveAspectRatio="none" aria-hidden="true"></svg>
            <div className="road-stops" ref={stopsRef}></div>
          </div>
        </div>
        <ol className="tl-list" ref={listRef}>
          {STOPS.map((s) => (
            <li key={s.date} data-date={s.date}>
              <span className="m-dot"></span>
              <span className="date">{s.label}</span>
              <span className="what">{s.what}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
