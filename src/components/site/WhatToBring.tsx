import { Reveal } from './Reveal'

const ITEMS = [
  {
    title: 'Your problem, in a few sentences',
    body: 'What you are trying to find out, and where you are stuck.',
  },
  {
    title: 'An example of your data',
    body: 'A sample, a screenshot or a figure on your laptop, so a methods expert can see what you work with.',
  },
  {
    title: 'What you are missing',
    body: 'The method or the expertise your project needs.',
  },
  {
    title: 'Students: your unfinished project',
    body: 'For the Not-Just-Posters session: a poster, a prototype, a demo or slides.',
  },
]

export function WhatToBring() {
  return (
    <section className="format" id="bring">
      <Reveal className="wrap">
        <h2>What to bring</h2>
        <p className="bring-lede">You don&rsquo;t need a polished talk. A real problem is enough.</p>
        <div className="format-list">
          {ITEMS.map((it) => (
            <div className="format-item" key={it.title}>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
