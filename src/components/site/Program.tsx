import { useEffect } from 'react'

/* "The program" section: animation of how the program is built.
   09.11.2026: on /programme/ it runs as a player (player.js, phone.js in V4P_PLAYER mode): no pin, plays once in view.
   The animation lives in public/program/ (plain scripts shared with the preview pages):
   anim.js draws the desktop scene, scroll-init.js pins and scrubs it with GSAP ScrollTrigger,
   phone.js builds the separate phone version below 760 px. Mockup integration (08.11.2026). */

const BASE = import.meta.env.BASE_URL + 'program/'
const SCRIPTS = ['gsap.min.js', 'anim.js', 'phone.js', 'player.js']

const INTRO = `<div class="expl">
  <p>At a typical conference, you sit through talks that have little to do with your work.</p>
  <p>At V4AIR, we read your application first, then match you with experts and topics based on what you need.</p>
  <p>The talks and workshops are chosen to address your specific problem.</p>
</div>`

const MARKUP = `
<div id="pin" class="v4p-pin desk">
  <div class="two">
    <div id="left">
      <div class="lefthead">
        <h2 class="big">The program</h2>
        ${INTRO}
      </div>
      <ol id="steps"></ol>
    </div>
    <svg id="stage" viewBox="0 0 600 560" role="img" aria-label="Participants whose needs and skills match are brought together at Kostelec Castle; an invited expert fills a gap no applicant covers; the program follows."></svg>
  </div>
</div>
<div id="phone" class="phone"></div>`

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(src))
    document.body.appendChild(s)
  })
}

export function Program() {
  useEffect(() => {
    if (document.getElementById('v4p-css')) return
    const link = document.createElement('link')
    link.id = 'v4p-css'
    link.rel = 'stylesheet'
    link.href = BASE + 'program.css'
    document.head.appendChild(link)
    const w = window as unknown as Record<string, unknown>
    w.V4P_EMBED = true
    w.V4P_PLAYER = true
    w.V4P_ASSET = import.meta.env.BASE_URL + 'assets/castle-silhouette.png'
    SCRIPTS.reduce((p, f) => p.then(() => loadScript(BASE + f)), Promise.resolve())
  }, [])

  return <section className="v4p player" id="program" dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
