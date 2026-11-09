import { Reveal } from './Reveal'

/* 09.11.2026: pricing line (homepage section 6 in the redesign doc). The fee notes moved here from
   "Should you apply?" (reviewer: they read like disclaimers next to the Apply button). */
export function CostLine() {
  return (
    <section className="format cost-line" id="cost">
      <Reveal className="wrap">
        <h2>Pricing</h2>
        {/* div, not p: the tooltip contains a <ul>, which is invalid inside <p> */}
        <div className="funded-note">
          Applicants from partner universities pay no fee: accommodation, meals and
          a travel contribution are paid by the International Visegrad Fund.{' '}
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
          Applicants from other universities can apply too, for a fee. Use the same form.
        </p>
        <p className="cost-link">
          <a href={`${import.meta.env.BASE_URL}pricing/`}>See the prices &rarr;</a>
        </p>
      </Reveal>
    </section>
  )
}
