// Mock data from the KiGo design. Replace with API calls when the backend is ready.

export const SPORT_COLORS = {
  Futbol: '#C8F25A',
  Padel: '#9EE6C8',
  Bilyard: '#FFD58A',
  Tennis: '#B9C8FF',
  Basketbol: '#FFB59A',
}

export const CLUBS = [
  {
    id: 'pirat',
    name: '«Pirat» bilyard',
    fullName: '«Pirat» bilyard klubi',
    sport: 'Bilyard',
    district: 'Yunusobod',
    dist: '1,2 km',
    rating: '4.7',
    reviewsCount: 312,
    img: 'images/billiards.jpg',
    photos: 24,
    price: 55000,
    slots: ['19:00', '21:00', '22:00', '23:00'],
    nextFree: '21:00',
    map: { left: '40%', top: '30%' },
    types: [
      { label: 'Rus bilyardi', price: 55000 },
      { label: 'Pul', price: 45000 },
      { label: 'VIP', price: 90000 },
    ],
    busy: [['18:00', '20:00', '22:00'], ['19:00'], [], ['21:00'], [], ['18:00']],
    prices: [
      ['Rus bilyardi, kunduzi', '40 000/soat'],
      ['Rus bilyardi, 18:00 dan', '55 000/soat'],
      ['Pul (amerikancha)', '45 000/soat'],
      ['VIP xona', '90 000/soat'],
    ],
    amenities: ['Bar', 'Parking', 'Wi‑Fi', '12 stol'],
    reviews: [
      { name: 'Aziz T.', stars: 5, text: 'Stollar tekis, movut yangi. Kelganda stol tayyor turgan edi.' },
      { name: 'Rustam M.', stars: 4, text: 'Kechqurun odam ko‘p, oldindan bron qiling.' },
    ],
  },
  {
    id: 'aqua',
    name: '«Aqua Sport»',
    fullName: '«Aqua Sport» basseyni',
    sport: 'Suzish',
    district: 'Yunusobod',
    dist: '2,0 km',
    rating: '4.6',
    reviewsCount: 0,
    img: 'images/pool.jpg',
    photos: 1,
    price: 60000,
    slots: ['18:00', '19:00', '20:00'],
    nextFree: '18:00',
    map: { left: '15%', top: '52%' },
    types: [{ label: 'Yo‘lak', price: 60000 }],
    busy: [[], [], [], [], [], []],
    prices: [['Yo‘lak', '60 000/soat']],
    amenities: [],
    reviews: [],
  },
  {
    id: 'olimp',
    name: '«Olimp» korti',
    fullName: '«Olimp» tennis korti',
    sport: 'Tennis',
    district: 'Mirzo Ulug‘bek',
    dist: '3,4 km',
    rating: '4.9',
    reviewsCount: 0,
    img: 'images/coach-tennis.jpg',
    photos: 1,
    price: 180000,
    slots: ['19:00', '20:00'],
    nextFree: '20:00',
    map: { left: '62%', top: '60%' },
    types: [{ label: 'Kort', price: 180000 }],
    busy: [[], [], [], [], [], []],
    prices: [['Kort', '180 000/soat']],
    amenities: [],
    reviews: [],
  },
  {
    id: 'streetball',
    name: 'Streetball Park',
    fullName: 'Streetball Park',
    sport: 'Basketbol',
    district: 'Chilonzor',
    dist: '6,8 km',
    rating: '4.5',
    reviewsCount: 0,
    img: 'images/basketball-cup.jpg',
    photos: 1,
    price: 120000,
    slots: ['18:00', '20:00', '22:00'],
    nextFree: '18:00',
    map: { left: '70%', top: '20%' },
    types: [{ label: 'Maydon', price: 120000 }],
    busy: [[], [], [], [], [], []],
    prices: [['Maydon', '120 000/soat']],
    amenities: [],
    reviews: [],
  },
]

export const clubById = (id) => CLUBS.find((c) => c.id === id) || CLUBS[0]

