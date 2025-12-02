import { Typography, Card, Space } from 'antd'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

export default function Preview() {
  const { t } = useTranslation()

  return (
    <div style={{ padding: '24px', height: '100%' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>{t('common.preview')}</Title>

        <Card>
          <div
            style={{
              minHeight: '500px',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ant-color-bg-container)'
            }}
          >
            <Paragraph type="secondary" style={{ fontSize: '16px' }}>
              {t('editor.canvas')}
            </Paragraph>
          </div>
        </Card>
      </Space>
    </div>
  )
}

