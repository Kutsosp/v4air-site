import { Reveal } from './Reveal'

/* 09.11.2026 (redesign doc point 3): the animation moved to /programme/; the homepage keeps the idea in three sentences */
export function ProgramTeaser() {
  return (
    <section className="format program-teaser" id="adaptive">
      <Reveal className="wrap">
        <h2>The program</h2>
        <div className="teaser-text">
          <p>At a typical conference, you sit through talks that have little to do with your work.</p>
          <p>At V4AIR, the program adapts to you instead. The talks and workshops are chosen to address your specific problem.</p>
        </div>
        <p className="cost-link">
          <a href={`${import.meta.env.BASE_URL}programme/`}>See how we fit the program to you &rarr;</a>
        </p>
      </Reveal>
    </section>
  )
}
