import { useState } from 'react'

const TABS = [
  { id: 'k', label: 'Kutilayotgan' },
  { id: 'd', label: 'Davom etayotgan' },
  { id: 'y', label: 'Yakunlangan' },
]

const BADGE = {
  k: { label: 'Kutilayotgan', cls: 'badge-upcoming' },
  d: { label: 'Davom etayotgan', cls: 'badge-live' },
  y: { label: 'Yakunlangan', cls: 'badge-done' },
}

const CARDS = [
  { s: 'k', img: '/images/chess.jpg', title: 'Shaxmat kubogi', meta: 'Toshkent · 10-noyabr · Yakka', foot: '32 / 64 ishtirokchi', cta: 'Yozilish' },
  { s: 'k', img: '/images/billiards.jpg', title: 'Pirat Cup 2026', meta: '«Pirat» bilyard klubi · 12-noyabr', foot: 'Sovrin: 5 000 000 so‘m', cta: 'Yozilish' },
  { s: 'k', img: '/images/coach-tennis.jpg', title: 'Kuzgi tennis ochiq turniri', meta: '«Olimp» korti · 20-noyabr', foot: '18 / 32 ishtirokchi', cta: 'Yozilish' },
  { s: 'd', img: '/images/marathon.jpg', title: 'Shahar marafoni', meta: 'Samarqand · bugun', foot: '200+ yuguruvchi', cta: 'Jonli natijalar' },
  { s: 'y', img: '/images/basketball-cup.jpg', title: 'Basketbol kubogi', meta: '12 jamoa · 96 ishtirokchi', foot: 'G‘olib: Phoenix', cta: 'Natijalar' },
]

export default function Tournaments() {
  const [tab, setTab] = useState('k')
  const cards = CARDS.filter((c) => c.s === tab)

  return (
    <section className="wrap section stack-32" id="tournaments">
      <div className="section-head">
        <div className="stack-14">
          <span className="ey">Turnirlar</span>
          <h2 className="d h2-lg">Bellashing. Yuting. Tarixda qoling.</h2>
        </div>
        <div className="tabs" role="tablist" aria-label="Turnir holati">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'chip on' : 'chip'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="t-grid" role="tabpanel">
        {cards.map((c) => (
          <a key={c.title} href="#" className="tc">
            <div className="tc-media">
              <img src={c.img} alt={c.title} />
              <span className={`pill tc-badge ${BADGE[c.s].cls}`}>{BADGE[c.s].label}</span>
            </div>
            <div className="tc-body">
              <b className="d tc-title">{c.title}</b>
              <span className="tc-meta">{c.meta}</span>
              <div className="tc-foot">
                <span>{c.foot}</span>
                <span className="tc-cta">{c.cta} →</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="row">
        <a href="#" className="btn bo">Barcha turnirlar</a>
        <a href="#" className="btn btn-ghost">+ O‘z turniringizni o‘tkazing</a>
      </div>
    </section>
  )
}
