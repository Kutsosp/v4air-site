import { Reveal } from './Reveal'

const FOR_ALL = [
  {
    title: 'Ideas from other fields',
    body: 'You see how researchers in other fields use AI methods, and how those methods could work on your own problems.',
  },
  {
    title: 'Experts in the methods you need',
    body: 'You meet researchers from other fields who already use these methods and could work with you.',
  },
]

export function WhatYouGet() {
  return (
    <section className="format" id="get">
      <Reveal className="wrap">
        <h2>What you&rsquo;ll take home</h2>
        {/* 09.11.2026: the two outcomes as plain text; the audience columns below are the cards */}
        <div className="get-text">
          {FOR_ALL.map((it) => (
            <p key={it.title}>
              <strong>{it.title}.</strong> {it.body}
            </p>
          ))}
        </div>
        <div className="stage-cols">
          <p className="stage-lead">If you are&hellip;</p>
          <div className="stage-grid lay-cards">
            <div className="stage-col lay-card">
              <h3>an early-career researcher</h3>
              <ul>
                <li>Find a methods expert for your next grant</li>
                <li>Meet grant partners from universities in Czechia, Hungary, Poland and Slovakia</li>
                <li>Recruit PhD and master&rsquo;s students for your group</li>
                <li>Get feedback on a project while it is still in progress</li>
              </ul>
            </div>
            <div className="stage-col lay-card">
              <h3>a PhD or master&rsquo;s student</h3>
              <ul>
                <li>Get feedback from experts in the Not-Just-Posters session</li>
                <li>Find a supervisor or mentor</li>
                <li>Line up your next position: a PhD place or a postdoc</li>
                <li>Practise a method hands-on in the workshops</li>
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
