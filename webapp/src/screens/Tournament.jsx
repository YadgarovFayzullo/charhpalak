import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Screen from '../components/Screen.jsx'
import { ChipGroup, UnderlineTabs } from '../components/ui.jsx'
import { Async } from '../components/State.jsx'
import { useAction } from '../components/useAction.jsx'
import { api, useApi } from '../api.js'
import { money } from '../format.js'
import { haptic } from '../telegram.js'

// A score wins when it is a number greater than the opponent's.
const wins = (a, b) => !isNaN(a) && !isNaN(b) && Number(a) > Number(b)

export default function Tournament() {
  const { id } = useParams()
  // The "Turnirlar" tab has no id: open the nearest upcoming tournament.
  const list = useApi('/api/tournaments', { skip: Boolean(id) })
  const one = useApi(`/api/tournaments/${id}`, { skip: !id })

  if (!id && list.data) {
    const next = list.data.find((t) => t.status === 'Kutilayotgan') || list.data[0]
    if (next) return <Navigate to={`/tournament/${next.id}`} replace />
  }

  return (
    <Screen back="/">
      {!id && list.data
        ? <div className="state"><b className="fs16">Hozircha turnir yo‘q</b><Link to="/tournament-apply" className="mbs" style={{ width: 'auto', padding: '0 20px' }}>Turnir o‘tkazish</Link></div>
        : <Async res={id ? one : list}>{(t) => <TournamentBody t={t} setT={one.setData} />}</Async>}
    </Screen>
  )
}

function TournamentBody({ t, setT }) {
  const [tab, setTab] = useState('setka')
  const [round, setRound] = useState(t.rounds[0]?.label)
  const { run, busy, toast } = useAction()
  const matches = t.rounds.find((r) => r.label === round)?.matches || []

  const register = async () => {
    haptic('medium')
    const updated = await run(() => api(`/api/tournaments/${t.id}/register`, { method: 'POST' }))
    if (updated) setT(updated)
  }

  return (
    <>
      <div className="body">
        <div className="t-hero">
          {t.img && <img src={t.img} alt="" />}
          <div className="t-hero-txt">
            <span className="row gap-6">
              <span className="pill pill-md pill-lime">{t.status}</span>
              {t.tags.map((x) => <span key={x} className="pill pill-md" style={{ background: 'rgba(238,243,234,.16)', color: 'var(--ink)' }}>{x}</span>)}
            </span>
            <h1 className="d fs30" style={{ lineHeight: 1 }}>{t.title}</h1>
          </div>
        </div>

        <div className="grid2" style={{ padding: '12px 16px 0', gap: 8 }}>
          <div className="fact"><span>Sana</span><b>{t.dates}</b></div>
          <div className="fact"><span>Joy</span>{t.clubId ? <Link to={`/club/${t.clubId}`} style={{ color: 'var(--ink)', fontWeight: 700 }}>{t.clubName}</Link> : <b>{t.clubName}</b>}</div>
          <div className="fact"><span>Ishtirokchi</span><b>{t.players}</b></div>
          <div className="fact"><span>Sovrin fondi</span><b>{t.prize || '—'}</b></div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <UnderlineTabs label="Turnir bo‘limlari" options={[['setka', 'Setka'], ['qoida', 'Qoidalar'], ['isht', 'Ishtirokchilar']]} value={tab} onChange={setTab} />
        </div>

        <div className="pad" style={{ gap: 12 }}>
          {tab === 'setka' && (t.rounds.length ? (
            <>
              <ChipGroup options={t.rounds.map((r) => r.label)} value={round} onChange={setRound} className="chip-sm" wrap={false} />
              {matches.map(([a, as, b, bs], i) => (
                <div key={i} className="match">
                  <span className={wins(as, bs) ? 'w' : ''}>{a}<b>{as}</b></span>
                  <span className={wins(bs, as) ? 'w' : ''}>{b}<b>{bs}</b></span>
                </div>
              ))}
              <span className="mu fs12">Natija kiritilganda bot ishtirokchilarga xabar yuboradi</span>
            </>
          ) : <span className="mu">Setka ro‘yxatdan o‘tish yopilgach tuziladi.</span>)}

          {tab === 'qoida' && (
            <>
              {t.rules.map(([k, v]) => <div key={k} className="fact"><span>{k}</span><b>{v}</b></div>)}
              {t.note && <span className="mu fs14">{t.note}</span>}
              <Link to="/tournament-apply" className="fs14" style={{ fontWeight: 600 }}>+ O‘z turniringizni o‘tkazing</Link>
            </>
          )}

          {tab === 'isht' && (t.participants.length ? t.participants.map(([i, name, r, bg], k) => (
            <div key={k} className="card row gap-12" style={{ padding: '10px 12px', borderRadius: 12 }}>
              <span className="av-lg fs12" style={{ background: bg, width: 36, height: 36 }}>{i}</span>
              <b className="flex1 fs15">{name}</b>
              <span className="mu fs12">★ {r}</span>
            </div>
          )) : <span className="mu">Hali hech kim yozilmagan</span>)}
        </div>
      </div>

      {toast}
      {t.status === 'Kutilayotgan' && (
        <div className="mb">
          <button type="button" className={t.registered ? 'mbb on' : 'mbb'} disabled={busy || (!t.registered && t.full)} onClick={register}>
            {t.registered ? `✓ Ro‘yxatdasiz${t.group ? ` · ${t.group} guruh` : ''}` : t.full ? 'Joylar tugadi' : `Ro‘yxatdan o‘tish · ${t.fee ? money(t.fee) : 'bepul'}`}
          </button>
        </div>
      )}
    </>
  )
}
