import { Arrow, Crown, Gift, Team } from './icons.jsx'
import { BOT_URL, PARTNERS } from '../data.js'

const ICONS = { crown: Crown, gift: Gift, team: Team }

export default function Partners() {
  return (
    <section className="wrap section" id="partners">
      <div className="sec-head">
        <h2>Homiylar va hamkorlar</h2>
        <a href={BOT_URL} className="more">Barcha hamkorlar <Arrow size={16} /></a>
      </div>
      <div className="partners">
        {PARTNERS.map((p) => {
          const Icon = ICONS[p.icon]
          return (
            <div key={p.title} className="partner">
              <Icon size={40} strokeWidth={1.5} />
              <span><b>{p.title}</b><small>{p.text}</small></span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
