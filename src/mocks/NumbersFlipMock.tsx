import { useState } from 'react'
import { FlipClock } from '@/components/ui/flip-clock'
import { TextShimmer } from '@/components/motion-primitives/text-shimmer'

/* Replaces the "3 days in 1 castle" numbers band with a live countdown.
   Two states: before applications open (1 Sep 2026), and open (until 15 Jan 2027). */
const OPEN = new Date('2026-09-01T00:00:00')
const DEADLINE = new Date('2027-01-15T23:59:59')
const APPLY_URL = 'mailto:kutsosp@natur.cuni.cz?subject=V4AIR%20application'

export function NumbersFlipMock() {
  /* mock-only state switcher; the real section derives this from the date */
  const [phase, setPhase] = useState<'pre' | 'open'>(
    Date.now() < OPEN.getTime() ? 'pre' : 'open',
  )

  return (
    <section className="relative border-y border-line bg-bg-raise py-14">
      <div className="absolute right-4 top-4 flex gap-2 text-xs">
        <button
          className={`rounded border border-line px-2 py-1 ${phase === 'pre' ? 'bg-accent text-accent-ink' : 'text-ink-2'}`}
          onClick={() => setPhase('pre')}
        >
          mock: before open
        </button>
        <button
          className={`rounded border border-line px-2 py-1 ${phase === 'open' ? 'bg-accent text-accent-ink' : 'text-ink-2'}`}
          onClick={() => setPhase('open')}
        >
          mock: open now
        </button>
      </div>

      {phase === 'pre' ? (
        <div className="wrap flex flex-col items-center gap-6 text-center">
          <p className="mb-0 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            Applications open in
          </p>
          <FlipClock
            countdown
            targetDate={OPEN}
            size="lg"
            variant="secondary"
            showDays="always"
            className="[&_.relative]:border [&_.relative]:border-line"
          />
          <p className="mb-0 max-w-[46ch] text-ink-2">
            Three questions, no CV, no motivation letter. The form takes minutes, not
            days.
          </p>
        </div>
      ) : (
        <div className="wrap flex flex-col items-center gap-5 text-center">
          <TextShimmer
            as="h2"
            className="mb-0 text-3xl font-bold md:text-5xl [--base-color:var(--color-accent)] [--base-gradient-color:#ffe3bd]"
            duration={2.2}
          >
            Applications are open now!
          </TextShimmer>
          <p className="mb-0 max-w-[50ch] text-lg text-ink">
            Three questions. No CV, no motivation letter. Fully funded for V4
            participants.
          </p>
          <a
            className="btn btn-primary text-lg shadow-[0_0_30px_rgba(233,162,79,0.35)]"
            href={APPLY_URL}
          >
            Apply to attend
          </a>
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="mb-0 text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">
              Deadline: 15 January 2027
            </p>
            <FlipClock
              countdown
              targetDate={DEADLINE}
              size="sm"
              variant="secondary"
              showDays="always"
              className="[&_.relative]:border [&_.relative]:border-line"
            />
          </div>
        </div>
      )}
    </section>
  )
}
