import { useTranslation } from 'react-i18next'
import { Globe, Logo, Plus } from './icons.jsx'
import Select from './Select.jsx'
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
          <Select
            variant="lang"
            align="end"
            label={t('header.language')}
            icon={<Globe size={18} />}
            value={i18n.resolvedLanguage}
            onChange={(code) => i18n.changeLanguage(code)}
            options={LANGUAGES.map((l) => ({ value: l.code, label: l.name, short: l.label, lang: l.code }))}
          />
          <a href={BOT_URL} className="btn btn-line">{t('header.login')}</a>
          <a href={BOT_URL} className="btn btn-lime" aria-label={t('header.create')}><Plus size={18} /><span className="btn-label">{t('header.create')}</span></a>
        </div>
      </div>
    </header>
  )
}
