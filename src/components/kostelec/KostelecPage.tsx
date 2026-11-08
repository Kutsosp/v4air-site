import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'
import { Reveal, APPLY_URL, CONTACT_MAILTO } from '@/components/site/Reveal'
import { asset } from '@/lib/utils'
import { useTheme } from '@/lib/theme'

/* /kostelec/: the venue page. Photos are Wikimedia Commons files (credits at the
   bottom of the page and in ATTRIBUTION.md). No links to the venue's own websites. */

const img = (f: string) => asset('assets/kostelec/' + f)

/* Coordinates, not the place name: a place card would lead to the venue's own website */
const MAP_URL = 'https://www.google.com/maps?q=49.99578,14.8629&z=15&hl=en&output=embed'

/* One stop on the route diagram; `line` colours the segment that leaves it and the
   line badges sit on that segment */
function Stop({
  name,
  note,
  line,
  pills,
  time,
  leg,
}: {
  name: string
  note?: string
  line?: 'n59' | 'a' | 'c' | 'bus' | 'walk'
  pills?: string[]
  time?: string
  leg?: string
}) {
  return (
    <li className={line ? `k-stop k-l-${line}` : 'k-stop'}>
      <strong>{name}</strong>
      {note && <span className="k-stop-note">{note}</span>}
      {leg && (
        <p className="k-leg">
          {pills && (
            <span className="k-pills">
              {pills.map((p) => (
                <span className="k-pill" key={p}>
                  {p}
                </span>
              ))}
            </span>
          )}
          <b>{time}</b> <span>{leg}</span>
        </p>
      )}
    </li>
  )
}

type Photo = { src: string; alt: string; w: number; h: number; cap?: string }

const CASTLE: Record<'courtyard' | 'corridor' | 'gate' | 'hall', Photo> = {
  courtyard: {
    src: img('courtyard.jpg'),
    alt: 'The castle courtyard, with two floors of arched galleries above a ground-floor arcade, a stone fountain and benches on the lawn',
    w: 1600,
    h: 1200,
    cap: 'The Renaissance courtyard, with arcades on three floors.',
  },
  corridor: {
    src: img('corridor.jpg'),
    alt: 'A long vaulted corridor with a red tiled floor, plants along tall windows on the right',
    w: 1200,
    h: 1600,
    cap: 'A vaulted corridor along the courtyard.',
  },
  gate: {
    src: img('gate.jpg'),
    alt: 'The gate tower of the castle, its walls covered in diamond-pattern sgraffito, with a stone bridge leading to the arched entrance',
    w: 1600,
    h: 1200,
    cap: 'The gate tower and its sgraffito walls.',
  },
  hall: {
    src: img('hall.jpg'),
    alt: 'A large empty hall with a coffered wooden ceiling, a wooden floor and tall arched windows at the far end',
    w: 1600,
    h: 1200,
    cap: 'One of the castle halls.',
  },
}

/* every photo used on the page, for the credits list (source: Wikimedia Commons) */
const CREDITS = [
  { what: 'Castle from the park', author: 'Richenza', lic: 'CC BY-SA 3.0', file: 'Kostelec_nad_Černými_lesy_(09).jpg' },
  { what: 'Courtyard', author: 'Juan de Vojníkov', lic: 'CC BY-SA 3.0', file: 'Zámek_(Kostelec_nad_Černými_lesy),_jedna_z_venkovních_fasád_zámku.JPG' },
  { what: 'Corridor', author: 'Palickap', lic: 'CC BY-SA 3.0', file: 'Kostelec_nad_Černými_lesy,_zámek,_chodba.jpg' },
  { what: 'Gate tower', author: 'MartinVeselka', lic: 'CC BY-SA 4.0', file: 'Kostelec_nad_Černými_lesy_-_zámek_(stav_září_2024)_(1).jpg' },
  { what: 'Hall', author: 'JiriMatejicek', lic: 'CC BY-SA 4.0', file: 'Kostelec_nad_Cernymi_lesy_zamek_3.jpg' },
  { what: 'The castle in 1819', author: 'Johann Venuto', lic: 'Public domain', file: 'Schloss_Schwarz_Kostelecz_Kaurzimer_Kreises_nach_Pucherna_gemahlt_von_J._Venuto_1819.jpg' },
  { what: 'The castle today', author: 'JiriMatejicek', lic: 'CC BY-SA 4.0', file: 'Kostelec_nad_Cernymi_lesy_zamek_q.jpg' },
  { what: 'Savoy house', author: 'ŠJů', lic: 'CC BY-SA 3.0', file: 'Dům_Marie_Terezie_kněžny_Savojské,_od_kaple.jpg' },
  { what: 'Brewery courtyard', author: 'MartinVeselka', lic: 'CC BY-SA 4.0', file: 'Kostelec_nad_Černými_lesy_-_areál_pivovaru_čp._17_v_Českobrodské_ul._(stav_září_2024)_(4).jpg' },
  { what: 'Brewery buildings', author: 'MartinVeselka', lic: 'CC BY-SA 4.0', file: 'Kostelec_nad_Černými_lesy_-_areál_pivovaru_čp._17_v_Českobrodské_ul._(stav_září_2024)_(1).jpg' },
  { what: 'Brewery, eight-sided hall', author: 'ŠJů', lic: 'CC BY-SA 3.0', file: 'Pivovar_Kostelec_nad_Černými_lesy,_polygonální_mlat.jpg' },
  { what: 'Beech forest in April', author: 'Juan de Vojníkov', lic: 'CC BY-SA 3.0', file: 'Voděradské_bučiny_na_jaře_(007).JPG' },
  { what: 'View from the castle', author: 'ŠJů', lic: 'CC BY-SA 3.0', file: 'Kostelec_nČl,_výhled_ze_zámku_k_lesům.jpg' },
]

