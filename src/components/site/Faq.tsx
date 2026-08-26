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
    a: 'Around 45 funded places for selected participants from the V4 region, plus a limited number of additional seats for a small fee.',
  },
  {
    id: 'faq-selection',
    q: 'How are participants selected?',
    a: 'By fit and mix, not first-come-first-served. There is no CV and no motivation letter; the core of your application is reviewed institution-blind, so what you write matters more than where you are from.',
  },
  {
    id: 'faq-nominated',
    q: 'I was nominated by my institution. Do I still apply?',
    a: 'Yes. Everyone fills in the same application form, nominated or not; the form simply asks who nominated you. A nomination gets you noticed, not selected.',
  },
  {
    id: 'faq-attendance',
    q: 'Do I have to attend the whole three days?',
    a: 'Yes, we expect you there from Wednesday midday to Friday evening. The event is built on everyone living, eating, and working in one place; day visits would break exactly the thing that makes it work.',
  },
  {
    id: 'faq-language',
    q: 'What language is everything in?',
    a: 'English, throughout.',
  },
  {
    id: 'faq-getting-there',
    q: 'Where is Kostelec and how do I get there?',
    a: 'Kostelec nad Černými lesy is about 30 minutes from Prague. Accepted participants receive full travel instructions with their acceptance.',
  },
  {
    id: 'faq-early-career',
    q: 'Who counts as "early-career"?',
    a: "Master's students, PhD candidates, and postdocs, read generously. Recently past the postdoc stage, say a new assistant professor still early in building a group? You're welcome too. If you are unsure, apply.",
  },
  {
    id: 'faq-non-v4',
    q: "I'm not at a V4 partner institution. Can I still come?",
    a: 'Yes. A limited number of seats, on top of the funded places, are open to participants from other institutions for a small fee. Apply the same way; we will contact you about the details.',
  },
  {
    id: 'faq-no-talk',
    q: 'Do I need a paper, poster, or finished talk to apply?',
    a: 'No. Ideas, perspectives, and works-in-progress are welcome, and projects that failed or got stuck are first-class material here. If you are selected, we shape your contribution together.',
  },
  {
    id: 'faq-recording',
    q: 'Will my talk be recorded or published?',
    a: 'A shared repository of recorded talks, slides, and example code goes public after the conference; you can opt out of having your material included. Selected student works are published in the conference proceedings with a DOI.',
  },
  {
    id: 'faq-afterwards',
    q: 'What happens after the three days?',
    a: 'Selected attendees are invited to join an invitation-only network of early-career researchers and industry veterans, built to carry the connections forward. For whoever stays, there is an optional self-funded guided Prague walkthrough on Saturday 1 May.',
  },
  {
    id: 'faq-contact',
    q: 'I have an idea, I want to collaborate, or I have another question.',
    a: (
      <>
        We want to hear it. Write to <a href={CONTACT_MAILTO}>kutsosp@natur.cuni.cz</a>;
        ideas, collaboration offers, and questions all land with the organizing team
        directly.
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
