import type { Theme } from '@/App'
import { asset } from '@/lib/utils'
import { APPLY_URL } from './Reveal'

/* 09.11.2026: partner universities in the hero (legitimacy at first sight); Slovak partner left out until confirmed */
const UNIS: { src: string; alt: string; w: number; h: number }[] = [
  { src: asset('assets/charles-university_white.png'), alt: 'Charles University', w: 280, h: 280 },
  { src: asset('assets/cvut_white.png'), alt: 'Czech Technical University in Prague', w: 137, h: 280 },
  { src: asset('assets/uwr-wroclaw_white.png'), alt: 'University of Wrocław', w: 751, h: 255 },
  { src: asset('assets/umk-torun_white.png'), alt: 'Nicolaus Copernicus University in Toruń', w: 348, h: 280 },
  { src: asset('assets/elte_white.png'), alt: 'Eötvös Loránd University in Budapest', w: 1400, h: 280 },
]

export function Hero({ theme }: { theme: Theme }) {
  const photo =
    theme === 'light' ? asset('assets/castle-day-2x.jpg') : asset('assets/castle-dusk-2x.jpg')

  return (
    <section className="hero ov-on ts-on" id="hero">
      <div className="hero-photo">
        <img
          src={photo}
          alt="Aerial view of Kostelec Castle at dusk, its windows glowing warm against the surrounding forests"
          width={2528}
          height={1684}
          fetchPriority="high"
        />
        <img
          className="ts-layer"
          src={photo}
          alt=""
          aria-hidden="true"
          width={2528}
          height={1684}
        />
      </div>
      <div className="hero-scrim"></div>
      <div className="hero-inner wrap">
        <p className="eyebrow">28-30 April 2027 &middot; Kostelec Castle, near Prague</p>
        <h1>A three-day meetup for researchers who use AI</h1>
        <p className="lede">
          For early-career researchers and PhD students in any field who use AI in
          their research: historians, sports scientists, biologists, linguists and
          more. You tell us what your project needs, and we invite the experts and
          collaborators to match.
        </p>
        {/* 09.11.2026: buttons and logos on one row (logos wrap below on narrow screens) */}
        <div className="hero-actions">
        <div className="cta-row">
          <a className="btn btn-primary" href={APPLY_URL}>
            Apply now
          </a>
          <a className="btn btn-ghost" href={`${import.meta.env.BASE_URL}programme/`}>
            How it works
          </a>
        </div>
        {/* partner universities, then the Visegrad Fund logo (linked, visible without scrolling: Fund logo manual 2024) */}
        <div className="hero-unis">
          <ul aria-label="Partner universities">
            {UNIS.map((u) => (
              <li key={u.alt}>
                <img src={u.src} alt={u.alt} width={u.w} height={u.h} />
              </li>
            ))}
          </ul>
          <a className="hero-ivf" href="https://www.visegradfund.org" target="_blank" rel="noopener noreferrer">
            <img src={asset('assets/visegrad-fund_white.png')} alt="Supported by the International Visegrad Fund" width={626} height={280} />
          </a>
        </div>
        </div>
      </div>
    </section>
  )
}
