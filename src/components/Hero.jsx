import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bars, Calendar, Pin, Search, Shield, Trophy, Users } from './icons.jsx'
import Select from './Select.jsx'
import { CITIES, SPORTS } from '../data.js'
import { photo } from '../photos.js'

// Diagonal photo strips; each opens the matching tournament card below.
const STRIPS = [
  { img: 'heroTennis', id: 'tennis-open' },
  { img: 'heroSwim', id: 'suzish-kubogi' },
  { img: 'heroChess', id: 'shaxmat-kubogi' },
]

const PERKS = [
  { Icon: Trophy, key: 'more' },
  { Icon: Users, key: 'community' },
  { Icon: Bars, key: 'results' },
  { Icon: Shield, key: 'platform' },
]

export default function Hero({ filters, onSearch }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(filters)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    onSearch(form)
    document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" id="top">
      <div className="hero-photos">
        {STRIPS.map((s, i) => (
          <a key={s.img} href={`#t-${s.id}`} className={`strip strip-${i}`} aria-label={t(`tournaments.names.${s.id}`)}>
            <img {...photo(s.img, 420)} fetchpriority={i === 0 ? 'high' : undefined} alt="" />
          </a>
        ))}
      </div>

      <div className="wrap hero-in">
        <h1 className="hero-title">
          {t('hero.title_1')}<br /><span className="lime">{t('hero.title_2')}</span>
        </h1>
        <p className="hero-lead">{t('hero.lead')}</p>

        <form className="search" onSubmit={submit} role="search">
          <label className="field field-q">
            <Search />
            <input value={form.q} onChange={set('q')} placeholder={t('hero.search_placeholder')} aria-label={t('hero.search_label')} />
          </label>
          <Select
            label={t('hero.sport_label')}
            value={form.sport}
            emptyValue="all"
            onChange={(sport) => setForm({ ...form, sport })}
            options={SPORTS.map((s) => ({ value: s, label: s === 'all' ? t('hero.all_sports') : t(`sports.${s}`) }))}
          />
          <Select
            label={t('hero.city_label')}
            icon={<Pin />}
            value={form.city}
            onChange={(city) => setForm({ ...form, city })}
            options={[{ value: '', label: t('hero.city_placeholder') }, ...CITIES.map((c) => ({ value: c, label: t(`cities.${c}`) }))]}
          />
          <label className="field field-date">
            <Calendar />
            <input type="date" value={form.date} onChange={set('date')} aria-label={t('hero.date_label')} />
            {!form.date && <span className="ph">{t('hero.date_placeholder')}</span>}
          </label>
          <button type="submit" className="btn btn-lime btn-search"><Search />{t('hero.submit')}</button>
        </form>

        <ul className="perks">
          {PERKS.map(({ Icon, key }) => <li key={key}><Icon />{t(`hero.perks.${key}`)}</li>)}
        </ul>
      </div>
    </section>
  )
}
