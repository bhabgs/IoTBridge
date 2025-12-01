import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { zh, type Translations } from './zh'
import { en } from './en'
import { ar } from './ar'

export type Language = 'zh' | 'en' | 'ar'

const translations: Record<Language, Translations> = { zh, en, ar }

interface I18nContextType {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps): React.JSX.Element {
  const [language, setLanguageState] = useState<Language>('zh')

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [])

  const value: I18nContextType = {
    language,
    t: translations[language],
    setLanguage,
    isRTL: language === 'ar'
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export type { Translations }
