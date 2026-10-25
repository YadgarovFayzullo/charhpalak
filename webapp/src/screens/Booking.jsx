import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Sheet, ToggleRow } from '../components/ui.jsx'
import { clubById } from '../data.js'
import { money, nextDays } from '../format.js'
import { getUser, haptic } from '../telegram.js'

const DEPOSIT = 20000

const PAYS = [
  { label: 'Click', note: 'Telegram ichida, kartadan', tag: 'Click', bg: '#0A6CFF' },
  { label: 'Payme', note: 'Telegram ichida, kartadan', tag: 'Payme', bg: '#14A9A0' },
  { label: 'Klubda to‘lash', note: 'Bu klub depozitsiz bronni qabul qiladi', tag: 'Joyida', bg: '#5F7766' },
]

// Used when the screen is opened directly, without coming from a club page.
const DEFAULT_BOOKING = { clubId: 'pirat', typeLabel: 'Rus bilyardi', price: 55000, slot: '19:00', end: '21:00', dur: 2 }

export default function Booking() {
  const navigate = useNavigate()
  const b = { ...DEFAULT_BOOKING, dayLabel: nextDays(1)[0].label, ...useLocation().state }
  const club = clubById(b.clubId)
  const user = getUser()

  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState('+998 90 123 45 67')
  const [invite, setInvite] = useState(true)
  const [pay, setPay] = useState(0)
  const [sheet, setSheet] = useState(false)

  const total = b.price * b.dur
  const now = pay === 2 ? 0 : DEPOSIT
  const atClub = total - now

  const confirm = () => {
    haptic('heavy')
    navigate('/booking/done', {
      replace: true,
      state: { ...b, paid: now, atClub, payLabel: PAYS[pay].label, invite, number: 1000 + Math.floor(Math.random() * 9000) },
    })
  }

  return (
    <Screen back={`/club/${club.id}`}>
      <div className="body pad">
        <h1 className="d fs26">Bronni tasdiqlang</h1>

        <div className="card row gap-12" style={{ padding: 12 }}>
          <img src={club.img} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
          <span className="col flex1">
            <b>{club.name.replace(' bilyard', '')}, {b.typeLabel}</b>
            <span className="mu fs13">{b.dayLabel} · {b.slot}–{b.end}</span>
          </span>
          <Link to={`/club/${club.id}`} className="fs13" style={{ fontWeight: 600 }}>O‘zgartirish</Link>
        </div>

        <div className="grid2">
          <label className="fl" htmlFor="tn">Ism<input id="tn" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="fl" htmlFor="tp">Telefon<input id="tp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
        <span className="mu fs12" style={{ marginTop: -8 }}>Telegram profilingizdan olindi</span>

        <ToggleRow title="Sherikni taklif qilish" hint="To‘lovdan keyin Telegram’da havola yuborasiz" on={invite} onToggle={() => setInvite(!invite)} />

        <b className="fs16">To‘lov usuli</b>
        {PAYS.map((p, i) => (
          <button key={p.label} type="button" className={pay === i ? 'pay on' : 'pay'} aria-pressed={pay === i} onClick={() => { haptic('light'); setPay(i) }}>
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

      <div className="mb">
        <button type="button" className="mbb" onClick={() => (now ? setSheet(true) : confirm())}>
          {now ? `${money(now)} to‘lash` : 'Bron qilish'}
        </button>
      </div>

      {/* Payment sheet. In production this becomes Telegram.WebApp.openInvoice() with an invoice link from the backend. */}
      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          <div className="between">
            <span className="mu fs12">Telegram to‘lov oynasi</span>
            <button type="button" aria-label="Yopish" className="ghost-btn" style={{ width: 44, color: 'var(--ink)', fontSize: 18 }} onClick={() => setSheet(false)}>✕</button>
          </div>
          <div className="row gap-12">
            <span className="lg" style={{ background: PAYS[pay].bg, width: 52, height: 36 }}>{PAYS[pay].tag}</span>
            <span className="col"><b>KiGo · Bron</b><span className="mu fs13">{club.name.replace(' bilyard', '')}, depozit</span></span>
          </div>
          <div className="r fs15"><span className="mu">Karta</span><span>•••• 4421</span></div>
          <div className="r fs17"><b>Jami</b><b>{money(now)}</b></div>
          <button type="button" className="mbb" onClick={confirm}>To‘lash</button>
        </Sheet>
      )}
    </Screen>
  )
}
