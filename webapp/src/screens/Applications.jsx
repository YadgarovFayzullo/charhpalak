import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { Async } from '../components/State.jsx'
import { useAction } from '../components/useAction.jsx'
import { api, useApi } from '../api.js'
import { haptic, openTelegramLink } from '../telegram.js'

const STATUS = {
  rev: ['Ko‘rib chiqilmoqda', { background: '#FFF1CC', color: '#7A5200' }],
  info: ['Ma’lumot so‘raldi', { background: '#FFE4D6', color: '#9A3A12' }],
  ok: ['E’lon qilingan', { background: '#C8F25A', color: '#0F1F14' }],
  no: ['Rad etilgan', { background: '#F1E3E3', color: '#8A2A2A' }],
}

// Past events come from the backend; the steps still ahead depend on the status.
function timeline(a) {
  const done = a.history.map((h) => ['ok', h.title, h.at])
  const lastTitle = a.history.at(-1)?.title
  if (a.status === 'info') {
    done[done.length - 1] = ['now', 'Ma’lumot so‘raldi', `${a.history.at(-1).at} · 72 soat ichida javob bering`]
    return [...done, ['', 'Qayta ko‘rib chiqish', ''], ['', 'Qaror', '']]
  }
  if (a.status === 'rev') {
    const again = ['Siz javob berdingiz', 'Qayta yuborildi'].includes(lastTitle)
    return [...done, ['now', again ? 'Qayta ko‘rib chiqilmoqda' : 'Tekshirilmoqda', 'odatda 24 soat ichida'], ['', 'Qaror', 'tasdiq yoki rad, bot xabar beradi']]
  }
  if (a.status === 'ok') return [...done, ['', 'Turnir boshlanadi', a.data.start_date]]
  return done
}

export default function Applications() {
  const res = useApi('/api/applications')
  const wanted = useLocation().state?.id
  return (
    <Screen back="/profile" title="Mening arizalarim">
      <Async res={res}>
        {(list) => list.length
          ? <AppView list={list} initial={wanted} onChange={(a) => res.setData((l) => l.map((x) => (x.id === a.id ? a : x)))} />
          : (
            <div className="state">
              <b className="fs16">Hali ariza yo‘q</b>
              <span className="mu fs14 measure">Istalgan sportda turnir o‘tkazing, ishtirokchi yig‘ing.</span>
              <Link to="/tournament-apply" className="mbs" style={{ width: 'auto', padding: '0 20px' }}>Turnir o‘tkazish</Link>
            </div>
          )}
      </Async>
    </Screen>
  )
}

