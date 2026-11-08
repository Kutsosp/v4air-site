import { Reveal } from './Reveal'

const ITEMS = [
  {
    title: 'Not-Just-Posters: a session for projects that don’t fit slides',
    body: 'Students show a poster, a prototype, a physical object or an interactive demo, and get feedback from experts.',
  },
  {
    title: 'Hands-on workshops',
    body: 'Practical workshops on topics taken from the interests participants list in the application form.',
  },
  {
    title: 'Free time to talk',
    body: 'Everyone stays and eats within a few minutes’ walk of each other, so conversations continue after the sessions end.',
  },
]

export function FormatGrid() {
  return (
    <section className="format" id="format">
      <Reveal className="wrap">
        <h2>What happens during the three days</h2>
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
