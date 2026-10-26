// Landing content. Text lives in src/locales/*.json; here only ids and values.
// Tournaments are a sample until the landing reads them from the backend.

// The mini app lives in the Telegram bot: every call to action opens it.
export const BOT_URL = 'https://t.me/charhpalak_bot'

export const SPORTS = ['all', 'futbol', 'tennis', 'shaxmat', 'yugurish', 'suzish', 'bilyard', 'boshqa']

export const NO_FILTERS = { q: '', sport: 'all', city: '', date: '' }

export const CITIES = ['tashkent', 'samarkand', 'bukhara', 'namangan', 'online']

export const STATUSES = ['upcoming', 'live', 'finished']

// start/end: ISO dates; city and format are translation keys
export const TOURNAMENTS = [
  { id: 'tennis-open', sport: 'tennis', status: 'upcoming', format: 'doubles', start: '2026-11-12', end: '2026-11-14', city: 'tashkent', img: 'tennis' },
  { id: 'shaxmat-kubogi', sport: 'shaxmat', status: 'upcoming', format: 'singles', start: '2026-11-20', end: '2026-11-21', city: 'samarkand', img: 'chess' },
  { id: 'shahar-yugurishi', sport: 'yugurish', status: 'upcoming', format: 'singles', start: '2026-11-27', end: '2026-11-27', city: 'bukhara', img: 'marathon' },
  { id: 'futbol-kubogi', sport: 'futbol', status: 'upcoming', format: 'team', start: '2026-12-04', end: '2026-12-06', city: 'namangan', img: 'football' },
  { id: 'suzish-kubogi', sport: 'suzish', status: 'live', format: 'singles', start: '2026-10-24', end: '2026-10-27', city: 'tashkent', img: 'swim' },
  { id: 'bilyard-turniri', sport: 'bilyard', status: 'finished', format: 'singles', start: '2026-03-01', end: '2026-03-02', city: 'tashkent', img: 'billiards', players: 32 },
  { id: 'basketbol-kubogi', sport: 'boshqa', status: 'finished', format: 'team', start: '2026-02-15', end: '2026-02-23', city: 'tashkent', img: 'basketball', teams: 12, players: 96, winner: 'Phoenix' },
]

export const PARTNERS = [
  { icon: 'crown', key: 'main' },
  { icon: 'gift', key: 'prize' },
  { icon: 'team', key: 'host' },
]

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

/** "12–14-noyabr, 2026" in Uzbek; Intl range format ("Nov 12 – 14, 2026", "2026년 11월 12일~14일") otherwise. */
export function formatDates(start, end, lng) {
  const a = new Date(`${start}T12:00:00`)
  const b = new Date(`${end}T12:00:00`)
  if (lng === 'uz') {
    // Our own format: the browsers' Uzbek locale data is incomplete.
    const day = start === end ? `${a.getDate()}` : `${a.getDate()}–${b.getDate()}`
    const sameMonth = a.getMonth() === b.getMonth()
    return sameMonth
      ? `${day}-${UZ_MONTHS[b.getMonth()]}, ${b.getFullYear()}`
      : `${a.getDate()}-${UZ_MONTHS[a.getMonth()]} – ${b.getDate()}-${UZ_MONTHS[b.getMonth()]}, ${b.getFullYear()}`
  }
  const fmt = new Intl.DateTimeFormat(lng, { day: 'numeric', month: lng === 'ko' ? 'long' : 'short', year: 'numeric' })
  return start === end ? fmt.format(a) : fmt.formatRange(a, b)
}
