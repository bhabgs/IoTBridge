import { Select } from 'antd'
import { useTranslation } from 'react-i18next'

const languages = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: 'العربية', value: 'ar' }
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = (value: string) => {
    i18n.changeLanguage(value)
  }

  // 获取当前语言显示名称
  const getCurrentLanguageLabel = () => {
    const current = languages.find(lang => lang.value === i18n.language)
    return current?.label || i18n.language
  }

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      options={languages}
      style={{ width: 140 }}
      placeholder={getCurrentLanguageLabel()}
    />
  )
}

