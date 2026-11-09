/* 09.11.2026: the full FAQ moved to /faq/ (redesign doc point 3); the homepage keeps one link line */
export function FaqLink() {
  return (
    <section className="faq-link" id="faq">
      <div className="wrap">
        <p className="cost-link">
          <a href={`${import.meta.env.BASE_URL}faq/`}>Questions? Read the FAQ &rarr;</a>
        </p>
      </div>
    </section>
  )
}
