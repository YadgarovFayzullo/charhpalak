import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

/** Public offer (sample text until the real document is approved). */
export default function OfferPage() {
  const { t } = useTranslation()
  const sections = t('offer.sections', { returnObjects: true })
  return (
    <div className="page">
      <Header />
      <main className="wrap list-page offer">
        <Link to="/" className="back">← {t('offer.back')}</Link>
        <h1 className="list-title">{t('offer.title')}</h1>
        <p className="offer-draft">{t('offer.draft')}</p>
        {Array.isArray(sections) && sections.map((s) => (
          <section key={s.h}><h2>{s.h}</h2><p>{s.p}</p></section>
        ))}
        <p className="offer-date">{t('offer.updated')}</p>
      </main>
      <Footer />
    </div>
  )
}