const LICENSE_URL: Record<string, string | undefined> = {
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

function Figure({ p, className }: { p: Photo; className?: string }) {
  return (
    <figure className={'k-fig ' + (className ?? '')}>
      <img src={p.src} alt={p.alt} width={p.w} height={p.h} loading="lazy" />
      {p.cap && <figcaption>{p.cap}</figcaption>}
    </figure>
  )
}

export function KostelecPage() {
  const [theme, toggleTheme] = useTheme()

  return (
    <>
      <Nav theme={theme} onToggleTheme={toggleTheme} home={false} overPhoto showPeople={false} />
      <main id="top" className="kostelec">
        <section className="hero k-hero" id="hero">
          <div className="hero-photo">
            <img
              src={img('hero.jpg')}
              alt="Kostelec Castle seen from its park: a long cream-coloured wing with red roofs and onion-domed corner towers under a blue sky"
              width={2400}
              height={1600}
              fetchPriority="high"
            />
          </div>
          <div className="hero-scrim"></div>
          <div className="hero-inner wrap">
            <p className="eyebrow">The venue &middot; 28-30 April 2027</p>
            <h1>Three days in a Renaissance castle near Prague</h1>
            <p className="lede">
              V4AIR takes place at Kostelec Castle, 45 minutes from Prague. Your room, your
              meals and every session are a few minutes&rsquo; walk apart, and the forest
              begins at the edge of town.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href={APPLY_URL}>
                Apply now
              </a>
              <a className="btn btn-ghost" href="#castle">
                See the castle
              </a>
            </div>
          </div>
        </section>

        <section className="k-section" id="castle">
          <Reveal className="wrap">
            <p className="k-eyebrow">The castle</p>
            <h2>Seven centuries old, and still in daily use</h2>
            <div className="k-text k-cols">
              <p>
                A royal castle stood here by the 13th century. After a fire in 1548 it was
                rebuilt as the Renaissance castle you see today. In 1618 its young owner,
                Albrecht Jan Smiřický, was spoken of as a candidate for the Bohemian throne.
              </p>
              <p>
                Today the castle belongs to the Czech University of Life Sciences Prague,
                which also manages the forests around the town. It is a working university
                building, not a museum.
              </p>
            </div>
          </Reveal>
          <Reveal className="wrap">
            <div className="k-mosaic">
              <Figure p={CASTLE.courtyard} className="m-courtyard" />
              <Figure p={CASTLE.corridor} className="m-corridor" />
              <Figure p={CASTLE.gate} className="m-gate" />
              <Figure p={CASTLE.hall} className="m-hall" />
            </div>
          </Reveal>
          <Reveal className="wrap">
            <div className="k-thennow">
              <figure className="k-fig">
                <span className="k-year">1819</span>
                <img
                  src={img('castle-1819.jpg')}
                  alt="A painting of the castle on its hill above trees, ponds and fields, painted in 1819"
                  width={1275}
                  height={756}
                  loading="lazy"
                />
                <figcaption>Painted by Johann Venuto in 1819.</figcaption>
              </figure>
              <figure className="k-fig">
                <span className="k-year">Today</span>
                <img
                  src={img('castle-today.jpg')}
                  alt="The same castle wing today, with its round corner towers and red roof, seen from the lawn"
                  width={1600}
                  height={1200}
                  loading="lazy"
                />
                <figcaption>The same towers today.</figcaption>
              </figure>
            </div>
          </Reveal>
        </section>

        <section className="k-section" id="stay">
          <Reveal className="wrap k-split">
            <div className="k-text">
              <p className="k-eyebrow">Where you sleep</p>
              <h2>Your room is in the castle or next to it</h2>
              <p>
                Participants stay in the castle and in the historic guesthouses around it,
                all within a few minutes&rsquo; walk of the courtyard.
              </p>
              <p>
                Meals, sessions and evenings happen on the same few streets. You will not
                need a car or a taxi during the three days.
              </p>
            </div>
            <Figure
              p={{
                src: img('savoy-house.jpg'),
                alt: 'A two-storey white house with a steep red roof and dormer windows, reached by a short bridge',
                w: 1600,
                h: 1200,
                cap: 'The Savoy house, an 18th-century building next to the castle, now a guesthouse.',
              }}
            />
          </Reveal>
        </section>

        <section className="k-section" id="brewery">
          <Reveal className="wrap">
            <p className="k-eyebrow">Down the street</p>
            <h2>A working brewery, six minutes from the castle</h2>
            <div className="k-text k-cols">
              <p>
                Kostelec has brewed beer since 1489. The town brewery, a short walk from
                the castle gate, has brewed again since 2009. Its courtyard has a pub, long
                tables outside and a brewing museum.
              </p>
              <p>
                Look for the eight-sided hall where horses once walked in circles to drive
                the machinery. It is probably the largest building of its kind in Europe.
              </p>
            </div>
          </Reveal>
          <Reveal className="wrap">
            <div className="k-trio">
              <Figure
                className="t-main"
                p={{
                  src: img('brewery-yard.jpg'),
                  alt: 'The cobbled brewery courtyard with tables, parasols and a tall brick chimney behind the buildings',
                  w: 1600,
                  h: 1200,
                  cap: 'The brewery courtyard.',
                }}
              />
              <Figure
                p={{
                  src: img('brewery-hall.jpg'),
                  alt: 'An eight-sided building with a pyramid roof, with wooden benches and tables in front of it',
                  w: 1600,
                  h: 1081,
                  cap: 'The eight-sided horse-mill hall.',
                }}
              />
              <Figure
                p={{
                  src: img('brewery.jpg'),
                  alt: 'Brewery buildings with red roofs and a tall brick chimney under a blue sky',
                  w: 1600,
                  h: 1200,
                  cap: 'The brewhouse and its chimney.',
                }}
              />
            </div>
          </Reveal>
        </section>

        <section className="k-section k-forest" id="forests">
          <figure className="k-bleed">
            <img
              src={img('beech-forest.jpg')}
              alt="A bright beech forest in spring, with tall grey trunks, long shadows and a floor of brown leaves"
              width={1600}
              height={1200}
              loading="lazy"
            />
          </figure>
          <Reveal className="wrap k-split k-split-rev">
            <Figure
              p={{
                src: img('view-forests.jpg'),
                alt: 'View from the castle over gardens and roofs to a wide band of dark forest on the horizon',
                w: 1600,
                h: 1200,
                cap: 'The view from the castle.',
              }}
            />
            <div className="k-text">
              <p className="k-eyebrow">The black forests</p>
              <h2>The town is named after its forests</h2>
              <p>
                Kostelec nad Černými lesy means &ldquo;Kostelec above the black
                forests&rdquo;. The woods begin at the edge of town.
              </p>
              <p>
                Five kilometres away is Voděradské bučiny, a national nature reserve:
                684&nbsp;hectares of beech forest with granite boulders and forest springs.
                In late April the beeches are coming into leaf. Bring shoes you can walk
                in.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="k-section" id="practical">
          <Reveal className="wrap k-pair">
            <div className="k-text">
              <p className="k-eyebrow">Getting there</p>
              <h2>By metro and bus from Prague</h2>
              <p>
                Kostelec is 25&nbsp;km east of Prague. By public transport, take metro line
                C to Háje, then a direct bus to the town square, four minutes from the castle
                gate. From Prague airport, allow two to two and a half hours.
              </p>
              <p className="muted">
                Selected participants receive full travel instructions with their
                acceptance.
              </p>
            </div>
            <div className="k-gmap">
              <iframe
                src={MAP_URL}
                title="Google map with Kostelec Castle pinned"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
          <Reveal className="wrap">
            <div className="k-route">
              <h3>From Prague to the castle in 45 minutes</h3>
              <div className="k-route-starts">
                <div>
                  <p className="k-route-from">From a coach or train</p>
                  <ol className="k-line">
                    <Stop
                      name="Florenc"
                      note="Coach station"
                      line="c"
                      pills={['C']}
                      time="20 min"
                      leg="Metro towards Háje"
                    />
                    <Stop
                      name="Hlavní nádraží"
                      note="Main railway station"
                      line="c"
                      pills={['C']}
                      time="19 min"
                      leg="Metro towards Háje"
                    />
                  </ol>
                </div>
                <div>
                  <p className="k-route-from">From the airport</p>
                  <ol className="k-line">
                    <Stop
                      name="Terminál 1 or Terminál 2"
                      note="Prague airport"
                      line="n59"
                      pills={['59']}
                      time="17 min"
                      leg="Bus towards Nádraží Veleslavín"
                    />
                    <Stop
                      name="Nádraží Veleslavín"
                      note="Change to metro A"
                      line="a"
                      pills={['A']}
                      time="12 min"
                      leg="Metro towards Depo Hostivař or Skalka, to Muzeum"
                    />
                  </ol>
                </div>
              </div>
              <p className="k-route-from k-route-join">Both routes continue from Muzeum</p>
              <ol className="k-line k-line-end">
                <Stop
                  name="Muzeum"
                  note="From the airport, change here to metro C."
                  line="c"
                  pills={['C']}
                  time="17 min"
                  leg="Metro towards Háje"
                />
                <Stop
                  name="Háje"
                  note="End of metro C. Walk to bus stand A."
                  line="bus"
                  pills={['381', '387']}
                  time="45 min"
                  leg="Bus towards Čáslav, Kutná Hora or Zásmuky (381) or Uhlířské Janovice (387). On weekdays a bus leaves every 30 to 60 minutes."
                />
                <Stop
                  name="Kostelec n.Č.l.,nám."
                  note="The town square. Get off here, at the third stop in Kostelec, after Jevanská and Dobrovského."
                  line="walk"
                  time="4 min"
                  leg="Walk"
                />
                <li className="k-stop k-terminus">
                  <strong>Kostelec Castle</strong>
                </li>
              </ol>
              <p className="muted k-route-note">
                Lines and stops as of November 2026. Check times at{' '}
                <a href="https://pid.cz/en/">pid.cz</a>.
              </p>
              <img className="k-route-castle" src={asset('assets/castle-silhouette.png')} alt="" />
            </div>
          </Reveal>
          <Reveal className="wrap">
            <div className="k-text k-access" id="access">
              <p className="k-eyebrow">Access</p>
              <h2>The castle is not step-free</h2>
              <p>
                It is a historic building with stairs throughout and cobbled courtyards. If
                you use a wheelchair or find stairs difficult, please write to us at{' '}
                <a href={CONTACT_MAILTO}>info@v4air.eu</a> before you apply. We will look
                for a solution with the venue.
              </p>
              <p className="muted">Telling us has no effect on selection.</p>
            </div>
          </Reveal>
        </section>

        <section className="k-section k-cta" id="apply">
          <Reveal className="wrap">
            <h2>Spend three days here in April</h2>
            <p>Applications close on 15 January 2027.</p>
            <div className="cta-row">
              <a className="btn btn-primary" href={APPLY_URL}>
                Apply now
              </a>
              <a className="k-back" href={import.meta.env.BASE_URL}>
                Back to the main page
              </a>
            </div>
          </Reveal>
        </section>

        <section className="wrap k-credits" aria-label="Photo credits">
          <details>
            <summary>Photo credits</summary>
            <ul>
              {CREDITS.map((c) => (
                <li key={c.file}>
                  {c.what}:{' '}
                  <a href={'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(c.file)}>
                    {c.author}
                  </a>
                  ,{' '}
                  {LICENSE_URL[c.lic] ? <a href={LICENSE_URL[c.lic]}>{c.lic}</a> : c.lic}, via
                  Wikimedia Commons
                </li>
              ))}
            </ul>
          </details>
        </section>
      </main>
      <Footer />
    </>
  )
}
