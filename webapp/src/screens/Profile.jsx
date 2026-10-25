import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { Segmented } from '../components/ui.jsx'
import { Loading } from '../components/State.jsx'
import { useAction } from '../components/useAction.jsx'
import { api, useApi } from '../api.js'
import { useMe } from '../me.jsx'
import { sportColor } from '../data.js'
import { money } from '../format.js'
import { haptic, openTelegramLink } from '../telegram.js'

export default function Profile() {
  const me = useMe()
  const user = me.data
  const [view, setView] = useState('b')
  const [stars, setStars] = useState(4)
  const [thanks, setThanks] = useState(null)
  const { run, busy, toast } = useAction()

  const rate = async () => {
    const p = user.pendingRating
    const r = await run(() => api('/api/ratings', { method: 'POST', body: { game_id: p.gameId, user_id: p.userId, stars } }))
    if (!r) return
    haptic('light')
    setThanks(p.name)
    me.setData({ ...user, pendingRating: r.pendingRating })
  }

  const apps = user.applications
  const appsHint = apps.needInfo ? `${apps.count} ta · ma’lumot so‘raldi ›` : apps.count ? `${apps.count} ta ›` : '›'

  return (
    <Screen>
      <div className="body pad">
        <div className="row gap-14">
          <span className="av-lg" style={{ background: 'var(--lime)', width: 64, height: 64, fontSize: 20 }}>{user.initials}</span>
          <span className="col flex1">
            <b className="d fs22">{user.name}</b>
            <span className="mu fs13">{[user.username, user.sports.join(', '), user.level.toLowerCase()].filter(Boolean).join(' · ')}</span>
          </span>
        </div>

        <div className="grid3">
          {[[user.stats.games, 'o‘yin'], [user.stats.rating === '—' ? '—' : `★ ${user.stats.rating}`, 'reyting'], [user.stats.onTime, 'o‘z vaqtida']].map(([v, l]) => (
            <div key={l} className="card" style={{ padding: '10px 12px' }}><b className="d fs22">{v}</b><div className="mu fs11">{l}</div></div>
          ))}
        </div>

        {user.pendingRating ? (
          <div className="card col gap-8" style={{ padding: 14, borderColor: 'var(--lime)' }}>
            <span className="pill pill-soft self-start">Baholash kutilmoqda</span>
            <b className="fs15">{user.pendingRating.label} · {user.pendingRating.name} qanday o‘ynadi?</b>
            <div className="between">
              <span className="row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={n <= stars ? 'star on' : 'star'} aria-label={`${n} yulduz`} onClick={() => { haptic('light'); setStars(n) }}>★</button>
                ))}
              </span>
              <button type="button" className="sb" disabled={busy} style={{ background: 'var(--lime)', color: 'var(--dark)' }} onClick={rate}>Yuborish</button>
            </div>
          </div>
        ) : thanks && (
          <div className="card fs14" style={{ padding: 14 }}>Rahmat! Bahoingiz {thanks} profiliga qo‘shildi.</div>
        )}

        <Segmented small options={[['b', 'Bronlarim'], ['o', 'O‘yinlarim'], ['t', 'Turnirlarim']]} value={view} onChange={setView} />

        {view === 'b' && <MyBookings />}
        {view === 'o' && <MyGames />}
        {view === 't' && <MyTournaments />}

        <div className="card" style={{ overflow: 'hidden' }}>
          <Link to="/start" className="set"><span>Sport va tuman</span><span className="mu">O‘zgartirish ›</span></Link>
          <Link to="/tournament-apply" className="set"><span>Turnir o‘tkazaman</span><span className="mu">›</span></Link>
          <Link to="/applications" className="set"><span>Mening arizalarim</span><span className="mu">{appsHint}</span></Link>
          <Link to="/business" className="set"><span>Klubim bor</span><span className="mu">›</span></Link>
          <Link to="/business" state={{ kind: 'coach' }} className="set"><span>Murabbiy bo‘lish</span><span className="mu">›</span></Link>
          <button type="button" className="set" onClick={() => openTelegramLink('https://t.me/kigo_sherik')}><span>Yordam · @kigo_sherik</span><span className="mu">›</span></button>
        </div>
      </div>
      {toast}
      <TabBar />
    </Screen>
  )
}

