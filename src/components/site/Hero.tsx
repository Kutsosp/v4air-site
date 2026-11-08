import type { Theme } from '@/App'
import { asset } from '@/lib/utils'
import { APPLY_URL } from './Reveal'

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
        <div className="cta-row">
          <a className="btn btn-primary" href={APPLY_URL}>
            Apply now
          </a>
          <a className="btn btn-ghost" href="#adaptive">
            How it works
          </a>
        </div>
      </div>
    </section>
  )
}
