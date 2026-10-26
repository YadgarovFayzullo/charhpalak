import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from './components/Dialog.jsx'

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
  return (
    <Dialog labelledBy="login-title" onClose={onClose}>
      <button type="button" className="modal-x" aria-label={t('auth.close')} onClick={onClose}>×</button>
      <h2 id="login-title">{t('auth.title')}</h2>
      <p>{t('auth.text')}</p>
      <button type="button" className="btn btn-lime btn-big">{t('auth.login')}</button>
      <button type="button" className="btn btn-line" onClick={onClose}>{t('auth.later')}</button>
    </Dialog>
  )
}