function MyBookings() {
  const res = useApi('/api/bookings')
  const { run, busy, toast } = useAction()
  const [asking, setAsking] = useState(null)

  const cancel = async (id) => {
    const updated = await run(() => api(`/api/bookings/${id}/cancel`, { method: 'POST' }))
    setAsking(null)
    if (!updated) return
    haptic('heavy')
    res.setData((list) => list.map((b) => (b.id === id ? updated : b)))
  }

  if (!res.data) return <Loading />
  const list = res.data.filter((b) => !b.past)
  if (!list.length) return <Link to="/search" className="card center" style={{ padding: 16 }}>Bron yo‘q. <span className="lime">Joy topish →</span></Link>

  return (
    <div className="col gap-10">
      {toast}
      {list.map((b) => {
        const cancelled = b.status === 'cancelled'
        return (
          <div key={b.id} className="card col gap-10" style={{ padding: 14 }}>
            <div className="row gap-12">
              <img src={b.img} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
              <span className="col flex1"><b className="fs15">{b.clubName}, {b.typeLabel}</b><span className="mu fs12">{b.dayLabel}, {b.slot}–{b.end} · № {b.number}</span></span>
              {cancelled
                ? <span className="pill" style={{ background: '#2A1A12', color: 'var(--orange)' }}>Bekor qilindi</span>
                : b.isToday ? <span className="pill pill-lime">Bugun</span>
                  : <span className="pill" style={{ background: 'var(--card-2)', color: 'var(--ink)' }}>Tasdiqlangan</span>}
            </div>
            {asking === b.id && (
              <div className="warn">
                <b className="fs14">Bekor qilasizmi?</b>
                <span style={{ color: '#F3D9C4' }}>
                  {b.paid > 0 ? (b.freeCancel ? `${money(b.paid)} depozit kartangizga qaytadi.` : `O‘yinga 2 soatdan kam qoldi: ${money(b.paid)} depozit qaytmaydi.`) : 'Klub ogohlantiriladi.'}
                </span>
                <span className="row-8">
                  <button type="button" className="sb" disabled={busy} style={{ background: 'var(--orange)', color: '#2A1A12' }} onClick={() => cancel(b.id)}>Ha, bekor qilish</button>
                  <button type="button" className="sb" style={{ border: '1px solid var(--ink-dim)', background: 'transparent', color: 'var(--ink)' }} onClick={() => setAsking(null)}>Yo‘q</button>
                </span>
              </div>
            )}
            {!cancelled && asking !== b.id && (
              <div className="row-8">
                <Link to={`/booking/${b.id}`} state={{ booking: b }} className="sb flex1" style={{ background: 'var(--lime)', color: 'var(--dark)' }}>QR kod</Link>
                <Link to={`/club/${b.clubId}`} className="sb flex1" style={{ border: '1px solid var(--line-chip)', color: 'var(--ink)' }}>Yangi bron</Link>
                <button type="button" className="sb flex1" style={{ background: 'transparent', color: 'var(--orange)' }} onClick={() => setAsking(b.id)}>Bekor qilish</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MyGames() {
  const res = useApi('/api/games', { params: { mine: true } })
  if (!res.data) return <Loading />
  if (!res.data.length) return <Link to="/games" className="card center" style={{ padding: 16 }}>O‘yin yo‘q. <span className="lime">Sherik topish →</span></Link>
  return (
    <div className="col gap-10">
      {res.data.map((g) => (
        <Link key={g.id} to="/games" className="card row gap-12" style={{ padding: 14 }}>
          <span className="pill" style={{ background: sportColor(g.sport), color: 'var(--dark)' }}>{g.sport}</span>
          <span className="col flex1"><b className="fs15">{g.when} · {g.place.split(' · ')[0]}</b><span className="mu fs12">{g.mine ? 'Siz e’lon bergansiz' : 'Qo‘shilgansiz'} · {g.have}/{g.max}</span></span>›
        </Link>
      ))}
    </div>
  )
}

function MyTournaments() {
  const res = useApi('/api/tournaments')
  if (!res.data) return <Loading />
  const mine = res.data.filter((t) => t.registered)
  if (!mine.length) return <Link to="/tournament" className="card center" style={{ padding: 16 }}>Turnir yo‘q. <span className="lime">Turnirlar →</span></Link>
  return (
    <div className="col gap-10">
      {mine.map((t) => (
        <Link key={t.id} to={`/tournament/${t.id}`} className="card row gap-12" style={{ padding: 14 }}>
          <span className="center fs11" style={{ width: 44, height: 44, borderRadius: 12, background: '#FFD58A', color: 'var(--dark)', display: 'grid', placeItems: 'center', fontWeight: 700, lineHeight: 1.1 }}>
            {(t.startLabel || t.dates).split('-').map((p, i) => <span key={i}>{p}</span>)}
          </span>
          <span className="col flex1"><b className="fs15">{t.title}</b><span className="mu fs12">Ro‘yxatdasiz{t.group && ` · ${t.group} guruh`}</span></span>›
        </Link>
      ))}
    </div>
  )
}
