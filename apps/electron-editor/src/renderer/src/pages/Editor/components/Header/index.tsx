import { Button, Space, Typography, Divider } from 'antd'
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ExportOutlined,
  ImportOutlined,
  FullscreenOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styles from './index.module.less'

const { Title } = Typography

const Header = ({ className }: { className?: string }) => {
  const { t } = useTranslation()

  return (
    <div className={`${styles.header} ${className || ''}`}>
      <div className={styles.headerLeft}>
        <Title level={4} className={styles.title}>
          {t('editor.title')}
        </Title>
      </div>
      <div className={styles.headerCenter}>
        <Space>
          <Button icon={<UndoOutlined />} size="small" title={t('common.undo')} />
          <Button icon={<RedoOutlined />} size="small" title={t('common.redo')} />
        </Space>
      </div>
      <div className={styles.headerRight}>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" size="small">
            {t('common.save')}
          </Button>
          <Divider type="vertical" />
          <Button icon={<ExportOutlined />} size="small">
            {t('common.export')}
          </Button>
          <Button icon={<ImportOutlined />} size="small">
            {t('common.import')}
          </Button>
          <Button icon={<FullscreenOutlined />} size="small" />
        </Space>
      </div>
    </div>
  )
}

export default Header
