import { Card, Space, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Settings() {
  const { t } = useTranslation()

  return (
    <Card title={t('common.settings')} style={{ maxWidth: 600, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h4>{t('common.language')}</h4>
          <LanguageSwitcher />
        </div>
        <Divider />
        <div>
          <h4>{t('common.theme')}</h4>
          <ThemeSwitcher />
        </div>
      </Space>
    </Card>
  )
}

