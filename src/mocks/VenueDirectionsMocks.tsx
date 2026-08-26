import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { InView } from '@/components/motion-primitives/in-view'
import { TransitionPanel } from '@/components/motion-primitives/transition-panel'
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from '@/components/motion-primitives/image-comparison'
import { Card, CardFooter } from '@/components/ui/card'

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}
const view = { once: true, amount: 0.3 } as const

/* ---------- 1. 72 HOURS: the resident's timeline ---------- */
const HOURS = [
  { d: 'Day 1', t: '12:00', line: 'You arrive through the gate tower. Someone hands you a key and a programme your own answers helped write.', img: '/assets/exterior-2024-web.jpg' },
  { d: 'Day 1', t: '19:30', line: 'Dinner in one hall. All of you, one table plan, no name-tag roulette.' },
  { d: 'Day 2', t: '09:10', line: 'A talk you asked for, given to the exact people who asked for it.' },
  { d: 'Day 2', t: '16:00', line: 'A workshop built from what applicants said they were stuck on.', img: '/assets/hall-web.jpg' },
  { d: 'Day 2', t: '23:40', line: 'The best conversation of your year happens in a corridor.', img: '/assets/corridor-web.jpg' },
  { d: 'Day 3', t: '17:00', line: 'You leave with people you will still be working with in five years.' },
]

