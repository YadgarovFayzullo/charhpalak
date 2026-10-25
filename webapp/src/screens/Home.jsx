import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { Search, Partners, Calendar, Star, Trophy } from '../components/icons.jsx'
import { sportColor } from '../data.js'
import { useApi } from '../api.js'
import { useMe } from '../me.jsx'

const QUICK = [
  { to: '/games', label: 'Sherik topish', Icon: Partners },
  { to: '/search', label: 'Joy bron qilish', Icon: Calendar },
  { to: '/search', label: 'Murabbiy', Icon: Star },
  { to: '/tournament', label: 'Turnirlar', Icon: () => <Trophy size={26} full /> },
]

export default function Home() {
  const user = useMe().data
  const clubs = useApi('/api/clubs').data || []
  const games = (useApi('/api/games').data || []).filter((g) => !g.joined && g.left > 0)
  const bookings = useApi('/api/bookings').data || []
  const tournaments = useApi('/api/tournaments').data || []

  const today = bookings.find((b) => b.isToday && b.status === 'confirmed' && !b.past)
  const tournament = tournaments.find((t) => t.status === 'Kutilayotgan') || tournaments[0]

  return (
    <Screen>
      <div className="body pad" style={{ gap: 20 }}>
        <div className="between">
          <span className="col">
            <span className="mu fs13">Toshkent · {user.areas[0] || 'Yunusobod'}</span>
            <h1 className="d fs26">Salom, {user.first}</h1>
          </span>
          <Link to="/profile" className="profile-btn" aria-label="Profil">
            {user.initials}{user.pendingRating && <span className="profile-dot" />}
          </Link>
        </div>

        <Link to="/search" className="search-link"><Search size={20} strokeWidth={2} />Klub, sport yoki o‘yinchi</Link>

        <div className="grid4">
          {QUICK.map(({ to, label, Icon }) => (
            <Link key={label} to={to} className="qa"><span className="qa-i"><Icon /></span>{label}</Link>
          ))}
        </div>

        {today && (
          <Link to={`/booking/${today.id}`} className="today">
            <span className="today-time">{today.slot}</span>
            <span className="col flex1">
              <span className="fs12" style={{ fontWeight: 600 }}>Bugungi broningiz{today.hoursLeft > 0 && ` · ${today.hoursLeft} soatdan keyin`}</span>
              <b className="fs16">{today.clubName}, {today.typeLabel}</b>
            </span>
            <b>QR →</b>
          </Link>
        )}

        <section className="col gap-10">
          <div className="sec-h"><b>Hozir bo‘sh, yaqinda</b><Link to="/search">Hammasi</Link></div>
          <div className="hscroll" style={{ gap: 10 }}>
            {clubs.filter((c) => c.nextFree).slice(0, 4).map((c) => (
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

        {games.length > 0 && (
          <section className="col gap-10">
            <div className="sec-h"><b>Sizga mos ochiq o‘yinlar</b><Link to="/games">Hammasi</Link></div>
            {games.slice(0, 2).map((g) => (
              <Link key={g.id} to="/games" className="card li">
                <span className="pill" style={{ background: sportColor(g.sport), color: 'var(--dark)' }}>{g.sport}</span>
                <span className="col flex1">
                  <b className="fs15">{g.when} · {g.place.split(' · ')[0]}</b>
                  <span className="mu fs12">{g.max === 2 ? 'Raqib kerak' : `Yana ${g.left} kishi`} · {g.price}</span>
                </span>
                <span className="lime fs14" style={{ fontWeight: 600 }}>→</span>
              </Link>
            ))}
          </section>
        )}

        {tournament && (
          <Link to={`/tournament/${tournament.id}`} className="card row" style={{ overflow: 'hidden', alignItems: 'stretch' }}>
            <img src="images/chess.jpg" alt="" style={{ width: 110, objectFit: 'cover' }} />
            <span className="col gap-2" style={{ padding: '12px 14px' }}>
              <span className="pill pill-lime self-start">{tournament.registered ? 'Ro‘yxatdasiz' : 'Yozilish ochiq'}</span>
              <b className="fs15" style={{ paddingTop: 4 }}>{tournament.title}</b>
              <span className="mu fs12">{tournament.startLabel || tournament.dates} · {tournament.count}/{tournament.max} · sovrin {tournament.prize}</span>
            </span>
          </Link>
        )}
      </div>
      <TabBar />
    </Screen>
  )
}
