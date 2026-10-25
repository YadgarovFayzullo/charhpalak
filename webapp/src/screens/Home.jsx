import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { Search, Partners, Calendar, Star, Trophy } from '../components/icons.jsx'
import { CLUBS, GAMES, SPORT_COLORS, TOURNAMENT } from '../data.js'
import { getUser } from '../telegram.js'
import { loadPrefs } from '../storage.js'

const QUICK = [
  { to: '/games', label: 'Sherik topish', Icon: Partners },
  { to: '/search', label: 'Joy bron qilish', Icon: Calendar },
  { to: '/search', label: 'Murabbiy', Icon: Star },
  { to: `/tournament/${TOURNAMENT.id}`, label: 'Turnirlar', Icon: () => <Trophy size={26} full /> },
]

export default function Home() {
  const user = getUser()
  const area = Object.keys(loadPrefs()?.areas || {}).find((a) => loadPrefs().areas[a]) || 'Yunusobod'

  return (
    <Screen>
      <div className="body pad" style={{ gap: 20 }}>
        <div className="between">
          <span className="col">
            <span className="mu fs13">Toshkent · {area}</span>
            <h1 className="d fs26">Salom, {user.first}</h1>
          </span>
          <Link to="/profile" className="profile-btn" aria-label="Profil">
            {user.initials}<span className="profile-dot" />
          </Link>
        </div>

        <Link to="/search" className="search-link"><Search size={20} strokeWidth={2} />Klub, sport yoki o‘yinchi</Link>

        <div className="grid4">
          {QUICK.map(({ to, label, Icon }) => (
            <Link key={label} to={to} className="qa"><span className="qa-i"><Icon /></span>{label}</Link>
          ))}
        </div>

        <Link to="/booking/done" className="today">
          <span className="today-time">19:00</span>
          <span className="col flex1">
            <span className="fs12" style={{ fontWeight: 600 }}>Bugungi broningiz · 3 soatdan keyin</span>
            <b className="fs16">«Pirat», Rus bilyardi</b>
          </span>
          <b>QR →</b>
        </Link>

        <section className="col gap-10">
          <div className="sec-h"><b>Hozir bo‘sh, yaqinda</b><Link to="/search">Hammasi</Link></div>
          <div className="hscroll" style={{ gap: 10 }}>
            {CLUBS.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/club/${c.id}`} className="card venue-mini">
                <img src={c.img} alt={c.name} />
                <span className="col gap-2" style={{ padding: '10px 12px' }}>
                  <b className="fs15">{c.name}</b>
                  <span className="mu fs12">{c.dist} · ★ {c.rating}</span>
                  <span className="pill pill-soft self-start" style={{ marginTop: 4 }}>{c.nextFree} bo‘sh</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="col gap-10">
          <div className="sec-h"><b>Sizga mos ochiq o‘yinlar</b><Link to="/games">Hammasi</Link></div>
          {GAMES.slice(0, 2).map((g) => (
            <Link key={g.id} to="/games" className="card li">
              <span className="pill" style={{ background: SPORT_COLORS[g.sport], color: 'var(--dark)' }}>{g.sport}</span>
              <span className="col flex1">
                <b className="fs15">{g.when} · {g.place.split(' · ')[0]}</b>
                <span className="mu fs12">{g.max - g.have === 1 && g.max === 2 ? 'Raqib kerak' : `Yana ${g.max - g.have} kishi`} · {g.price}</span>
              </span>
              <span className="lime fs14" style={{ fontWeight: 600 }}>→</span>
            </Link>
          ))}
        </section>

        <Link to={`/tournament/${TOURNAMENT.id}`} className="card row" style={{ overflow: 'hidden', alignItems: 'stretch' }}>
          <img src="images/chess.jpg" alt="" style={{ width: 110, objectFit: 'cover' }} />
          <span className="col gap-2" style={{ padding: '12px 14px' }}>
            <span className="pill pill-lime self-start">Yozilish ochiq</span>
            <b className="fs15" style={{ paddingTop: 4 }}>{TOURNAMENT.title}</b>
            <span className="mu fs12">12-noyabr · {TOURNAMENT.players.replace(' / ', '/')} · sovrin 5 mln</span>
          </span>
        </Link>
      </div>
      <TabBar />
    </Screen>
  )
}
