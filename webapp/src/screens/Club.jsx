import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { UnderlineTabs } from '../components/ui.jsx'
import { clubById } from '../data.js'
import { addHours, money, nextDays } from '../format.js'
import { haptic, openLink, share } from '../telegram.js'

const TIMES = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00']

export default function Club() {
  const { id } = useParams()
  const club = clubById(id)
  const navigate = useNavigate()
  const location = useLocation()
  const days = nextDays(6)

  const [tab, setTab] = useState('bron')
  const [day, setDay] = useState(0)
  const [type, setType] = useState(0)
  const [slot, setSlot] = useState(location.state?.slot || '19:00')
  const [dur, setDur] = useState(2)

  const busy = club.busy[day] || []
  const price = club.types[type].price
  const total = price * dur
  const end = addHours(slot, dur)

  const book = () => {
    haptic('medium')
    navigate('/booking', {
      state: { clubId: club.id, dayLabel: days[day].label, typeLabel: club.types[type].label, price, slot, end, dur },
    })
  }

  return (
    <Screen back="/search">
      <div className="body">
        <div className="hero-img">
          <img src={club.img} alt={club.name} />
          <span className="pill pill-md hero-count">1 / {club.photos}</span>
        </div>

        <div className="col gap-10" style={{ padding: '14px 16px 0' }}>
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <span className="col gap-2">
              <h1 className="d fs24">{club.fullName}</h1>
              <span className="mu fs13">★ {club.rating}{club.reviewsCount ? ` · ${club.reviewsCount} sharh` : ''} · {club.district} · {club.dist}</span>
            </span>
            <span className="pill pill-md pill-soft">Ochiq</span>
          </div>
          <div className="row-8">
            <button type="button" className="act" onClick={() => openLink(`https://yandex.uz/maps/?text=${encodeURIComponent(club.fullName + ' Toshkent')}`)}>Yo‘nalish</button>
            <button type="button" className="act">Qo‘ng‘iroq</button>
            <button type="button" className="act" onClick={() => share(`${club.fullName} — KiGo’da bron qiling`)}>Ulashish</button>
          </div>
        </div>

        <UnderlineTabs
          label="Klub bo‘limlari"
          options={[['bron', 'Bron'], ['narx', 'Narx va qulaylik'], ['sharh', 'Sharhlar']]}
          value={tab}
          onChange={setTab}
        />

        <div className="pad">
          {tab === 'bron' && (
            <>
              <div className="hscroll">
                {days.map((d, i) => (
                  <button key={d.label} type="button" className={day === i ? 'day on' : 'day'} onClick={() => setDay(i)}>
                    <span>{d.w}</span><b>{d.n}</b>
                  </button>
                ))}
              </div>
              {club.types.length > 1 && (
                <div className="chips">
                  {club.types.map((t, i) => (
                    <button key={t.label} type="button" className={type === i ? 'opt on' : 'opt'} onClick={() => setType(i)}>{t.label}</button>
                  ))}
                </div>
              )}
              <div className="between"><b className="fs15">Boshlanish vaqti</b><span className="mu fs12">chiziqli = band</span></div>
              <div className="grid4">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={slot === t ? 'sl on' : 'sl'}
                    disabled={busy.includes(t)}
                    onClick={() => { haptic('light'); setSlot(t) }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="between">
                <b className="fs15">Davomiyligi</b>
                <div className="row gap-6">
                  {[1, 2, 3].map((h) => (
                    <button key={h} type="button" className={dur === h ? 'opt on' : 'opt'} onClick={() => setDur(h)}>{h} s</button>
                  ))}
                </div>
              </div>
              <span className="mu fs13">{days[day].w}, {slot}–{end} · 2 soat oldin bepul bekor qilinadi</span>
            </>
          )}

          {tab === 'narx' && (
            <div>
              {club.prices.map(([k, v]) => <div key={k} className="price-row"><span>{k}</span><b>{v}</b></div>)}
              {club.amenities.length > 0 && (
                <div className="chips" style={{ paddingTop: 14 }}>
                  {club.amenities.map((a) => <span key={a} className="pill pill-md tag">{a}</span>)}
                </div>
              )}
            </div>
          )}

          {tab === 'sharh' && (
            club.reviews.length ? club.reviews.map((r) => (
              <div key={r.name} className="card col gap-6" style={{ padding: 14, borderRadius: 14 }}>
                <div className="between"><b>{r.name}</b><span className="lime">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span></div>
                <span className="fs14">{r.text}</span>
              </div>
            )) : <span className="mu center">Hali sharh yo‘q</span>
          )}
        </div>
      </div>

      <div className="mb">
        <button type="button" className="mbb" onClick={book} disabled={busy.includes(slot)}>Bron qilish · {money(total)}</button>
      </div>
    </Screen>
  )
}
