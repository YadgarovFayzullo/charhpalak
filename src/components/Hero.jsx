import { useState } from 'react'
import { Bars, Calendar, Pin, Search, Shield, Trophy, Users } from './icons.jsx'
import { CITIES, SPORTS } from '../data.js'
import { photo } from '../photos.js'

// Diagonal photo strips; each opens the matching tournament card below.
const STRIPS = [
  { img: 'heroTennis', alt: 'Tennis turniri', href: '#t-tennis-open' },
  { img: 'heroSwim', alt: 'Suzish kubogi', href: '#t-suzish-kubogi' },
  { img: 'heroChess', alt: 'Shaxmat kubogi', href: '#t-shaxmat-kubogi' },
]

const PERKS = [
  { Icon: Trophy, label: 'Ko‘proq turnirlar' },
  { Icon: Users, label: 'Faol sport hamjamiyati' },
  { Icon: Bars, label: 'Shaffof natijalar' },
  { Icon: Shield, label: 'Barchasi bir platformada' },
]

export default function Hero({ filters, onSearch }) {
  const [form, setForm] = useState(filters)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    onSearch(form)
    document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" id="top">
      <div className="hero-photos" aria-hidden="false">
        {STRIPS.map((s, i) => (
          <a key={s.img} href={s.href} className={`strip strip-${i}`} aria-label={s.alt}>
            <img {...photo(s.img, 420)} fetchpriority={i === 0 ? 'high' : undefined} alt="" />
          </a>
        ))}
      </div>

      <div className="wrap hero-in">
        <h1 className="hero-title">
          Sizning sportingiz.<br /><span className="lime">Sizning turniringiz.</span>
        </h1>
        <p className="hero-lead">Turnir toping, bellashuvlarni kuzating va natijalar tarixini ko‘ring.</p>

        <form className="search" onSubmit={submit} role="search">
          <label className="field field-q">
            <Search />
            <input value={form.q} onChange={set('q')} placeholder="Turnir qidirish" aria-label="Turnir qidirish" />
          </label>
          <label className="field">
            <select value={form.sport} onChange={set('sport')} aria-label="Sport turi">
              {SPORTS.map((s) => <option key={s.id} value={s.id}>{s.id === 'all' ? 'Barcha sport turlari' : s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <Pin />
            <select value={form.city} onChange={set('city')} aria-label="Shahar">
              <option value="">Shahar yoki onlayn</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field field-date">
            <Calendar />
            <input type="date" value={form.date} onChange={set('date')} aria-label="Sana" />
            {!form.date && <span className="ph">Sana</span>}
          </label>
          <button type="submit" className="btn btn-lime btn-search"><Search />Qidirish</button>
        </form>

        <ul className="perks">
          {PERKS.map(({ Icon, label }) => <li key={label}><Icon />{label}</li>)}
        </ul>
      </div>
    </section>
  )
}
