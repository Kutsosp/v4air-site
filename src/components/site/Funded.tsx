import { Reveal } from './Reveal'
import { asset } from '@/lib/utils'

/* partner universities, one-colour logos (white files, inverted in light mode like the fund logo) */
const UNIS: { src: string; alt: string; tba?: boolean }[] = [
  { src: asset('assets/charles-university_white.png'), alt: 'Charles University' },
  { src: asset('assets/uwr-wroclaw_white.png'), alt: 'University of Wrocław' },
  { src: asset('assets/umk-torun_white.png'), alt: 'Nicolaus Copernicus University in Toruń' },
  { src: asset('assets/cvut_white.png'), alt: 'Czech Technical University in Prague' },
  { src: asset('assets/elte_white.png'), alt: 'Eötvös Loránd University in Budapest' },
  { src: asset('assets/comenius-university_white.png'), alt: 'Partner university in Slovakia, to be announced', tba: true },
]

export function Funded() {
  return (
    <section className="funded">
      <Reveal>
        <div className="wrap">
          <img
            src={asset('assets/visegrad-fund_white.png')}
            alt="International Visegrad Fund"
            width={626}
            height={280}
          />
          <p>
            <strong className="chip">Free and fully funded</strong> for students and researchers from the six
            partner universities. Admission, accommodation, meals and part of your travel
            costs are paid by the International Visegrad Fund.
          </p>
          <ul className="funded-unis" aria-label="Partner universities">
            {UNIS.map((u) => (
              <li key={u.alt}>
                <img src={u.src} alt={u.alt} className={u.tba ? 'tba' : undefined} loading="lazy" />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
