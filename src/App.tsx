import { Nav } from '@/components/site/Nav'
import { Hero } from '@/components/site/Hero'
import { Funded } from '@/components/site/Funded'
import { Countdown } from '@/components/site/Countdown'
import { Adaptive } from '@/components/site/Adaptive'
import { FormatGrid } from '@/components/site/FormatGrid'
import { Venue } from '@/components/site/Venue'
import { Who } from '@/components/site/Who'
import { ApplySteps } from '@/components/site/ApplySteps'
import { Timeline } from '@/components/site/Timeline'
import { Faq } from '@/components/site/Faq'
import { Partners } from '@/components/site/Partners'
import { Footer } from '@/components/site/Footer'

import { MocksPage } from '@/mocks/MocksPage'

export type { Theme } from '@/lib/theme'

const SHOW_MOCKS =
  typeof window !== 'undefined' && window.location.search.includes('mocks')

import { TimeProvider } from '@/lib/time'
import { useTheme } from '@/lib/theme'

export default function App() {
  return <TimeProvider>{SHOW_MOCKS ? <MocksPage /> : <Site />}</TimeProvider>
}

function Site() {
  const [theme, toggleTheme] = useTheme()

  return (
    <>
      <Nav theme={theme} onToggleTheme={toggleTheme} />
      <main id="top">
        <Hero theme={theme} />
        <Funded />
        <Countdown />
        <Adaptive />
        <FormatGrid />
        <Venue />
        <Who />
        <ApplySteps />
        <Timeline />
        <Faq />
        <Partners />
      </main>
      <Footer />
    </>
  )
}
