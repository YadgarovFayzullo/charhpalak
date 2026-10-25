import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { tg, inTelegram, closeApp } from '../telegram.js'

// Go back in history when there is one, otherwise to `fallback`.
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key !== 'default' ? navigate(-1) : navigate(fallback, { replace: true }))
}

/**
 * One mini-app screen. Inside Telegram the header is drawn by Telegram itself,
 * so `back` drives the native BackButton. In a plain browser we draw the same
 * header as in the design so the app can be previewed.
 */
export default function Screen({ back, title = 'KiGo', subtitle = 'mini ilova', children }) {
  const goBack = useBack(typeof back === 'string' ? back : '/')

  useEffect(() => {
    if (!inTelegram || !back) return
    tg.BackButton.show()
    tg.BackButton.onClick(goBack)
    return () => {
      tg.BackButton.offClick(goBack)
      tg.BackButton.hide()
    }
  })

  return (
    <div className="screen">
      {!inTelegram && (
        <div className="tgh">
          {back ? (
            <button type="button" onClick={goBack}>← Orqaga</button>
          ) : (
            <button type="button" onClick={closeApp}>✕ Yopish</button>
          )}
          <span className="tgh-title"><b>{title}</b><span className="mu">{subtitle}</span></span>
          <button type="button" aria-label="Menyu">⋯</button>
        </div>
      )}
      {children}
    </div>
  )
}
