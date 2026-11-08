import { Reveal } from './Reveal'

export function Adaptive() {
  return (
    <section className="adaptive" id="adaptive">
      <Reveal className="wrap">
        <h2>How the program is built</h2>
        <div className="cols">
          <div>
            <p>
              There is no fixed program. We build it from the applications, in four
              steps:
            </p>
            <ol className="prog-steps">
              <li>
                We read every application: what you want to learn, what you can offer,
                and who you want to meet.
              </li>
              <li>
                We select participants whose needs and contributions complement each
                other, so that someone who needs a method meets someone who can offer it.
              </li>
              <li>
                Where participants need expertise that no applicant offers, we invite
                speakers and participants who have it.
              </li>
              <li>
                The talks, the workshops and the people you meet all follow from this.
              </li>
            </ol>
            <p className="muted">
              Keynote speakers and a draft program are published in March 2027, the
              final program in April 2027.
            </p>
          </div>
          <div>
            <p>
              Participants come from fields like <strong>history</strong>,{' '}
              <strong>biology</strong>, <strong>medicine</strong>,{' '}
              <strong>linguistics</strong>, <strong>psychology</strong>,{' '}
              <strong>sports science</strong> and <strong>engineering</strong>. They
              use methods like <strong>NLP</strong>, <strong>computer vision</strong>,{' '}
              <strong>machine learning</strong>, <strong>agentic AI</strong> and{' '}
              <strong>statistical modeling</strong>.
            </p>
            <p className="muted">
              There is no CV or motivation letter. Careful answers in the form improve
              your chances and shape what you get out of the three days.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
