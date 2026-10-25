import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Bars, ChipGroup, Done } from '../components/ui.jsx'
import { useAction } from '../components/useAction.jsx'
import { api, useApi } from '../api.js'
import { useMe } from '../me.jsx'
import { money } from '../format.js'
import { haptic, openTelegramLink } from '../telegram.js'

const TITLES = ['Turnir haqida', 'Joy va sana', 'Ishtirok va to‘lov', 'Sovrin va yuborish']
const OTHER = '__other'
const UNITS = { Juftlik: 'juftlik', Jamoa: 'jamoa' }

const EMPTY = {
  name: '', sport: 'Padel', format: 'Juftlik', level: 'Havaskor', description: '',
  venue: '', club_id: null, start_date: '', end_date: '', time: '10:00', registration_until: '',
  max_players: 16, min_players: 8, fee: 0, payout_card: '', rules: '', prizes: '', sponsor: '',
}

// Values a step needs before "Davom etish" is allowed.
function stepError(f, step) {
  if (step === 0 && f.name.trim().length < 3) return 'Turnir nomini yozing'
  if (step === 1 && !f.venue.trim()) return 'Joyni tanlang'
  if (step === 1 && (!f.start_date || !f.end_date)) return 'Sanalarni kiriting'
  if (step === 1 && f.end_date < f.start_date) return 'Tugash sanasi boshlanishdan oldin'
  if (step === 2 && (f.min_players < 2 || f.max_players < f.min_players)) return 'Ishtirokchilar sonini tekshiring'
  return null
}

