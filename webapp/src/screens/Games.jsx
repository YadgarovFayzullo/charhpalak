import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { ChipGroup, Segmented } from '../components/ui.jsx'
import { AVATARS, GAMES, PLAYERS, SPORT_COLORS } from '../data.js'
import { haptic, openTelegramLink } from '../telegram.js'

export default function Games() {
  const [view, setView] = useState('g')
  const [sport, setSport] = useState('Hammasi')
  const [joined, setJoined] = useState({})

  const games = GAMES.filter((g) => sport === 'Hammasi' || g.sport === sport)

  return (
    <Screen>
      <div className="search-top">
        <h1 className="d fs26">Kim bilan o‘ynaysiz?</h1>
        <Segmented options={[['g', 'Ochiq o‘yinlar'], ['p', 'O‘yinchilar']]} value={view} onChange={setView} />
        <ChipGroup options={['Hammasi', 'Futbol', 'Bilyard', 'Padel', 'Tennis']} value={sport} onChange={setSport} scroll />
      </div>

      <div className="body pad" style={{ padding: '14px 16px 90px', gap: 12 }}>
        {view === 'g' && games.map((g) => {
          const j = Boolean(joined[g.id])
          const have = g.have + (j ? 1 : 0)
          const left = g.max - have
          return (
            <article key={g.id} className="card col gap-10" style={{ padding: 14 }}>
              <div className="between">
                <span className="pill" style={{ background: SPORT_COLORS[g.sport], color: 'var(--dark)' }}>{g.sport}</span>
                <span className="mu fs12">{g.level}</span>
              </div>
              <div className="col">
                <b className="fs17">{g.when}</b>
                {g.clubId
                  ? <Link to={`/club/${g.clubId}`} className="fs13" style={{ color: '#D5E0D7' }}>{g.place}</Link>
                  : <span className="fs13" style={{ color: '#D5E0D7' }}>{g.place}</span>}
              </div>
              <div className="between">
                <span className="row" style={{ paddingLeft: 7 }}>
                  {AVATARS.slice(0, Math.min(have, 4)).map(([i, bg]) => <span key={i} className="av" style={{ background: bg }}>{i}</span>)}
                  {Array.from({ length: Math.min(left, 2) }, (_, k) => <span key={k} className="av e">+</span>)}
                </span>
                <span className="col fs12" style={{ alignItems: 'flex-end' }}>
                  <b className="fs14">{g.price}</b>
                  <span className="mu">{left > 0 ? `yana ${left} kishi` : 'to‘ldi'}</span>
                </span>
              </div>
              <button
                type="button"
                className={j ? 'jb on' : 'jb'}
                disabled={!j && left <= 0}
                onClick={() => { haptic(j ? 'light' : 'medium'); setJoined({ ...joined, [g.id]: !j }) }}
              >
                {j ? '✓ Qo‘shildingiz · chatga o‘tish' : 'Qo‘shilish'}
              </button>
            </article>
          )
        })}

        {view === 'p' && (
          <>
            {PLAYERS.filter((p) => sport === 'Hammasi' || p.meta.startsWith(sport)).map((p) => (
              <div key={p.name} className="card row gap-12" style={{ padding: 12 }}>
                <span className="av-lg" style={{ background: p.bg, width: 46, height: 46 }}>{p.i}</span>
                <span className="col flex1"><b className="fs15">{p.name}</b><span className="mu fs12">{p.meta}</span></span>
                <button type="button" className="tg-btn" disabled={!p.username} onClick={() => openTelegramLink(`https://t.me/${p.username}`)}>Yozish</button>
              </div>
            ))}
            <span className="mu fs12 center">«Yozish» Telegram’da shaxsiy chatni ochadi</span>
          </>
        )}
      </div>

      <Link to="/games/new" className="fab">+ E’lon berish</Link>
      <TabBar />
    </Screen>
  )
}
