/* Desktop scroll setup for the program section (GSAP ScrollTrigger). Needs anim.js. */
/* GSAP ScrollTrigger: pin the section, scrub the timeline with the scrollbar,
   and snap to the end of each beat so a scroll never stops halfway through a match.
   Snap points are progress values (0..1) where a beat has finished. */
const BEATS = [
  0,      // crowd
  0.1,    // applications sent, matching starts
  0.117,  // sports scientist: needs
  0.177,  // computer scientist: offers
  0.2,    // linked
  0.365,  // group 1 in its column
  0.397,  // ecologist: needs
  0.437,  // historian: needs
  0.477,  // computer vision researcher: offers
  0.5,    // linked
  0.645,  // group 2 in its column
  0.656,  // psychologist: needs
  0.698,  // empty circle with "nobody offers this"
  0.752,  // label gone
  0.79,   // invitation sent
  0.838,  // guest in the circle
  0.905,  // gap pair in its column
  0.955,  // line and "The program"
  1,      // frame closed
]
const state = { p: 0 }
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const PHONE = window.matchMedia('(max-width: 760px)').matches
if (PHONE) {
  
} else if (reduce) {
  /* no scroll animation: show the finished program next to the steps */
  render(1)
  buildSteps(() => {})

} else {
  gsap.registerPlugin(ScrollTrigger)
  /* phones: the address bar showing and hiding changes the viewport height; don't recalculate on that */
  ScrollTrigger.config({ ignoreMobileResize: true })
  const phone = window.matchMedia('(max-width: 900px)').matches

  /* timeline in seconds of "scroll time": an intro phase, then the animation (1 unit) */
  /* timeline in "scroll time" units. Every text that appears is followed by a pause for reading:
     the heading, each intro paragraph, and each step when it opens. */
  const T_IN = 0.025                         /* one text fading in */
  const READ = { head: 0.03, p: [0.04, 0.06, 0.045], step: 0.07 }
  const STEP_AT = [0, 0.1, 0.64, 0.9]        /* animation positions where a new step opens */
  /* intro */
  let at = 0
  const SNAP_T = [0]
  const introSeq = []
  introSeq.push({ el: '.lefthead h2', t: at }); at += T_IN; SNAP_T.push(at); at += READ.head
  document.querySelectorAll('.lefthead .expl p').forEach((el, k) => {
    introSeq.push({ el, t: at }); at += T_IN; SNAP_T.push(at); at += READ.p[k] || 0.045
  })
  const SHOW_AT = at                         /* the castle (at full opacity) fades in first */
  at += 0.03; SNAP_T.push(at); at += 0.03
  const STEPS_AT = at                        /* then the steps list, with step 1 open */
  at += 0.03
  const ANIM_AT = at                         /* then the crowd and the envelopes */
  /* animation position p -> timeline time, with a reading pause after each step opens */
  const timeOf = (p) => ANIM_AT + p + READ.step * STEP_AT.filter((b) => b <= p).length - (STEP_AT.some((b) => b === p) ? READ.step : 0)
  const HOLD = 0.08                          /* the finished program stays on screen for a while before the page moves on */
  const TOTAL = ANIM_AT + 1 + READ.step * STEP_AT.length + HOLD
  const SNAPS = [...SNAP_T.map((x) => x / TOTAL), ...BEATS.map((b) => timeOf(b) / TOTAL), 1]

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#pin',
      start: 'top top',
      end: '+=3000%',         /* about 6 screen heights for the intro, the rest for the animation and its pauses */
      pin: true,
      scrub: 1,               /* follows the scrollbar with 1 s of smoothing */
      snap: {
        snapTo: SNAPS,
        directional: true,    /* settle on the next text or beat in the direction of travel */
        inertia: false,       /* no velocity throw: a fast scrollbar drag must not jump to the far end of the section */
        duration: { min: 0.4, max: 1.2 },
        delay: 0.2,
        ease: 'power1.inOut',
      },
    },
  })
  introSeq.forEach((x) => tl.from(x.el, { autoAlpha: 0, y: 16, duration: T_IN, ease: 'power2.out' }, x.t))
  tl.fromTo('#stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, SHOW_AT)
  tl.fromTo('#steps', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, STEPS_AT)
  /* the animation runs in segments; it stands still for a moment each time a step opens */
  let prev = 0
  STEP_AT.forEach((b, k) => {
    if (b > prev) tl.to(state, { p: b, ease: 'none', duration: b - prev, onUpdate: () => render(state.p) }, timeOf(prev) + (k > 0 || prev > 0 ? READ.step : 0))
    prev = b
  })
  tl.to(state, { p: 1, ease: 'none', duration: 1 - prev, onUpdate: () => render(state.p) }, timeOf(prev) + READ.step)
  tl.to({}, { duration: 0.0001 }, TOTAL)
  window.V4P_TL = tl

  /* the page above may still be loading (photos, fonts); measure again once it has */
  const remeasure = () => ScrollTrigger.refresh()
  window.addEventListener('load', remeasure)
  if (document.fonts) document.fonts.ready.then(remeasure)
  setTimeout(remeasure, 1500)
  render(0)
  /* clicking a step scrolls to where that step starts */
  buildSteps((k) => {
    const st = tl.scrollTrigger
    window.scrollTo({ top: st.start + (st.end - st.start) * (timeOf(STEP_START[k]) / TOTAL) + 2, behavior: 'smooth' })
  })
}
