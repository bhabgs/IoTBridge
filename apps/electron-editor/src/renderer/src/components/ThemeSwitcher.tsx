import { Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const { mode, toggleMode } = useTheme()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{t('common.light')}</span>
      <Switch
        checked={mode === 'dark'}
        onChange={toggleMode}
        checkedChildren={t('common.dark')}
        unCheckedChildren={t('common.light')}
      />
      <span>{t('common.dark')}</span>
    </div>
  )
}

