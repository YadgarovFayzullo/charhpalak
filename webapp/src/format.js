const WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

export function money(n) {
  return n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' so‘m'
}

// Next `count` days starting today: [{ w: 'Bugun', n: 24, label: 'Bugun, 24-okt' }, ...]
export function nextDays(count = 6) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const w = i === 0 ? 'Bugun' : WEEKDAYS[d.getDay()]
    return { w, n: d.getDate(), label: `${w}, ${d.getDate()}-${MONTHS[d.getMonth()]}` }
  })
}

export function addHours(time, h) {
  const hh = (parseInt(time, 10) + h + 24) % 24
  return String(hh).padStart(2, '0') + ':00'
}
