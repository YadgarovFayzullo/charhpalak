import { Arrow } from './icons.jsx'

const BOOKINGS = [
  { time: '10:00', place: 'Rus bilyardi, stol 1', status: 'Bron' },
  { time: '12:00', place: 'Pul, stol 2', status: 'Bo‘sh' },
  { time: '14:00', place: 'VIP stol', status: 'Bron' },
  { time: '16:00', place: 'Rus bilyardi, stol 3', status: 'Kutilmoqda' },
  { time: '19:00', place: 'VIP stol', status: 'Bron' },
]

const STATUS_CLASS = { Bron: 'st-booked', 'Bo‘sh': 'st-free', Kutilmoqda: 'st-wait' }

const STATS = [
  { value: '18', label: 'bron bugun' },
  { value: '2,4 mln', label: 'kassa, so‘m' },
  { value: '7/9', label: 'stol band' },
]

export default function Business() {
  return (
    <section className="business" id="business">
      <div className="wrap section biz-grid">
        <div className="stack-22">
          <span className="ey">Klublar uchun · Charhpalak Business</span>
          <h2 className="d h2-lg">Klubingizni bir joydan boshqaring.</h2>
          <p className="mu lead-18">
            Bronlar, mijozlar, kassa, bar va hisobotlar bitta tizimda. Klubingiz Charhpalak’da ko‘rinadi va yangi mijozlar o‘zi keladi.
          </p>
          <div className="row row-center">
            <a href="#" className="btn bp">Klubni ulash <Arrow /></a>
            <a href="#" className="price-link">300 000 so‘m/oy + 1–2%</a>
          </div>
        </div>

        <div className="biz-media">
          <img src="/images/billiards.jpg" alt="Bilyard zali" className="biz-img" />
          <div className="biz-panel">
            <div className="biz-panel-head">
              <b>Bronlar · bugun</b>
              <span className="pill st-free">24-okt</span>
            </div>
            <div className="biz-table">
              {BOOKINGS.map((b) => (
                <div key={b.time} className="biz-row">
                  <span className="biz-time">{b.time}</span>
                  <span>{b.place}</span>
                  <span className={`pill ${STATUS_CLASS[b.status]}`}>{b.status}</span>
                </div>
              ))}
            </div>
            <div className="biz-stats">
              {STATS.map((s) => (
                <span key={s.label} className="biz-stat">
                  <b className="d">{s.value}</b>
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
