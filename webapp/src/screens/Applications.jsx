import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { TOURNAMENT } from '../data.js'
import { haptic, openTelegramLink } from '../telegram.js'

const STATUS = {
  rev: ['Ko‘rib chiqilmoqda', { background: '#FFF1CC', color: '#7A5200' }],
  info: ['Ma’lumot so‘raldi', { background: '#FFE4D6', color: '#9A3A12' }],
  ok: ['E’lon qilingan', { background: '#C8F25A', color: '#0F1F14' }],
  no: ['Rad etilgan', { background: '#F1E3E3', color: '#8A2A2A' }],
}

const BASE = [['ok', 'Ariza yuborildi', '24-okt, 11:05 · qoralama 2 kunda to‘ldirildi'], ['ok', 'Admin ko‘ra boshladi', '24-okt, 13:40 · Aziza K.']]

function timeline(st, answered) {
  if (st === 'rev' && answered) return [['ok', 'Ma’lumot so‘raldi', '24-okt, 14:20'], ['ok', 'Siz javob berdingiz', 'hozir · 1 fayl'], ['now', 'Qayta ko‘rib chiqilmoqda', 'odatda 24 soat ichida'], ['', 'Qaror', 'tasdiq yoki rad, bot xabar beradi']]
  if (st === 'rev') return [['now', 'Tekshirilmoqda', 'odatda 24 soat ichida'], ['', 'Qaror', 'tasdiq yoki rad, bot xabar beradi']]
  if (st === 'info') return [['now', 'Ma’lumot so‘raldi', '24-okt, 14:20 · 72 soat ichida javob bering'], ['', 'Qayta ko‘rib chiqish', ''], ['', 'Qaror', '']]
  if (st === 'ok') return [['ok', 'Tasdiqlandi', '25-okt, 10:12'], ['ok', 'E’lon qilindi', 'ro‘yxatdan o‘tish ochiq'], ['', 'Turnir boshlanadi', '15-noyabr, 10:00']]
  return [['ok', 'Rad etildi', '25-okt, 10:12 · sabab ko‘rsatilgan']]
}

const DEMOS = [['rev', 'Tekshiruvda'], ['info', 'Ma’lumot kerak'], ['ok', 'Tasdiqlangan'], ['no', 'Rad etilgan']]

