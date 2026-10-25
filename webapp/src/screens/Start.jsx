import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Bars, ChipGroup, MultiChips, Sheet } from '../components/ui.jsx'
import { getUser, haptic, inTelegram, requestPhone } from '../telegram.js'
import { savePrefs } from '../storage.js'

const ROLES = [
  ['p', 'O‘ynayman', 'Sherik topish, joy bron qilish, turnirlar'],
  ['c', 'Klubim bor', 'Bronlar va mijozlarni boshqarish'],
  ['m', 'Murabbiyman', 'O‘quvchi topish, dars jadvali'],
  ['t', 'Turnir o‘tkazaman', 'Ishtirokchi va natijalarni yig‘ish'],
]
const SPORTS = ['Bilyard', 'Futbol', 'Padel', 'Tennis', 'Basketbol', 'Suzish', 'Shaxmat', 'Kibersport']
const LEVELS = ['Boshlang‘ich', 'O‘rta', 'Kuchli']
const AREAS = ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Shayxontohur', 'Yakkasaroy', 'Sergeli']

export default function Start() {
  const navigate = useNavigate()
  const user = getUser()
  const [step, setStep] = useState(1)
  const [roles, setRoles] = useState({ p: true })
  const [sports, setSports] = useState({ Bilyard: true, Futbol: true })
  const [level, setLevel] = useState('O‘rta')
  const [areas, setAreas] = useState({ Yunusobod: true })
  const [askPhone, setAskPhone] = useState(false)

  const finish = (phoneShared) => {
    savePrefs({ done: true, roles, sports, level, areas, phoneShared: Boolean(phoneShared) })
    navigate('/', { replace: true })
  }

  const next = () => {
    haptic('medium')
    if (step < 3) return setStep(step + 1)
    // In Telegram the native contact dialog is used; in a browser we show the design's sheet.
    if (inTelegram) requestPhone(finish)
    else setAskPhone(true)
  }

  return (
    <Screen>
      <div className="body pad" style={{ paddingTop: 18, gap: 18 }}>
        <Bars total={3} current={step - 1} />

        {step === 1 && (
          <div className="col gap-16">
            <div className="card row gap-12" style={{ padding: 12 }}>
              <span className="av-lg" style={{ background: 'var(--lime)' }}>{user.initials}</span>
              <span className="col flex1">
                <b>{user.name}</b>
                <span className="mu fs13">Telegram hisobingiz bilan kirdingiz{user.username && ` · ${user.username}`}</span>
              </span>
            </div>
            <h1 className="d fs30 lh-tight">Xush kelibsiz! KiGo’da nima qilasiz?</h1>
            <span className="mu fs14">Bir nechtasini tanlash mumkin. Keyin profilda o‘zgartirasiz.</span>
            {ROLES.map(([id, title, sub]) => (
              <button
                key={id}
                type="button"
                className={roles[id] ? 'role on' : 'role'}
                aria-pressed={Boolean(roles[id])}
                onClick={() => { haptic('light'); setRoles({ ...roles, [id]: !roles[id] }) }}
              >
                <span className="ck">{roles[id] ? '✓' : ''}</span>
                <span className="col"><b className="fs16">{title}</b><span className="mu fs13">{sub}</span></span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="col gap-16">
            <h1 className="d fs30 lh-tight">Qaysi sportlar?</h1>
            <span className="mu fs14">Shularga mos o‘yin va sheriklarni ko‘rsatamiz.</span>
            <MultiChips options={SPORTS} value={sports} onChange={setSports} />
            <b className="fs15" style={{ paddingTop: 6 }}>Darajangiz</b>
            <ChipGroup options={LEVELS} value={level} onChange={setLevel} />
          </div>
        )}

        {step === 3 && (
          <div className="col gap-16">
            <h1 className="d fs30 lh-tight">Qayerda o‘ynaysiz?</h1>
            <span className="mu fs14">Yaqin klublar va o‘yinlar birinchi chiqadi.</span>
            <MultiChips options={AREAS} value={areas} onChange={setAreas} />
            <div className="card col gap-6" style={{ padding: 14 }}>
              <b className="fs15">Telefon raqam nega kerak?</b>
              <span className="mu fs13">Klub broningizni tasdiqlashi uchun. Raqam faqat bron qilgan klubga ko‘rinadi.</span>
            </div>
          </div>
        )}
      </div>

      {askPhone && (
        <Sheet onClose={() => setAskPhone(false)}>
          <span className="mu fs12 center">Telegram oynasi</span>
          <b className="fs17 center">KiGo telefon raqamingizni so‘rayapti</b>
          <button type="button" className="mbb" onClick={() => finish(true)}>Raqamni ulashish</button>
          <button type="button" className="ghost-btn" onClick={() => finish(false)}>Keyinroq</button>
        </Sheet>
      )}

      <div className="mb">
        <button type="button" className="mbb" onClick={next}>{step < 3 ? 'Davom etish' : 'Tayyor'}</button>
      </div>
    </Screen>
  )
}
