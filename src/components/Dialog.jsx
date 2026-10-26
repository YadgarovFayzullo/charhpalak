import { useEffect, useRef } from 'react'

/** Modal dialog: Esc and backdrop close it, Tab stays inside, focus returns to the opener. */
export default function Dialog({ labelledBy, onClose, children, className = '' }) {
  const box = useRef(null)
  useEffect(() => {
    const back = document.activeElement
    const first = box.current?.querySelector('[data-autofocus]') || box.current?.querySelector('a,button,input,select,textarea')
    first?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const f = [...box.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')]
        if (!f.length) return
        const a = f[0], z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; back?.focus?.() }
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>{children}</div>
    </div>
  )
}
