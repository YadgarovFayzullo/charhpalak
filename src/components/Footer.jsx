import { NAV } from './Hero.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-grid">
          <div className="stack-18">
            <b className="d footer-title">Keyingi o‘yiningiz shu yerdan boshlansin.</b>
            <a href="#how" className="btn bp self-start">Boshlash</a>
          </div>
          <nav className="nav footer-col" aria-label="Sport">
            <span className="mu footer-label">Sport</span>
            {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
          </nav>
          <nav className="nav footer-col" aria-label="Biznes">
            <span className="mu footer-label">Biznes</span>
            <a href="#business">Klubni ulash</a><a href="#coaches">Murabbiy bo‘lish</a><a href="#partners">Hamkorlik</a>
          </nav>
          <div className="footer-col">
            <span className="mu footer-label">Ilova va aloqa</span>
            <span>App Store · Google Play</span>
            <span>Telegram @kigo_sherik</span>
            <span>Instagram kigo_game</span>
          </div>
        </div>
        <div className="mu footer-bottom">
          <span>© 2026 KiGo · ООО «INVENTUM»</span>
          <span>Ommaviy oferta · Maxfiylik · O‘zbekcha / Русский</span>
        </div>
      </div>
    </footer>
  )
}
