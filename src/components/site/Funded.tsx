import { Reveal } from './Reveal'
import { asset } from '@/lib/utils'

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
            <strong className="chip">Free and fully funded</strong> for students and researchers from
            the six partner universities, including admission, accommodation at the
            castle, meals and a contribution toward travel.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
