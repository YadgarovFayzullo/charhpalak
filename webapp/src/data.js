// UI constants. Everything else comes from the API (src/api.js).

export const SPORT_COLORS = {
  Futbol: '#C8F25A',
  Padel: '#9EE6C8',
  Bilyard: '#FFD58A',
  Tennis: '#B9C8FF',
  Basketbol: '#FFB59A',
  Suzish: '#9EE6C8',
  Shaxmat: '#FFD58A',
}

export const sportColor = (s) => SPORT_COLORS[s] || '#EEF3EA'
