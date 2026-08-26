import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from '@/components/motion-primitives/image-comparison'

/* THE CORRIDOR WALK: pinned horizontal composite.
   Track: intro type panel -> hung photos -> 1548 numeral wall -> then/now stop ->
   chapel + 1618 wall -> nightfall finale. Mobile/reduced-motion: snap strip. */

function useIsWalkable() {
  const [ok, setOk] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia(
      '(min-width: 901px) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setOk(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return ok
}

function Hung({ src, cap, h }: { src: string; cap: string; h: string }) {
  return (
    <figure className="m-0 flex-none self-center">
      <img
        src={src}
        alt={cap}
        className={`${h} w-auto rounded-md border border-line object-cover`}
        loading="lazy"
      />
      <figcaption className="mt-2 text-sm text-ink-2">{cap}</figcaption>
    </figure>
  )
}

function NumeralWall({ year, line }: { year: string; line: string }) {
  return (
    <div className="flex w-[44vw] flex-none flex-col justify-center border-x border-line px-14">
      <p className="mb-0 font-mono text-[clamp(5rem,11vw,10rem)] font-medium leading-none text-accent">
        {year}
      </p>
      <p className="mb-0 mt-5 max-w-[38ch] text-lg leading-relaxed">{line}</p>
    </div>
  )
}

export function CorridorWalkMock() {
  const walkable = useIsWalkable()
  const outerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -shift])
  /* the walk ends at dusk: the stage darkens over the last quarter */
  const duskOpacity = useTransform(scrollYProgress, [0.72, 0.95], [0, 0.55])
  const progressWidth = useTransform(scrollYProgress, (v) => `${v * 100}%`)

  useEffect(() => {
    if (!walkable) return
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      setShift(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [walkable])

  const content = (
    <>
      {/* 1: intro panel */}
      <div className="flex w-[70vw] max-w-2xl flex-none flex-col justify-center px-14">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          The venue
        </p>
        <h2 className="mb-4">Walk the corridor</h2>
        <p className="mb-0 max-w-[40ch] text-ink-2">
          A Renaissance castle thirty minutes from Prague, deep in the woods that
          named the town: until 1920, this was officially Black Kostelec.
        </p>
      </div>

      {/* 2: first photo cluster */}
      <Hung src="/assets/corridor-web.jpg" cap="Castle corridors" h="h-[52vh]" />
      <Hung src="/assets/exterior-wide-web.jpg" cap="Above the black forests" h="h-[38vh]" />
      <Hung src="/assets/courtyard-web.jpg" cap="The Renaissance courtyard" h="h-[46vh]" />

      {/* 3: 1548 wall */}
      <NumeralWall
        year="1548"
        line="The medieval castle burns. Ferdinand I has his court architects raise the Renaissance chateau in its place."
      />

      {/* 4: then/now stop */}
      <div className="flex w-[52vw] flex-none flex-col justify-center">
        <ImageComparison
          className="aspect-video w-full overflow-hidden rounded-md border border-line"
          enableHover
          springOptions={{ bounce: 0.1 }}
        >
          <ImageComparisonImage
            src="/assets/exterior-wide-web.jpg"
            alt="The castle, archival treatment"
            position="left"
            className="grayscale sepia-[0.35] contrast-125 brightness-75"
          />
          <ImageComparisonImage
            src="/assets/exterior-wide-web.jpg"
            alt="The castle today"
            position="right"
          />
          <ImageComparisonSlider className="w-0.5 bg-accent shadow-[0_0_10px_rgba(233,162,79,0.6)]">
            <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-bg-raise" />
          </ImageComparisonSlider>
        </ImageComparison>
        <p className="mb-0 mt-2 text-sm text-ink-2">Move across the picture: then and now.</p>
      </div>

      {/* 5: chapel + 1618 wall */}
      <Hung src="/assets/chapel-web.jpg" cap="Chapel of St. Adalbert, 1568–1573" h="h-[52vh]" />
      <NumeralWall
        year="1618"
        line="The castle's owner helps plan the Prague defenestration, nearly takes the Bohemian throne, and dies at 23. He is buried in this chapel."
      />
      <Hung src="/assets/sgraffito-web.jpg" cap="Sgraffito, up close" h="h-[40vh]" />
      <Hung src="/assets/exterior-2024-web.jpg" cap="The gate tower today" h="h-[48vh]" />

      {/* 6: nightfall finale */}
      <div className="relative flex w-[75vw] flex-none items-center justify-center">
        <img
          src="/assets/castle-dusk.jpg"
          alt="Kostelec Castle at dusk, windows lit"
          className="h-[70vh] w-auto rounded-md border border-line object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 text-center">
          <p className="mb-1 text-[clamp(1.4rem,2.6vw,2.2rem)] font-semibold [text-shadow:0_2px_18px_rgba(8,14,16,0.9)]">
            When the sun sets, nobody leaves.
          </p>
          <p className="mb-0 text-ink-2 [text-shadow:0_2px_14px_rgba(8,14,16,0.9)]">
            Yours for three days. Working language: English.
          </p>
        </div>
      </div>
      <div className="w-[10vw] flex-none" />
    </>
  )

  if (!walkable) {
    /* mobile / reduced motion: plain snap strip with the same content order */
    return (
      <section className="border-t border-line py-24">
        <div className="wrap">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            The venue
          </p>
          <h2 className="mb-10">Walk the corridor</h2>
        </div>
        <div className="flex snap-x snap-mandatory items-stretch gap-8 overflow-x-auto px-8 pb-6">
          {content}
        </div>
      </section>
    )
  }

  return (
    <section className="border-t border-line" ref={outerRef}>
      <div className="relative h-[450vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div
            ref={trackRef}
            className="flex h-full items-stretch gap-10"
            style={{ x }}
          >
            {content}
          </motion.div>
          {/* dusk falls over the final stretch */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[#05090c]"
            style={{ opacity: duskOpacity }}
          />
          {/* progress: how far down the corridor you are */}
          <div className="absolute inset-x-8 bottom-6 h-px bg-line">
            <motion.div
              className="h-px bg-accent shadow-[0_0_8px_rgba(233,162,79,0.7)]"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
