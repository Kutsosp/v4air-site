import { FlipClock } from '@/components/ui/flip-clock'
import { useNow } from '@/lib/time'
import { APPLY_URL } from './Reveal'

/* Countdown band: before 1 Sep 2026 it counts down to applications opening;
   while open it becomes the call to action with the deadline clock;
   after the deadline it disappears (the timeline section carries the story). */
const OPEN = new Date('2026-09-01T00:00:00')
const DEADLINE = new Date('2027-01-15T23:59:59')

export function Countdown() {
  const now = useNow()
  if (now > DEADLINE.getTime()) return null
  const phase = now < OPEN.getTime() ? 'pre' : 'open'
  /* FlipClock counts against real time; shift its targets by the simulated
     offset so debug dates show the right remaining time */
  const offset = now - Date.now()
  const openTarget = new Date(OPEN.getTime() - offset)
  const deadlineTarget = new Date(DEADLINE.getTime() - offset)

  return (
    <section className="relative overflow-hidden border-b border-line bg-bg-raise py-14">
      {phase === 'pre' ? (
        <div className="wrap relative flex flex-col items-center gap-6 text-center">
          <p className="mb-0 text-sm font-semibold uppercase tracking-[0.14em]">
            <span className="chip">Applications open in</span>
          </p>
          <FlipClock
            countdown
            targetDate={openTarget}
            size="lg"
            variant="secondary"
            showDays="always"
            className="flip-paper"
          />
          <p className="mb-0 max-w-[46ch] text-ink-2">
            No CV, no motivation letter. You decide what the three days look like.
          </p>
        </div>
      ) : (
        <div className="wrap relative flex flex-col items-center gap-5 text-center">
          <h2 className="mb-0 text-3xl font-bold md:text-5xl">Applications are open.</h2>
          <div className="flex flex-col items-center gap-2">
            <FlipClock
              countdown
              targetDate={deadlineTarget}
              size="sm"
              variant="secondary"
              showDays="always"
              className="flip-paper"
            />
          </div>
          <a className="btn btn-primary" href={APPLY_URL}>
            Apply now
          </a>
          <p className="mb-0 max-w-[50ch] text-sm text-ink-2">
            No abstract, CV, or motivation letter required. Deadline for
            applications: 15 January 2027.
          </p>
        </div>
      )}
    </section>
  )
}
