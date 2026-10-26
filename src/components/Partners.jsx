import { useTranslation } from 'react-i18next'
import { Arrow, Crown, Gift, Team } from './icons.jsx'
import { BOT_URL, PARTNERS } from '../data.js'

const ICONS = { crown: Crown, gift: Gift, team: Team }

export default function Partners() {
  const { t } = useTranslation()
  return (
    <section className="wrap section" id="partners">
      <div className="sec-head">
        <h2>{t('partners.title')}</h2>
        <a href={BOT_URL} className="more">{t('partners.all')} <Arrow size={16} /></a>
      </div>
      <div className="partners">
        {PARTNERS.map((p) => {
          const Icon = ICONS[p.icon]
          return (
            <div key={p.key} className="partner">
              <Icon size={40} strokeWidth={1.5} />
              <span><b>{t(`partners.${p.key}.title`)}</b><small>{t(`partners.${p.key}.text`)}</small></span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
