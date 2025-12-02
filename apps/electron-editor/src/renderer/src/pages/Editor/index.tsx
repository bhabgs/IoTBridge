import { Typography, Space, Button, Card } from 'antd'
import { useTranslation } from 'react-i18next'
import { SaveOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Editor() {
  const { t } = useTranslation()

  return (
    <div style={{ padding: '24px', height: '100%' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>{t('editor.title')}</Title>
          <Space>
            <Button type="primary" icon={<SaveOutlined />}>
              {t('common.save')}
            </Button>
            <Button icon={<ExportOutlined />}>{t('common.export')}</Button>
            <Button icon={<ImportOutlined />}>{t('common.import')}</Button>
          </Space>
        </div>

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

