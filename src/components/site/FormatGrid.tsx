import { Reveal } from './Reveal'

const ITEMS: { title: string; sub?: string; body: string }[] = [
  {
    title: 'Talks',
    body: 'Invited experts and participants talk about their work. The topics are chosen from what you write in your applications.',
  },
  {
    title: 'Workshops',
    body: 'Practical sessions on the methods participants ask for in the application form.',
  },
  {
    title: 'Not-Just-Posters session',
    sub: 'For projects that don’t fit slides',
    body: 'Students show a poster, a prototype, a physical object or an interactive demo, and get feedback from experts.',
  },
  {
    title: 'Free time to talk',
    body: 'Everyone stays and eats within a few minutes’ walk of each other, so conversations continue after the sessions end.',
  },
  {
    title: 'Evenings at the castle',
    body: 'A welcome dinner on 28 April, a guided tour of the castle, and a gala dinner with beer tasting and a museum tour on 29 April at the National Museum of Brewing, the town brewery six minutes’ walk from the castle.',
  },
]

export function FormatGrid() {
  return (
    <section className="format" id="format">
      <Reveal className="wrap">
        <h2>What you can expect</h2>
        {/* 09.11.2026: layout B, list where heading and text read as one sentence */}
        <ul className="lay-list">
          {ITEMS.map((it) => (
            <li key={it.title}>
              <p>
                <strong>{it.title}.</strong>{' '}
                {it.sub && <span className="sub">{it.sub}.</span>}{it.sub && ' '}
                <span className="rest">{it.body}</span>
              </p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
