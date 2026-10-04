import { CONTACT_MAILTO, PARTNERS_MAILTO, Reveal } from './Reveal'
import { asset } from '@/lib/utils'

/* Logo files are 200 px tall WebP copies of the colour logos (05.10.2026) to keep the section light. */
const UNIVERSITIES = [
  { src: asset('assets/charles-university_red-sm.webp'), alt: 'Charles University', place: 'Prague, Czechia', tall: true, w: 200, h: 200 },
  // Partnership paperwork in progress (2026-09): logo blurred, name and city withheld. Flip `tba` off to reveal.
  { src: asset('assets/uwr-wroclaw_black-sm.webp'), alt: 'Partner university in Poland, to be announced', place: 'TBA, Poland', tba: true, w: 390, h: 200 },
  { src: asset('assets/umk-torun_blue-sm.webp'), alt: 'Nicolaus Copernicus University in Torun', place: 'Toruń, Poland', w: 248, h: 200 },
  { src: asset('assets/cvut_blue-sm.webp'), alt: 'Czech Technical University in Prague', place: 'Prague, Czechia', tall: true, w: 98, h: 200 },
  { src: asset('assets/elte_color-sm.webp'), alt: 'Partner university in Hungary, to be announced', place: 'TBA, Hungary', tba: true, w: 569, h: 120 },
  { src: asset('assets/comenius-university_red-sm.webp'), alt: 'Comenius University Bratislava', place: 'Bratislava, Slovakia', w: 496, h: 200 },
]

/* partners outside academia: separate strip under the universities (05.10.2026) */
const PARTNERS = [
  { src: asset('assets/prgai-logo.svg'), alt: 'prg.ai', w: 159, h: 40 },
  { src: asset('assets/common-ground-research-sm.webp'), alt: 'common ground research', tall: true, w: 160, h: 160 },
]

export function Partners() {
  return (
    <section className="partners" id="partners">
      <Reveal className="wrap">
        <h2>
          <span className="count">Six</span> universities,{' '}
          <span className="count">four</span> countries,{' '}
          <span className="count">one</span> castle
        </h2>
        <p className="intro">
          Coordinated by Charles University with partner institutions across the V4
          region, co-organized with prg.ai and common ground research.
        </p>
        <div className="logo-wall">
          {UNIVERSITIES.map((l) => (
            <figure className={l.tba ? 'logo-cell tba' : 'logo-cell'} key={l.alt}>
              <img
                className={[l.tall && 'tall', l.tba && 'tba'].filter(Boolean).join(' ') || undefined}
                src={l.src}
                alt={l.alt}
                width={l.w}
                height={l.h}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{l.place}</figcaption>
            </figure>
          ))}
        </div>
        <div className="partner-strip">
          <p className="partner-strip-label">Organizing Partners</p>
          <div className="partner-strip-logos">
            {PARTNERS.map((l) => (
              <img
                key={l.alt}
                className={l.tall ? 'tall' : undefined}
                src={l.src}
                alt={l.alt}
                width={l.w}
                height={l.h}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
        <div className="partners-bottom">
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
                <a href={CONTACT_MAILTO}>info@v4air.eu</a>
              </p>
            </div>
          </div>
          {/* for companies arriving from the one-pager: same wording as the one-pager (04.10.2026) */}
          <div className="for-partners">
            <h3>Companies, sponsors and partners</h3>
            <p>
              Three days with hand-picked researchers who apply AI across disciplines. If you
              want to share your experience in a talk or workshop, support the meetup, or meet
              the people in the room, write to{' '}
              <a href={PARTNERS_MAILTO}>partners@v4air.eu</a>.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
