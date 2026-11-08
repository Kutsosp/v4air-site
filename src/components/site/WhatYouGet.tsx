import { Reveal } from './Reveal'

const FOR_ALL = [
  {
    title: 'Ideas from other fields',
    body: 'You see how researchers in other fields use AI methods, and how those methods could work on your own problems.',
  },
  {
    title: 'Collaborators who know the methods',
    body: 'You meet people from other fields who specialize in the methods you need.',
  },
]

export function WhatYouGet() {
  return (
    <section className="format" id="get">
      <Reveal className="wrap">
        <h2>What you get from the three days</h2>
        <div className="format-list">
          {FOR_ALL.map((it) => (
            <div className="format-item" key={it.title}>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </div>
          ))}
        </div>
        <div className="stage-cols">
          <p className="stage-lead">If you are&hellip;</p>
          <div className="stage-grid">
            <div className="stage-col">
              <h3>an early-career researcher</h3>
              <ul>
                <li>Find a methods expert for your next grant</li>
                <li>Meet grant partners from universities in Czechia, Hungary, Poland and Slovakia</li>
                <li>Recruit PhD and master&rsquo;s students for your group</li>
                <li>Get feedback on a project while it is still in progress</li>
              </ul>
            </div>
            <div className="stage-col">
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
