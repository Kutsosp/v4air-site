import { Reveal } from './Reveal'

export function NotAiResearcher() {
  return (
    <section className="adaptive" id="not-ai">
      <Reveal className="wrap">
        <h2>&ldquo;But I&rsquo;m not an AI researcher&rdquo;</h2>
        <div className="cols">
          <div>
            <p>
              You don&rsquo;t need to be. At V4AIR, &ldquo;AI researchers&rdquo; means
              researchers in any field who use AI in their research. Your questions
              come from your own field, and AI is one of the methods you use to answer
              them.
            </p>
            <p>
              A historian working through thousands of archival documents belongs here
              as much as a computer scientist. So does a sports scientist using pose
              estimation to give young players feedback.
            </p>
          </div>
          <div>
            <p>
              If you analyze qualitative data, such as interviews, texts or archives,
              large language models are a tool worth knowing. You don&rsquo;t need to
              build them to use them well.
            </p>
            <p className="muted">
              At the meetup you work with people who specialize in the methods you
              need, so you can bring the problem and leave with a way to approach it.
            </p>
            <p>
              <strong>Not in academia?</strong> If you work with AI in a company, a
              startup, tech transfer or investment, apply through the same form, as a
              participant or as a speaker.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
