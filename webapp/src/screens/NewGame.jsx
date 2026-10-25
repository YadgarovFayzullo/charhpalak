import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { ChipGroup, ToggleRow } from '../components/ui.jsx'
import { useAction } from '../components/useAction.jsx'
import { api } from '../api.js'
import { haptic } from '../telegram.js'

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

// Today, tomorrow and the next 5 days as chip labels → ISO dates.
function dayOptions() {
  const base = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const label = i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : WEEKDAYS[d.getDay()]
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { label, iso }
  })
}

export default function NewGame() {
  const navigate = useNavigate()
  const days = dayOptions()
  const { run, busy, toast } = useAction()
  const [sport, setSport] = useState('Futbol')
  const [day, setDay] = useState(days[1].label)
  const [time, setTime] = useState('19:00')
  const [place, setPlace] = useState('«Arena» maydoni, 6×6')
  const [need, setNeed] = useState(2)
  const [level, setLevel] = useState('O‘rta')
  const [price, setPrice] = useState('30 000 so‘m')
  const [toGroup, setToGroup] = useState(true)

  const publish = async () => {
    const date = days.find((d) => d.label === day).iso
    const game = await run(() => api('/api/games', {
      method: 'POST',
      body: { sport, level, date, time, place, need, price: price.replace(/\s*so‘m$/, '') + '/kishi', to_group: toGroup },
    }))
    if (!game) return
    haptic('heavy')
    navigate('/games', { replace: true })
  }

  return (
    <Screen back="/games">
      <div className="body pad" style={{ gap: 20 }}>
        <h1 className="d fs26">Sherik kerakmi?</h1>

        <div className="col gap-10"><span className="lb">Sport</span>
          <ChipGroup options={['Futbol', 'Bilyard', 'Padel', 'Tennis', 'Basketbol']} value={sport} onChange={setSport} />
        </div>

        <div className="col gap-10"><span className="lb">Qachon</span>
          <ChipGroup options={days.map((d) => d.label)} value={day} onChange={setDay} scroll />
          <ChipGroup options={['08:00', '10:00', '17:00', '18:00', '19:00', '20:00', '21:00']} value={time} onChange={setTime} scroll />
        </div>

        <div className="fl"><label htmlFor="pl" className="lb" style={{ color: 'var(--ink)' }}>Joy</label>
          <input id="pl" value={place} onChange={(e) => setPlace(e.target.value)} style={{ minHeight: 52 }} />
          <span className="mu fs12">Joy hali bron qilinmagan. E’londan keyin bron qilishingiz mumkin.</span>
        </div>

        <div className="between">
          <span className="col"><span className="lb">Yana necha kishi kerak</span><span className="mu fs12">Siz bilan birga {need + 1} kishi</span></span>
          <span className="row gap-12">
            <button type="button" className="stepper" aria-label="Kamaytirish" onClick={() => setNeed(Math.max(1, need - 1))}>−</button>
            <b className="fs20 center" style={{ minWidth: 20 }}>{need}</b>
            <button type="button" className="stepper" aria-label="Ko‘paytirish" onClick={() => setNeed(Math.min(21, need + 1))}>+</button>
          </span>
        </div>

        <div className="col gap-10"><span className="lb">Daraja</span>
          <ChipGroup options={['Har qanday', 'Boshlang‘ich', 'O‘rta', 'Kuchli']} value={level} onChange={setLevel} />
        </div>

        <div className="fl"><label htmlFor="pp" className="lb" style={{ color: 'var(--ink)' }}>Kishi boshiga</label>
          <input id="pp" value={price} onChange={(e) => setPrice(e.target.value)} style={{ fontSize: 16, minHeight: 52 }} />
        </div>

        <ToggleRow title="Telegram guruhga ham yuborish" hint={`«Toshkent ${sport.toLowerCase()}» guruhiga e’lon tushadi`} on={toGroup} onToggle={() => setToGroup(!toGroup)} />
      </div>

      {toast}
      <div className="mb"><button type="button" className="mbb" disabled={busy || !place.trim()} onClick={publish}>E’lon qilish</button></div>
    </Screen>
  )
}
