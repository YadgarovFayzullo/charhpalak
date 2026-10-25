// localStorage can throw (private mode, blocked storage), so every access is guarded.
const KEY = 'kigo.prefs'

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function isOnboarded() {
  return Boolean(loadPrefs()?.done)
}
