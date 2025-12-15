import { Button, Space, Typography, Divider, message } from 'antd'
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ExportOutlined,
  ImportOutlined,
  FullscreenOutlined,
  BorderOutlined,
  FileTextOutlined,
  LineOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import styles from './index.module.less'

const { Title } = Typography

const Header = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { exportSceneToFile, importSceneFromFile } = useEditor()

  const shapes = [
    {
      key: 'rect',
      icon: <BorderOutlined />,
      title: t('editor.shapes.rect')
    },
    {
      key: 'circle',
      icon: <div className={styles.circleIcon} />,
      title: t('editor.shapes.circle')
    },
    {
      key: 'polygon',
      icon: <div className={styles.polygonIcon} />,
      title: t('editor.shapes.polygon')
    },
    {
      key: 'arrow',
      icon: <ArrowRightOutlined />,
      title: t('editor.shapes.arrow')
    },
    {
      key: 'line',
      icon: <LineOutlined />,
      title: t('editor.shapes.line')
    },
    {
      key: 'text',
      icon: <FileTextOutlined />,
      title: t('editor.shapes.text')
    }
  ]

  const handleShapeClick = (key: string) => {
    console.log('Add shape:', key)
    // TODO: 实现添加图形逻辑
  }

  // 处理基础图形拖拽开始
  const handleShapeDragStart = (e: React.DragEvent, key: string, title: string) => {
    const dragData = {
      type: 'shape',
      shapeType: key,
      label: title
    }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  // 处理基础图形拖拽结束
  const handleShapeDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  // 处理导出
  const handleExport = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `scene-${timestamp}.json`
      exportSceneToFile(filename)
      message.success(t('common.exportSuccess') || '导出成功')
    } catch (error) {
      console.error('Export failed:', error)
      message.error(t('common.exportFailed') || '导出失败')
    }
  }

  // 处理导入
  const handleImport = async () => {
    try {
      await importSceneFromFile()
      message.success(t('common.importSuccess') || '导入成功')
    } catch (error) {
      // 用户取消文件选择时不显示错误
      if (error instanceof Error && error.message === 'File selection cancelled') {
        return
      }
      console.error('Import failed:', error)
      message.error(t('common.importFailed') || '导入失败')
    }
  }

  return (
    <div className={`${styles.header} ${className || ''}`}>
      <div className={styles.headerLeft}>
        <Title level={4} className={styles.title}>
          {t('editor.title')}
        </Title>
      </div>
      <div className={styles.headerCenter}>
        <Space size="small" split={<Divider type="vertical" />}>
          <Space size="small">
            <Button icon={<UndoOutlined />} size="small" title={t('common.undo')} />
            <Button icon={<RedoOutlined />} size="small" title={t('common.redo')} />
          </Space>
          <Space size="small">
            {shapes.map((shape) => (
              <Button
                key={shape.key}
                icon={shape.icon}
                size="small"
                title={shape.title}
                draggable
                onDragStart={(e) => handleShapeDragStart(e, shape.key, shape.title)}
                onDragEnd={handleShapeDragEnd}
                onClick={() => handleShapeClick(shape.key)}
                style={{ cursor: 'grab' }}
              />
            ))}
          </Space>
        </Space>
      </div>
      <div className={styles.headerRight}>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" size="small">
            {t('common.save')}
          </Button>
          <Divider type="vertical" />
          <Button icon={<ExportOutlined />} size="small" onClick={handleExport}>
            {t('common.export')}
          </Button>
          <Button icon={<ImportOutlined />} size="small" onClick={handleImport}>
            {t('common.import')}
          </Button>
          <Button icon={<FullscreenOutlined />} size="small" />
        </Space>
      </div>
    </div>
  )
}

export default Header
