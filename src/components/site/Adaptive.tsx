import { Reveal } from './Reveal'

export function Adaptive() {
  return (
    <section className="adaptive" id="adaptive">
      <Reveal className="wrap">
        <h2>The program adapts to you, not the other way around.</h2>
        <div className="cols">
          <div>
            <p>
              V4AIR is a participant-first adaptive conference. The application form
              asks what you work on, what you want to learn, and who you would like
              to meet.
            </p>
            <p className="muted">
              You choose the talks, the workshops, the speakers, and the people
              you meet.
            </p>
          </div>
          <div>
            <p className="muted">
              Selection is based on fit and mix, not first-come-first-served. Filling
              in the form carefully is the best thing you can do for your chances,
              and for your experience once you are there.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
