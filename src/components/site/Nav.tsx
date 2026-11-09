import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'
import type { Theme } from '@/App'
import { TextMorph } from '@/components/motion-primitives/text-morph'
import { APPLY_URL } from './Reveal'

/* Sticky nav: transparent over the hero, solid blurred bar once scrolled.
   The Apply link reads "Apply" throughout (05.10.2026); the countdown band carries the window state. */

/* 09.11.2026 (redesign doc point 3): the nav links go to pages, not homepage sections */
const LINKS = [
  { href: 'programme/', label: 'Program' },
  { href: 'kostelec/', label: 'Venue' },
  { href: 'pricing/', label: 'Pricing' },
  { href: 'faq/', label: 'FAQ' },
]

/* /people is a second page (06.10.2026); off the main page the section links point home */
const PEOPLE_URL = import.meta.env.BASE_URL + 'people/'
/* /people is password-protected until everyone listed has consented; no public links to it yet */
export const SHOW_PEOPLE_LINK = false /* 09.11.2026: hidden for now (Peter); visitors would hit the password screen */

export function Nav({
  theme,
  onToggleTheme,
  home = true,
  overPhoto = home,
  showPeople = !home,
}: {
  theme: Theme
  onToggleTheme: () => void
  home?: boolean
  /** page opens on a full-bleed photo: the bar stays transparent until scrolled */
  overPhoto?: boolean
  /** /people links to itself; other subpages keep it hidden like the home page */
  showPeople?: boolean
}) {
  const [scrolled, setScrolled] = useState(!overPhoto)
  /* the brand folds later than the bar turns opaque, so the morph is visible.
     It mounts folded and unfolds as an entrance beat (and on scrolling back up). */
  const [folded, setFolded] = useState(true)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(!overPhoto || window.scrollY > 40)
      setFolded(window.scrollY > 160)
    }
    /* bar opacity syncs immediately; the fold waits a beat so the unfold
       plays visibly as an entrance */
    setScrolled(!overPhoto || window.scrollY > 40)
    const t = setTimeout(onScroll, 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [overPhoto])

  const applyLabel = 'Apply'
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="nav2" data-scrolled={scrolled}>
      <div className="nav2-inner wrap">
        <a
          className="brand"
          href={home ? '#top' : import.meta.env.BASE_URL}
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
        {/* event date, centred between the logomark and the switch (mockup) */}
        <p className="nav-date">28-30 April 2027</p>
        {/* 09.11.2026: links visible from the start, also over the hero (NN/g: keep navigation visible on desktop) */}
        <nav aria-label="Main">
          <AnimatedGroup
            className="nav2-links"
            asChild="span"
            animate="visible"
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
              <a
                key={l.href}
                href={import.meta.env.BASE_URL + l.href}
                aria-current={typeof window !== 'undefined' && window.location.pathname.endsWith('/' + l.href) ? 'page' : undefined}
              >
                {l.label}
              </a>
            ))}
            {(SHOW_PEOPLE_LINK || showPeople) && (
              <a href={PEOPLE_URL} aria-current={typeof window !== 'undefined' && window.location.pathname.endsWith('/people/') ? 'page' : undefined}>
                People
              </a>
            )}
          </AnimatedGroup>
        </nav>
        <div className="nav-right">
          {/* phones (< 900 px): the links go into a menu; Apply stays in the bar */}
          <button
            type="button"
            className="nav-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
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
              {applyLabel}
            </span>
            <AnimatePresence>
              {scrolled && (
                <motion.a
                  className="nav-apply nav-apply-real"
                  href={APPLY_URL}
                  initial={{ opacity: 0, scale: 0.6, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: -10 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                >
                  {applyLabel}
                </motion.a>
              )}
            </AnimatePresence>
          </span>
        </div>
      </div>
      {menuOpen && (
        <div className="nav-menu-panel" id="nav-menu">
          <div className="wrap">
            {LINKS.map((l) => (
              <a key={l.href} href={import.meta.env.BASE_URL + l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a className="btn btn-primary" href={APPLY_URL}>Apply now</a>
          </div>
        </div>
      )}
    </header>
  )
}
