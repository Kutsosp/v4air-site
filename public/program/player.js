/* Desktop player for "The program" (09.11.2026, redesign doc points 9-11).
   Replaces scroll-init.js: no pinning, no scrubbing. The animation plays like a video once the
   section is in view, stops on the last frame; clicking a step jumps there and plays on.
   Uses render(p), buildSteps() and STEP_START from anim.js. */
;(function desktopPlayer() {
  const stage = document.getElementById('stage')
  if (!stage || window.matchMedia('(max-width: 760px)').matches) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const DUR = 46000
  /* 10.11.2026 (Peter: matchmaking too slow): step 2 (p 0.1-0.64) plays 1.4x faster, 24.8 s -> 17.7 s (2x was too fast) */
  const MATCH_SPEED = 1.4
  let p = 0, playing = false, last = 0, started = false
  function frame(now) {
    if (!playing) return
    const dt = last ? now - last : 0; last = now
    p = Math.min(1, p + (dt * (p >= 0.1 && p < 0.64 ? MATCH_SPEED : 1)) / DUR)
    render(p)
    if (p >= 1) { playing = false; return }
    requestAnimationFrame(frame)
  }
  function play() { if (playing) return; playing = true; last = 0; requestAnimationFrame(frame) }
  buildSteps((k) => { p = STEP_START[k] + 0.001; render(p); started = true; if (!reduce) play() })
  /* reduced motion: show the finished program, steps still clickable */
  if (reduce) { render(1); return }
  render(0)
  /* start when at least 40 % of the stage is on screen */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && !started) { started = true; play() } })
  }, { threshold: 0.4 })
  io.observe(stage)
})()
