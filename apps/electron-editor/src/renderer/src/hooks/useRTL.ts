import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// RTL 语言列表
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']

export function useRTL() {
  const { i18n } = useTranslation()
  const [isRTL, setIsRTL] = useState(false)

  useEffect(() => {
    const currentLang = i18n.language.split('-')[0] // 获取语言代码，如 'ar' from 'ar-SA'
    const rtl = RTL_LANGUAGES.includes(currentLang)
    setIsRTL(rtl)

    // 更新 HTML 文档方向
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language

    // 监听语言变化
    const handleLanguageChanged = (lng: string) => {
      const langCode = lng.split('-')[0]
      const isRtlLang = RTL_LANGUAGES.includes(langCode)
      setIsRTL(isRtlLang)
      document.documentElement.dir = isRtlLang ? 'rtl' : 'ltr'
      document.documentElement.lang = lng
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  return isRTL
}

