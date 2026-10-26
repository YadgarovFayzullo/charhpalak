import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BOT_URL } from './data.js'

const KEY = 'charhpalak.user'
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const read = () => { try { return localStorage.getItem(KEY) } catch { return null } }

/**
 * Sign-in state of the visitor. Signing in itself happens in the Telegram bot (until the backend session exists
 * the landing only knows the flag), so the popup sends people there. `requireAuth(fn)` runs fn when signed in
 * and opens the popup otherwise.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(read)
  const [open, setOpen] = useState(false)
  const requireAuth = useCallback((fn) => { if (user) fn(); else setOpen(true) }, [user])
  const value = useMemo(() => ({ user, requireAuth }), [user, requireAuth])
  useEffect(() => {
    const sync = (e) => { if (e.key === KEY) setUser(read()) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  return (
    <AuthContext.Provider value={value}>
      {children}
      {open && <LoginModal onClose={() => setOpen(false)} />}
    </AuthContext.Provider>
  )
}

function LoginModal({ onClose }) {
  const { t } = useTranslation()
  const box = useRef(null)
  useEffect(() => {
    const back = document.activeElement
    box.current?.querySelector('a')?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = [...box.current.querySelectorAll('a,button')]
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; back?.focus?.() }
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} className="modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button type="button" className="modal-x" aria-label={t('auth.close')} onClick={onClose}>×</button>
        <h2 id="login-title">{t('auth.title')}</h2>
        <p>{t('auth.text')}</p>
        <a href={BOT_URL} className="btn btn-lime btn-big">{t('auth.login')}</a>
        <button type="button" className="btn btn-line" onClick={onClose}>{t('auth.later')}</button>
      </div>
    </div>
  )
}
