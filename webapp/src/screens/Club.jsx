import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { UnderlineTabs } from '../components/ui.jsx'
import { Async } from '../components/State.jsx'
import { useApi } from '../api.js'
import { addHours, money } from '../format.js'
import { haptic, openLink, share } from '../telegram.js'

export default function Club() {
  const { id } = useParams()
  const res = useApi(`/api/clubs/${id}`)
  return (
    <Screen back="/search">
      <Async res={res}>{(club) => <ClubBody club={club} />}</Async>
    </Screen>
  )
}

function ClubBody({ club }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('bron')
  const [day, setDay] = useState(0)
  const [type, setType] = useState(0)
  const [slot, setSlot] = useState(location.state?.slot || club.slots[0] || club.times[2])
  const [dur, setDur] = useState(2)

  const t = club.types[type]
  const busy = club.busy[t.id][day] || []
  const end = addHours(slot, dur)
  // Every hour of the chosen duration must be free (and within the evening schedule).
  const startIdx = club.times.indexOf(slot)
  const span = club.times.slice(startIdx, startIdx + dur)
  const blocked = span.length < dur || span.some((x) => busy.includes(x))

  const book = () => {
    haptic('medium')
    navigate('/booking', {
      state: {
        clubId: club.id, clubName: club.name, img: club.img, typeId: t.id, typeLabel: t.label, price: t.price,
        date: club.days[day].date, dayLabel: club.days[day].label, slot, end, dur,
      },
    })
  }

  return (
    <>
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

        <UnderlineTabs label="Klub bo‘limlari" options={[['bron', 'Bron'], ['narx', 'Narx va qulaylik'], ['sharh', 'Sharhlar']]} value={tab} onChange={setTab} />

        <div className="pad">
          {tab === 'bron' && (
            <>
              <div className="hscroll">
                {club.days.map((d, i) => {
                  const [w, n] = d.label.split(', ')
                  return (
                    <button key={d.date} type="button" className={day === i ? 'day on' : 'day'} onClick={() => setDay(i)}>
                      <span>{w}</span><b>{parseInt(n, 10)}</b>
                    </button>
                  )
                })}
              </div>
              {club.types.length > 1 && (
                <div className="chips">
                  {club.types.map((x, i) => (
                    <button key={x.id} type="button" className={type === i ? 'opt on' : 'opt'} onClick={() => setType(i)}>{x.label}</button>
                  ))}
                </div>
              )}
              <div className="between"><b className="fs15">Boshlanish vaqti</b><span className="mu fs12">chiziqli = band</span></div>
              <div className="grid4">
                {club.times.map((x) => (
                  <button key={x} type="button" className={slot === x ? 'sl on' : 'sl'} disabled={busy.includes(x)} onClick={() => { haptic('light'); setSlot(x) }}>
                    {x}
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
              <span className="mu fs13">
                {blocked ? 'Tanlangan vaqt band. Boshqa vaqt yoki davomiylikni tanlang.' : `${club.days[day].label.split(',')[0]}, ${slot}–${end} · 2 soat oldin bepul bekor qilinadi`}
              </span>
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
              <div key={r.name + r.text} className="card col gap-6" style={{ padding: 14, borderRadius: 14 }}>
                <div className="between"><b>{r.name}</b><span className="lime">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span></div>
                <span className="fs14">{r.text}</span>
              </div>
            )) : <span className="mu center">Hali sharh yo‘q</span>
          )}
        </div>
      </div>

      <div className="mb">
        <button type="button" className="mbb" onClick={book} disabled={blocked}>Bron qilish · {money(t.price * dur)}</button>
      </div>
    </>
  )
}
