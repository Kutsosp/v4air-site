import { Reveal } from './Reveal'

const ITEMS = [
  {
    title: 'You choose the topics',
    body: 'You tell us what you want to learn; that decides the talks and the invited speakers.',
  },
  {
    title: 'Not-Just-Posters session',
    body: 'For students: present your project while it is still in progress and get feedback from experts. Bring a poster, a prototype, a demo or slides.',
  },
  {
    title: 'Hands-on workshops',
    body: 'Workshop topics assembled from the interests you bring in your form.',
  },
  {
    title: 'Unstructured time, on purpose',
    body: 'Everyone lives, eats, and socializes in one place, so the best conversations do not end when the sessions do.',
  },
]

export function FormatGrid() {
  return (
    <section className="format" id="format">
      <Reveal className="wrap">
        <h2>What you can expect</h2>
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
