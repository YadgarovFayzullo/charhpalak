import { Plus } from './icons.jsx'
import { BOT_URL } from '../data.js'

export default function Cta() {
  return (
    <section className="cta" id="cta">
      <div className="wrap cta-in">
        <h2>Sportni birga rivojlantiramiz</h2>
        <p>Yangi turnirlar, kengroq imkoniyatlar va yanada faol sport hamjamiyati uchun.</p>
        <div className="cta-actions">
          <a href={BOT_URL} className="btn btn-lime"><Plus size={18} />Turnir yaratish</a>
          <a href={BOT_URL} className="btn btn-ghost">Homiy bo‘lish</a>
        </div>
      </div>
    </section>
  )
}
