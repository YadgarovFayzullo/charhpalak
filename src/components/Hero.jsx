import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Pin, Search } from './icons.jsx'
import BannerSlider from './BannerSlider.jsx'
import Select from './Select.jsx'
import { CITIES, NO_FILTERS, SPORTS } from '../data.js'

export default function Hero({ filters, onSearch }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(filters)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const dirty = Object.keys(NO_FILTERS).some((k) => form[k] !== NO_FILTERS[k] || filters[k] !== NO_FILTERS[k])
  const reset = () => { setForm(NO_FILTERS); onSearch(NO_FILTERS) }

  const submit = (e) => {
    e.preventDefault()
    onSearch(form)
    document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" id="top">
      <BannerSlider />

      <div className="wrap search-wrap">
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
          {dirty && <button type="button" className="btn btn-reset" onClick={reset}>{t('hero.reset')}</button>}
          <button type="submit" className="btn btn-lime btn-search"><Search />{t('hero.submit')}</button>
        </form>
      </div>
    </section>
  )
}
