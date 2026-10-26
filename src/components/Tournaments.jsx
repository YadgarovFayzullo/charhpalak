import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Arrow, Calendar, Heart, Image, Pin, SPORT_ICONS, User, Users } from './icons.jsx'
import { BOT_URL, NO_FILTERS, SPORTS, STATUSES, TOURNAMENTS, formatDates } from '../data.js'
import { photo } from '../photos.js'

export default function Tournaments({ filters, setFilters }) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('upcoming')
  const [liked, setLiked] = useState({})
  const [focus, setFocus] = useState(null)

  // Search matches the tournament name in the current language.
  const q = filters.q.trim().toLowerCase()
  const list = TOURNAMENTS.filter((x) => x.status === status
    && (filters.sport === 'all' || x.sport === filters.sport)
    && (!q || t(`tournaments.names.${x.id}`).toLowerCase().includes(q))
    && (!filters.city || x.city === filters.city)
    && (!filters.date || x.end >= filters.date))
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS)

  // "#t-<id>" (hero photos): open the card's tab, clear filters, scroll to it and highlight it.
  useEffect(() => {
    const open = () => {
      const x = TOURNAMENTS.find((c) => `#t-${c.id}` === window.location.hash)
      if (!x || x.status === 'finished') return
      setStatus(x.status)
      setFilters(NO_FILTERS)
      setFocus(x.id)
      requestAnimationFrame(() => document.getElementById(`t-${x.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [setFilters])

  useEffect(() => {
    if (!focus) return
    const id = setTimeout(() => setFocus(null), 2400)
    return () => clearTimeout(id)
  }, [focus])

  return (
    <section className="wrap section" id="tournaments">
      <div className="sports" role="toolbar" aria-label={t('tournaments.sport_label')}>
        {SPORTS.map((s) => {
          const Icon = SPORT_ICONS[s]
          return (
            <button key={s} type="button" className={filters.sport === s ? 'sport on' : 'sport'} aria-pressed={filters.sport === s}
              onClick={() => setFilters({ ...filters, sport: s })}>
              <span className="sport-i"><Icon size={18} /></span>{t(`sports.${s}`)}
            </button>
          )
        })}
      </div>

      <div className="sec-head">
        <h2>{t('tournaments.title')}</h2>
        <div className="seg" role="tablist" aria-label={t('tournaments.status_label')}>
          {STATUSES.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{t(`status.${s}`)}</button>
          ))}
        </div>
      </div>

      <div className="cards">
        {list.map((x) => {
          const name = t(`tournaments.names.${x.id}`)
          return (
            <article key={x.id} id={status === 'finished' ? undefined : `t-${x.id}`} className={focus === x.id ? 'tcard focus' : 'tcard'}>
              <div className="tcard-media">
                <img {...photo(x.img, 420)} loading="lazy" alt={name} />
                <span className={x.status === 'finished' ? 'badge badge-done' : 'badge'}>{t(`status.${x.status}`)}</span>
                <button type="button" className={liked[x.id] ? 'like on' : 'like'} aria-pressed={Boolean(liked[x.id])} aria-label={t('tournaments.save')}
                  onClick={() => setLiked({ ...liked, [x.id]: !liked[x.id] })}><Heart size={16} /></button>
              </div>
              <div className="tcard-body">
                <h3>{name}</h3>
                <span className="format">{x.format === 'singles' ? <User size={14} /> : <Users size={14} />}{t(`format.${x.format}`)}</span>
                <div className="meta">
                  <span><Calendar size={16} />{formatDates(x.start, x.end, i18n.resolvedLanguage)}</span>
                  <span><Pin size={16} />{t(`cities.${x.city}`)}</span>
                </div>
                <div className="tcard-foot">
                  <span className="sponsor"><span className="sponsor-logo"><Image size={16} /></span>{t('tournaments.sponsor')}</span>
                  <a href={BOT_URL} className="btn btn-soft">{t('tournaments.details')} <Arrow size={16} /></a>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {list.length === 0 && (
        <div className="empty">
          {t('tournaments.empty')}
          {filtered && <button type="button" className="btn btn-line" onClick={() => setFilters(NO_FILTERS)}>{t('tournaments.clear')}</button>}
        </div>
      )}
    </section>
  )
}
