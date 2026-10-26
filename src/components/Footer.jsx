import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span className="footer-brand"><b>Charh<span>palak</span></b> {t('footer.tagline')}</span>
        <span className="footer-legal">© 2026 Charhpalak · ООО «INVENTUM»</span>
      </div>
    </footer>
  )
}
