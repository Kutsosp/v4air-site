import { CONTACT_MAILTO, PARTNERS_MAILTO, Reveal } from './Reveal'
import { asset } from '@/lib/utils'

/* Logo files are 200 px tall WebP copies of the colour logos (05.10.2026) to keep the section light.
   `href`: English homepage, linked only once the partner is announced (03.11.2026). */
const UNIVERSITIES: { src: string; alt: string; place: string; href?: string; tall?: boolean; tba?: boolean; w: number; h: number }[] = [
  { src: asset('assets/charles-university_red-sm.webp'), alt: 'Charles University', place: 'Prague, Czechia', href: 'https://cuni.cz/UKEN-1.html', tall: true, w: 200, h: 200 },
  // Rector's patronage granted 02.11.2026; UWr approved the official blue logo (UWr_LOGO_1) for the site on 03.11.2026.
  { src: asset('assets/uwr-wroclaw_blue-sm.webp'), alt: 'University of Wrocław', place: 'Wrocław, Poland', href: 'https://uwr.edu.pl/en/', w: 589, h: 200 },
  { src: asset('assets/umk-torun_blue-sm.webp'), alt: 'Nicolaus Copernicus University in Torun', place: 'Toruń, Poland', href: 'https://www.umk.pl/en/', w: 248, h: 200 },
  { src: asset('assets/cvut_blue-sm.webp'), alt: 'Czech Technical University in Prague', place: 'Prague, Czechia', href: 'https://www.cvut.cz/en', tall: true, w: 98, h: 200 },
  { src: asset('assets/elte_color-sm.webp'), alt: 'Eötvös Loránd University in Budapest', place: 'Budapest, Hungary', href: 'https://www.elte.hu/en/', w: 569, h: 120 },
  // Partnership with the department leadership not yet confirmed (2026-10-20): same tba treatment as above.
  { src: asset('assets/comenius-university_red-sm.webp'), alt: 'Partner university in Slovakia, to be announced', place: 'TBA, Slovakia', tba: true, w: 496, h: 200 },
]

/* partners outside academia: separate strip under the universities (05.10.2026) */
const PARTNERS: { src: string; alt: string; href?: string; tall?: boolean; w: number; h: number }[] = [
  { src: asset('assets/prgai-logo.svg'), alt: 'prg.ai', href: 'https://prg.ai/en/', w: 159, h: 40 },
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
          {UNIVERSITIES.map((l) => {
            const content = (
              <>
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
              </>
            )
            return (
              <figure className={l.tba ? 'logo-cell tba' : 'logo-cell'} key={l.alt}>
                {l.href && !l.tba ? (
                  <a className="logo-link" href={l.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </figure>
            )
          })}
        </div>
        <div className="partner-strip">
          <p className="partner-strip-label">Organizing Partners</p>
          <div className="partner-strip-logos">
            {PARTNERS.map((l) => {
              const img = (
                <img
                  className={l.tall ? 'tall' : undefined}
                  src={l.src}
                  alt={l.alt}
                  width={l.w}
                  height={l.h}
                  loading="lazy"
                  decoding="async"
                />
              )
              return l.href ? (
                <a key={l.alt} href={l.href} target="_blank" rel="noopener noreferrer">
                  {img}
                </a>
              ) : (
                <span key={l.alt}>{img}</span>
              )
            })}
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
