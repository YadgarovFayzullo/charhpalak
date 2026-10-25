import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { ChipGroup, ToggleRow } from '../components/ui.jsx'
import { haptic } from '../telegram.js'

export default function NewGame() {
  const navigate = useNavigate()
  const [sport, setSport] = useState('Futbol')
  const [day, setDay] = useState('Shanba')
  const [time, setTime] = useState('19:00')
  const [need, setNeed] = useState(2)
  const [level, setLevel] = useState('O‘rta')
  const [price, setPrice] = useState('30 000 so‘m')
  const [toGroup, setToGroup] = useState(true)

  const publish = () => {
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
          <ChipGroup options={['Bugun', 'Ertaga', 'Shanba', 'Yakshanba']} value={day} onChange={setDay} scroll />
          <ChipGroup options={['17:00', '18:00', '19:00', '20:00', '21:00']} value={time} onChange={setTime} scroll />
        </div>

        <div className="col gap-10"><span className="lb">Joy</span>
          <Link to="/search" className="sel-link"><span>«Arena» maydoni, 6×6</span><span className="mu">O‘zgartirish ›</span></Link>
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

      <div className="mb"><button type="button" className="mbb" onClick={publish}>E’lon qilish</button></div>
    </Screen>
  )
}
