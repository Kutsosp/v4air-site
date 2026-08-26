import { NumbersFlipMock } from './NumbersFlipMock'
import { AdaptiveDemoMock } from './AdaptiveDemoMock'
import { CorridorWalkMock } from './CorridorWalkMock'
import {
  SeventyTwoHoursMock,
  DossierMock,
  GroundPlanMock,
  CinematicChaptersMock,
  ThenNowMock,
  CorridorMock,
  NightfallMock,
} from './VenueDirectionsMocks'

function Label({ children }: { children: string }) {
  return (
    <div className="wrap py-6">
      <p className="mb-0 inline-block rounded-md border border-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">
        MOCK: {children}
      </p>
    </div>
  )
}

/* Preview gallery for section reworks: open http://localhost:5174/?mocks */
export function MocksPage() {
  return (
    <main className="pt-10">
      <div className="wrap">
        <h1 className="text-3xl">Section mocks</h1>
        <p className="muted">
          Scroll through; each variant is labeled. Nothing here is on the real page
          yet.
        </p>
      </div>

      <Label>countdown band, both states (Watermelon flip-clock + MP text-shimmer)</Label>
      <NumbersFlipMock />

      <Label>adaptive: answer-to-programme demo (MP transition-panel)</Label>
      <AdaptiveDemoMock />

      <Label>venue COMPOSITE: the corridor walk — pinned horizontal (photos + numeral walls + then/now + nightfall)</Label>
      <CorridorWalkMock />

      <Label>venue direction 1: 72 hours — the resident's timeline</Label>
      <SeventyTwoHoursMock />

      <Label>venue direction 2: the dossier — archival plates</Label>
      <DossierMock />

      <Label>venue direction 3: the ground plan — silhouette hotspots (MP transition-panel, Watermelon card)</Label>
      <GroundPlanMock />

      <Label>venue direction 4: cinematic chapters — full-bleed + type interludes</Label>
      <CinematicChaptersMock />

      <Label>venue direction 5: then/now — comparison slider (MP image-comparison)</Label>
      <ThenNowMock />

      <Label>venue direction 6: the corridor — horizontal hung gallery</Label>
      <CorridorMock />

      <Label>venue direction 7: nightfall — scroll-driven dusk</Label>
      <NightfallMock />

      <div className="h-32" />
    </main>
  )
}
