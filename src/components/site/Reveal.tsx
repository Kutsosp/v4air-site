import type { ReactNode } from 'react'
import { InView } from '@/components/motion-primitives/in-view'

/** Scroll-in reveal matching the site's original .reveal motion. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <InView
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      viewOptions={{ once: true, amount: 0.15 }}
    >
      <div className={className}>{children}</div>
    </InView>
  )
}

/* the forms ship with the site under public/apply and public/nominate (base-aware) */
export const APPLY_URL = import.meta.env.BASE_URL + 'apply/'
export const NOMINATE_URL = import.meta.env.BASE_URL + 'nominate/'
export const CONTACT_MAILTO = 'mailto:kutsosp@natur.cuni.cz'
