import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import uz from './locales/uz.json'
import en from './locales/en.json'
import ko from './locales/ko.json'

export const LANGUAGES = [
  { code: 'uz', label: 'UZ', name: 'O‘zbekcha' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ko', label: 'KO', name: '한국어' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { uz: { translation: uz }, en: { translation: en }, ko: { translation: ko } },
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true, // "en-US" → "en", "ko-KR" → "ko"
    fallbackLng: 'uz',
    // ?lang=en in the link wins, then the saved choice, then the browser language.
    detection: { order: ['querystring', 'localStorage', 'navigator'], lookupQuerystring: 'lang', lookupLocalStorage: 'charhpalak.lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false }, // React escapes already
  })

// Keep <html lang>, the tab title and the meta description in the current language.
function syncDocument(lng) {
  const t = i18n.getFixedT(lng)
  document.documentElement.lang = lng
  document.title = t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
}
syncDocument(i18n.resolvedLanguage)
i18n.on('languageChanged', () => syncDocument(i18n.resolvedLanguage))

export default i18n
