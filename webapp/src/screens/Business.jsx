import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { ChipGroup, Done } from '../components/ui.jsx'
import { useAction } from '../components/useAction.jsx'
import { api } from '../api.js'
import { useMe } from '../me.jsx'
import { haptic } from '../telegram.js'

const TABLES = [['Stol 1', '0:42', '#C8F25A'], ['Stol 2', '1:15', '#C8F25A'], ['Stol 3', 'bo‘sh', '#EEF2E7'], ['Stol 4', '22:00', '#FFE7C2']]

const FEATURES = [
  ['Bron va depozit.', 'Click/Payme orqali, «kelmay qoldi» kamayadi.'],
  ['Kassa, bar, smena.', 'Stol vaqti va bar bitta chekda.'],
  ['Bot xabarlari.', 'Yangi bron va bekor qilish Telegram’ga darhol keladi.'],
]

export default function Business() {
  const navigate = useNavigate()
  const coach = useLocation().state?.kind === 'coach'
  const me = useMe().data
  const { run, busy, toast } = useAction()
  const [sport, setSport] = useState(coach ? 'Tennis' : 'Bilyard')
  const [name, setName] = useState(coach ? me.name : '')
  const [phone, setPhone] = useState(me.phone)
  const [sent, setSent] = useState(false)

  const send = async () => {
    const ok = await run(() => api('/api/business-leads', {
      method: 'POST',
      body: { kind: coach ? 'coach' : 'club', club_name: name, sport, phone },
    }))
    if (!ok) return
    haptic('heavy')
    setSent(true)
  }

  if (sent) {
    return (
      <Screen back="/profile" title="KiGo Business">
        <Done title="Ariza qabul qilindi" text="Menejer 24 soat ichida qo‘ng‘iroq qiladi yoki Telegram’da yozadi." />
        <div className="mb"><button type="button" className="mbb" onClick={() => navigate('/', { replace: true })}>Bosh sahifaga</button></div>
      </Screen>
    )
  }

  return (
    <Screen back="/profile" title="KiGo Business">
      <div className="body pad" style={{ gap: 18 }}>
        <div className="col gap-8">
          <h1 className="d fs28" style={{ lineHeight: 1.05 }}>{coach ? 'Murabbiy sifatida qo‘shiling' : 'Klubingizni bir joydan boshqaring'}</h1>
          <span className="mu fs14">{coach
            ? 'Ochiq jadval, oldindan to‘lov va yangi o‘quvchilar. Obuna yo‘q, faqat har darsdan 5%.'
            : 'Stollar, bronlar, kassa va bar. O‘yinchilar KiGo’dan o‘zi bron qiladi.'}</span>
        </div>

        {!coach && (
          <>
            <div className="col gap-8" style={{ background: 'var(--paper)', color: 'var(--text)', borderRadius: 16, padding: 12 }}>
              <div className="between fs12"><b>Zal · hozir</b><span style={{ color: 'var(--field-mu)' }}>21:42</span></div>
              <div className="grid4" style={{ gap: 6 }}>
                {TABLES.map(([t, v, bg]) => <span key={t} className="tcell" style={{ background: bg }}><b>{t}</b>{v}</span>)}
              </div>
              <div className="between fs12" style={{ borderTop: '1px solid #E3E8DE', paddingTop: 8 }}>
                <span><b>3,1 mln</b> tushum</span><span><b>18</b> KiGo bron</span><span><b>74%</b> bandlik</span>
              </div>
            </div>

            <div className="col gap-12">
              {FEATURES.map(([t, d], i) => (
                <div key={t} className="ft"><i>{i + 1}</i><span><b>{t}</b> <span className="mu">{d}</span></span></div>
              ))}
            </div>

            <div className="col gap-4" style={{ background: 'var(--lime)', color: 'var(--dark)', borderRadius: 16, padding: 16 }}>
              <span className="fs12" style={{ fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Narx</span>
              <span><b className="d fs30">300 000</b> <b>so‘m / oy</b></span>
              <span className="fs14" style={{ fontWeight: 600 }}>+ KiGo orqali kelgan bronlardan 1–2%</span>
            </div>
          </>
        )}

        <div className="col gap-12">
          <b className="fs17">Ariza</b>
          <label className="fl" htmlFor="kn">{coach ? 'Ismingiz' : 'Klub nomi'}<input id="kn" placeholder={coach ? '' : 'Masalan: «Pirat»'} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <ChipGroup options={coach ? ['Tennis', 'Futbol', 'Suzish', 'Padel', 'Boshqa'] : ['Bilyard', 'Futbol', 'Kompyuter klubi', 'Boshqa']} value={sport} onChange={setSport} />
          <label className="fl" htmlFor="kp">Telefon<input id="kp" type="tel" placeholder="+998" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </div>
      </div>

      {toast}
      <div className="mb">
        <button type="button" className="mbb" disabled={busy || !name.trim() || phone.trim().length < 5} onClick={send}>Ariza yuborish</button>
      </div>
    </Screen>
  )
}
