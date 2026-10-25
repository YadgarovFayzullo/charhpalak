import { Link, useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Check, Telegram } from '../components/icons.jsx'
import { clubById } from '../data.js'
import { addHours, money } from '../format.js'
import { openLink, share } from '../telegram.js'

// Decorative 7×7 QR pattern from the design; the real code comes from the backend.
const QR = '1110111' + '1011001' + '1110111' + '0101010' + '1101101' + '1010110' + '1110101'

const DEFAULT = { clubId: 'pirat', typeLabel: 'Rus bilyardi', dayLabel: 'Bugun', slot: '19:00', end: '21:00', paid: 20000, atClub: 90000, payLabel: 'Click', number: 4821 }

export default function Confirmed() {
  const navigate = useNavigate()
  const b = { ...DEFAULT, ...useLocation().state }
  const club = clubById(b.clubId)

  return (
    <Screen back="/">
      <div className="body pad" style={{ paddingTop: 18 }}>
        <div className="col gap-8 center" style={{ alignItems: 'center' }}>
          <span className="done-icon" style={{ width: 56, height: 56 }}><Check /></span>
          <h1 className="d fs28">Bron tasdiqlandi</h1>
          <span className="mu fs14">Chek va QR kod bot chatiga ham yuborildi</span>
        </div>

        <div className="ticket">
          <div className="row gap-14">
            <div className="qr" role="img" aria-label="Bron QR kodi">
              {[...QR].map((c, i) => <span key={i} className={c === '1' ? 'q' : ''} />)}
            </div>
            <div className="col gap-2">
              <span className="fs12 ticket-mu">Bron № {b.number}</span>
              <b className="d" style={{ fontSize: 19 }}>{club.name}</b>
              <span className="fs13" style={{ color: 'var(--text-mu)' }}>{b.typeLabel}</span>
              <b className="fs17" style={{ paddingTop: 4 }}>{b.dayLabel.split(',')[0]}, {b.slot}–{b.end}</b>
            </div>
          </div>
          <div style={{ borderTop: '1px dashed #CDD6CA', paddingTop: 6 }}>
            {b.paid > 0 && <div className="r"><span className="ticket-mu">To‘landi ({b.payLabel})</span><b>{money(b.paid)}</b></div>}
            <div className="r"><span className="ticket-mu">Klubda to‘lanadi</span><b>{money(b.atClub)}</b></div>
            <div className="r"><span className="ticket-mu">Bepul bekor qilish</span><b>{addHours(b.slot, -2)} gacha</b></div>
          </div>
        </div>

        <div className="card row gap-12" style={{ padding: 14 }}>
          <span className="tg-circle"><Telegram /></span>
          <span className="col fs13"><b className="fs14">Bot eslatadi</b><span className="mu">O‘yindan 1 soat oldin @kigo_bot xabar yuboradi</span></span>
        </div>

        <div className="grid2">
          <button type="button" className="mbs" onClick={() => openLink(`https://yandex.uz/maps/?text=${encodeURIComponent(club.fullName + ' Toshkent')}`)}>Yo‘nalish</button>
          <Link to="/profile" className="mbs">Bronlarim</Link>
        </div>
      </div>

      <div className="mb">
        <button type="button" className="mbb" onClick={() => share(`${club.name}, ${b.dayLabel} ${b.slot} da o‘ynaymizmi? Men joy bron qildim.`)}>
          Sherikni Telegram’da chaqirish
        </button>
        <button type="button" className="ghost-btn" onClick={() => navigate('/', { replace: true })}>Bosh sahifaga</button>
      </div>
    </Screen>
  )
}
