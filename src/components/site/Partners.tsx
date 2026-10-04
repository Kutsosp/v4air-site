import { CONTACT_MAILTO, PARTNERS_MAILTO, Reveal } from './Reveal'
import { asset } from '@/lib/utils'

const LOGOS = [
  { src: asset('assets/charles-university_red.png'), alt: 'Charles University', place: 'Prague, Czechia', tall: true, w: 280, h: 280 },
  // Partnership paperwork in progress (2026-09): logo blurred, name and city withheld. Flip `tba` off to reveal.
  { src: asset('assets/uwr-wroclaw_black.png'), alt: 'Partner university in Poland, to be announced', place: 'TBA, Poland', tba: true, w: 1040, h: 534 },
  { src: asset('assets/umk-torun_blue.png'), alt: 'Nicolaus Copernicus University in Torun', place: 'Toruń, Poland', w: 900, h: 725 },
  { src: asset('assets/cvut_blue.png'), alt: 'Czech Technical University in Prague', place: 'Prague, Czechia', tall: true, w: 439, h: 900 },
  { src: asset('assets/elte_color.svg'), alt: 'Partner university in Hungary, to be announced', place: 'TBA, Hungary', tba: true, w: 963, h: 203 },
  { src: asset('assets/comenius-university_red.png'), alt: 'Comenius University Bratislava', place: 'Bratislava, Slovakia', w: 900, h: 363 },
  // co-organizers outside academia (added 04.10.2026)
  { src: asset('assets/prgai-logo.svg'), alt: 'prg.ai', place: 'Co-organizer', w: 159, h: 40 },
  { src: asset('assets/common-ground-research.png'), alt: 'common ground research', place: 'Co-organizer', tall: true, w: 360, h: 360 },
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
          {LOGOS.map((l) => (
            <figure className={l.tba ? 'logo-cell tba' : 'logo-cell'} key={l.alt}>
              <img
                className={[l.tall && 'tall', l.tba && 'tba'].filter(Boolean).join(' ') || undefined}
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
        {/* for companies and investors arriving from the one-pager: same wording as the one-pager (04.10.2026) */}
        <div className="for-partners">
          <h3>Companies and investors</h3>
          <p>
            Three days with hand-picked researchers who apply AI across disciplines. If you
            want to share your experience in a talk or workshop, support the meetup, or meet
            the people in the room, write to{' '}
            <a href={PARTNERS_MAILTO}>partners@v4air.eu</a>.
          </p>
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
              <a href={CONTACT_MAILTO}>info@v4air.eu</a>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