export default function Applications() {
  // Status comes from the backend; `info` matches the design's default.
  const [status, setStatus] = useState('info')
  const [answered, setAnswered] = useState(false)
  const st = status === 'info' && answered ? 'rev' : status

  let main = { label: 'Arizani ochish', cls: 'mbb gh', onClick: () => {} }
  if (st === 'info') main = { label: 'Javobni yuborish', cls: 'mbb', onClick: () => { haptic('heavy'); setAnswered(true) } }
  if (st === 'no') main = { label: 'Tuzatib qayta yuborish', cls: 'mbb', onClick: () => { setStatus('rev'); setAnswered(false) } }
  if (st === 'rev') main = { ...main, label: 'Ko‘rib chiqilmoqda…' }

  return (
    <Screen back="/profile" title="Mening arizalarim">
      <div className="body pad" style={{ padding: '14px 16px 20px' }}>
        {import.meta.env.DEV && (
          <div className="chips" style={{ gap: 6, alignItems: 'center' }}>
            <span className="mu fs11">Dev: holatni tanlang</span>
            {DEMOS.map(([id, label]) => (
              <button key={id} type="button" className={status === id && !(id === 'info' && answered) ? 'demo on' : 'demo'} onClick={() => { setStatus(id); setAnswered(false) }}>{label}</button>
            ))}
          </div>
        )}

        <div className="col gap-8">
          <div className="between"><span className="mu fs12">№ T-0142 · Padel · juftlik</span><span className="status" style={STATUS[st][1]}>{STATUS[st][0]}</span></div>
          <h1 className="d fs26" style={{ lineHeight: 1.1 }}>Chilonzor Padel Open</h1>
          <span className="mu fs13">Padel Club «Chilonzor» · 15–16 noyabr · 8–16 juftlik</span>
        </div>

        {status === 'info' && (
          <>
            <div className="note" style={{ borderColor: '#9A3A12', background: '#22170F' }}>
              <div className="row gap-10">
                <span className="av-lg fs12" style={{ width: 32, height: 32, background: '#FFE4D6', color: '#9A3A12' }}>AK</span>
                <span className="col"><b className="fs14">Aziza K. · moderator</b><span className="mu fs11">bugun 14:20</span></span>
              </div>
              <span className="fs14" style={{ lineHeight: 1.45 }}>Klubdan kortlarni band qilish bo‘yicha tasdiq hali kelmadi. Klub bilan kelishganingizni ko‘rsatuvchi xat yoki administrator kontaktini yuboring. Sovrin fondi manbasini ham yozing.</span>
              <span className="chips" style={{ gap: 6 }}>
                <span className="status" style={STATUS.info[1]}>Joy va sana</span>
                <span className="status" style={STATUS.info[1]}>Sovrinlar</span>
              </span>
            </div>
            {!answered && (
              <div className="col gap-10">
                <label className="fl" htmlFor="an">Javobingiz
                  <textarea id="an" style={{ minHeight: 72, background: 'var(--bg)', borderColor: 'var(--line-chip)' }} defaultValue="Klub administratori: Dilshod, +998 93 555 12 12. Kelishuv xati ilova qilindi. Sovrin: homiy Padel Store." />
                </label>
                <label className="upload upload-sm" htmlFor="att">📎 Fayl biriktirish</label>
                <input id="att" type="file" className="sr-only" />
                <Link to="/tournament-apply" className="fs13">Arizadagi maydonlarni tahrirlash</Link>
              </div>
            )}
          </>
        )}

        {st === 'ok' && (
          <>
            <div className="note" style={{ background: 'var(--lime)', color: 'var(--dark)', borderColor: 'var(--lime)' }}>
              <b className="fs16">Turniringiz tasdiqlandi va e’lon qilindi</b>
              <span className="fs14">Ro‘yxatdan o‘tish ochildi. Turnir «Turnirlar» bo‘limida, bosh ekranda va kigo.uz saytida ko‘rinadi.</span>
              <span className="chips fs12" style={{ gap: 6, fontWeight: 600 }}>
                {['✓ Turnirlar ro‘yxati', '✓ Sayt: Tanlangan turnirlar', '✓ @kigo_uz kanal'].map((t) => (
                  <span key={t} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(15,31,20,.12)' }}>{t}</span>
                ))}
              </span>
            </div>
            <div className="grid3 center fs12">
              {[['0', 'ro‘yxatda'], ['16', 'joy'], ['21', 'kun qoldi']].map(([v, l]) => (
                <div key={l} className="note" style={{ padding: 10, gap: 2 }}><b className="fs20">{v}</b><span className="mu">{l}</span></div>
              ))}
            </div>
          </>
        )}

        {st === 'no' && (
          <div className="note" style={{ borderColor: '#8A2A2A', background: '#241212' }}>
            <b className="fs15">Ariza rad etildi</b>
            <span className="fs14" style={{ lineHeight: 1.45 }}><span className="mu">Sabab:</span> Ko‘rsatilgan sanalarda klubda boshqa tadbir bor. Boshqa sana tanlab qayta yuborishingiz mumkin.</span>
          </div>
        )}

        <div className="col">
          <b className="fs15" style={{ paddingBottom: 10 }}>Tarix</b>
          {BASE.concat(timeline(st, answered)).map(([dot, t, d]) => (
            <div key={t} className="tl">
              <div className="col" style={{ alignItems: 'center' }}><span className={`dot ${dot}`} /><span className="ln" /></div>
              <div className="col gap-2" style={{ paddingBottom: 16 }}><b className="fs14">{t}</b>{d && <span className="mu fs12">{d}</span>}</div>
            </div>
          ))}
        </div>
        <span className="mu fs12">Savol bo‘lsa: <button type="button" className="link" onClick={() => openTelegramLink('https://t.me/kigo_sherik')}>@kigo_sherik</button></span>
      </div>

      <div className="mb">
        {st === 'ok'
          ? <Link to={`/tournament/${TOURNAMENT.id}`} className="mbb">Turnir sahifasini ochish</Link>
          : <button type="button" className={main.cls} onClick={main.onClick}>{main.label}</button>}
      </div>
    </Screen>
  )
}
