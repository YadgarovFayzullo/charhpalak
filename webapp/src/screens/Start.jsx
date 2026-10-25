import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Bars, ChipGroup, MultiChips, Sheet } from '../components/ui.jsx'
import { useAction } from '../components/useAction.jsx'
import { haptic, inTelegram, requestPhone } from '../telegram.js'
import { api } from '../api.js'
import { useMe } from '../me.jsx'

const ROLES = [
  ['p', 'O‘ynayman', 'Sherik topish, joy bron qilish, turnirlar'],
  ['c', 'Klubim bor', 'Bronlar va mijozlarni boshqarish'],
  ['m', 'Murabbiyman', 'O‘quvchi topish, dars jadvali'],
  ['t', 'Turnir o‘tkazaman', 'Ishtirokchi va natijalarni yig‘ish'],
]
const SPORTS = ['Bilyard', 'Futbol', 'Padel', 'Tennis', 'Basketbol', 'Suzish', 'Shaxmat', 'Kibersport']
const LEVELS = ['Boshlang‘ich', 'O‘rta', 'Kuchli']
const AREAS = ['Yunusobod', 'Chilonzor', 'Mirzo Ulug‘bek', 'Shayxontohur', 'Yakkasaroy', 'Sergeli']

const keys = (o) => Object.keys(o).filter((k) => o[k])
const toSet = (arr, fallback) => Object.fromEntries((arr?.length ? arr : fallback).map((k) => [k, true]))

export default function Start() {
  const navigate = useNavigate()
  const me = useMe()
  const user = me.data
  const { run, busy, toast } = useAction()
  const [step, setStep] = useState(1)
  const [roles, setRoles] = useState(toSet(user.roles, ['p']))
  const [sports, setSports] = useState(toSet(user.sports, ['Bilyard', 'Futbol']))
  const [level, setLevel] = useState(user.level || 'O‘rta')
  const [areas, setAreas] = useState(toSet(user.areas, ['Yunusobod']))
  const [askPhone, setAskPhone] = useState(false)

  const finish = async (phone) => {
    const body = { roles: keys(roles), sports: keys(sports), level, areas: keys(areas), onboarded: true }
    if (phone) body.phone = phone
    const updated = await run(() => api('/api/me', { method: 'PATCH', body }))
    if (!updated) return
    me.setData(updated)
    navigate('/', { replace: true })
  }

  const next = () => {
    haptic('medium')
    if (step < 3) return setStep(step + 1)
    // In Telegram the native contact dialog is used; in a browser we show the design's sheet.
    if (inTelegram && !user.phone) requestPhone(finish)
    else if (!inTelegram && !user.phone) setAskPhone(true)
    else finish()
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
          <button type="button" className="mbb" disabled={busy} onClick={() => finish('+998 90 123 45 67')}>Raqamni ulashish</button>
          <button type="button" className="ghost-btn" disabled={busy} onClick={() => finish()}>Keyinroq</button>
        </Sheet>
      )}

      {toast}
      <div className="mb">
        <button type="button" className="mbb" disabled={busy || (step === 2 && !keys(sports).length)} onClick={next}>
          {step < 3 ? 'Davom etish' : 'Tayyor'}
        </button>
      </div>
    </Screen>
  )
}
