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
              Early-career researchers and graduate students from the V4 region, any
              discipline. Master's students, PhD candidates, and postdocs are all
              eligible, and so are researchers recently past the postdoc stage: if
              you're a junior faculty member still building your research, you're
              welcome.
            </p>
            <a className="btn btn-primary" href={APPLY_URL} target="_blank" rel="noopener">
              Apply now
            </a>
            {/* div, not p: the tooltip contains a <ul>, which is invalid inside <p> */}
            <div className="funded-note">
              Applicants from partner universities get accommodation, attendance,
              board, and travel covered.{' '}
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
              <a href={CONTACT_MAILTO}>kutsosp@natur.cuni.cz</a>.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
