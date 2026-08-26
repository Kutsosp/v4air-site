[English](README.md) | [Čeština](README.cs.md)

# v4air-site

Public landing site for V4AIR (V4 AI researchers meetup): a free, Visegrad-Fund-funded three-day adaptive conference for early-career AI researchers from the V4 region, held at Kostelec Castle near Prague, 28-30 April 2027.

The site is a single-page React application. All event copy is sourced from the DoMore project materials; the application CTA links to the live Google Form.

## What it does

- Full-screen hero with theme-aware castle photography (day/dusk) and the poster color identity (sage paper, ink, teal, bloom orange)
- Split-flap countdown to application opening (1 September 2026), switching to an open-applications state with a deadline clock (15 January 2027)
- "Should you apply?" section with synchronized rotating discipline/relationship pairs and a staggered reveal
- Pinned scroll sequence explaining the four application steps, with a glowing progress thread (static fallback on small screens and reduced motion)
- Night-band timeline ("The road to Kostelec") with an animated walker, castle silhouette terminus, and date-driven phase copy
- FAQ with hash deep links and expand-all; partner wall with country captions; footer lockup that unfolds from V4AIR into the full name
- Sticky nav whose logotype folds/unfolds on scroll (Motion Primitives TextMorph) and whose Apply pill carries the application-window state
- Light (paper) and dark theme, persisted in localStorage

## Setup

Prerequisites: Node 20+.

```
npm install
npm run dev      # dev server
npm run build    # type-check + production build to dist/
```

## Usage

- `?debug` appends a date simulator (slider + date input) and a display-font switcher, for previewing date-driven states (pre-open, open, deadline, event, post-event)
- `?mocks` renders the internal mock gallery instead of the site

## Stack

- Vite, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`)
- Motion (`motion/react`) with Motion Primitives components (text-loop, text-morph, text-effect, in-view, animated-group, text-shimmer) and Watermelon UI's flip-clock
- Fonts: Aileron (display), Satoshi (body, self-hosted), JetBrains Mono

## Image credits

Castle gallery photos are CC BY-SA derivatives from Wikimedia Commons; see [ATTRIBUTION.md](ATTRIBUTION.md) for authors and licenses.

## Limitations

- The interior-venue subpage is not built yet; venue mocks are parked under `src/mocks/`
- Event facts (capacity, funding wording) follow the DoMore brief as of August 2026 and must be re-checked before major announcements
