import { useCallback, useEffect, useState } from 'react'
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

export type Theme = 'dark' | 'light'

const SHOW_MOCKS =
  typeof window !== 'undefined' && window.location.search.includes('mocks')

import { TimeProvider } from '@/lib/time'

export default function App() {
  return <TimeProvider>{SHOW_MOCKS ? <MocksPage /> : <Site />}</TimeProvider>
}

function Site() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem('v4air-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  )

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
