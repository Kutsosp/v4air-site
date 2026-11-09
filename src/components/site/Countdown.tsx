import { useNow } from '@/lib/time'
import { APPLY_URL } from './Reveal'

/* Applications band (09.11.2026, points 8 + 21 of the redesign doc): a big number of days until the
   deadline instead of the flip clock. Used twice: under the hero and as the closing CTA before the partners.
   After the deadline it disappears (the timeline section carries the story). */
const DEADLINE = new Date('2027-01-15T23:59:59')
const DAY = 86400000

/* whole calendar days from today to the deadline day: 0 on 15 January itself */
function daysLeft(now: number) {
  const d = new Date(now)
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const end = new Date(DEADLINE.getFullYear(), DEADLINE.getMonth(), DEADLINE.getDate()).getTime()
  return Math.round((end - today) / DAY)
}

export function Countdown({ id }: { id?: string }) {
  const now = useNow()
  if (now > DEADLINE.getTime()) return null
  const n = daysLeft(now)

  return (
    <section id={id} className="relative overflow-hidden border-b border-line bg-bg-raise py-14">
      <div className="wrap relative flex flex-col items-center gap-5 text-center">
        <h2 className="mb-0 text-3xl font-bold md:text-5xl">Applications are open.</h2>
        <div className="days-left" aria-live="polite">
          {n === 0 ? (
            <span className="days-last">Last day to apply</span>
          ) : (
            <>
              <span className="days-n">{n}</span>
              <span className="days-label">{n === 1 ? 'day left' : 'days left'}</span>
            </>
          )}
        </div>
        <a className="btn btn-primary" href={APPLY_URL}>
          Apply now
        </a>
        <p className="mb-0 max-w-[50ch] text-sm text-ink-2">
          You apply with one online form. No abstract, CV or motivation letter.
          Deadline: 15 January 2027.
        </p>
      </div>
    </section>
  )
}
