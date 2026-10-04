import { Reveal } from './Reveal'

export function Adaptive() {
  return (
    <section className="adaptive" id="adaptive">
      <Reveal className="wrap">
        <h2>Meet your next collaborators</h2>
        <div className="cols">
          <div>
            <p>
              In your application, you tell us what expertise your project is missing
              and who you want to meet, and we invite people who match. Early-career
              researchers find collaborators, team members and expert advice, and talk
              to people from industry. Students find mentors and research positions
              and get feedback on their ideas.
            </p>
            <p className="muted">
              The talks, the workshop topics, the invited speakers and the sessions are
              all chosen to fit your answers.
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
