import { AnimatedBackground } from '@/components/motion-primitives/animated-background'
import { Spotlight } from '@/components/motion-primitives/spotlight'
import { Tilt } from '@/components/motion-primitives/tilt'

const ITEMS = [
  {
    title: 'Talks chosen for the room',
    body: 'A set of talks and invited speakers picked from what participants said they want to learn.',
  },
  {
    title: 'A more-than-posters session',
    body: 'A student session built around real conversation, not hallway poster duty.',
  },
  {
    title: 'Hands-on workshops',
    body: 'Workshop topics assembled from the interests participants bring in their forms.',
  },
]

const UNSTRUCTURED = {
  title: 'Unstructured time, on purpose',
  body: 'Everyone lives, eats, and socializes in one place, so the best conversations do not end when the sessions do.',
}

/* Variant 1: asymmetric bento — unstructured time is the hero cell */
export function FormatBentoMock() {
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <h2 className="mb-10">A small, informal format</h2>
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-3">
          {/* hero cell */}
          <div className="relative overflow-hidden rounded-2xl border border-line md:col-span-2 md:row-span-3">
            <img
              src="/assets/courtyard-web.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
            <div className="relative flex h-full min-h-72 flex-col justify-end p-8">
              <h3 className="max-w-[16ch] text-2xl md:text-3xl">{UNSTRUCTURED.title}</h3>
              <p className="max-w-[44ch] text-ink-2">{UNSTRUCTURED.body}</p>
            </div>
          </div>
          {/* the three smaller cells with a sliding hover highlight */}
          <AnimatedBackground
            className="rounded-2xl bg-bg-raise"
            enableHover
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          >
            {ITEMS.map((it) => (
              <div
                key={it.title}
                data-id={it.title}
                className="w-full rounded-2xl border border-line p-6"
              >
                <div>
                  <h3 className="text-lg">{it.title}</h3>
                  <p className="mb-0 text-sm text-ink-2">{it.body}</p>
                </div>
              </div>
            ))}
          </AnimatedBackground>
        </div>
      </div>
    </section>
  )
}

/* Variant 2: editorial numbered menu — hover reveals the detail */
export function FormatMenuMock() {
  const all = [...ITEMS, UNSTRUCTURED]
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <h2 className="mb-10">A small, informal format</h2>
        <div className="max-w-3xl">
          {all.map((it, k) => (
            <div
              key={it.title}
              className="group cursor-default border-t border-line py-6 last:border-b"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-semibold tracking-[0.14em] text-accent">
                  0{k + 1}
                </span>
                <h3 className="mb-0 text-xl transition-colors group-hover:text-accent md:text-2xl">
                  {it.title}
                </h3>
              </div>
              <p className="mb-0 max-h-0 overflow-hidden pl-[3.4rem] text-ink-2 opacity-0 transition-all duration-500 group-hover:mt-2 group-hover:max-h-24 group-hover:opacity-100">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Variant 3: the shape of the three days — qualitative flow, no invented schedule */
export function FormatDayMock() {
  const flow = [
    { t: 'Talks', d: 'chosen from what the room wants to learn' },
    { t: 'Workshops', d: 'built from what applicants are stuck on' },
    { t: 'A student session', d: 'that is more than posters' },
    { t: 'And in between', d: 'nobody has to leave, so nobody does' },
  ]
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <h2 className="mb-3">A small, informal format</h2>
        <p className="muted mb-12">Three days, one shape:</p>
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-0">
          {flow.map((f, k) => (
            <div key={f.t} className="flex items-center md:flex-1">
              <div className="flex-1 rounded-xl border border-line bg-bg-raise p-5">
                <h3 className="mb-1 text-lg">{f.t}</h3>
                <p className="mb-0 text-sm text-ink-2">{f.d}</p>
              </div>
              {k < flow.length - 1 && (
                <span aria-hidden="true" className="hidden px-3 text-accent md:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Variant 4: keep the grid, add physics — Tilt + Spotlight per card */
export function FormatTiltMock() {
  const all = [...ITEMS, UNSTRUCTURED]
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <h2 className="mb-10">A small, informal format</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {all.map((it) => (
            <Tilt key={it.title} rotationFactor={6} isRevese>
              <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-raise p-6">
                <Spotlight
                  className="bg-accent/25 blur-2xl"
                  size={180}
                />
                <div className="relative">
                  <h3>{it.title}</h3>
                  <p className="mb-0 text-ink-2">{it.body}</p>
                </div>
              </div>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  )
}
