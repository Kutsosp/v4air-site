import { InView } from '@/components/motion-primitives/in-view'
import { TextLoop } from '@/components/motion-primitives/text-loop'
import { APPLY_URL, CONTACT_MAILTO, Reveal } from './Reveal'

/* X and Y rotate as matched pairs so the sentence always makes sense */
const PAIRS: Array<[string, string]> = [
  ['a biologist training models on field data', 'your daily tool'],
  ['a sociologist studying how people use chatbots', 'your research subject'],
  ['a PhD student building new architectures', 'your whole field'],
  ['a linguist probing what models learn', 'your object of study'],
  ['an economist forecasting with neural nets', 'your unfair advantage'],
  ['a historian mining digitized archives', 'your reading assistant'],
  ['a medical researcher classifying scans', 'your second opinion'],
  ['a chemist screening candidate molecules', 'your lab partner'],
  ['a lawyer-to-be studying algorithmic decisions', 'your case study'],
  ["a master's student who just met LLMs", 'your next step'],
]

const LOOP_TRANSITION = { duration: 0.45, ease: [0.65, 0, 0.35, 1] as const }
const LOOP_INTERVAL = 2.6

export function Who() {
  return (
    <section className="who" id="who">
      <div className="wrap">
        <Reveal>
          <h2 className="who-q">Should you apply?</h2>
          {/* div, not p: TextLoop renders block elements, which break out of a <p> */}
          <div className="who-doubt">
            Well&hellip; if you're{' '}
            <TextLoop className="slot-loop" interval={LOOP_INTERVAL} transition={LOOP_TRANSITION}>
              {PAIRS.map(([x]) => (
                <span key={x}>{x}</span>
              ))}
            </TextLoop>
            <br />
            and AI is{' '}
            <TextLoop className="slot-loop" interval={LOOP_INTERVAL} transition={LOOP_TRANSITION}>
              {PAIRS.map(([, y], k) => (
                <span key={k}>{y}</span>
              ))}
            </TextLoop>
            &hellip;
          </div>
        </Reveal>
        {/* staggered reveal: Then -> Yes (slow rise, short delay) -> the rest */}
        <div className="who-yes">
          <Reveal delay={0.1}>
            <div className="who-doubt who-then">Then&hellip;</div>
          </Reveal>
          <InView
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            viewOptions={{ once: true, amount: 0.35 }}
          >
            <span className="yes">Yes.</span>
          </InView>
          <Reveal delay={0.8}>
            <p className="yes-line">We want you at V4AIR.</p>
          </Reveal>
          <Reveal delay={1}>
            <p>
              If AI is part of your research, apply, whatever your field. You don't
              have to build AI to belong here. Master's and PhD students, postdocs and
              researchers still early in building a group can all apply.
            </p>
            <a className="btn btn-primary" href={APPLY_URL}>
              Apply now
            </a>
            {/* div, not p: the tooltip contains a <ul>, which is invalid inside <p> */}
            <div className="funded-note">
              Applicants from partner universities pay no fee: accommodation, meals and
              a travel contribution are covered.{' '}
              <span className="partner-q" tabIndex={0}>
                Is my university a partner?
                {/* spans styled as a list: real <ul> is invalid inside inline markup */}
                <span className="partner-tip" role="tooltip">
                  <strong>The six partner universities</strong>
                  <span className="tip-li">Charles University, Prague</span>
                  <span className="tip-li">Czech Technical University in Prague</span>
                  <span className="tip-li">Comenius University Bratislava</span>
                  <span className="tip-li">E&ouml;tv&ouml;s Lor&aacute;nd University, Budapest</span>
                  <span className="tip-li">University of Wroc&#322;aw</span>
                  <span className="tip-li">Nicolaus Copernicus University in Toru&#324;</span>
                </span>
              </span>
            </div>
            <p className="funded-note">
              Applicants from outside partner universities are welcome to apply for a
              small fee. If that&rsquo;s you, contact{' '}
              <a href={CONTACT_MAILTO}>info@v4air.eu</a>.
            </p>
            <p className="funded-note">
              <strong>Not in academia?</strong> If you work with AI in a company, a
              startup, tech transfer or investment, apply through the same form, as a
              participant or as a speaker.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