const AVATARS = [['JK', '#C8F25A'], ['AT', '#FFD58A'], ['SN', '#B9C8FF'], ['MR', '#9EE6C8']]
export { AVATARS }

export const GAMES = [
  { id: 1, sport: 'Futbol', level: 'O‘rta', when: 'Bugun, 19:00', place: '«Arena» · 6×6', clubId: null, have: 10, max: 12, price: '30 000/kishi' },
  { id: 2, sport: 'Bilyard', level: 'Har qanday', when: 'Bugun, 21:00', place: '«Pirat» · Rus bilyardi', clubId: 'pirat', have: 1, max: 2, price: '55 000/kishi' },
  { id: 3, sport: 'Padel', level: 'Boshlang‘ich', when: 'Ertaga, 08:00', place: '«Padel Club»', clubId: null, have: 3, max: 4, price: '75 000/kishi' },
  { id: 4, sport: 'Tennis', level: 'Kuchli', when: 'Shanba, 10:00', place: '«Olimp» · juftlik', clubId: 'olimp', have: 2, max: 4, price: '90 000/kishi' },
]

// username: Telegram handle for the «Yozish» button; null until the backend provides it
export const PLAYERS = [
  { i: 'MR', bg: '#9EE6C8', name: 'Malika R.', meta: 'Tennis · kuchli · ★ 4.9 · 1,1 km', username: null },
  { i: 'AT', bg: '#FFD58A', name: 'Aziz T.', meta: 'Bilyard · o‘rta · ★ 4.6 · 2,3 km', username: null },
  { i: 'SN', bg: '#B9C8FF', name: 'Sardor N.', meta: 'Padel · boshlang‘ich · ★ 4.7', username: null },
  { i: 'BO', bg: '#FFB59A', name: 'Bobur O.', meta: 'Futbol · o‘rta · ★ 4.8 · 0,8 km', username: null },
  { i: 'DI', bg: '#C8F25A', name: 'Davron I.', meta: 'Basketbol · o‘rta · ★ 4.6', username: null },
]

export const TOURNAMENT = {
  id: 'pirat-cup',
  title: 'Pirat Cup 2026',
  img: 'images/billiards.jpg',
  tags: ['Bilyard · yakka'],
  status: 'Kutilayotgan',
  dates: '12–14 noyabr',
  clubId: 'pirat',
  clubName: '«Pirat»',
  players: '32 / 64',
  prize: '5 000 000 so‘m',
  fee: 50000,
  rules: [
    ['Format', 'Guruhlar 8×8, keyin pley-off 16 kishi'],
    ['Kirish to‘lovi', '50 000 so‘m · ro‘yxat 10-noyabrgacha'],
    ['Sovrinlar', '1-o‘rin 2,5 mln + kubok · 2-o‘rin 1,5 mln · 3-o‘rin 1 mln'],
  ],
  note: 'O‘yindan 15 daqiqa oldin keling. 10 daqiqa kechiksangiz texnik mag‘lubiyat.',
  rounds: [
    {
      label: 'Chorak final',
      matches: [
        ['Aziz T.', '3', 'Bobur O.', '1'],
        ['Rustam M.', '2', 'Sardor N.', '3'],
        ['Jasur K.', '3', 'Timur A.', '0'],
        ['Davron I.', '—', 'Ulug‘bek S.', '—'],
      ],
    },
    { label: 'Yarim final', matches: [['Aziz T.', '—', 'Sardor N.', '—'], ['Jasur K.', '—', 'G‘olib 4-juft', '—']] },
    { label: 'Final', matches: [['—', '—', '—', '—']] },
  ],
  participants: [
    ['AT', 'Aziz T.', '4.6', '#FFD58A'],
    ['BO', 'Bobur O.', '4.8', '#FFB59A'],
    ['RM', 'Rustam M.', '4.5', '#9EE6C8'],
    ['SN', 'Sardor N.', '4.7', '#B9C8FF'],
    ['JK', 'Jasur K.', '4.8', '#C8F25A'],
    ['TA', 'Timur A.', '4.3', '#FFD58A'],
  ],
}
