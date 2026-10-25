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

export function haptic(style = 'light') {
  tg?.HapticFeedback?.impactOccurred(style)
}

export function closeApp() {
  if (inTelegram) tg.close()
}

// Telegram's native contact dialog. Calls back with the phone number, or '' when declined.
// Outside Telegram the caller shows its own sheet instead.
export function requestPhone(cb) {
  tg.requestContact((ok, res) => cb(ok ? res?.responseUnsafe?.contact?.phone_number || '' : ''))
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