export default function TournamentApply() {
  const navigate = useNavigate()
  const edit = useLocation().state?.edit // an application to fix and resend
  const me = useMe().data
  const clubs = useApi('/api/clubs').data || []
  const { run, busy, toast } = useAction()

  const [step, setStep] = useState(0)
  const [sent, setSent] = useState(null)
  const [agree, setAgree] = useState(false)
  const [f, setF] = useState(edit ? { ...EMPTY, ...edit.data } : EMPTY)
  const [paid, setPaid] = useState(edit ? edit.data.fee > 0 : true)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const input = (key, type = 'text') => ({
    id: key, type, value: f[key] ?? '',
    onChange: (e) => set({ [key]: type === 'number' ? Number(e.target.value) : e.target.value }),
  })

  const last = step === 3
  const error = stepError(f, step)
  const venueKey = f.club_id || (f.venue ? OTHER : '')

  const next = async () => {
    if (error || (last && !agree)) return
    haptic('medium')
    if (!last) return setStep(step + 1)
    const body = { ...f, fee: paid ? f.fee : 0, unit: UNITS[f.format] || 'ishtirokchi', registration_until: f.registration_until || null }
    const app = await run(() => edit
      ? api(`/api/applications/${edit.id}`, { method: 'PUT', body })
      : api('/api/applications', { method: 'POST', body }))
    if (app) setSent(app)
  }

  if (sent) {
    return (
      <Screen back="/profile" title="Turnir o‘tkazish">
        <Done title={edit ? 'Ariza qayta yuborildi' : 'Ariza yuborildi'} text={`№ ${sent.number}. Admin 24 soat ichida ko‘rib chiqadi. Javob @kigo_bot orqali keladi.`}>
          <button type="button" className="link fs14" onClick={() => openTelegramLink('https://t.me/kigo_bot')}>Bot xabarini ko‘rish</button>
        </Done>
        <div className="mb"><button type="button" className="mbb" onClick={() => navigate('/applications', { replace: true, state: { id: sent.id } })}>Ariza holatini ko‘rish</button></div>
      </Screen>
    )
  }

  return (
    <Screen back="/profile" title="Turnir o‘tkazish">
      <div className="col gap-8" style={{ flex: 'none', padding: '12px 16px 4px' }}>
        <Bars total={4} current={step} />
        <div className="between fs12"><b>{TITLES[step]}</b><span className="mu">{step + 1} / 4</span></div>
      </div>

      <div className="body pad" style={{ padding: '12px 16px 20px', gap: 14 }}>
        {step === 0 && (
          <>
            <div className="hint"><span className="lime">ⓘ</span><span>Ariza admin tomonidan 24 soat ichida ko‘riladi. Tasdiqlangach turnir ilovada va saytda chiqadi.</span></div>
            <label className="fl" htmlFor="name">Turnir nomi<input {...input('name')} placeholder="Masalan: Chilonzor Padel Open" /></label>
            <div className="fl">Sport turi<ChipGroup options={['Padel', 'Tennis', 'Bilyard', 'Futbol', 'Shaxmat', 'Boshqa']} value={f.sport} onChange={(sport) => set({ sport })} /></div>
            <div className="fl">Format<ChipGroup options={['Yakka', 'Juftlik', 'Jamoa', 'Guruh + pley-off']} value={f.format} onChange={(format) => set({ format })} /></div>
            <div className="fl">Kim uchun<ChipGroup options={['Havaskor', 'O‘rta', 'Professional']} value={f.level} onChange={(level) => set({ level })} /></div>
            <label className="fl" htmlFor="description">Qisqa tavsif<textarea {...input('description')} placeholder="Juftlik turniri, ikki kun. Guruhlar va pley-off." /></label>
          </>
        )}

        {step === 1 && (
          <>
            <div className="fl">O‘tkaziladigan joy
              <div className="col gap-8">
                {clubs.map((c) => (
                  <button key={c.id} type="button" className={venueKey === c.id ? 'vsel' : 'vopt'} onClick={() => set({ club_id: c.id, venue: c.fullName })}>
                    {c.fullName}<span className="fs12 mu">KiGo klubi · {c.sport} · {c.district}</span>
                  </button>
                ))}
                <button type="button" className={venueKey === OTHER ? 'vsel' : 'vopt'} onClick={() => set({ club_id: null, venue: venueKey === OTHER ? f.venue : ' ' })}>
                  Boshqa joy<span className="fs12 mu">Manzilni o‘zingiz yozasiz, admin qo‘shimcha tekshiradi</span>
                </button>
                {venueKey === OTHER && <input className="field" aria-label="Manzil" placeholder="Joy nomi va manzili" value={f.venue.trim() ? f.venue : ''} onChange={(e) => set({ venue: e.target.value || ' ' })} />}
              </div>
            </div>
            <div className="grid2">
              <label className="fl" htmlFor="start_date">Boshlanish<input {...input('start_date', 'date')} /></label>
              <label className="fl" htmlFor="end_date">Tugash<input {...input('end_date', 'date')} /></label>
            </div>
            <div className="grid2">
              <label className="fl" htmlFor="time">Vaqt<input {...input('time', 'time')} /></label>
              <label className="fl" htmlFor="registration_until">Ro‘yxat yopiladi<input {...input('registration_until', 'date')} /></label>
            </div>
            {f.club_id && <div className="hint"><span className="lime">✓</span><span>KiGo klubi tanlandi: klubga kortlarni band qilish so‘rovi avtomatik ketadi. Klub roziligi admin uchun tekshiruvda ko‘rinadi.</span></div>}
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid2">
              <label className="fl" htmlFor="max_players">Maksimal ({UNITS[f.format] || 'ishtirokchi'})<input {...input('max_players', 'number')} min="2" /></label>
              <label className="fl" htmlFor="min_players">Minimal<input {...input('min_players', 'number')} min="2" /></label>
            </div>
            <div className="fl">Kirish to‘lovi<ChipGroup options={['Bepul', 'Pullik']} value={paid ? 'Pullik' : 'Bepul'} onChange={(v) => setPaid(v === 'Pullik')} /></div>
            {paid && (
              <div className="col gap-10">
                <label className="fl" htmlFor="fee">Har bir ishtirokchi uchun, so‘m<input {...input('fee', 'number')} min="0" step="10000" /></label>
                <label className="fl" htmlFor="payout_card">Pul qayerga tushadi (karta)<input {...input('payout_card')} inputMode="numeric" placeholder="8600 •••• •••• ••••" /></label>
                <span className="mu fs12">To‘lov ilova ichida Click/Payme orqali olinadi. KiGo xizmat haqi: [foiz, belgilanmagan].</span>
              </div>
            )}
            <label className="fl" htmlFor="rules">Qoidalar<textarea {...input('rules')} placeholder="Guruhlarda 1 set 6 gemgacha. Pley-off 2 set. Kechikish 10 daqiqa." /></label>
          </>
        )}

        {step === 3 && (
          <>
            <label className="fl" htmlFor="prizes">Sovrinlar<textarea {...input('prizes')} placeholder="1-o‘rin: 3 000 000 so‘m + kubok. 2-o‘rin: 1 500 000." /></label>
            <label className="fl" htmlFor="sponsor">Homiy (ixtiyoriy)<input {...input('sponsor')} /></label>
            <div className="col">
              <b className="fs15" style={{ paddingBottom: 4 }}>Tekshiring</b>
              <div className="sum"><span>Tashkilotchi</span><b>{me.name}{me.username && ` · ${me.username}`}</b></div>
              {me.phone && <div className="sum"><span>Telefon</span><b>{me.phone}</b></div>}
              <div className="sum"><span>Turnir</span><b>{f.name} · {f.sport} · {f.format}</b></div>
              <div className="sum"><span>Joy, sana</span><b>{f.venue.trim()} · {f.start_date}{f.end_date !== f.start_date && ` – ${f.end_date}`}</b></div>
              <div className="sum"><span>Ishtirok</span><b>{f.min_players}–{f.max_players} {UNITS[f.format] || 'ishtirokchi'} · {paid && f.fee ? money(f.fee) : 'bepul'}</b></div>
            </div>
            <button type="button" className={agree ? 'agree on' : 'agree'} aria-pressed={agree} onClick={() => setAgree(!agree)}>
              <i>{agree ? '✓' : ''}</i>
              <span>Qoidalar bilan tanishdim. Ma’lumotlar to‘g‘ri, turnir o‘tmasa ishtirokchilarga pul qaytariladi.</span>
            </button>
          </>
        )}
        {error && <span className="fs13" style={{ color: 'var(--orange)' }}>{error}</span>}
      </div>

      {toast}
      <div className="mb mb-row">
        {step > 0 && <button type="button" className="mb-back" onClick={() => setStep(step - 1)}>Orqaga</button>}
        <button type="button" className="mbb" disabled={busy || Boolean(error) || (last && !agree)} onClick={next}>
          {last ? (edit ? 'Qayta yuborish' : 'Arizani yuborish') : 'Davom etish'}
        </button>
      </div>
    </Screen>
  )
}
