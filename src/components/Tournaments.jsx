import { useEffect, useState } from 'react'
import { Arrow, Calendar, Heart, Image, Pin, SPORT_ICONS, User, Users } from './icons.jsx'
import { BOT_URL, NO_FILTERS, SPORTS, STATUSES, TOURNAMENTS } from '../data.js'
import { photo } from '../photos.js'

function matches(t, f) {
  const q = f.q.trim().toLowerCase()
  return (f.sport === 'all' || t.sport === f.sport)
    && (!q || t.title.toLowerCase().includes(q))
    && (!f.city || t.city === f.city)
    && (!f.date || t.date >= f.date)
}

export default function Tournaments({ filters, setFilters }) {
  const [status, setStatus] = useState('upcoming')
  const [liked, setLiked] = useState({})
  const [focus, setFocus] = useState(null)
  const list = TOURNAMENTS.filter((t) => t.status === status && matches(t, filters))
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS)

  // "#t-<id>" (hero photos): open the card's tab, clear filters, scroll to it and highlight it.
  useEffect(() => {
    const open = () => {
      const t = TOURNAMENTS.find((c) => `#t-${c.id}` === window.location.hash)
      if (!t || t.status === 'finished') return
      setStatus(t.status)
      setFilters(NO_FILTERS)
      setFocus(t.id)
      requestAnimationFrame(() => document.getElementById(`t-${t.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [setFilters])

  useEffect(() => {
    if (!focus) return
    const t = setTimeout(() => setFocus(null), 2400)
    return () => clearTimeout(t)
  }, [focus])

  return (
    <section className="wrap section" id="tournaments">
      <div className="sports" role="toolbar" aria-label="Sport turi">
        {SPORTS.map((s) => {
          const Icon = SPORT_ICONS[s.id]
          return (
            <button key={s.id} type="button" className={filters.sport === s.id ? 'sport on' : 'sport'} aria-pressed={filters.sport === s.id}
              onClick={() => setFilters({ ...filters, sport: s.id })}>
              <span className="sport-i"><Icon size={18} /></span>{s.label}
            </button>
          )
        })}
      </div>

      <div className="sec-head">
        <h2>O‘zingizga mos turnirni toping</h2>
        <div className="seg" role="tablist" aria-label="Turnir holati">
          {STATUSES.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={status === s.id} className={status === s.id ? 'on' : ''} onClick={() => setStatus(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="cards">
        {list.map((t) => (
          <article key={t.id} id={status === 'finished' ? undefined : `t-${t.id}`} className={focus === t.id ? 'tcard focus' : 'tcard'}>
            <div className="tcard-media">
              <img {...photo(t.img, 420)} loading="lazy" alt={t.title} />
              <span className={t.status === 'finished' ? 'badge badge-done' : 'badge'}>{STATUSES.find((s) => s.id === t.status).label}</span>
              <button type="button" className={liked[t.id] ? 'like on' : 'like'} aria-pressed={Boolean(liked[t.id])} aria-label="Saqlash"
                onClick={() => setLiked({ ...liked, [t.id]: !liked[t.id] })}><Heart size={16} /></button>
            </div>
            <div className="tcard-body">
              <h3>{t.title}</h3>
              <span className="format">{t.format === 'Individual' ? <User size={14} /> : <Users size={14} />}{t.format}</span>
              <div className="meta"><span><Calendar size={16} />{t.dates}</span><span><Pin size={16} />{t.city}</span></div>
              <div className="tcard-foot">
                <span className="sponsor"><span className="sponsor-logo"><Image size={16} /></span>Homiy</span>
                <a href={BOT_URL} className="btn btn-soft">Batafsil <Arrow size={16} /></a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && (
        <div className="empty">
          Bu filtr bo‘yicha turnir topilmadi.
          {filtered && <button type="button" className="btn btn-line" onClick={() => setFilters(NO_FILTERS)}>Filtrlarni tozalash</button>}
        </div>
      )}
    </section>
  )
}
