import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { ChipGroup, Segmented } from '../components/ui.jsx'
import { ErrorBox, Loading } from '../components/State.jsx'
import { useAction } from '../components/useAction.jsx'
import { api, useApi } from '../api.js'
import { sportColor } from '../data.js'
import { haptic, openTelegramLink } from '../telegram.js'

export default function Games() {
  const [view, setView] = useState('g')
  const [sport, setSport] = useState('Hammasi')
  const games = useApi(view === 'g' ? '/api/games' : '/api/players', { params: { sport } }, [view])
  const { run, busy, toast } = useAction()

  const toggle = async (g) => {
    haptic(g.joined ? 'light' : 'medium')
    const updated = await run(() => api(`/api/games/${g.id}/join`, { method: 'POST' }))
    if (updated) games.setData((list) => list.map((x) => (x.id === g.id ? updated : x)))
  }

  const list = games.data || []

  return (
    <Screen>
      <div className="search-top">
        <h1 className="d fs26">Kim bilan o‘ynaysiz?</h1>
        <Segmented options={[['g', 'Ochiq o‘yinlar'], ['p', 'O‘yinchilar']]} value={view} onChange={(v) => { games.setData(null); setView(v) }} />
        <ChipGroup options={['Hammasi', 'Futbol', 'Bilyard', 'Padel', 'Tennis']} value={sport} onChange={setSport} scroll />
      </div>

      <div className="body pad" style={{ padding: '14px 16px 90px', gap: 12 }}>
        {games.error && !games.data ? <ErrorBox error={games.error} onRetry={games.reload} /> : !games.data ? <Loading /> : view === 'g' ? (
          <>
            {list.length === 0 && <span className="mu center" style={{ padding: 24 }}>Hozircha ochiq o‘yin yo‘q. Birinchi bo‘lib e’lon bering!</span>}
            {list.map((g) => (
              <article key={g.id} className="card col gap-10" style={{ padding: 14 }}>
                <div className="between">
                  <span className="pill" style={{ background: sportColor(g.sport), color: 'var(--dark)' }}>{g.sport}</span>
                  <span className="mu fs12">{g.mine ? 'Sizning e’loningiz · ' : ''}{g.level}</span>
                </div>
                <div className="col">
                  <b className="fs17">{g.when}</b>
                  {g.clubId
                    ? <Link to={`/club/${g.clubId}`} className="fs13" style={{ color: '#D5E0D7' }}>{g.place}</Link>
                    : <span className="fs13" style={{ color: '#D5E0D7' }}>{g.place}</span>}
                </div>
                <div className="between">
                  <span className="row" style={{ paddingLeft: 7 }}>
                    {g.avatars.map((a, k) => <span key={k} className="av" style={{ background: a.bg }}>{a.i}</span>)}
                    {Array.from({ length: Math.min(g.left, 2) }, (_, k) => <span key={`e${k}`} className="av e">+</span>)}
                  </span>
                  <span className="col fs12" style={{ alignItems: 'flex-end' }}>
                    <b className="fs14">{g.price}</b>
                    <span className="mu">{g.left > 0 ? `yana ${g.left} kishi` : 'to‘ldi'}</span>
                  </span>
                </div>
                {!g.mine && (
                  <button type="button" className={g.joined ? 'jb on' : 'jb'} disabled={busy || (!g.joined && g.left <= 0)} onClick={() => toggle(g)}>
                    {g.joined ? '✓ Qo‘shildingiz · chiqish' : 'Qo‘shilish'}
                  </button>
                )}
              </article>
            ))}
          </>
        ) : (
          <>
            {list.map((p) => (
              <div key={p.id} className="card row gap-12" style={{ padding: 12 }}>
                <span className="av-lg" style={{ background: p.bg, width: 46, height: 46 }}>{p.i}</span>
                <span className="col flex1"><b className="fs15">{p.name}</b><span className="mu fs12">{p.meta}</span></span>
                <button type="button" className="tg-btn" disabled={!p.username} onClick={() => openTelegramLink(`https://t.me/${p.username}`)}>Yozish</button>
              </div>
            ))}
            {list.length === 0 && <span className="mu center" style={{ padding: 24 }}>Bu sport bo‘yicha o‘yinchi topilmadi</span>}
            <span className="mu fs12 center">«Yozish» Telegram’da shaxsiy chatni ochadi</span>
          </>
        )}
      </div>

      {toast}
      <Link to="/games/new" className="fab">+ E’lon berish</Link>
      <TabBar />
    </Screen>
  )
}
