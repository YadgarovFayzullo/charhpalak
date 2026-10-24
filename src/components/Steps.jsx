const STEPS = [
  { title: 'Profil yarating', text: 'Sportingiz va darajangizni belgilang, shunda mos sheriklar chiqadi.' },
  { title: 'Sherik toping', text: 'Ochiq o‘yinga qo‘shiling yoki o‘zingiz e’lon bering.' },
  { title: 'Joy bron qiling', text: 'Bo‘sh vaqtni ko‘ring, Click yoki Payme bilan depozit to‘lang.' },
  { title: 'O‘ynang va baholang', text: 'Baholar ishonchli sport profilingizni quradi.' },
]

export default function Steps() {
  return (
    <section className="wrap section stack-36" id="how">
      <div className="section-head">
        <h2 className="d h2">Qanday boshlaysiz?</h2>
        <p className="mu head-note">To‘rt qadam. Ro‘yxatdan o‘tish bir daqiqa oladi, ko‘rish uchun esa umuman shart emas.</p>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <a key={s.title} href="#" className="card step">
            <span className="d step-num">{String(i + 1).padStart(2, '0')}</span>
            <b className="step-title">{s.title}</b>
            <span className="mu step-text">{s.text}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
