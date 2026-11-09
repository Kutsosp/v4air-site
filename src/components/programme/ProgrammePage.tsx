import { useTheme } from '@/lib/theme'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'
import { Program } from '@/components/site/Program'
import { FormatGrid } from '@/components/site/FormatGrid'
import { Countdown } from '@/components/site/Countdown'

/* /programme/ (09.11.2026, redesign doc points 3 + 9-12): the animation as a player, what happens, apply */
export function ProgrammePage() {
  const [theme, toggleTheme] = useTheme()
  return (
    <>
      <Nav theme={theme} onToggleTheme={toggleTheme} home={false} showPeople={false} />
      <main id="top" className="programme-page">
        <Program />
        <FormatGrid />
        <Countdown id="apply-now" />
        <p className="back-home wrap">
          <a href={import.meta.env.BASE_URL}>&larr; Back to the V4AIR homepage</a>
        </p>
      </main>
      <Footer />
    </>
  )
}
