import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

/* Simulated-time support: add ?debug to the URL to get a floating date panel.
   Date-driven components read useNow() instead of Date.now(). */

const TimeContext = createContext<number>(Date.now())

export function useNow() {
  return useContext(TimeContext)
}

export const DEBUG =
  typeof window !== 'undefined' && window.location.search.includes('debug')

const RANGE_START = new Date('2026-08-01T00:00:00').getTime()
const RANGE_END = new Date('2027-05-15T00:00:00').getTime()
const DAY = 86400000

/* debug-only display-font candidates; the final pick gets self-hosted */
const FONTS: Array<{ label: string; family: string; url?: string }> = [
  { label: 'Outfit (current)', family: 'Outfit Variable' },
  {
    label: 'Cabinet Grotesk',
    family: 'Cabinet Grotesk',
    url: 'https://api.fontshare.com/v2/css?f%5B%5D=cabinet-grotesk@600,700,800&display=swap',
  },
  {
    label: 'General Sans',
    family: 'General Sans',
    url: 'https://api.fontshare.com/v2/css?f%5B%5D=general-sans@600,700&display=swap',
  },
  {
    label: 'Bricolage Grotesque',
    family: 'Bricolage Grotesque',
    url: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap',
  },
  {
    label: 'Sora',
    family: 'Sora',
    url: 'https://fonts.googleapis.com/css2?family=Sora:wght@600;700&display=swap',
  },
  {
    label: 'Unbounded',
    family: 'Unbounded',
    url: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&display=swap',
  },
  {
    label: 'Space Grotesk (the old one)',
    family: 'Space Grotesk',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap',
  },
]

function setDisplayFont(label: string) {
  const f = FONTS.find((x) => x.label === label)
  if (!f) return
  if (f.url) {
    const id = `debug-font-${f.family.replace(/\s/g, '-')}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = f.url
      document.head.appendChild(link)
    }
  }
  document.documentElement.style.setProperty('--display-font', `'${f.family}'`)
}

export function TimeProvider({ children }: { children: ReactNode }) {
  const [simNow, setSimNow] = useState<number | null>(null)

  return (
    <TimeContext.Provider value={simNow ?? Date.now()}>
      {children}
      {DEBUG && <DebugTimePanel simNow={simNow} setSimNow={setSimNow} />}
    </TimeContext.Provider>
  )
}

function DebugTimePanel({
  simNow,
  setSimNow,
}: {
  simNow: number | null
  setSimNow: (v: number | null) => void
}) {
  const value = simNow ?? Date.now()
  const days = Math.round((value - RANGE_START) / DAY)
  const maxDays = Math.round((RANGE_END - RANGE_START) / DAY)

  return (
    <div className="fixed bottom-4 right-4 z-50 grid w-72 gap-2 rounded-xl border border-line bg-bg-raise p-3 text-xs text-ink-2 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase tracking-[0.14em] text-accent">
          Debug: date
        </span>
        <button
          className="rounded border border-line px-2 py-0.5 hover:text-accent"
          onClick={() => setSimNow(null)}
        >
          reset to real
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={maxDays}
        value={Math.min(maxDays, Math.max(0, days))}
        onChange={(e) => setSimNow(RANGE_START + Number(e.target.value) * DAY)}
        className="w-full accent-(--color-accent)"
      />
      <input
        type="date"
        className="rounded border border-line bg-bg px-2 py-1 text-ink"
        value={new Date(value).toISOString().slice(0, 10)}
        onChange={(e) => {
          const t = new Date(`${e.target.value}T12:00:00`).getTime()
          if (!Number.isNaN(t)) setSimNow(t)
        }}
      />
      <span className="font-semibold text-ink">
        {simNow ? new Date(value).toDateString() : `real time (${new Date(value).toDateString()})`}
      </span>
      <label className="mt-1 grid gap-1 border-t border-line pt-2">
        <span className="font-bold uppercase tracking-[0.14em] text-accent">
          Debug: display font
        </span>
        <select
          className="rounded border border-line bg-bg px-2 py-1 text-ink"
          defaultValue={FONTS[0].label}
          onChange={(e) => setDisplayFont(e.target.value)}
        >
          {FONTS.map((f) => (
            <option key={f.label}>{f.label}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
