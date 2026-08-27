import { useEffect, useRef } from 'react'
import { APPLY_URL, CONTACT_MAILTO } from './Reveal'

const STEPS = [
  {
    title: 'Tell us three things',
    body: 'What you work on, what you want to learn, and who you would like to meet. No abstract, no finished talk; that is the entire form.',
  },
  {
    title: 'We select for fit and mix',
    body: 'Not first-come-first-served. Careful answers beat fast ones, and they shape your experience once you are there.',
  },
  {
    title: 'We get in touch',
    body: 'Accepted participants hear from us directly, with everything you need for the trip.',
  },
  {
    title: 'We shape your contribution together',
    body: 'Your topic and format get worked out with you, and the whole event is built from what everyone asked for.',
  },
]

/* Pinned scroll sequence: the glowing thread fill drives step reveals. */
export function ApplySteps() {
  const outerRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)
  const threadRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outer = outerRef.current
    const steps = stepsRef.current
    const thread = threadRef.current
    const fill = fillRef.current
    const panel = panelRef.current
    if (!outer || !steps || !thread || !fill || !panel) return
    const items = Array.from(steps.querySelectorAll('li'))
    /* small screens use the static (non-pinned) layout, same as reduced motion */
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(max-width: 900px)').matches

    let top = 0
    let span = 0
    let marks: number[] = []
    let panelMark = 1
    let litTimer = 0
    const measure = () => {
      const ns = items.map((li) => li.querySelector<HTMLElement>('.n')!)
      const c = (n: HTMLElement) =>
        (n.parentElement as HTMLElement).offsetTop + n.offsetTop + n.offsetHeight / 2
      top = c(ns[0])
      /* run past ring 4 and END behind the apply panel (mid-panel, so it never
         pokes out below): the panel is the destination. offsetTop-based math
         ignores the panel's reveal transform, unlike getBoundingClientRect. */
      const panelMid = panel.offsetTop - steps.offsetTop + panel.offsetHeight / 2
      span = panelMid - top
      thread.style.top = `${top}px`
      thread.style.height = `${span}px`
      fill.style.top = `${top}px`
      marks = ns.map((n) => (c(n) - top) / span)
      /* the panel lights up like a ring the moment the fill touches its top edge */
      panelMark = (panel.offsetTop - steps.offsetTop - top) / span
    }
    measure()

    if (reduce) {
      items.forEach((li) => li.classList.add('on'))
      panel.classList.add('on', 'lit')
      fill.style.height = `${span}px`
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const onScroll = () => {
      const total = outer.offsetHeight - window.innerHeight
      let p = (window.scrollY - outer.offsetTop) / total
      p = Math.max(0, Math.min(1, p))
      const frac = Math.max(0, Math.min(1, (p - 0.1) / 0.75))
      fill.style.height = `${frac * span}px`
      items.forEach((li, k) => li.classList.toggle('on', frac >= marks[k] - 0.01))
      panel.classList.toggle('on', p >= 0.9)
      /* light up a beat after arrival (same 400ms delay as the nav fold),
         and only once the panel itself is visible */
      const arrived = p >= 0.9 && frac >= panelMark - 0.01
      if (arrived && !litTimer && !panel.classList.contains('lit')) {
        litTimer = window.setTimeout(() => {
          panel.classList.add('lit')
          litTimer = 0
        }, 400)
      } else if (!arrived) {
        if (litTimer) {
          clearTimeout(litTimer)
          litTimer = 0
        }
        panel.classList.remove('lit')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    onScroll()
    return () => {
      if (litTimer) clearTimeout(litTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section className="apply" id="apply">
      <div className="pin-outer" ref={outerRef}>
        <div className="pin-inner">
          <div className="wrap">
            <h2>You do not need a finished talk to apply</h2>
            <p className="muted">
              Ideas, perspectives, and works-in-progress are welcome. Here is the
              whole process:
            </p>

            <ol className="steps" ref={stepsRef}>
              <span className="thread" aria-hidden="true" ref={threadRef}></span>
              <span className="thread-fill" aria-hidden="true" ref={fillRef}></span>
              {STEPS.map((s, k) => (
                <li key={s.title}>
                  <span className="n">{k + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>

            <div className="apply-panel" ref={panelRef}>
              <div>
                <h3>Ready when you are</h3>
                <p>The whole program is built from what you ask for.</p>
              </div>
              <div className="apply-cta">
                <a className="btn btn-primary" href={APPLY_URL} target="_blank" rel="noopener">
                  Apply now
                </a>
                <p className="muted">
                  Questions first? Write to{' '}
                  <a href={CONTACT_MAILTO}>kutsosp@natur.cuni.cz</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
