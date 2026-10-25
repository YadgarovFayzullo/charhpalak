import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Async } from '../components/State.jsx'
import { Check, Telegram } from '../components/icons.jsx'
import { useApi } from '../api.js'
import { money } from '../format.js'
import { openLink, share } from '../telegram.js'

// Decorative 7×7 QR pattern from the design. A real QR would encode the booking number.
const QR = '1110111' + '1011001' + '1110111' + '0101010' + '1101101' + '1010110' + '1110101'

export default function Confirmed() {
  const { id } = useParams()
  const fromState = useLocation().state?.booking
  // "/booking/done" (link from the bot) shows the next upcoming booking.
  const one = useApi(`/api/bookings/${id}`, { skip: id === 'done' || Boolean(fromState) })
  const list = useApi('/api/bookings', { skip: id !== 'done' })
  const res = id === 'done'
    ? { ...list, data: list.data && (list.data.find((b) => b.status === 'confirmed' && !b.past) || null) }
    : fromState ? { data: fromState } : one

  return (
    <Screen back="/">
      {id === 'done' && list.data && !res.data
        ? <div className="state"><b className="fs16">Faol bron yo‘q</b><Link to="/search" className="mbs" style={{ width: 'auto', padding: '0 20px' }}>Joy topish</Link></div>
        : <Async res={res}>{(b) => <Ticket b={b} />}</Async>}
    </Screen>
  )
}

function Ticket({ b }) {
  const navigate = useNavigate()
  const cancelled = b.status === 'cancelled'

  return (
    <>
      <div className="body pad" style={{ paddingTop: 18 }}>
        <div className="col gap-8 center" style={{ alignItems: 'center' }}>
          <span className="done-icon" style={{ width: 56, height: 56, background: cancelled ? 'var(--orange)' : undefined }}><Check /></span>
          <h1 className="d fs28">{cancelled ? 'Bron bekor qilingan' : 'Bron tasdiqlandi'}</h1>
          {!cancelled && <span className="mu fs14">Chek va QR kod bot chatiga ham yuborildi</span>}
        </div>

        <div className="ticket" style={cancelled ? { opacity: 0.6 } : undefined}>
          <div className="row gap-14">
            <div className="qr" role="img" aria-label="Bron QR kodi">
              {[...QR].map((c, i) => <span key={i} className={c === '1' ? 'q' : ''} />)}
            </div>
            <div className="col gap-2">
              <span className="fs12 ticket-mu">Bron № {b.number}</span>
              <b className="d" style={{ fontSize: 19 }}>{b.clubName}</b>
              <span className="fs13" style={{ color: 'var(--text-mu)' }}>{b.typeLabel}</span>
              <b className="fs17" style={{ paddingTop: 4 }}>{b.dayLabel}, {b.slot}–{b.end}</b>
            </div>
          </div>
          <div style={{ borderTop: '1px dashed #CDD6CA', paddingTop: 6 }}>
            {b.paid > 0 && <div className="r"><span className="ticket-mu">To‘landi ({b.payLabel})</span><b>{money(b.paid)}</b></div>}
            <div className="r"><span className="ticket-mu">Klubda to‘lanadi</span><b>{money(b.atClub)}</b></div>
            {!cancelled && <div className="r"><span className="ticket-mu">Bepul bekor qilish</span><b>{b.cancelUntil} gacha</b></div>}
            {cancelled && b.refunded && <div className="r"><span className="ticket-mu">Depozit</span><b>qaytarildi</b></div>}
          </div>
        </div>

        {!cancelled && (
          <div className="card row gap-12" style={{ padding: 14 }}>
            <span className="tg-circle"><Telegram /></span>
            <span className="col fs13"><b className="fs14">Bot eslatadi</b><span className="mu">O‘yindan 1 soat oldin @kigo_bot xabar yuboradi</span></span>
          </div>
        )}

        <div className="grid2">
          <button type="button" className="mbs" onClick={() => openLink(`https://yandex.uz/maps/?text=${encodeURIComponent(b.clubFullName + ' Toshkent')}`)}>Yo‘nalish</button>
          <Link to="/profile" className="mbs">Bronlarim</Link>
        </div>
      </div>

      <div className="mb">
        {!cancelled && (
          <button type="button" className="mbb" onClick={() => share(`${b.clubName}, ${b.dayLabel} ${b.slot} da o‘ynaymizmi? Men joy bron qildim.`)}>
            Sherikni Telegram’da chaqirish
          </button>
        )}
        <button type="button" className="ghost-btn" onClick={() => navigate('/', { replace: true })}>Bosh sahifaga</button>
      </div>
    </>
  )
}
