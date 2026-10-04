import { Coffee, MessagesSquare, Presentation, Wrench } from 'lucide-react'
import { Reveal } from './Reveal'

const ITEMS = [
  {
    icon: Presentation,
    title: 'You choose the topics',
    body: 'You tell us what you want to learn; that decides the talks and the invited speakers.',
  },
  {
    icon: MessagesSquare,
    title: 'Not-Just-Posters session',
    body: 'For students: present your project while it is still in progress and get feedback from experts. Bring a poster, a prototype, a demo or slides.',
  },
  {
    icon: Wrench,
    title: 'Hands-on workshops',
    body: 'Workshop topics assembled from the interests you bring in your form.',
  },
  {
    icon: Coffee,
    title: 'Unstructured time, on purpose',
    body: 'Everyone lives, eats, and socializes in one place, so the best conversations do not end when the sessions do.',
  },
]

export function FormatGrid() {
  return (
    <section className="format" id="format">
      <Reveal className="wrap">
        <h2>What you can expect</h2>
        <div className="format-grid">
          {ITEMS.map((it) => (
            <div className="format-item" key={it.title}>
              <span className="format-icon" aria-hidden="true">
                <it.icon size={26} strokeWidth={1.8} />
              </span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
