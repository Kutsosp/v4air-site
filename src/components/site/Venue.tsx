import { Reveal } from './Reveal'
import { asset } from '@/lib/utils'

/* Canon venue section (the cinematic scrollytelling rework lives in
   v4air-landing/mock-venue.html, pending Peter's final verdict). */
export function Venue() {
  return (
    <section className="venue" id="venue">
      <Reveal className="wrap">
        <div className="split">
          <div>
            <p className="eyebrow">The venue</p>
            <h2>You will be staying in the castle</h2>
            <p>
              Kostelec Castle is a Renaissance castle owned by the Czech University of
              Life Sciences Prague, 45 minutes from Prague by metro and a direct bus.
              Rooms, meals and sessions are all within a few minutes&rsquo; walk of each
              other.
            </p>
            <p className="muted">Working language: English.</p>
            <p>
              <a className="btn btn-line" href={`${import.meta.env.BASE_URL}kostelec/`}>
                More about the venue
              </a>
            </p>
          </div>
          <figure className="venue-photo">
            <img
              src={asset('assets/castle-day.jpg')}
              alt="Aerial view of Kostelec Castle in daylight, red roofs and towers surrounded by green forest"
              width={1600}
              height={1066}
              loading="lazy"
            />
            <figcaption>Kostelec Castle, Kostelec nad Černými lesy, Czechia.</figcaption>
          </figure>
        </div>
      </Reveal>
    </section>
  )
}