function AppView({ list, initial, onChange }) {
  const navigate = useNavigate()
  const [id, setId] = useState(initial || list[0].id)
  const a = list.find((x) => x.id === id) || list[0]
  const [answer, setAnswer] = useState('')
  const { run, busy, toast } = useAction()
  const t = useApi(`/api/tournaments/${a.tournamentId}`, { skip: !a.tournamentId })

  const sendAnswer = async () => {
    const updated = await run(() => api(`/api/applications/${a.id}/answer`, { method: 'POST', body: { answer } }))
    if (!updated) return
    haptic('heavy')
    setAnswer('')
    onChange(updated)
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(a.data.start_date) - new Date()) / 86400000))

  return (
    <>
      <div className="body pad" style={{ padding: '14px 16px 20px' }}>
        {list.length > 1 && (
          <div className="hscroll">
            {list.map((x) => (
              <button key={x.id} type="button" className={x.id === a.id ? 'chip-sm on' : 'chip-sm'} onClick={() => setId(x.id)}>{x.number}</button>
            ))}
          </div>
        )}

        <div className="col gap-8">
          <div className="between"><span className="mu fs12">№ {a.number} · {a.sport} · {a.format.toLowerCase()}</span><span className="status" style={STATUS[a.status][1]}>{STATUS[a.status][0]}</span></div>
          <h1 className="d fs26" style={{ lineHeight: 1.1 }}>{a.title}</h1>
          <span className="mu fs13">{a.venue} · {a.dates} · {a.players}</span>
        </div>

        {a.status === 'info' && (
          <>
            <div className="note" style={{ borderColor: '#9A3A12', background: '#22170F' }}>
              <div className="row gap-10">
                <span className="av-lg fs12" style={{ width: 32, height: 32, background: '#FFE4D6', color: '#9A3A12' }}>{a.moderator.slice(0, 2).toUpperCase()}</span>
                <span className="col"><b className="fs14">{a.moderator} · moderator</b><span className="mu fs11">{a.history.at(-1)?.at}</span></span>
              </div>
              <span className="fs14" style={{ lineHeight: 1.45 }}>{a.comment}</span>
              {a.commentFields.length > 0 && (
                <span className="chips" style={{ gap: 6 }}>
                  {a.commentFields.map((x) => <span key={x} className="status" style={STATUS.info[1]}>{x}</span>)}
                </span>
              )}
            </div>
            <div className="col gap-10">
              <label className="fl" htmlFor="an">Javobingiz
                <textarea id="an" value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ minHeight: 72, background: 'var(--bg)', borderColor: 'var(--line-chip)' }} placeholder="Masalan: klub administratori kontakti, kelishuv tafsilotlari" />
              </label>
              <span className="mu fs12">Fayl kerak bo‘lsa, @kigo_sherik ga yuboring.</span>
              <Link to="/tournament-apply" state={{ edit: a }} className="fs13">Arizadagi maydonlarni tahrirlash</Link>
            </div>
          </>
        )}

        {a.status === 'ok' && (
          <>
            <div className="note" style={{ background: 'var(--lime)', color: 'var(--dark)', borderColor: 'var(--lime)' }}>
              <b className="fs16">Turniringiz tasdiqlandi va e’lon qilindi</b>
              <span className="fs14">Ro‘yxatdan o‘tish ochildi. Turnir «Turnirlar» bo‘limida, bosh ekranda va kigo.uz saytida ko‘rinadi.</span>
            </div>
            {t.data && (
              <div className="grid3 center fs12">
                {[[t.data.count, 'ro‘yxatda'], [t.data.max - t.data.count, 'joy'], [daysLeft, 'kun qoldi']].map(([v, l]) => (
                  <div key={l} className="note" style={{ padding: 10, gap: 2 }}><b className="fs20">{v}</b><span className="mu">{l}</span></div>
                ))}
              </div>
            )}
          </>
        )}

        {a.status === 'no' && (
          <div className="note" style={{ borderColor: '#8A2A2A', background: '#241212' }}>
            <b className="fs15">Ariza rad etildi</b>
            <span className="fs14" style={{ lineHeight: 1.45 }}><span className="mu">Sabab:</span> {a.reason}</span>
          </div>
        )}

        <div className="col">
          <b className="fs15" style={{ paddingBottom: 10 }}>Tarix</b>
          {timeline(a).map(([dot, title, d], i) => (
            <div key={i} className="tl">
              <div className="col" style={{ alignItems: 'center' }}><span className={`dot ${dot}`} /><span className="ln" /></div>
              <div className="col gap-2" style={{ paddingBottom: 16 }}><b className="fs14">{title}</b>{d && <span className="mu fs12">{d}</span>}</div>
            </div>
          ))}
        </div>
        <span className="mu fs12">Savol bo‘lsa: <button type="button" className="link" onClick={() => openTelegramLink('https://t.me/kigo_sherik')}>@kigo_sherik</button></span>
      </div>

      {toast}
      <div className="mb">
        {a.status === 'ok' && <Link to={`/tournament/${a.tournamentId}`} className="mbb">Turnir sahifasini ochish</Link>}
        {a.status === 'info' && <button type="button" className="mbb" disabled={busy || !answer.trim()} onClick={sendAnswer}>Javobni yuborish</button>}
        {a.status === 'no' && <button type="button" className="mbb" onClick={() => navigate('/tournament-apply', { state: { edit: a } })}>Tuzatib qayta yuborish</button>}
        {a.status === 'rev' && <button type="button" className="mbb gh" disabled>Ko‘rib chiqilmoqda…</button>}
      </div>
    </>
  )
}
