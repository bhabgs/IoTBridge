import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import styles from './index.module.less'

const { Text } = Typography

const Canvas = ({ className }: { className?: string }) => {
  const { t } = useTranslation()

  return (
    <div className={`${styles.canvas} ${className || ''}`}>
      <div className={styles.canvasContainer}>
        <div className={styles.canvasPlaceholder}>
          <Text type="secondary" className={styles.placeholderText}>
            {t('editor.canvas')}
          </Text>
          <Text type="secondary" className={styles.placeholderHint}>
            拖拽左侧工具到此处开始编辑
          </Text>
        </div>
      </div>
    </div>
  )
}

export default Canvas
