import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { TextMorph } from '@/components/motion-primitives/text-morph'
import { Reveal } from './Reveal'

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
        <Reveal className="wrap footer-send">
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
              src="/assets/castle-silhouette.png"
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
        </Reveal>
      </div>
      <div className="wrap footer-meta">
        <p>We are looking forward to meeting you in Kostelec.</p>
        <p>Supported by the International Visegrad Fund, Grant No. 22610317.</p>
        <p>V4AIR &middot; 28-30 April 2027</p>
      </div>
    </footer>
  )
}
