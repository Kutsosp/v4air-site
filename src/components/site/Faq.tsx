import { useEffect, useRef, useState } from 'react'
import { CONTACT_MAILTO, Reveal } from './Reveal'

const ITEMS: Array<{ id: string; q: string; a: React.ReactNode }> = [
  {
    id: 'faq-funding',
    q: 'What does "fully funded" actually cover?',
    a: 'Everything essential: accommodation at the castle, board for the whole three days, and a contribution toward travel scaled by the distance of your institution. Funding comes from the International Visegrad Fund.',
  },
  {
    id: 'faq-places',
    q: 'How many places are there?',
    a: 'Funded places go to selected participants from the V4 region, plus a limited number of additional seats for a fee.',
  },
  {
    id: 'faq-selection',
    q: 'How are participants selected?',
    a: 'Based on your answers in the application form. We select people whose needs fit the event and who together make a good mix. There is no CV or motivation letter, and the order of applications does not matter.',
  },
  {
    id: 'faq-nominated',
    q: 'I was nominated by my institution. Do I still apply?',
    a: 'Yes. Everyone fills in the same application form, nominated or not; the form simply asks who nominated you. A nomination gets you noticed, not selected.',
  },
  {
    id: 'faq-attendance',
    q: 'Do I have to attend the whole three days?',
    a: 'Yes, from Wednesday midday to Friday evening (28-30 April 2027). The program depends on everyone staying together for the whole time, so day visits are not possible.',
  },
  {
    id: 'faq-language',
    q: 'What language is everything in?',
    a: 'English, throughout.',
  },
  {
    id: 'faq-getting-there',
    q: 'Where is Kostelec and how do I get there?',
    a: 'Kostelec nad Černými lesy is about 45 minutes from Prague. Fly into Prague (Václav Havel Airport), take the metro to Háje (line C), and a direct bus takes you to Kostelec. From the airport, allow two to two and a half hours. Accepted participants receive full travel instructions with their acceptance.',
  },
  {
    id: 'faq-access',
    q: 'Is the castle accessible?',
    a: (
      <>
        Kostelec is a Renaissance castle with stairs. If you have access needs of any kind,
        write to the organizers at <a href={CONTACT_MAILTO}>info@v4air.eu</a> before you
        apply and we will look for a solution together. This has no bearing on selection.
      </>
    ),
  },
  {
    id: 'faq-early-career',
    q: 'Who counts as "early-career"?',
    a: "Master’s students, PhD candidates and postdocs. Researchers just past the postdoc stage, for example a new assistant professor starting a research group, are welcome too. If you are unsure, apply.",
  },
  {
    id: 'faq-non-v4',
    q: 'My university is not a partner. Can I still come?',
    a: (
      <>
        Yes. A limited number of paid places are open to people from other institutions. The fees are
        on the <a href={`${import.meta.env.BASE_URL}pricing/`}>prices page</a>. Apply through the same form.
      </>
    ),
  },
  {
    id: 'faq-no-talk',
    q: 'Do I need a paper, poster, or finished talk to apply?',
    a: 'No. Ideas and unfinished projects are welcome, and so are projects that failed or got stuck. If you are selected, we plan your part together.',
  },
  {
    id: 'faq-recording',
    q: 'Will my talk be recorded or published?',
    a: 'We plan to share talks, slides, and example code among participants after the meetup; you can opt out of having your material included. Details come with your acceptance.',
  },
  {
    id: 'faq-afterwards',
    q: 'What happens after the three days?',
    a: 'Follow-up activities for participants are being planned so that the connections made over the three days continue. Details come during the meetup.',
  },
  {
    id: 'faq-contact',
    q: 'I have an idea, I want to collaborate, or I have another question.',
    a: (
      <>
        We want to hear it. Write to <a href={CONTACT_MAILTO}>info@v4air.eu</a>;
        ideas, collaboration offers, and questions all go straight to the organizing
        team.
      </>
    ),
  },
]

export function Faq() {
  const [allOpen, setAllOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  /* deep links: #faq-xyz opens that question and scrolls to it */
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const openFromHash = () => {
      const id = location.hash.slice(1)
      if (!id) return
      const d = document.getElementById(id)
      if (d && d.tagName === 'DETAILS' && list.contains(d)) {
        ;(d as HTMLDetailsElement).open = true
        d.scrollIntoView({ block: 'center' })
      }
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  const toggleAll = () => {
    const expand = !allOpen
    listRef.current
      ?.querySelectorAll<HTMLDetailsElement>('details')
      .forEach((d) => (d.open = expand))
    setAllOpen(expand)
  }

  const onToggle = (id: string, open: boolean) => {
    /* keep the URL shareable without history spam */
    if (open) history.replaceState(null, '', `#${id}`)
    else if (location.hash === `#${id}`)
      history.replaceState(null, '', location.pathname + location.search)
  }

  return (
    <section className="faq" id="faq">
      <Reveal className="wrap">
        <div className="faq-head">
          <h2>Questions, answered</h2>
          <button className="expand-all" aria-expanded={allOpen} onClick={toggleAll}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="faq-list" ref={listRef}>
          {ITEMS.map((it) => (
            <details
              id={it.id}
              key={it.id}
              onToggle={(e) => onToggle(it.id, (e.target as HTMLDetailsElement).open)}
            >
              <summary>{it.q}</summary>
              <div className="faq-a">
                <p>{it.a}</p>
              </div>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
