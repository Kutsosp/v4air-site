import { Reveal } from './Reveal'

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
              A university-owned Renaissance castle in the black forests, 30 minutes
              from Prague. All of us will live, eat, and socialize in one place for
              the whole three days.
            </p>
            <p className="muted">Working language: English.</p>
          </div>
          <figure className="venue-photo">
            <img
              src="/assets/castle-day.jpg"
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
