import { useRef, useState } from 'react'
import { tg } from '../telegram.js'

/**
 * Run a mutation (POST/PATCH...) with a busy flag and an error toast.
 * `run` resolves to the result, or to undefined when the request failed.
 */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const timer = useRef()

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      tg?.HapticFeedback?.notificationOccurred('error')
      setError(e.message)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setError(null), 4000)
      return undefined
    } finally {
      setBusy(false)
    }
  }

  const toast = error ? <div className="toast" role="alert">{error}</div> : null
  return { run, busy, toast }
}
