[English](README.md) | [Čeština](README.cs.md)

# v4air-site

Public landing site for V4AIR (V4 AI researchers meetup): a free, Visegrad-Fund-funded three-day adaptive conference for early-career AI researchers from the V4 region, held at Kostelec Castle near Prague, 28-30 April 2027.

The site is a single-page React application. All event copy is sourced from the DoMore project materials; the application CTA links to the form at `/apply/`.

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

## Forms

The application and nomination forms live in this repo and ship with the site: `public/apply/` and `public/nominate/` are plain HTML, CSS, and JavaScript with no build step, served at `/apply/` and `/nominate/`. Every Apply button on the site points at `/apply/`; the apply panel also links to `/nominate/`.

- `forms/survey-spec.md`: the specification, every question with ID, wording, options, conditions, and the behaviour the backend must provide (sections 5.1 to 5.17). A third instrument, the post-acceptance form, is specified there and frozen.
- `forms/form-a-preview.html`, `forms/form-b-preview.html`: review views of both forms with variable IDs, a participant mode with dev controls (`j` and `k` to move between screens), and comment boxes that export to markdown. Open directly in a browser.
- `public/apply/index.html`, `public/nominate/index.html`: the forms as respondents see them. Validation on leaving a field and on Next, autosave in the browser, weighted progress with time left, response IDs (`V4A-`, `V4N-`). "Dev controls" in the footer or `?dev` in the URL adds free navigation. Nothing is sent anywhere yet.

### Open items for the forms

Content, for the organizers:

1. Consent texts for the application (A8) and the nomination form (B6), the retention period, and the link to the privacy notice. Both are bracketed placeholders. The A8 text and the privacy notice must name the optional gender item (A1.11) and its purpose, aggregate reporting on gender balance; the item was added 04.10.2026.
2. Dates and numbers in copy: "Everyone hears from us by February", "We will write to them within [N] days", and the year on the 15 January deadline if needed.
3. Copy not yet confirmed: the closing line of the "What you are looking for" screen, the two participation-cost tooltips, the four experience-level examples, and the Not-Just-Posters tooltip.
4. Pilot: five people complete the application on their own devices, at least two on phones, timed per screen (spec 5.14). Recalibrate the per-screen minutes in spec 5.1 from the results.

Build, to make the forms live:

1. Storage: a Google Sheet with an Apps Script web app (save on Next, resume by token, LockService for IDs), or a database and API. The sheet is enough at this scale.
2. Email: resume link carrying the application ID, confirmations for both forms, the nominee invitation. Mind the MailApp quota if Apps Script sends them.
3. Admin: counts by country and stage, coverage matrix of "want to learn" versus "could present", nominee list with duplicate detection, export (spec 5.11 and 5.12).
4. Closing at the deadline and the retention cleanup.

## Image credits

Castle gallery photos are CC BY-SA derivatives from Wikimedia Commons; see [ATTRIBUTION.md](ATTRIBUTION.md) for authors and licenses.

## Limitations

- The interior-venue subpage is not built yet; venue mocks are parked under `src/mocks/`
- Event facts (capacity, funding wording) follow the DoMore brief as of August 2026 and must be re-checked before major announcements
