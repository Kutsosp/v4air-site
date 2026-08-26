import { CONTACT_MAILTO, Reveal } from './Reveal'
import { asset } from '@/lib/utils'

const LOGOS = [
  { src: asset('assets/charles-university_white.png'), alt: 'Charles University', place: 'Prague, Czechia', tall: true, w: 280, h: 280 },
  { src: asset('assets/uwr-wroclaw_white.png'), alt: 'University of Wroclaw', place: 'Wrocław, Poland', w: 751, h: 255 },
  { src: asset('assets/umk-torun_white.png'), alt: 'Nicolaus Copernicus University in Torun', place: 'Toruń, Poland', w: 348, h: 280 },
  { src: asset('assets/cvut_white.png'), alt: 'Czech Technical University in Prague', place: 'Prague, Czechia', tall: true, w: 137, h: 280 },
  { src: asset('assets/elte_white.png'), alt: 'Eotvos Lorand University in Budapest', place: 'Budapest, Hungary', w: 1400, h: 280 },
  { src: asset('assets/comenius-university_white.png'), alt: 'Comenius University Bratislava', place: 'Bratislava, Slovakia', w: 693, h: 280 },
]

export function Partners() {
  return (
    <section className="partners">
      <Reveal className="wrap">
        <h2>
          <span className="count">Six</span> universities,{' '}
          <span className="count">four</span> countries,{' '}
          <span className="count">one</span> castle
        </h2>
        <p className="intro">
          Coordinated by Charles University with partner institutions across the V4
          region.
        </p>
        <div className="logo-wall">
          {LOGOS.map((l) => (
            <figure className="logo-cell" key={l.alt}>
              <img
                className={l.tall ? 'tall' : undefined}
                src={l.src}
                alt={l.alt}
                width={l.w}
                height={l.h}
                loading="lazy"
              />
              <figcaption>{l.place}</figcaption>
            </figure>
          ))}
        </div>
        <div className="team">
          <div>
            <h3>Peter Kutsos</h3>
            <p>Project coordinator</p>
          </div>
          <div>
            <h3>Petr Chlup</h3>
            <p>Technical coordinator</p>
          </div>
          <div>
            <h3>Inquiries and collaborations</h3>
            <p>
              <a href={CONTACT_MAILTO}>kutsosp@natur.cuni.cz</a>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
