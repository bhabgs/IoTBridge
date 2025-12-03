import { Typography } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useRef, useState } from 'react'
import { useEditor } from '../../context/EditorContext'
import styles from './index.module.less'

const { Text } = Typography

const Canvas = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { addElement, elements } = useEditor()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // 处理拖拽进入
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDraggingOver(true)
  }

  // 处理拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))

      if (!canvasRef.current) return

      // 获取画布容器的位置
      const rect = canvasRef.current.getBoundingClientRect()
      // 计算相对于画布的坐标（减去滚动位置）
      const x = e.clientX - rect.left + canvasRef.current.scrollLeft
      const y = e.clientY - rect.top + canvasRef.current.scrollTop

      // 根据拖拽数据类型添加元素
      if (dragData.type === 'component') {
        // 添加组件
        addElement({
          type: 'component',
          name: dragData.label,
          x: Math.max(0, x - 50), // 默认宽度100，居中
          y: Math.max(0, y - 30), // 默认高度60，居中
          width: 100,
          height: 60,
          componentType: dragData.componentType
        })
      } else if (dragData.type === 'shape') {
        // 添加基础图形
        addElement({
          type: dragData.shapeType,
          name: dragData.label || dragData.shapeType,
          x: Math.max(0, x - 50),
          y: Math.max(0, y - 30),
          width: 100,
          height: 60
        })
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error)
    }
  }

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${className || ''} ${isDraggingOver ? styles.draggingOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.canvasContainer}>
        {elements.length === 0 ? (
          <div className={styles.canvasPlaceholder}>
            <Text type="secondary" className={styles.placeholderText}>
              {t('editor.canvas')}
            </Text>
            <Text type="secondary" className={styles.placeholderHint}>
              拖拽左侧工具到此处开始编辑
            </Text>
          </div>
        ) : (
          <div className={styles.canvasContent}>
            {elements.map((element) => (
              <div
                key={element.id}
                className={styles.canvasElement}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`
                }}
              >
                <div className={styles.elementContent}>
                  {element.type === 'component' ? (
                    <>
                      <DatabaseOutlined />
                      <span>{element.name}</span>
                    </>
                  ) : (
                    <span>{element.name || element.type}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Canvas
