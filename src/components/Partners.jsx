const ROLES = [
  { title: 'Tashkilotchi', text: 'Istalgan sportda turnir o‘tkazing, ishtirokchi yig‘ing.' },
  { title: 'Mezbon klub', text: 'Turnir orqali yangi auditoriyani zalingizga olib keling.' },
  { title: 'Homiy', text: 'Brendingiz turnir sahifasida va zallarda.' },
]

export default function Partners() {
  return (
    <section className="partners">
      <div className="wrap partners-grid">
        <div className="stack-8">
          <span className="ey ey-ink">Hamkorlik</span>
          <h2 className="d h2-sm">Sportni birga rivojlantiramiz.</h2>
        </div>
        {ROLES.map((r) => (
          <a key={r.title} href="#" className="role">
            <b>{r.title} →</b>
            <span>{r.text}</span>
          </a>
        ))}
        <a href="#" className="btn bd partners-btn">Hamkor bo‘lish</a>
      </div>
    </section>
  )
}
