import { useEffect, useState } from 'react'
import { InView } from '@/components/motion-primitives/in-view'
import { TextLoop } from '@/components/motion-primitives/text-loop'
import { APPLY_URL, NOMINATE_URL, Reveal } from './Reveal'

/* X and Y rotate as matched pairs so the sentence always makes sense */
const PAIRS: Array<[string, string]> = [
  ['a biologist training models on field data', 'your daily tool'],
  ['a sociologist studying how people use chatbots', 'your research subject'],
  ['a PhD student building new architectures', 'your whole field'],
  ['a linguist probing what models learn', 'your object of study'],
  ['an economist forecasting with neural nets', 'your unfair advantage'],
  ['a historian mining digitized archives', 'your reading assistant'],
  ['a medical researcher classifying scans', 'your second opinion'],
  ['a chemist screening candidate molecules', 'your lab partner'],
  ['a lawyer-to-be studying algorithmic decisions', 'your case study'],
  ["a master's student who just met LLMs", 'your next step'],
]

const LOOP_TRANSITION = { duration: 0.45, ease: [0.65, 0, 0.35, 1] as const }
/* 09.11.2026: 5 s per pair (was 2.6 s): the sentence is 13-16 words, about 3.3-4 s to read at 238 wpm */
const LOOP_INTERVAL = 5

export function Who() {
  /* the rotation pauses while the pointer is over the sentence or it has focus */
  const [paused, setPaused] = useState(false)
  /* 09.11.2026: one index drives both halves of the sentence; prev/next arrows step it, the timer restarts after a click */
  const [idx, setIdx] = useState(0)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx((i) => i + 1), LOOP_INTERVAL * 1000)
    return () => clearInterval(t)
  }, [paused, tick])
  const step = (d: number) => { setIdx((i) => i + d); setTick((t) => t + 1) }
  return (
    <section className="who" id="who">
      <div className="wrap">
        <Reveal>
          <h2 className="who-q">
            Should you apply?
            <span className="who-arrows">
              <button type="button" aria-label="Previous example" onClick={() => step(-1)}>&larr;</button>
              <button type="button" aria-label="Next example" onClick={() => step(1)}>&rarr;</button>
            </span>
          </h2>
          {/* div, not p: TextLoop renders block elements, which break out of a <p> */}
          <div
            className="who-doubt"
            tabIndex={0}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            Well&hellip; if you're{' '}
            <TextLoop className="slot-loop" transition={LOOP_TRANSITION} index={idx}>
              {PAIRS.map(([x]) => (
                <span key={x}>{x}</span>
              ))}
            </TextLoop>
            <br />
            and AI is{' '}
            <TextLoop className="slot-loop" transition={LOOP_TRANSITION} index={idx}>
              {PAIRS.map(([, y], k) => (
                <span key={k}>{y}</span>
              ))}
            </TextLoop>
            &hellip;
          </div>
        </Reveal>
        {/* staggered reveal: Then -> Yes (slow rise, short delay) -> the rest */}
        <div className="who-yes">
          <Reveal delay={0.1}>
            <div className="who-doubt who-then">Then&hellip;</div>
          </Reveal>
          <InView
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            viewOptions={{ once: true, amount: 0.35 }}
          >
            <span className="yes">Yes.</span>
          </InView>
          {/* 09.11.2026: Apply button on the same line as "We want you at V4AIR." (wraps under it on phones) */}
          <Reveal delay={0.8}>
            <div className="yes-row">
              <p className="yes-line">We want you at V4AIR.</p>
              <a className="btn btn-primary" href={APPLY_URL}>
                Apply now
              </a>
            </div>
            {/* 09.11.2026: effort + nominate line. "17 minutes" is Peter's figure (Sheet 09.11.2026: median 19 min for the
                11 one-sitting submissions, mean 15.8 min for the 9 under an hour) */}
            <p className="yes-note">
              Just <strong>one online form, ~17 minutes</strong>. No paper, CV or motivation letter.
            </p>
            <p className="yes-note">
              Know someone who should be here? <a href={NOMINATE_URL}>Nominate them &rarr;</a>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
