export function money(n) {
  return n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' so‘m'
}

export function addHours(time, h) {
  const hh = (parseInt(time, 10) + h + 24) % 24
  return String(hh).padStart(2, '0') + ':00'
}
