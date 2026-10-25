// Thin wrapper over window.Telegram.WebApp so the app also runs in a plain browser.
export const tg = window.Telegram?.WebApp
export const inTelegram = Boolean(tg?.initData)

const BG = '#0B1811'

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  tg.setHeaderColor?.(BG)
  tg.setBackgroundColor?.(BG)
  tg.setBottomBarColor?.(BG)
}

const FALLBACK_USER = { first: 'Jasur', name: 'Jasur Karimov', username: '@jasur_k', initials: 'JK' }

export function getUser() {
  const u = tg?.initDataUnsafe?.user
  if (!u) return FALLBACK_USER
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  return { first: u.first_name, name, username: u.username ? '@' + u.username : '', initials }
}

export function haptic(style = 'light') {
  tg?.HapticFeedback?.impactOccurred(style)
}

export function closeApp() {
  if (inTelegram) tg.close()
}

// Telegram's native contact dialog; outside Telegram the caller shows its own sheet.
export function requestPhone(cb) {
  if (inTelegram && tg.requestContact) tg.requestContact((ok) => cb(ok))
  else cb(null)
}

export function openLink(url) {
  if (inTelegram) tg.openLink(url)
  else window.open(url, '_blank', 'noopener')
}

export function openTelegramLink(url) {
  if (inTelegram) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener')
}

export function share(text, url = 'https://t.me/kigo_bot') {
  const link = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  openTelegramLink(link)
}
