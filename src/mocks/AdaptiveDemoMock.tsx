import { useEffect, useState } from 'react'
import { TransitionPanel } from '@/components/motion-primitives/transition-panel'

/* "The program adapts to you" shown as a mechanism: an example form answer on
   the left generates the program block on the right. EXAMPLES ARE ILLUSTRATIVE. */
const DEMOS = [
  {
    answer: 'The most annoying still-manual step in my workflow? Annotating thousands of images by hand.',
    kind: 'Workshop',
    card: 'Hands-on: getting models to do your annotation',
    note: 'Workshop topics are assembled from what applicants are stuck on.',
  },
  {
    answer: 'No one around me can tell whether my model is actually any good.',
    kind: 'Matchmaking',
    card: 'You sit with people who validate models for a living',
    note: 'Your answers match you with the right people in the room.',
  },
  {
    answer: 'I tried using AI on my data, and it failed. Twice.',
    kind: 'Session',
    card: 'Failed and stuck projects, treated as first-class material',
    note: 'What went wrong is programme content here, not a secret.',
  },
  {
    answer: 'I want to hear how anyone gets research methods used outside academia.',
    kind: 'Talk',
    card: 'Invited speakers picked from what the room asked for',
    note: 'Talks and speakers are chosen from participants&apos; wishes.',
  },
]

export function AdaptiveDemoMock() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % DEMOS.length), 4200)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="py-24">
      <div className="wrap">
        <h2 className="mb-3">The program adapts to you, not the other way around.</h2>
        <p className="muted mb-12 max-w-[60ch]">
          The application form asks what you work on, what you want to learn, and who
          you would like to meet. Your answers literally build the programme. For
          example:
        </p>

        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          {/* the answer someone wrote */}
          <TransitionPanel
            activeIndex={i}
            className="min-h-32"
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            variants={{
              enter: { opacity: 0, y: 18 },
              center: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -18 },
            }}
          >
            {DEMOS.map((d) => (
              <blockquote
                key={d.answer}
                className="rounded-xl border border-line bg-bg-raise p-6 text-lg leading-relaxed text-ink"
              >
                “{d.answer}”
                <footer className="mt-3 text-sm text-ink-2">
                  — someone&apos;s application form
                </footer>
              </blockquote>
            ))}
          </TransitionPanel>

          {/* the arrow */}
          <div aria-hidden="true" className="hidden text-3xl text-accent md:block">
            →
          </div>

          {/* the programme block it generates */}
          <TransitionPanel
            activeIndex={i}
            className="min-h-32"
            transition={{ duration: 0.45, ease: 'easeInOut', delay: 0.15 }}
            variants={{
              enter: { opacity: 0, scale: 0.94 },
              center: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.94 },
            }}
          >
            {DEMOS.map((d) => (
              <div
                key={d.card}
                className="rounded-xl border border-accent/40 bg-bg p-6 shadow-[0_0_24px_rgba(233,162,79,0.12)]"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {d.kind}
                </p>
                <p className="text-lg font-semibold leading-snug">{d.card}</p>
                <p className="mt-2 text-sm text-ink-2">{d.note}</p>
              </div>
            ))}
          </TransitionPanel>
        </div>

        <p className="mt-10 max-w-[60ch] text-ink-2">
          Selection is based on fit and mix, not first-come-first-served. Filling in
          the form carefully is the best thing you can do for your chances.
        </p>
      </div>
    </section>
  )
}
