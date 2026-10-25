import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import TabBar from '../components/TabBar.jsx'
import { Segmented } from '../components/ui.jsx'
import { TOURNAMENT } from '../data.js'
import { getUser, haptic, openTelegramLink } from '../telegram.js'
import { loadPrefs } from '../storage.js'

const STATS = [['64', 'o‘yin'], ['★ 4.8', 'reyting'], ['96%', 'o‘z vaqtida']]

export default function Profile() {
  const user = getUser()
  const prefs = loadPrefs()
  const sports = Object.keys(prefs?.sports || { Futbol: 1, Bilyard: 1 }).filter((s) => !prefs || prefs.sports[s])
  const [view, setView] = useState('b')
  const [stars, setStars] = useState(4)
  const [rated, setRated] = useState(false)
  const [cancel, setCancel] = useState('no') // no | ask | done

  return (
    <Screen>
      <div className="body pad">
        <div className="row gap-14">
          <span className="av-lg" style={{ background: 'var(--lime)', width: 64, height: 64, fontSize: 20 }}>{user.initials}</span>
          <span className="col flex1">
            <b className="d fs22">{user.name}</b>
            <span className="mu fs13">{[user.username, sports.join(', '), (prefs?.level || 'o‘rta').toLowerCase()].filter(Boolean).join(' · ')}</span>
          </span>
        </div>

        <div className="grid3">
          {STATS.map(([v, l]) => (
            <div key={l} className="card" style={{ padding: '10px 12px' }}><b className="d fs22">{v}</b><div className="mu fs11">{l}</div></div>
          ))}
        </div>

        {!rated ? (
          <div className="card col gap-8" style={{ padding: 14, borderColor: 'var(--lime)' }}>
            <span className="pill pill-soft self-start">Baholash kutilmoqda</span>
            <b className="fs15">Futbol, 22-okt · Aziz T. qanday o‘ynadi?</b>
            <div className="between">
              <span className="row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={n <= stars ? 'star on' : 'star'} aria-label={`${n} yulduz`} onClick={() => { haptic('light'); setStars(n) }}>★</button>
                ))}
              </span>
              <button type="button" className="sb" style={{ background: 'var(--lime)', color: 'var(--dark)' }} onClick={() => setRated(true)}>Yuborish</button>
            </div>
          </div>
        ) : (
          <div className="card fs14" style={{ padding: 14 }}>Rahmat! Bahoingiz Aziz T. profiliga qo‘shildi.</div>
        )}

        <Segmented small options={[['b', 'Bronlarim'], ['o', 'O‘yinlarim'], ['t', 'Turnirlarim']]} value={view} onChange={setView} />

        {view === 'b' && (
          <div className="col gap-10">
            <div className="card col gap-10" style={{ padding: 14 }}>
              <div className="row gap-12">
                <img src="images/billiards.jpg" alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
                <span className="col flex1"><b className="fs15">«Pirat», Rus bilyardi</b><span className="mu fs12">Bugun, 19:00–21:00 · № 4821</span></span>
                {cancel === 'done'
                  ? <span className="pill" style={{ background: '#2A1A12', color: 'var(--orange)' }}>Bekor qilindi</span>
                  : <span className="pill pill-lime">Bugun</span>}
              </div>
              {cancel === 'ask' && (
                <div className="warn">
                  <b className="fs14">Bekor qilasizmi?</b>
                  <span style={{ color: '#F3D9C4' }}>20 000 so‘m depozit kartangizga qaytadi.</span>
                  <span className="row-8">
                    <button type="button" className="sb" style={{ background: 'var(--orange)', color: '#2A1A12' }} onClick={() => { haptic('heavy'); setCancel('done') }}>Ha, bekor qilish</button>
                    <button type="button" className="sb" style={{ border: '1px solid var(--ink-dim)', background: 'transparent', color: 'var(--ink)' }} onClick={() => setCancel('no')}>Yo‘q</button>
                  </span>
                </div>
              )}
              {cancel === 'no' && (
                <div className="row-8">
                  <Link to="/booking/done" className="sb flex1" style={{ background: 'var(--lime)', color: 'var(--dark)' }}>QR kod</Link>
                  <Link to="/club/pirat" className="sb flex1" style={{ border: '1px solid var(--line-chip)', color: 'var(--ink)' }}>Ko‘chirish</Link>
                  <button type="button" className="sb flex1" style={{ background: 'transparent', color: 'var(--orange)' }} onClick={() => setCancel('ask')}>Bekor qilish</button>
                </div>
              )}
            </div>
            <div className="card row gap-12" style={{ padding: 14 }}>
              <img src="images/coach-tennis.jpg" alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
              <span className="col flex1"><b className="fs15">«Olimp» korti</b><span className="mu fs12">Shanba, 10:00–11:00</span></span>
              <span className="pill" style={{ background: 'var(--card-2)', color: 'var(--ink)' }}>Tasdiqlangan</span>
            </div>
          </div>
        )}

        {view === 'o' && (
          <div className="col gap-10">
            <Link to="/games" className="card row gap-12" style={{ padding: 14 }}>
              <span className="pill pill-lime">Futbol</span>
              <span className="col flex1"><b className="fs15">Shanba, 19:00 · «Arena»</b><span className="mu fs12">Siz e’lon bergansiz · 10/12</span></span>›
            </Link>
            <Link to="/games" className="card row gap-12" style={{ padding: 14 }}>
              <span className="pill" style={{ background: '#9EE6C8', color: 'var(--dark)' }}>Padel</span>
              <span className="col flex1"><b className="fs15">Ertaga, 08:00</b><span className="mu fs12">Qo‘shilgansiz · 4/4</span></span>›
            </Link>
          </div>
        )}

        {view === 't' && (
          <Link to={`/tournament/${TOURNAMENT.id}`} className="card row gap-12" style={{ padding: 14 }}>
            <span className="center fs11" style={{ width: 44, height: 44, borderRadius: 12, background: '#FFD58A', color: 'var(--dark)', display: 'grid', placeItems: 'center', fontWeight: 700, lineHeight: 1.1 }}>12<br />noy</span>
            <span className="col flex1"><b className="fs15">{TOURNAMENT.title}</b><span className="mu fs12">Ro‘yxatdasiz · B guruh</span></span>›
          </Link>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <button type="button" className="set"><span>Til</span><span className="mu">O‘zbekcha ›</span></button>
          <button type="button" className="set"><span>Bot eslatmalari</span><span className="mu">Yoqilgan ›</span></button>
          <Link to="/tournament-apply" className="set"><span>Turnir o‘tkazaman</span><span className="mu">›</span></Link>
          <Link to="/applications" className="set"><span>Mening arizalarim</span><span className="mu">1 ta · ma’lumot so‘raldi ›</span></Link>
          <Link to="/business" className="set"><span>Klubim bor</span><span className="mu">›</span></Link>
          <Link to="/business" className="set"><span>Murabbiy bo‘lish</span><span className="mu">›</span></Link>
          <button type="button" className="set" onClick={() => openTelegramLink('https://t.me/kigo_sherik')}><span>Yordam · @kigo_sherik</span><span className="mu">›</span></button>
        </div>
      </div>
      <TabBar />
    </Screen>
  )
}
