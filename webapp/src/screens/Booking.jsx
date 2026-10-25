import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Sheet, ToggleRow } from '../components/ui.jsx'
import { useAction } from '../components/useAction.jsx'
import { api } from '../api.js'
import { useMe } from '../me.jsx'
import { money } from '../format.js'
import { haptic } from '../telegram.js'

const DEPOSIT = 20000 // keep in sync with backend/app/routers/bookings.py

const PAYS = [
  { id: 'click', label: 'Click', note: 'Telegram ichida, kartadan', tag: 'Click', bg: '#0A6CFF' },
  { id: 'payme', label: 'Payme', note: 'Telegram ichida, kartadan', tag: 'Payme', bg: '#14A9A0' },
  { id: 'club', label: 'Klubda to‘lash', note: 'Bu klub depozitsiz bronni qabul qiladi', tag: 'Joyida', bg: '#5F7766' },
]

export default function Booking() {
  const b = useLocation().state
  // The screen only makes sense coming from a club page.
  if (!b?.typeId) return <Navigate to="/search" replace />
  return <BookingForm b={b} />
}

function BookingForm({ b }) {
  const navigate = useNavigate()
  const me = useMe().data
  const { run, busy, toast } = useAction()

  const [name, setName] = useState(me.name)
  const [phone, setPhone] = useState(me.phone)
  const [invite, setInvite] = useState(true)
  const [pay, setPay] = useState(0)
  const [sheet, setSheet] = useState(false)

  const total = b.price * b.dur
  const now = PAYS[pay].id === 'club' ? 0 : Math.min(DEPOSIT, total)
  const atClub = total - now

  const confirm = async () => {
    const booking = await run(async () => {
      const created = await api('/api/bookings', {
        method: 'POST',
        body: { club_id: b.clubId, type_id: b.typeId, date: b.date, start: b.slot, hours: b.dur, pay_method: PAYS[pay].id, invite, name, phone },
      })
      // Payment stub on the backend; becomes a Click/Payme/Telegram invoice in production.
      return created.status === 'awaiting_payment' ? api(`/api/bookings/${created.id}/pay`, { method: 'POST' }) : created
    })
    if (!booking) return setSheet(false)
    haptic('heavy')
    navigate(`/booking/${booking.id}`, { replace: true, state: { booking } })
  }

  return (
    <Screen back={`/club/${b.clubId}`}>
      <div className="body pad">
        <h1 className="d fs26">Bronni tasdiqlang</h1>

        <div className="card row gap-12" style={{ padding: 12 }}>
          <img src={b.img} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
          <span className="col flex1">
            <b>{b.clubName}, {b.typeLabel}</b>
            <span className="mu fs13">{b.dayLabel} · {b.slot}–{b.end}</span>
          </span>
          <Link to={`/club/${b.clubId}`} className="fs13" style={{ fontWeight: 600 }}>O‘zgartirish</Link>
        </div>

        <div className="grid2">
          <label className="fl" htmlFor="tn">Ism<input id="tn" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="fl" htmlFor="tp">Telefon<input id="tp" type="tel" value={phone} placeholder="+998" onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
        <span className="mu fs12" style={{ marginTop: -8 }}>Telegram profilingizdan olindi</span>

        <ToggleRow title="Sherikni taklif qilish" hint="To‘lovdan keyin Telegram’da havola yuborasiz" on={invite} onToggle={() => setInvite(!invite)} />

        <b className="fs16">To‘lov usuli</b>
        {PAYS.map((p, i) => (
          <button key={p.id} type="button" className={pay === i ? 'pay on' : 'pay'} aria-pressed={pay === i} onClick={() => { haptic('light'); setPay(i) }}>
            <span className="dot" />
            <span className="col flex1"><b className="fs15">{p.label}</b><span className="mu fs12">{p.note}</span></span>
            <span className="lg" style={{ background: p.bg }}>{p.tag}</span>
          </button>
        ))}

        <div className="card" style={{ padding: 14 }}>
          <div className="r"><span className="mu">{money(b.price).replace(' so‘m', '')} × {b.dur} soat</span><span>{money(total)}</span></div>
          <div className="r"><span className="mu">Klubda to‘lanadi</span><span>{money(atClub)}</span></div>
          <div className="r fs16" style={{ borderTop: '1px solid var(--line-card)', marginTop: 6, paddingTop: 12 }}>
            <b>Hozir</b><b className="lime">{money(now)}</b>
          </div>
        </div>
      </div>

      {toast}
      <div className="mb">
        <button type="button" className="mbb" disabled={busy || !phone.trim()} onClick={() => (now ? setSheet(true) : confirm())}>
          {now ? `${money(now)} to‘lash` : 'Bron qilish'}
        </button>
      </div>

      {sheet && (
        <Sheet onClose={() => !busy && setSheet(false)}>
          <div className="between">
            <span className="mu fs12">Telegram to‘lov oynasi</span>
            <button type="button" aria-label="Yopish" className="ghost-btn" style={{ width: 44, color: 'var(--ink)', fontSize: 18 }} onClick={() => setSheet(false)}>✕</button>
          </div>
          <div className="row gap-12">
            <span className="lg" style={{ background: PAYS[pay].bg, width: 52, height: 36 }}>{PAYS[pay].tag}</span>
            <span className="col"><b>KiGo · Bron</b><span className="mu fs13">{b.clubName}, depozit</span></span>
          </div>
          <div className="r fs17"><b>Jami</b><b>{money(now)}</b></div>
          <button type="button" className="mbb" disabled={busy} onClick={confirm}>{busy ? 'Kuting…' : 'To‘lash'}</button>
        </Sheet>
      )}
    </Screen>
  )
}
