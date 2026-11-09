import { Nav } from '@/components/site/Nav'
import { Hero } from '@/components/site/Hero'
import { Countdown } from '@/components/site/Countdown'
import { ProgramTeaser } from '@/components/site/ProgramTeaser'
import { FormatGrid } from '@/components/site/FormatGrid'
import { CostLine } from '@/components/site/CostLine'
import { Venue } from '@/components/site/Venue'
import { Who } from '@/components/site/Who'
import { WhatYouGet } from '@/components/site/WhatYouGet'
import { NotAiResearcher } from '@/components/site/NotAiResearcher'
import { WhatToBring } from '@/components/site/WhatToBring'
import { Timeline } from '@/components/site/Timeline'
import { FaqLink } from '@/components/site/FaqLink'
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
        <Countdown />
        {/* 09.11.2026 order (redesign doc point 3): for me? -> what I get -> how -> what happens -> where -> cost -> when -> prepare */}
        <Who />
        <NotAiResearcher />
        <WhatYouGet />
        <ProgramTeaser />
        <FormatGrid />
        <Venue />
        <CostLine />
        <Timeline />
        <WhatToBring />
        <FaqLink />
        <Countdown id="apply-now" />
        <Partners />
      </main>
      <Footer />
    </>
  )
}
