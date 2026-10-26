import { Arrow, Calendar, Pin, Trophy, User, Users } from './icons.jsx'
import { BOT_URL, TOURNAMENTS } from '../data.js'
import { photo } from '../photos.js'

export default function Finished() {
  const list = TOURNAMENTS.filter((t) => t.status === 'finished')
  return (
    <section className="wrap section" id="results">
      <div className="sec-head">
        <h2>Turnir tugadi. Tarix qoladi.</h2>
        <a href={BOT_URL} className="more">Barcha yakunlangan turnirlar <Arrow size={16} /></a>
      </div>
      <div className="cards cards-2">
        {list.map((t) => (
          <article key={t.id} id={`t-${t.id}`} className="tcard tcard-wide">
            <div className="tcard-media">
              <img {...photo(t.img, 640)} loading="lazy" alt={t.title} />
              <span className="badge badge-done">Yakunlangan</span>
            </div>
            <div className="tcard-body tcard-body-row">
              <div className="col">
                <h3>{t.title}</h3>
                {t.winner && <span className="winner"><Trophy size={16} />G‘olib: <b>{t.winner}</b></span>}
                <div className="meta">
                  <span>{t.winner ? <Users size={16} /> : <User size={16} />}{t.participants}</span>
                  <span><Calendar size={16} />{t.dates}</span>
                  <span><Pin size={16} />{t.city}</span>
                </div>
              </div>
              <a href={BOT_URL} className="btn btn-soft">Natijalarni ko‘rish <Arrow size={16} /></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
