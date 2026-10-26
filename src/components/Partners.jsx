import { useTranslation } from 'react-i18next'
import { Arrow, Crown, Gift, Team } from './icons.jsx'
import { PARTNERS, PARTNER_LOGOS } from '../data.js'

const ICONS = { crown: Crown, gift: Gift, team: Team }

// Simple geometric marks standing in for real logos.
const MARKS = {
  circle: <circle cx="12" cy="12" r="8" />,
  bars: <path d="M5 19V9h3v10zM10.5 19V5h3v14zM16 19v-7h3v7z" />,
  drop: <path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z" />,
  hex: <path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9z" />,
  bolt: <path d="M13 2 5 13h5l-1 9 8-11h-5z" />,
  wave: <path d="M2 14c2-3 4-3 6 0s4 3 6 0 4-3 6 0v5H2z" />,
  ring: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fillRule="evenodd" />,
  tri: <path d="M12 3 22 20H2z" />,
}

function Logo({ name, mark }) {
  return (
    <li className="logo-item">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{MARKS[mark]}</svg>
      <span>{name}</span>
    </li>
  )
}

/** Endless logo strip: two identical groups slide left by exactly one group, so the loop is seamless. */
function Marquee({ label }) {
  const group = [...PARTNER_LOGOS, ...PARTNER_LOGOS] // long enough to cover very wide screens
  return (
    <div className="marquee" role="region" aria-label={label}>
      <div className="marquee-track">
        <ul className="marquee-group">{group.map((l, i) => <Logo key={i} {...l} />)}</ul>
        {/* Visual copy for the loop only: hidden from assistive tech and the tab order */}
        <ul className="marquee-group" aria-hidden="true">{group.map((l, i) => <Logo key={i} {...l} />)}</ul>
      </div>
    </div>
  )
}

export default function Partners() {
  const { t } = useTranslation()
  return (
    <section className="wrap section" id="partners">
      <div className="sec-head">
        <h2>{t('partners.title')}</h2>
        <button type="button" className="more">{t('partners.all')} <Arrow size={16} /></button>
      </div>
      <Marquee label={t('partners.strip')} />
      <div className="partners">
        {PARTNERS.map((p) => {
          const Icon = ICONS[p.icon]
          return (
            <div key={p.key} className="partner">
              <Icon size={40} strokeWidth={1.5} />
              <span><b>{t(`partners.${p.key}.title`)}</b><small>{t(`partners.${p.key}.text`)}</small></span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
