import { useEffect, useRef, useState } from 'react'
import { asset } from '@/lib/utils'
import { motion, useInView } from 'motion/react'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { TextMorph } from '@/components/motion-primitives/text-morph'
import { CONTACT_MAILTO, PARTNERS_MAILTO, Reveal } from './Reveal'

export function Footer() {
  /* the lockup arrives folded as AIR, unfolds once seen, and stays unfolded */
  const lockupRef = useRef<HTMLDivElement>(null)
  const inView = useInView(lockupRef, { once: true, amount: 0.6 })
  const [unfolded, setUnfolded] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setUnfolded(true), 600)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <footer className="footer">
      {/* poster send-off: text lockup + castle silhouette + invitation */}
      <div className="footer-band">
        {/* 09.11.2026: one footer (point 21): send-off left, contact right, meta row below */}
        <Reveal className="wrap footer-send footer-split">
          <div className="footer-left">
          <div className="footer-row">
            <div
              className="footer-lockup"
              ref={lockupRef}
              role="img"
              aria-label="V4 AI researchers meetup"
            >
              <span className="fl-v4" aria-hidden="true">
                <span>V</span>
                <span>4</span>
              </span>
              <TextMorph
                as="span"
                className="fl-ai"
                transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.7 }}
              >
                {unfolded ? 'AI' : 'AIR'}
              </TextMorph>
              <motion.span
                className="fl-words"
                aria-hidden="true"
                initial={false}
                animate={
                  unfolded
                    ? { opacity: 1, width: 'auto', x: 0 }
                    : { opacity: 0, width: 0, x: -10 }
                }
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                /* release the animated width once open: a width measured before
                   the display font loads would clip the wider real text */
                onAnimationComplete={() => setSettled(true)}
                style={settled ? { width: 'auto' } : undefined}
              >
                researchers
                <br />
                meetup
              </motion.span>
            </div>
            <motion.img
              className="footer-castle"
              src={asset('assets/castle-silhouette.png')}
              alt=""
              loading="lazy"
              initial={false}
              animate={
                unfolded
                  ? { opacity: 0.9, width: 'auto', x: 0, scale: 1 }
                  : { opacity: 0, width: 0, x: -40, scale: 0.7 }
              }
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <TextEffect
            as="p"
            className="footer-invite"
            per="char"
            preset="fade-in-blur"
            trigger={unfolded}
            delay={0.7}
          >
            See you there.
          </TextEffect>
          </div>
          <div className="footer-contact">
            <div className="team">
              <div>
                <h3>Peter Kutsos</h3>
                <p>Project coordinator</p>
                <p>
                  <a href="mailto:peter@v4air.eu">peter@v4air.eu</a>
                </p>
              </div>
              <div>
                <h3>Petr Chlup</h3>
                <p>Technical coordinator</p>
                <p>
                  <a href="mailto:petr@v4air.eu">petr@v4air.eu</a>
                </p>
              </div>
              <div>
                <h3>Inquiries and collaborations</h3>
                <p>
                  <a href={CONTACT_MAILTO}>info@v4air.eu</a>
                </p>
              </div>
              <div>
                <h3>Companies, sponsors and partners</h3>
                <p>
                  <a href={PARTNERS_MAILTO}>partners@v4air.eu</a>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="wrap footer-meta">
        <p>Supported by the International Visegrad Fund, Grant No. 22610317.</p>
        <p>V4AIR &middot; 28-30 April 2027</p>
        {/* 09.11.2026: the main links repeated at the bottom (NN/g doormat navigation) */}
        <p className="footer-links">
          <a href={`${import.meta.env.BASE_URL}programme/`}>Program</a> &middot; <a href={`${import.meta.env.BASE_URL}kostelec/`}>Venue</a> &middot;{' '}
          <a href={`${import.meta.env.BASE_URL}pricing/`}>Pricing</a> &middot; <a href={`${import.meta.env.BASE_URL}faq/`}>FAQ</a>
        </p>
        <p>
          <a href={`${import.meta.env.BASE_URL}policy/privacy/`}>Privacy notice</a> &middot;{' '}
          <a href={`${import.meta.env.BASE_URL}policy/cookies/`}>Cookies</a> &middot;{' '}
          <a href={`${import.meta.env.BASE_URL}policy/code-of-conduct/`}>Code of Conduct</a> &middot;{' '}
          <button type="button" data-cookie-settings>
            Cookie settings
          </button>
        </p>
        </div>
      </div>
    </footer>
  )
}
