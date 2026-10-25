import { useState } from 'react'
import { Link } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { ChipGroup, UnderlineTabs } from '../components/ui.jsx'
import { TOURNAMENT as T } from '../data.js'
import { money } from '../format.js'
import { haptic } from '../telegram.js'

// A score wins when it is a number greater than the opponent's.
const wins = (a, b) => !isNaN(a) && !isNaN(b) && Number(a) > Number(b)

export default function Tournament() {
  const [tab, setTab] = useState('setka')
  const [round, setRound] = useState(T.rounds[0].label)
  const [registered, setRegistered] = useState(false)

  const matches = T.rounds.find((r) => r.label === round).matches

  return (
    <Screen back="/">
      <div className="body">
        <div className="t-hero">
          <img src={T.img} alt="" />
          <div className="t-hero-txt">
            <span className="row gap-6">
              <span className="pill pill-md pill-lime">{T.status}</span>
              {T.tags.map((t) => <span key={t} className="pill pill-md" style={{ background: 'rgba(238,243,234,.16)', color: 'var(--ink)' }}>{t}</span>)}
            </span>
            <h1 className="d fs30" style={{ lineHeight: 1 }}>{T.title}</h1>
          </div>
        </div>

        <div className="grid2" style={{ padding: '12px 16px 0', gap: 8 }}>
          <div className="fact"><span>Sana</span><b>{T.dates}</b></div>
          <div className="fact"><span>Joy</span><Link to={`/club/${T.clubId}`} style={{ color: 'var(--ink)', fontWeight: 700 }}>{T.clubName}</Link></div>
          <div className="fact"><span>Ishtirokchi</span><b>{T.players}</b></div>
          <div className="fact"><span>Sovrin fondi</span><b>{T.prize}</b></div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <UnderlineTabs
            label="Turnir bo‘limlari"
            options={[['setka', 'Setka'], ['qoida', 'Qoidalar'], ['isht', 'Ishtirokchilar']]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="pad" style={{ gap: 12 }}>
          {tab === 'setka' && (
            <>
              <ChipGroup options={T.rounds.map((r) => r.label)} value={round} onChange={setRound} className="chip-sm" wrap={false} />
              {matches.map(([a, as, b, bs], i) => (
                <div key={i} className="match">
                  <span className={wins(as, bs) ? 'w' : ''}>{a}<b>{as}</b></span>
                  <span className={wins(bs, as) ? 'w' : ''}>{b}<b>{bs}</b></span>
                </div>
              ))}
              <span className="mu fs12">Natija kiritilganda bot ishtirokchilarga xabar yuboradi</span>
            </>
          )}

          {tab === 'qoida' && (
            <>
              {T.rules.map(([k, v]) => <div key={k} className="fact"><span>{k}</span><b>{v}</b></div>)}
              <span className="mu fs14">{T.note}</span>
              <Link to="/tournament-apply" className="fs14" style={{ fontWeight: 600 }}>+ O‘z turniringizni o‘tkazing</Link>
            </>
          )}

          {tab === 'isht' && T.participants.map(([i, name, r, bg]) => (
            <div key={name} className="card row gap-12" style={{ padding: '10px 12px', borderRadius: 12 }}>
              <span className="av-lg fs12" style={{ background: bg, width: 36, height: 36 }}>{i}</span>
              <b className="flex1 fs15">{name}</b>
              <span className="mu fs12">★ {r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb">
        <button type="button" className={registered ? 'mbb on' : 'mbb'} onClick={() => { haptic('medium'); setRegistered(!registered) }}>
          {registered ? '✓ Ro‘yxatdasiz · B guruh' : `Ro‘yxatdan o‘tish · ${money(T.fee)}`}
        </button>
      </div>
    </Screen>
  )
}
