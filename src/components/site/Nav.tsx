import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'
import type { Theme } from '@/App'
import { TextMorph } from '@/components/motion-primitives/text-morph'
import { useNow } from '@/lib/time'
import { APPLY_URL } from './Reveal'

/* Sticky nav: transparent over the hero, solid blurred bar once scrolled.
   The Apply link carries the application-window state (the persistent
   "applications are open" reminder lives here, per the CTA research). */
const OPEN = new Date('2026-09-01T00:00:00').getTime()
const DEADLINE = new Date('2027-01-15T23:59:59').getTime()
const DAY = 86400000

const LINKS = [
  { href: '#adaptive', label: 'How it works' },
  { href: '#venue', label: 'The castle' },
  { href: '#apply', label: 'Applying' },
  { href: '#timeline', label: 'Timeline' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav({
  theme,
  onToggleTheme,
}: {
  theme: Theme
  onToggleTheme: () => void
}) {
  const now = useNow()
  const [scrolled, setScrolled] = useState(false)
  /* the brand folds later than the bar turns opaque, so the morph is visible.
     It mounts folded and unfolds as an entrance beat (and on scrolling back up). */
  const [folded, setFolded] = useState(true)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      setFolded(window.scrollY > 160)
    }
    /* bar opacity syncs immediately; the fold waits a beat so the unfold
       plays visibly as an entrance */
    setScrolled(window.scrollY > 40)
    const t = setTimeout(onScroll, 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const isOpen = now >= OPEN && now <= DEADLINE
  const daysLeft = Math.ceil((DEADLINE - now) / DAY)
  const applyLabel = !isOpen
    ? 'Apply'
    : daysLeft <= 21
      ? `Apply — ${daysLeft === 1 ? '1 day' : `${daysLeft} days`} left`
      : 'Apply — open now'

  return (
    <header className="nav2" data-scrolled={scrolled}>
      <div className="nav2-inner wrap">
        <a
          className="brand"
          href="#top"
          aria-label="V4AIR, back to top"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <span className="brand-v4" aria-hidden="true">
            <span>V</span>
            <span>4</span>
          </span>
          {/* full lockup at the top (words stacked like the footer); folds
              into AIR a beat after the bar goes opaque */}
          <TextMorph
            as="span"
            className="brand-air"
            transition={
              folded && !hovered
                ? { type: 'spring', stiffness: 120, damping: 24, mass: 0.8 }
                : { type: 'spring', stiffness: 280, damping: 18, mass: 0.3 }
            }
          >
            {folded && !hovered ? 'AIR' : 'AI'}
          </TextMorph>
          <motion.span
            className="brand-words"
            aria-hidden="true"
            initial={false}
            animate={
              folded && !hovered
                ? { opacity: 0, width: 0, x: -6 }
                : { opacity: 1, width: 'auto', x: 0 }
            }
            transition={
              folded && !hovered
                ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } /* fold back: slower */
                : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }
          >
            researchers
            <br />
            meetup
          </motion.span>
        </a>
        {/* menu items exist only on the opaque bar: staggered blur-drop entrance */}
        <nav aria-label="Sections">
          <AnimatedGroup
            className="nav2-links"
            asChild="span"
            animate={scrolled ? 'visible' : 'hidden'}
            variants={{
              container: {
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
                hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
              },
              item: {
                hidden: { opacity: 0, y: -12, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
              },
            }}
          >
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </AnimatedGroup>
        </nav>
        <div className="nav-right">
          <label className="switch switch--skeuo">
            <input
              className="switch__input"
              type="checkbox"
              role="switch"
              checked={theme === 'light'}
              onChange={onToggleTheme}
            />
            <span className="toggle-switch" aria-hidden="true"></span>
            <span className="switch__sr">Light mode</span>
          </label>
          {/* the pill only exists on the opaque bar: over the hero the big CTA
              carries the call; it pops in with a spring once you scroll.
              An invisible twin holds the slot open so nothing shifts. */}
          <span className="nav-apply-slot">
            <span className="nav-apply nav-apply-ghost" aria-hidden="true">
              {isOpen && <span className="nav-apply-dot" />}
              {applyLabel}
            </span>
            <AnimatePresence>
              {scrolled && (
                <motion.a
                  className="nav-apply nav-apply-real"
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener"
                  initial={{ opacity: 0, scale: 0.6, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: -10 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                >
                  {isOpen && <span className="nav-apply-dot" aria-hidden="true" />}
                  {applyLabel}
                </motion.a>
              )}
            </AnimatePresence>
          </span>
        </div>
      </div>
    </header>
  )
}
