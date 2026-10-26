import { useTranslation } from 'react-i18next'
import { Chevron, Globe, Logo, Plus } from './icons.jsx'
import { BOT_URL } from '../data.js'
import { LANGUAGES } from '../i18n.js'

const NAV = [
  { key: 'tournaments', href: '#tournaments' },
  { key: 'organizers', href: '#cta' },
  { key: 'partners', href: '#partners' },
]

export default function Header() {
  const { t, i18n } = useTranslation()
  return (
    <header className="header">
      <div className="wrap header-in">
        <a href="#top" className="logo" aria-label={t('header.home')}><Logo /><span>Charh<b>palak</b></span></a>
        <nav className="nav" aria-label={t('header.nav_label')}>
          {NAV.map((n) => <a key={n.key} href={n.href}>{t(`header.nav.${n.key}`)}</a>)}
        </nav>
        <div className="header-actions">
          <label className="lang">
            <Globe size={18} />
            <select aria-label={t('header.language')} value={i18n.resolvedLanguage} onChange={(e) => i18n.changeLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code} title={l.name}>{l.label}</option>)}
            </select>
            <Chevron size={14} />
          </label>
          <a href={BOT_URL} className="btn btn-line">{t('header.login')}</a>
          <a href={BOT_URL} className="btn btn-lime"><Plus size={18} />{t('header.create')}</a>
        </div>
      </div>
    </header>
  )
}
