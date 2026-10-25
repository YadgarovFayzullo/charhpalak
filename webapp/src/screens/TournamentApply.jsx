import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Bars, ChipGroup, Done } from '../components/ui.jsx'
import { getUser, haptic, openTelegramLink } from '../telegram.js'

const TITLES = ['Turnir haqida', 'Joy va sana', 'Ishtirok va to‘lov', 'Sovrin va yuborish']
const VENUES = [
  ['Padel Club «Chilonzor»', 'KiGo klubi · 4 kort · bo‘sh sanalar ko‘rinadi'],
  ['Tennis Park Yunusobod', 'KiGo klubi · 6 kort'],
  ['Boshqa joy', 'Manzilni o‘zingiz yozasiz, admin qo‘shimcha tekshiradi'],
]

// Uncontrolled text field: the value lives in the DOM until submit.
const Field = ({ id, label, value, area }) => (
  <label className="fl" htmlFor={id}>{label}{area ? <textarea id={id} defaultValue={value} /> : <input id={id} defaultValue={value} />}</label>
)

export default function TournamentApply() {
  const navigate = useNavigate()
  const user = getUser()
  const [step, setStep] = useState(0)
  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ name: 'Chilonzor Padel Open', sport: 'Padel', format: 'Juftlik', level: 'Havaskor', venue: 0, fee: 'Pullik', agree: false })
  const set = (patch) => setF({ ...f, ...patch })

  const last = step === 3
  const blocked = last && !f.agree

  const next = () => {
    if (blocked) return
    haptic('medium')
    if (last) setSent(true)
    else setStep(step + 1)
  }

  if (sent) {
    return (
      <Screen back="/profile" title="Turnir o‘tkazish">
        <Done title="Ariza yuborildi" text="№ T-0142. Admin 24 soat ichida ko‘rib chiqadi. Javob @kigo_bot orqali keladi.">
          <button type="button" className="link fs14" onClick={() => openTelegramLink('https://t.me/kigo_bot')}>Bot xabarini ko‘rish</button>
        </Done>
        <div className="mb"><button type="button" className="mbb" onClick={() => navigate('/applications', { replace: true })}>Ariza holatini ko‘rish</button></div>
      </Screen>
    )
  }

  return (
    <Screen back="/profile" title="Turnir o‘tkazish">
      <div className="col gap-8" style={{ flex: 'none', padding: '12px 16px 4px' }}>
        <Bars total={4} current={step} />
        <div className="between fs12"><b>{TITLES[step]}</b><span className="mu">{step + 1} / 4 · qoralama saqlandi</span></div>
      </div>

      <div className="body pad" style={{ padding: '12px 16px 20px', gap: 14 }}>
        {step === 0 && (
          <>
            <div className="hint"><span className="lime">ⓘ</span><span>Ariza admin tomonidan 24 soat ichida ko‘riladi. Tasdiqlangach turnir ilovada va saytda chiqadi.</span></div>
            <label className="fl" htmlFor="tn">Turnir nomi<input id="tn" value={f.name} onChange={(e) => set({ name: e.target.value })} /></label>
            <div className="fl">Sport turi<ChipGroup options={['Padel', 'Tennis', 'Bilyard', 'Futbol', 'Shaxmat', 'Boshqa']} value={f.sport} onChange={(sport) => set({ sport })} /></div>
            <div className="fl">Format<ChipGroup options={['Yakka', 'Juftlik', 'Jamoa', 'Guruh + pley-off']} value={f.format} onChange={(format) => set({ format })} /></div>
            <div className="fl">Kim uchun<ChipGroup options={['Havaskor', 'O‘rta', 'Professional']} value={f.level} onChange={(level) => set({ level })} /></div>
            <Field id="td" label="Qisqa tavsif" area value="Juftlik turniri, ikki kun. Guruhlar va pley-off." />
          </>
        )}

        {step === 1 && (
          <>
            <div className="fl">O‘tkaziladigan joy
              <div className="col gap-8">
                {VENUES.map(([t, d], i) => (
                  <button key={t} type="button" className={f.venue === i ? 'vsel' : 'vopt'} onClick={() => set({ venue: i })}>
                    {t}<span className="fs12 mu">{d}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid2"><Field id="d1" label="Boshlanish" value="15.11.2026" /><Field id="d2" label="Tugash" value="16.11.2026" /></div>
            <div className="grid2"><Field id="t1" label="Vaqt" value="10:00" /><Field id="t2" label="Ro‘yxat yopiladi" value="12.11.2026" /></div>
            <div className="hint"><span className="lime">✓</span><span>KiGo klubi tanlansa, klubga kortlarni band qilish so‘rovi avtomatik ketadi. Klub roziligi admin uchun tekshiruvda ko‘rinadi.</span></div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid2"><Field id="mx" label="Maksimal ishtirokchi" value="16 juftlik" /><Field id="mn" label="Minimal" value="8 juftlik" /></div>
            <div className="fl">Kirish to‘lovi<ChipGroup options={['Bepul', 'Pullik']} value={f.fee} onChange={(fee) => set({ fee })} /></div>
            {f.fee === 'Pullik' && (
              <div className="col gap-10">
                <Field id="fe" label="Har bir ishtirokchi (juftlik) uchun" value="200 000 so‘m" />
                <div className="fl">Pul qayerga tushadi<div className="sel">Karta: 8600 •••• 4417 <span className="mu">o‘zgartirish</span></div></div>
                <span className="mu fs12">To‘lov ilova ichida Click/Payme orqali olinadi. KiGo xizmat haqi: [foiz, belgilanmagan].</span>
              </div>
            )}
            <Field id="ru" label="Qoidalar" area value="Guruhlarda 1 set 6 gemgacha. Pley-off 2 set. Kechikish 10 daqiqa." />
          </>
        )}

        {step === 3 && (
          <>
            <Field id="pz" label="Sovrinlar" area value="1-o‘rin: 3 000 000 so‘m + kubok. 2-o‘rin: 1 500 000. 3-o‘rin: raketka." />
            <Field id="sp" label="Homiy (ixtiyoriy)" value="Padel Store Tashkent" />
            <div className="fl">Muqova rasmi
              <label className="upload" htmlFor="cover"><b style={{ color: 'var(--ink)' }}>+ Rasm yuklash</b>1200×630, 5 MB gacha</label>
              <input id="cover" type="file" accept="image/*" className="sr-only" />
            </div>
            <div className="col">
              <b className="fs15" style={{ paddingBottom: 4 }}>Tekshiring</b>
              <div className="sum"><span>Tashkilotchi</span><b>{user.name}{user.username && ` · ${user.username}`}</b></div>
              <div className="sum"><span>Turnir</span><b>{f.name} · {f.sport} · {f.format}</b></div>
              <div className="sum"><span>Joy, sana</span><b>{VENUES[f.venue][0]} · 15–16 noyabr</b></div>
              <div className="sum"><span>Ishtirok</span><b>8–16 juftlik · {f.fee === 'Pullik' ? '200 000 so‘m' : 'bepul'}</b></div>
            </div>
            <button type="button" className={f.agree ? 'agree on' : 'agree'} aria-pressed={f.agree} onClick={() => set({ agree: !f.agree })}>
              <i>{f.agree ? '✓' : ''}</i>
              <span>Qoidalar bilan tanishdim. Ma’lumotlar to‘g‘ri, turnir o‘tmasa ishtirokchilarga pul qaytariladi.</span>
            </button>
          </>
        )}
      </div>

      <div className="mb mb-row">
        {step > 0 && <button type="button" className="mb-back" onClick={() => setStep(step - 1)}>Orqaga</button>}
        <button type="button" className="mbb" disabled={blocked} onClick={next}>{last ? 'Arizani yuborish' : 'Davom etish'}</button>
      </div>
    </Screen>
  )
}
