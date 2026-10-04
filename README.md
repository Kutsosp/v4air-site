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

1. Consent texts for the application (A8) and the nomination form (B6), the retention period, and the link to the privacy notice. Interim texts are live since 05.10.2026 (project-duration retention, info@v4air.eu for access and deletion); the faculty GDPR wording and a privacy notice page are requested from Petr Chlup. The A8 text and the privacy notice must name the optional gender item (A1.11) and its purpose, aggregate reporting on gender balance, and the optional care-duties item (A1.12) and its purpose, planning venue arrangements; both items were added 04.10.2026.
2. Dates and numbers in copy: "Everyone hears from us by February" and the year on the 15 January deadline if needed.
3. Copy not yet confirmed: the closing line of the "What you are looking for" screen, the two participation-cost tooltips, the four experience-level examples, and the Not-Just-Posters tooltip.
4. Pilot: five people complete the application on their own devices, at least two on phones, timed per screen (spec 5.14). Recalibrate the per-screen minutes in spec 5.1 from the results.

Build, to make the forms live:

1. Storage: built in `backend/` (Google Sheet + Apps Script web app, owned by petkout1@gmail.com). Form A saves on every Next and on Submit, the server assigns IDs and a resume token, and `?id=…&t=…` reopens an application. Form B stores on Send, one row in Nominations plus one row per person in Nominees. The A7 upload (one file, 10 MB, PDF/PPTX/PNG/JPG) goes to the Drive folder `V4AIR uploads/<application ID>/` under its original name; the sheet holds the link. Deployed 29.09.2026 (script id in `backend/.clasp.json`, sheet id 1dDRwBAy8YIQUQIZDiYjlbabDyJ3ZXbUOfl6sznkQYdc); `public/forms-api.js` points at the `/exec` URL. To change the backend: `clasp --user v4air push`, then `clasp --user v4air redeploy <deploymentId>`.
2. Email: resume link and confirmations are in `backend/Code.gs` and switched off (`EMAIL_ENABLED=false`, `SITE_URL` empty in the script properties) until the copy and sender are confirmed. The nominee invitation is not built. A consumer Gmail account sends to about 100 recipients a day.
3. Admin: counts by country and stage, coverage matrix of "want to learn" versus "could present", nominee list with duplicate detection, export (spec 5.11 and 5.12).
4. Closing at the deadline and the retention cleanup.

## Image credits

Castle gallery photos are CC BY-SA derivatives from Wikimedia Commons; see [ATTRIBUTION.md](ATTRIBUTION.md) for authors and licenses.

## Limitations

- The interior-venue subpage is not built yet; venue mocks are parked under `src/mocks/`
- Event facts (capacity, funding wording) follow the DoMore brief as of August 2026 and must be re-checked before major announcements
