import { useTranslation } from 'react-i18next'
import { Arrow, Calendar, Pin, Trophy, User, Users } from './icons.jsx'
import { BOT_URL, TOURNAMENTS, formatDates } from '../data.js'
import { photo } from '../photos.js'

export default function Finished() {
  const { t, i18n } = useTranslation()
  const list = TOURNAMENTS.filter((x) => x.status === 'finished')
  return (
    <section className="wrap section" id="results">
      <div className="sec-head">
        <h2>{t('finished.title')}</h2>
        <a href={BOT_URL} className="more">{t('finished.all')} <Arrow size={16} /></a>
      </div>
      <div className="cards cards-2">
        {list.map((x) => {
          const name = t(`tournaments.names.${x.id}`)
          return (
            <article key={x.id} id={`t-${x.id}`} className="tcard tcard-wide">
              <div className="tcard-media">
                <img {...photo(x.img, 640)} loading="lazy" alt={name} />
                <span className="badge badge-done">{t('status.finished')}</span>
              </div>
              <div className="tcard-body tcard-body-row">
                <div className="col">
                  <h3>{name}</h3>
                  {x.winner && <span className="winner"><Trophy size={16} />{t('finished.winner')} <b>{x.winner}</b></span>}
                  <div className="meta">
                    <span>
                      {x.teams ? <Users size={16} /> : <User size={16} />}
                      {x.teams ? t('finished.teams', { teams: x.teams, count: x.players }) : t('finished.players', { count: x.players })}
                    </span>
                    <span><Calendar size={16} />{formatDates(x.start, x.end, i18n.resolvedLanguage)}</span>
                    <span><Pin size={16} />{t(`cities.${x.city}`)}</span>
                  </div>
                </div>
                <a href={BOT_URL} className="btn btn-soft">{t('finished.results')} <Arrow size={16} /></a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