export function SeventyTwoHoursMock() {
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <p className="eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">The venue</p>
        <h2 className="mb-14">72 hours in a castle</h2>
        <div className="flex flex-col gap-10">
          {HOURS.map((h) => (
            <InView key={h.d + h.t} variants={rise} viewOptions={view} transition={{ duration: 0.6 }}>
              <div className="grid items-center gap-6 border-t border-line pt-8 md:grid-cols-[220px_1fr_auto]">
                <div>
                  <p className="mb-0 text-sm font-semibold uppercase tracking-[0.14em] text-ink-2">{h.d}</p>
                  <p className="mb-0 font-mono text-5xl font-medium tabular-nums text-accent md:text-6xl">{h.t}</p>
                </div>
                <p className="mb-0 max-w-[46ch] text-lg leading-relaxed">{h.line}</p>
                {h.img && (
                  <img src={h.img} alt="" className="h-28 w-44 rounded-lg border border-line object-cover md:h-32 md:w-52" loading="lazy" />
                )}
              </div>
            </InView>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. THE DOSSIER: archival plates ---------- */
function Plate({ n, src, cap }: { n: string; src: string; cap: string }) {
  return (
    <figure className="m-0">
      <img src={src} alt={cap} className="w-full rounded-sm border border-line object-cover" loading="lazy" />
      <figcaption className="mt-3 flex items-baseline gap-3 border-t border-line pt-2 text-sm text-ink-2">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Fig. {n}</span>
        {cap}
      </figcaption>
    </figure>
  )
}

export function DossierMock() {
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <p className="eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">The venue</p>
        <h2 className="mb-14">Kostelec Castle, a file</h2>

        <div className="grid gap-10 md:grid-cols-2">
          <Plate n="01" src="/assets/exterior-wide-web.jpg" cap="The chateau above the black forests. Until 1920 the town was officially Black Kostelec." />
          <Plate n="02" src="/assets/courtyard-web.jpg" cap="The Renaissance courtyard, largely completed by the 1590s." />
        </div>

        <InView variants={rise} viewOptions={view} transition={{ duration: 0.7 }}>
          <div className="my-20 border-y border-line py-12">
            <p className="mb-0 font-mono text-[clamp(4rem,10vw,9rem)] font-medium leading-none text-accent">1548</p>
            <p className="mb-0 mt-4 max-w-[52ch] text-lg">The medieval castle burns. Ferdinand I has his court architects raise the Renaissance chateau in its place.</p>
          </div>
        </InView>

        <div className="grid gap-10 md:grid-cols-2">
          <Plate n="03" src="/assets/chapel-web.jpg" cap="Chapel of St. Adalbert, 1568–1573." />
          <Plate n="04" src="/assets/sgraffito-web.jpg" cap="Sgraffito on the facade, up close." />
        </div>

        <InView variants={rise} viewOptions={view} transition={{ duration: 0.7 }}>
          <div className="my-20 border-y border-line py-12">
            <p className="mb-0 font-mono text-[clamp(4rem,10vw,9rem)] font-medium leading-none text-accent">1618</p>
            <p className="mb-0 mt-4 max-w-[52ch] text-lg">The castle's owner helps plan the Prague defenestration, nearly takes the Bohemian throne, and dies at 23. He is buried in the chapel.</p>
          </div>
        </InView>

        <div className="grid gap-10 md:grid-cols-2">
          <Plate n="05" src="/assets/corridor-web.jpg" cap="Castle corridors." />
          <Plate n="06" src="/assets/exterior-2024-web.jpg" cap="The gate tower today. A working university castle: 150 beds, conference halls, its own kitchen." />
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. THE GROUND PLAN: silhouette with hotspots ---------- */
const SPOTS = [
  { id: 'gate', x: '18%', y: '58%', label: 'Gate tower', img: '/assets/exterior-2024-web.jpg', text: 'You arrive here. Prague is 30 minutes behind you; the black forests start at the wall.' },
  { id: 'courtyard', x: '44%', y: '48%', label: 'Courtyard', img: '/assets/courtyard-web.jpg', text: 'Renaissance arcades; coffee, arguments, and the space between sessions.' },
  { id: 'chapel', x: '68%', y: '38%', label: 'Chapel', img: '/assets/chapel-web.jpg', text: 'St. Adalbert’s, 1568–1573. The almost-king of Bohemia is buried here.' },
  { id: 'halls', x: '85%', y: '55%', label: 'Halls', img: '/assets/hall-web.jpg', text: 'Talks and workshops in the historic halls; you sleep one staircase away.' },
]

export function GroundPlanMock() {
  const [active, setActive] = useState(0)
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <p className="eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">The venue</p>
        <h2 className="mb-3">One castle, everything inside</h2>
        <p className="muted mb-10">Tap a point.</p>
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="relative">
            <img src="/assets/castle-silhouette.png" alt="Silhouette of Kostelec Castle and town" className="w-full opacity-90 [filter:drop-shadow(0_0_14px_rgba(233,162,79,0.25))]" />
            {SPOTS.map((s, k) => (
              <button
                key={s.id}
                onClick={() => setActive(k)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: s.x, top: s.y }}
                aria-label={s.label}
              >
                <span className={`block h-4 w-4 rounded-full border-2 transition-all ${active === k ? 'scale-125 border-accent bg-accent' : 'border-accent bg-bg'}`} />
                {active === k && (
                  <span className="absolute left-1/2 top-[-1.9rem] -translate-x-1/2 whitespace-nowrap rounded border border-line bg-bg-raise px-2 py-0.5 text-xs font-semibold text-accent">
                    {s.label}
                  </span>
                )}
              </button>
            ))}
          </div>
          <TransitionPanel
            activeIndex={active}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            variants={{ enter: { opacity: 0, y: 14 }, center: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } }}
          >
            {SPOTS.map((s) => (
              <Card key={s.id} className="gap-0 overflow-hidden py-0">
                <img src={s.img} alt={s.label} className="aspect-[16/10] w-full object-cover" />
                <CardFooter className="flex-col items-start gap-1 py-4">
                  <p className="mb-0 text-sm font-semibold uppercase tracking-[0.14em] text-accent">{s.label}</p>
                  <p className="mb-0 text-ink-2">{s.text}</p>
                </CardFooter>
              </Card>
            ))}
          </TransitionPanel>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. CINEMATIC CHAPTERS: full-bleed + type interludes ---------- */
export function CinematicChaptersMock() {
  return (
    <section className="border-t border-line">
      <div className="relative h-[75vh]">
        <img src="/assets/castle-dusk.jpg" alt="Kostelec Castle at dusk" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <p className="absolute bottom-8 left-1/2 mb-0 -translate-x-1/2 text-sm uppercase tracking-[0.2em] text-ink-2">The venue</p>
      </div>
      <InView variants={rise} viewOptions={view} transition={{ duration: 0.7 }}>
        <div className="wrap py-28 text-center">
          <p className="mx-auto mb-0 max-w-[24ch] text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-tight">Thirty minutes from Prague, the woods turn dark.</p>
        </div>
      </InView>
      <div className="relative h-[75vh]">
        <img src="/assets/chapel-web.jpg" alt="Chapel of St. Adalbert" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      </div>
      <InView variants={rise} viewOptions={view} transition={{ duration: 0.7 }}>
        <div className="wrap py-28 text-center">
          <p className="mx-auto mb-0 max-w-[26ch] text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-tight">Rebuilt for kings. Kept by a university. Yours for three days.</p>
        </div>
      </InView>
    </section>
  )
}

/* ---------- 5. THEN / NOW: comparison slider ---------- */
export function ThenNowMock() {
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <p className="eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">The venue</p>
        <h2 className="mb-3">Burned 1548. Rebuilt for kings.</h2>
        <p className="muted mb-10">Drag the divider.</p>
        <ImageComparison className="aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-line" enableHover springOptions={{ bounce: 0.2 }}>
          <ImageComparisonImage
            src="/assets/exterior-wide-web.jpg"
            alt="The castle, archival treatment"
            position="left"
            className="grayscale sepia-[0.35] contrast-125 brightness-75"
          />
          <ImageComparisonImage src="/assets/exterior-wide-web.jpg" alt="The castle today" position="right" />
          <ImageComparisonSlider className="w-0.5 bg-accent shadow-[0_0_10px_rgba(233,162,79,0.6)]">
            <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-bg-raise" />
          </ImageComparisonSlider>
        </ImageComparison>
        <p className="mt-4 max-w-[52ch] text-sm text-ink-2">(Mock uses the same photo twice with an archival grade; a period engraving would take the left side in the real thing.)</p>
      </div>
    </section>
  )
}

/* ---------- 6. THE CORRIDOR: horizontal hung gallery ---------- */
const HUNG = [
  { src: '/assets/corridor-web.jpg', cap: 'Castle corridors', h: 'h-80' },
  { src: '/assets/exterior-wide-web.jpg', cap: 'Above the black forests', h: 'h-56' },
  { src: '/assets/chapel-web.jpg', cap: 'Chapel of St. Adalbert', h: 'h-72' },
  { src: '/assets/courtyard-web.jpg', cap: 'The courtyard', h: 'h-60' },
  { src: '/assets/sgraffito-web.jpg', cap: 'Sgraffito, up close', h: 'h-48' },
  { src: '/assets/exterior-2024-web.jpg', cap: 'The gate tower', h: 'h-72' },
  { src: '/assets/hall-web.jpg', cap: 'Historic halls', h: 'h-64' },
]

export function CorridorMock() {
  return (
    <section className="border-t border-line py-24">
      <div className="wrap">
        <p className="eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">The venue</p>
        <h2 className="mb-10">Walk the corridor</h2>
      </div>
      <div className="flex snap-x snap-mandatory items-center gap-8 overflow-x-auto px-8 pb-6 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        {HUNG.map((p) => (
          <figure key={p.src} className="m-0 flex-none snap-center">
            <img src={p.src} alt={p.cap} className={`${p.h} w-auto rounded-md border border-line object-cover`} loading="lazy" />
            <figcaption className="mt-2 text-sm text-ink-2">{p.cap}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ---------- 7. NIGHTFALL: scroll-driven dusk ---------- */
export function NightfallMock() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const duskOpacity = useTransform(scrollYProgress, [0.25, 0.6], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1])
  const silY = useTransform(scrollYProgress, [0.3, 0.65], [80, 0])

  return (
    <section className="border-t border-line" ref={ref}>
      <div className="relative h-[160vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <img src="/assets/castle-day.jpg" alt="Kostelec Castle in daylight" className="absolute inset-0 h-full w-full object-cover" />
          <motion.img
            src="/assets/castle-dusk.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: duskOpacity }}
          />
          <motion.img
            src="/assets/castle-silhouette.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 w-[520px] max-w-[70vw] -translate-x-1/2 opacity-90"
            style={{ y: silY }}
          />
          <motion.div className="absolute inset-x-0 top-[16vh] text-center" style={{ opacity: textOpacity }}>
            <p className="mb-0 text-[clamp(1.6rem,3.6vw,3rem)] font-semibold text-ink [text-shadow:0_2px_18px_rgba(8,14,16,0.8)]">
              When the sun sets, nobody leaves.
            </p>
            <p className="mb-0 mt-2 text-ink-2 [text-shadow:0_2px_14px_rgba(8,14,16,0.8)]">Scroll: day turns to dusk over the black forests.</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
