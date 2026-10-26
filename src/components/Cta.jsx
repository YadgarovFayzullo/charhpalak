import { useTranslation } from 'react-i18next'
import { Plus } from './icons.jsx'
import { BOT_URL } from '../data.js'

export default function Cta() {
  const { t } = useTranslation()
  return (
    <section className="cta" id="cta">
      <div className="wrap cta-in">
        <h2>{t('cta.title')}</h2>
        <p>{t('cta.text')}</p>
        <div className="cta-actions">
          <a href={BOT_URL} className="btn btn-lime"><Plus size={18} />{t('cta.create')}</a>
          <a href={BOT_URL} className="btn btn-ghost">{t('cta.sponsor')}</a>
        </div>
      </div>
    </section>
  )
}
