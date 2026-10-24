import { Logo, Arrow, Check, Ball, Pin, Calendar, Search } from './icons.jsx'

export const NAV = [
  { label: 'O‘yinchilar', href: '#how' },
  { label: 'Klublar', href: '#business' },
  { label: 'Murabbiylar', href: '#coaches' },
  { label: 'Turnirlar', href: '#tournaments' },
]

const QUICK = [
  { label: 'Sherik yoki raqib', href: '#how' },
  { label: 'Sport joyi', href: '#business' },
  { label: 'Murabbiy', href: '#coaches' },
  { label: 'Turnir', href: '#tournaments' },
]

const FIELDS = [
  { id: 'sport', label: 'Sport turi', Icon: Ball, options: ['Bilyard', 'Futbol', 'Padel', 'Tennis', 'Kompyuter klubi'] },
  { id: 'city', label: 'Shahar', Icon: Pin, options: ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan'] },
  { id: 'when', label: 'Qachon', Icon: Calendar, options: ['Bugun', 'Ertaga', 'Dam olish kuni'], narrow: true },
]

export default function Hero() {
  return (
    <section className="hero" id="top">
      <header className="wrap header">
        <a href="#top" className="d logo"><Logo />KiGo</a>
        <nav className="nav header-nav" aria-label="Asosiy bo‘limlar">
          {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="header-actions">
          <a href="#how" className="login">Kirish</a>
          <a href="#how" className="btn bp btn-sm">Boshlash</a>
        </div>
      </header>

      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="pill hero-pill">● Toshkentda [N] ta klub va maydon</span>
          <h1 className="d hero-title">
            Sport birlashtiradi. <span className="accent">Harakat sizdan boshlanadi.</span>
          </h1>
          <p className="mu hero-lead">
            Sherik toping, joy bron qiling, birga o‘ynang. Bilyard, futbol, padel, tennis va boshqa sport turlari bir joyda.
          </p>
          <div className="row">
            <a href="#search" className="btn bp btn-lg">O‘yin topish <Arrow /></a>
            <a href="#business" className="btn bo btn-lg">Klubni ulash</a>
          </div>
        </div>

        <div className="hero-media">
          <div className="hero-ring" aria-hidden="true" />
          <img src="/images/hero-padel.jpg" alt="Padel raketkasi bilan o‘yinchi qiz" className="hm-main" />
          <img src="/images/hero-swim.jpg" alt="Basseynda suzayotgan sportchi" className="hm-top" />
          <img src="/images/hero-basketball.jpg" alt="Basketbol o‘ynayotgan yigitlar" className="hm-bottom" />
          <div className="card hero-toast">
            <span className="toast-icon"><Check /></span>
            <span className="toast-text">
              <b>Bron tasdiqlandi</b>
              <span className="mu">«Pirat», bugun 19:00</span>
            </span>
          </div>
        </div>
      </div>

      <div className="wrap search-wrap" id="search">
        <form className="search" onSubmit={(e) => e.preventDefault()}>
          {FIELDS.map(({ id, label, Icon, options, narrow }) => (
            <label key={id} htmlFor={id} className={narrow ? 'field field-narrow' : 'field'}>
              <Icon />
              <span className="field-body">
                {label}
                <select id={id}>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </span>
            </label>
          ))}
          <button type="submit" className="btn bp search-btn"><Search />Qidirish</button>
        </form>
        <div className="quick">
          {QUICK.map((q) => <a key={q.label} href={q.href} className="chip">{q.label}</a>)}
        </div>
      </div>
    </section>
  )
}
