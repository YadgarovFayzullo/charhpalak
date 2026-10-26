// Landing content. Tournaments are a sample until the landing reads them from the backend.

// The mini app lives in the Telegram bot: every call to action opens it.
export const BOT_URL = 'https://t.me/charhpalak_bot'

export const SPORTS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'futbol', label: 'Futbol' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'shaxmat', label: 'Shaxmat' },
  { id: 'yugurish', label: 'Yugurish' },
  { id: 'suzish', label: 'Suzish' },
  { id: 'bilyard', label: 'Bilyard' },
  { id: 'boshqa', label: 'Boshqa sportlar' },
]

export const NO_FILTERS = { q: '', sport: 'all', city: '', date: '' }

export const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Onlayn']

export const STATUSES = [
  { id: 'upcoming', label: 'Kutilayotgan' },
  { id: 'live', label: 'Davom etayotgan' },
  { id: 'finished', label: 'Yakunlangan' },
]

// date: ISO start date (for the date filter); dates: label shown on the card
export const TOURNAMENTS = [
  { id: 'tennis-open', title: 'Tennis Open', sport: 'tennis', status: 'upcoming', format: 'Juftlik', date: '2026-11-12', dates: '12–14-noyabr, 2026', city: 'Toshkent', img: 'tennis' },
  { id: 'shaxmat-kubogi', title: 'Shaxmat kubogi', sport: 'shaxmat', status: 'upcoming', format: 'Individual', date: '2026-11-20', dates: '20–21-noyabr, 2026', city: 'Samarqand', img: 'chess' },
  { id: 'shahar-yugurishi', title: 'Shahar yugurishi', sport: 'yugurish', status: 'upcoming', format: 'Individual', date: '2026-11-27', dates: '27-noyabr, 2026', city: 'Buxoro', img: 'marathon' },
  { id: 'suzish-kubogi', title: 'Suzish kubogi', sport: 'suzish', status: 'live', format: 'Individual', date: '2026-10-24', dates: '24–27-oktabr, 2026', city: 'Toshkent', img: 'swim' },
  { id: 'bilyard-turniri', title: 'Bilyard turniri', sport: 'bilyard', status: 'finished', format: 'Individual', date: '2026-03-01', dates: '1–2-mart, 2026', city: 'Toshkent', img: 'billiards', participants: '32 ishtirokchi' },
  { id: 'basketbol-kubogi', title: 'Basketbol kubogi', sport: 'boshqa', status: 'finished', format: 'Jamoa', date: '2026-02-15', dates: '15–23-fevral, 2026', city: 'Toshkent', img: 'basketball', participants: '12 jamoa · 96 ishtirokchi', winner: 'Phoenix' },
]

export const PARTNERS = [
  { icon: 'crown', title: 'Bosh homiy', text: 'Turnirlarimizning asosiy qo‘llab-quvvatlovchisi' },
  { icon: 'gift', title: 'Sovrin hamkori', text: 'G‘oliblar va ishtirokchilar uchun sovrinlar' },
  { icon: 'team', title: 'Mezbon klub', text: 'Turnirlarni o‘tkazishda hamkorlik' },
]
