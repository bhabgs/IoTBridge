import { Button, Space, Divider, Typography } from 'antd'
import { BorderOutlined, FileTextOutlined, LineOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styles from './index.module.less'

const { Title } = Typography

const Toolbox = ({ className }: { className?: string }) => {
  const { t } = useTranslation()

  const tools = [
    {
      key: 'rect',
      icon: <BorderOutlined />,
      label: '方块',
      title: '添加方块'
    },
    {
      key: 'text',
      icon: <FileTextOutlined />,
      label: '文本',
      title: '添加文本'
    },
    {
      key: 'line',
      icon: <LineOutlined />,
      label: '线条',
      title: '添加线条'
    }
  ]

  return (
    <div className={`${styles.toolbox} ${className || ''}`}>
      <div className={styles.toolboxHeader}>
        <Title level={5} className={styles.toolboxTitle}>
          {t('editor.toolbar')}
        </Title>
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div className={styles.toolboxContent}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {tools.map((tool) => (
            <Button
              key={tool.key}
              block
              icon={tool.icon}
              className={styles.toolButton}
              title={tool.title}
            >
              {tool.label}
            </Button>
          ))}
          <Divider style={{ margin: '12px 0' }} />
          <Button
            block
            danger
            icon={<DeleteOutlined />}
            className={styles.toolButton}
            title={t('common.delete')}
          >
            {t('common.delete')}
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default Toolbox
