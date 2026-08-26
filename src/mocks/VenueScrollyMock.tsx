import { useEffect, useRef } from 'react'
import { Card, CardFooter } from '@/components/ui/card'

/* Cinematic venue scrollytelling: pinned stage, 4 editorial fact beats,
   2 crossfading photos per beat. Port of v4air-landing/mock-venue.html. */
const BEATS = [
  {
    no: '01 — THE BLACK FORESTS',
    h: 'Thirty minutes from Prague, the woods turn dark.',
    p: 'The dense conifer forest here named the whole town: until 1920 it was officially called Black Kostelec. The castle rises straight out of these woods, and for three days it is yours.',
  },
  {
    no: '02 — BUILT FOR KINGS',
    h: 'Kings kept rebuilding it.',
    p: 'A royal Gothic castle stood here by the 13th century. After the fire of 1548, Ferdinand I had his court architects raise the Renaissance chateau you will be sleeping in.',
  },
  {
    no: '03 — THE ALMOST-KING',
    h: 'Its owner nearly took the Bohemian throne.',
    p: 'Albrecht Jan Smiřický helped plan the 1618 Prague defenestration, joined the uprising, was a serious candidate for king, and died at 23. He is buried in the castle chapel.',
  },
  {
    no: '04 — A WORKING CASTLE',
    h: 'Not a museum.',
    p: 'Today it belongs to the Czech University of Life Sciences: around 150 beds, conference halls, its own kitchen. For three days, everyone lives, eats, and argues about AI inside the same walls. Working language: English.',
  },
]

/* One photo per beat: image and text always change together */
const PHOTOS = [
  { src: '/assets/exterior-wide-web.jpg', cap: 'The chateau above the black forests.' },
  { src: '/assets/courtyard-web.jpg', cap: 'The Renaissance courtyard.' },
  { src: '/assets/chapel-web.jpg', cap: 'Chapel of St. Adalbert, 1568–1573.' },
  { src: '/assets/exterior-2024-web.jpg', cap: 'The gate tower over the main entrance.' },
]

export function VenueScrollyMock() {
  const pinRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pin = pinRef.current
    const root = rootRef.current
    if (!pin || !root) return
    const beats = Array.from(root.querySelectorAll<HTMLElement>('.beat'))
    const imgs = Array.from(root.querySelectorAll<HTMLElement>('.vp-img'))
    const ticks = Array.from(root.querySelectorAll<HTMLElement>('.beat-nav span'))
    const caption = root.querySelector<HTMLElement>('.photo-caption')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let current = -1
    const setSlot = (slot: number) => {
      if (slot === current) return
      current = slot
      beats.forEach((b, k) => b.classList.toggle('active', k === slot))
      ticks.forEach((t, k) => t.classList.toggle('on', k <= slot))
      imgs.forEach((im, k) => im.classList.toggle('show', k === slot))
      caption.textContent = PHOTOS[slot].cap
    }

    if (reduce) {
      setSlot(0)
      return
    }
    let pending = false
    const onScroll = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        pending = false
        const total = pin.offsetHeight - window.innerHeight
        let p = (window.scrollY - pin.offsetTop) / total
        p = Math.max(0, Math.min(0.9999, p))
        setSlot(Math.floor(p * PHOTOS.length))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={rootRef}>
      <div className="venue-pin" ref={pinRef}>
        <div className="venue-stage">
          <div className="venue-copy">
            <span className="venue-eyebrow">The venue</span>
            {BEATS.map((b) => (
              <div className="beat" key={b.no}>
                <span className="no">{b.no}</span>
                <h3>{b.h}</h3>
                <p>{b.p}</p>
              </div>
            ))}
            <div className="beat-nav">
              {BEATS.map((b) => (
                <span key={b.no}></span>
              ))}
            </div>
          </div>
          <div className="venue-photos flex items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-4xl gap-0 overflow-hidden py-0">
              <div className="vp-frame relative aspect-video">
                {PHOTOS.map((ph) => (
                  <img
                    className="vp-img"
                    src={ph.src}
                    alt=""
                    loading="lazy"
                    key={ph.src}
                  />
                ))}
              </div>
              <CardFooter className="py-4">
                <span className="photo-caption mb-0 text-sm text-ink-2"></span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <p className="credits wrap">
        Photos: Zdeněk Fiedler, Juan de Vojníkov, Palickap, JiriMatejicek,
        Stribrohorak, MartinVeselka &middot;{' '}
        <a href="https://commons.wikimedia.org/wiki/Category:Castle_in_Kostelec_nad_%C4%8Cern%C3%BDmi_lesy">
          CC BY-SA 3.0/4.0, via Wikimedia Commons
        </a>
      </p>
    </div>
  )
}
