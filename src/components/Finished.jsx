import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Arrow } from './icons.jsx'
import TournamentCard from './TournamentCard.jsx'
import { TOURNAMENTS } from '../data.js'

const FEATURED = ['bilyard-turniri', 'basketbol-kubogi']

export default function Finished() {
  const { t } = useTranslation()
  return (
    <section className="wrap section" id="results">
      <div className="sec-head">
        <h2>{t('finished.title')}</h2>
        <Link to="/tournaments?status=finished" className="more">{t('finished.all')} <Arrow size={16} /></Link>
      </div>
      <div className="cards cards-2">
        {FEATURED.map((id) => <TournamentCard key={id} item={TOURNAMENTS.find((x) => x.id === id)} anchor wide />)}
      </div>
    </section>
  )
}
