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

export const APPLY_URL = 'https://forms.gle/Y7kzzHkME9BZp6zx5'
export const CONTACT_MAILTO = 'mailto:kutsosp@natur.cuni.cz'
