import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import TournamentCard from '../components/TournamentCard.jsx'
import { SPORT_ICONS } from '../components/icons.jsx'
import { SPORTS, STATUSES, TOURNAMENTS } from '../data.js'

/** All tournaments of one sport (or of every sport), reached from «More» on the landing. */
export default function TournamentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sport = 'all' } = useParams()
  const [params, setParams] = useSearchParams()
  const status = STATUSES.includes(params.get('status')) ? params.get('status') : 'upcoming'

  if (!SPORTS.includes(sport)) return <Navigate to="/tournaments" replace />

  const inSport = TOURNAMENTS.filter((x) => sport === 'all' || x.sport === sport)
  const list = inSport.filter((x) => x.status === status)
  const title = sport === 'all' ? t('tournaments.all_title') : t('tournaments.sport_title', { sport: t(`sports.${sport}`) })
  const go = (s) => navigate(`/tournaments${s === 'all' ? '' : `/${s}`}?status=${status}`)

  return (
    <div className="page">
      <Header />
      <main className="wrap list-page">
        <Link to="/#tournaments" className="back">← {t('tournaments.back')}</Link>
        <h1 className="list-title">{title}</h1>

        <div className="sports" role="toolbar" aria-label={t('tournaments.sport_label')}>
          {SPORTS.map((s) => {
            const Icon = SPORT_ICONS[s]
            return (
              <button key={s} type="button" className={sport === s ? 'sport on' : 'sport'} aria-pressed={sport === s} onClick={() => go(s)}>
                <span className="sport-i"><Icon size={18} /></span>{t(`sports.${s}`)}
              </button>
            )
          })}
        </div>

        <div className="sec-head">
          <h2 className="list-count">{t('tournaments.count', { count: list.length })}</h2>
          <div className="seg" role="tablist" aria-label={t('tournaments.status_label')}>
            {STATUSES.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={status === s} className={status === s ? 'on' : ''}
                onClick={() => setParams({ status: s }, { replace: true })}>
                {t(`status.${s}`)} <span className="seg-n">{inSport.filter((x) => x.status === s).length}</span>
              </button>
            ))}
          </div>
        </div>

        {list.length > 0
          ? <div className="cards">{list.map((x) => <TournamentCard key={x.id} item={x} />)}</div>
          : <div className="empty">{t('tournaments.empty_status')}</div>}
      </main>
      <Footer />
    </div>
  )
}
