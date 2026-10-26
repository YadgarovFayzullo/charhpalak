/**
 * Page-view counter of a tournament (FastAPI: /api/public/views). The server does the anti-abuse checks;
 * here a view is only reported after the page was really visible for a few seconds, once per tab session.
 * Without VITE_API_URL the counter is simply not shown.
 */
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const DWELL_MS = 4000

export const viewsEnabled = Boolean(API)

const url = (slug) => `${API}/api/public/views/${encodeURIComponent(slug)}`

export async function fetchViews(slug) {
  const r = await fetch(url(slug))
  if (!r.ok) throw new Error(`views ${r.status}`)
  return (await r.json()).views
}

/** Reports a view after DWELL_MS of the tab being visible. Returns a cleanup function. */
export function trackView(slug, onTotal) {
  const key = `charhpalak.viewed.${slug}`
  try { if (sessionStorage.getItem(key)) return () => {} } catch { /* private mode: server still dedupes */ }
  let visible = 0
  let last = document.visibilityState === 'visible' ? performance.now() : null
  const tick = setInterval(async () => {
    if (document.visibilityState === 'visible') {
      const t = performance.now()
      visible += t - (last ?? t)
      last = t
    } else last = null
    if (visible < DWELL_MS) return
    clearInterval(tick)
    try {
      sessionStorage.setItem(key, '1')
      const r = await fetch(url(slug), { method: 'POST' })
      if (r.ok) onTotal((await r.json()).views)
    } catch { /* counter is optional */ }
  }, 500)
  return () => clearInterval(tick)
}
