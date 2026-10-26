import { Chevron, Globe, Logo, Plus } from './icons.jsx'
import { BOT_URL } from '../data.js'

const NAV = [
  { label: 'Turnirlar', href: '#tournaments' },
  { label: 'Tashkilotchilar', href: '#cta' },
  { label: 'Hamkorlik', href: '#partners' },
]

export default function Header() {
  return (
    <header className="header">
      <div className="wrap header-in">
        <a href="#top" className="logo" aria-label="Charhpalak — bosh sahifa"><Logo /><span>Charh<b>palak</b></span></a>
        <nav className="nav" aria-label="Asosiy bo‘limlar">
          {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="header-actions">
          <label className="lang">
            <Globe size={18} />
            <select aria-label="Til" defaultValue="uz">
              <option value="uz">UZ</option>
              <option value="ru" disabled>RU (tez orada)</option>
            </select>
            <Chevron size={14} />
          </label>
          <a href={BOT_URL} className="btn btn-line">Kirish</a>
          <a href={BOT_URL} className="btn btn-lime"><Plus size={18} />Turnir yaratish</a>
        </div>
      </div>
    </header>
  )
}
