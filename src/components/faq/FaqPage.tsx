import { useTheme } from '@/lib/theme'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'
import { Faq } from '@/components/site/Faq'
import { Countdown } from '@/components/site/Countdown'

/* /faq/ (09.11.2026, redesign doc point 3): the full FAQ on its own page */
export function FaqPage() {
  const [theme, toggleTheme] = useTheme()
  return (
    <>
      <Nav theme={theme} onToggleTheme={toggleTheme} home={false} showPeople={false} />
      <main id="top" className="programme-page">
        <Faq />
        <Countdown id="apply-now" />
        <p className="back-home wrap">
          <a href={import.meta.env.BASE_URL}>&larr; Back to the V4AIR homepage</a>
        </p>
      </main>
      <Footer />
    </>
  )
}
