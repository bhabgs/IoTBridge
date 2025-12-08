import { useEffect, useRef, useState } from 'react'
import styles from './index.module.less'

const Canvas = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // 初始化 EditorCore
  useEffect(() => {
    if (!canvasRef.current) return

    const initEditorCore = async () => {}

    initEditorCore()

    // 清理函数
    return () => {}
  }, [])

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
    const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
    console.log(dragData)
  }

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${className || ''} ${isDraggingOver ? styles.draggingOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  )
}

export default Canvas
