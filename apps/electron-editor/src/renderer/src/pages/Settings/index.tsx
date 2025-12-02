import { Card, Space, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { ThemeSwitcher } from '../../components/ThemeSwitcher'

export default function Settings() {
  const { t } = useTranslation()

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <Card title={t('common.settings')} style={{ maxWidth: 600, width: '100%' }}>
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
    </div>
  )
}

