import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from './components/Dialog.jsx'
import { submitLead } from './leads.js'

const SponsorContext = createContext(null)
export const useSponsor = () => useContext(SponsorContext)

const KINDS = ['title', 'tournament', 'prizes', 'ads', 'other']
const EMPTY = { name: '', company: '', phone: '', email: '', kind: 'tournament', message: '', agree: false, site: '' }

/** "Become a sponsor" popup with the lead form. `openSponsor()` opens it from anywhere. */
export function SponsorProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openSponsor = useCallback(() => setOpen(true), [])
  const value = useMemo(() => ({ openSponsor }), [openSponsor])
  return (
    <SponsorContext.Provider value={value}>
      {children}
      {open && <SponsorForm onClose={() => setOpen(false)} />}
    </SponsorContext.Provider>
  )
}

const phoneOk = (v) => v.replace(/\D/g, '').length >= 9
const emailOk = (v) => !v || /^\S+@\S+\.\S+$/.test(v)

function SponsorForm({ onClose }) {
  const { t } = useTranslation()
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle') // idle | sending | done | failed
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'name'
    if (!phoneOk(f.phone)) err.phone = 'phone'
    if (!emailOk(f.email.trim())) err.email = 'email'
    if (!f.agree) err.agree = 'agree'
    setErrors(err)
    if (Object.keys(err).length) { document.getElementById(`sp-${Object.keys(err)[0]}`)?.focus(); return }
    if (f.site) { setState('done'); return } // honeypot: bots fill the hidden field
    setState('sending')
    try {
      await submitLead({ type: 'sponsor', name: f.name.trim(), company: f.company.trim(), phone: f.phone.trim(), email: f.email.trim(), interest: f.kind, message: f.message.trim() })
      setState('done')
    } catch { setState('failed') }
  }

  const x = (
    <button type="button" className="modal-x" aria-label={t('auth.close')} onClick={onClose}>×</button>
  )

  if (state === 'done') {
    return (
      <Dialog labelledBy="sp-title" onClose={onClose}>
        {x}
        <h2 id="sp-title">{t('sponsor.done_title')}</h2>
        <p>{t('sponsor.done_text')}</p>
        <button type="button" className="btn btn-lime btn-big" data-autofocus onClick={onClose}>{t('sponsor.done_close')}</button>
      </Dialog>
    )
  }

  const field = (k, props = {}) => (
    <label className="ff">
      <span>{t(`sponsor.${k}`)}{props.required && <i aria-hidden="true"> *</i>}</span>
      <input id={`sp-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `sp-${k}-e` : undefined} maxLength={120} {...props} />
      {errors[k] && <em id={`sp-${k}-e`} role="alert">{t(`sponsor.err_${k}`)}</em>}
    </label>
  )

  return (
    <Dialog labelledBy="sp-title" onClose={onClose} className="modal-form">
      {x}
      <h2 id="sp-title">{t('sponsor.title')}</h2>
      <p>{t('sponsor.text')}</p>
      <form onSubmit={submit} noValidate className="sp-form">
        {field('name', { required: true, autoComplete: 'name' })}
        {field('company', { autoComplete: 'organization' })}
        {field('phone', { required: true, type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+998 __ ___ __ __' })}
        {field('email', { type: 'email', autoComplete: 'email' })}
        <label className="ff">
          <span>{t('sponsor.kind')}</span>
          <select id="sp-kind" value={f.kind} onChange={set('kind')}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`sponsor.kinds.${k}`)}</option>)}
          </select>
        </label>
        <label className="ff">
          <span>{t('sponsor.message')}</span>
          <textarea id="sp-message" rows={3} value={f.message} onChange={set('message')} maxLength={1000} />
        </label>
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.site} onChange={set('site')} name="site" />
        <label className="ff-check">
          <input id="sp-agree" type="checkbox" checked={f.agree} onChange={set('agree')} aria-invalid={!!errors.agree} />
          <span>{t('sponsor.agree')}</span>
        </label>
        {errors.agree && <em className="ff-err" role="alert">{t('sponsor.err_agree')}</em>}
        {state === 'failed' && <em className="ff-err" role="alert">{t('sponsor.failed')}</em>}
        <button type="submit" className="btn btn-lime btn-big" disabled={state === 'sending'}>{state === 'sending' ? t('sponsor.sending') : t('sponsor.submit')}</button>
      </form>
    </Dialog>
  )
}
