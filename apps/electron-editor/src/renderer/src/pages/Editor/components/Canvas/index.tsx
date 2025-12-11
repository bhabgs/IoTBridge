import core from 'core'
import type { SceneNode } from 'core'
import styles from './index.module.less'
import { useEffect, useRef, useCallback } from 'react'
import { Button, Space } from 'antd'
import { AppstoreOutlined, BlockOutlined } from '@ant-design/icons'
import { useEditor } from '../../context/EditorContext'
import data from './data'

/** Canvas 组件属性 */
interface CanvasProps {
  className?: string
  /** 初始运行模式 */
  defaultRunMode?: 'edit' | 'preview' | 'production'
}

/** 容器 ID */
const CONTAINER_ID = 'industrial-canvas-container'

/** 生成唯一 ID */
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/** 根据图形类型获取默认配置 */
const getDefaultNodeConfig = (
  shapeType: string,
  position: { x: number; z: number }
): SceneNode => {
  const baseNode = {
    id: generateId(),
    transform: {
      position: { x: position.x, y: 0, z: position.z }
    }
  }

  switch (shapeType) {
    case 'rect':
      return {
        ...baseNode,
        type: 'rect',
        name: '矩形',
        geometry: { width: 100, height: 100, depth: 10 },
        material: { color: '#4A90D9' }
      } as SceneNode
    case 'circle':
      return {
        ...baseNode,
        type: 'circle',
        name: '圆形',
        geometry: { radius: 50 },
        material: { color: '#E6A23C' }
      } as SceneNode
    case 'ellipse':
      return {
        ...baseNode,
        type: 'ellipse',
        name: '椭圆',
        geometry: { radiusX: 60, radiusY: 40 },
        material: { color: '#F56C6C' }
      } as SceneNode
    case 'line':
      return {
        ...baseNode,
        type: 'line',
        name: '线条',
        geometry: {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
          ]
        },
        style: { stroke: '#909399', strokeWidth: 2 }
      } as SceneNode
    case 'polygon':
      return {
        ...baseNode,
        type: 'polygon',
        name: '多边形',
        geometry: {
          points: [
            { x: 50, y: 0 },
            { x: 100, y: 35 },
            { x: 80, y: 90 },
            { x: 20, y: 90 },
            { x: 0, y: 35 }
          ],
          closed: true
        },
        style: { fill: '#67C23A', stroke: '#409EFF', strokeWidth: 2 }
      } as SceneNode
    case 'text':
      return {
        ...baseNode,
        type: 'text',
        name: '文本',
        geometry: { width: 100, height: 30 },
        style: {
          text: '文本',
          fontSize: 16,
          fill: '#303133'
        }
      } as SceneNode
    default:
      return {
        ...baseNode,
        type: 'rect',
        name: '矩形',
        geometry: { width: 100, height: 100, depth: 10 },
        material: { color: '#4A90D9' }
      } as SceneNode
  }
}

const Canvas = ({ className, defaultRunMode = 'edit' }: CanvasProps) => {
  void defaultRunMode
  const containerRef = useRef<HTMLDivElement>(null)
  const { sdkRef, setSDK, selectNode, addNode, currentMode, setCurrentMode } = useEditor()

  // 初始化 SDK - 只在组件挂载时执行一次
  useEffect(() => {
    if (!containerRef.current) return

    const sdk = new core({
      container: containerRef.current,
      sceneModel: data,
      onModeChange: (mode) => {
        setCurrentMode(mode === '2d' ? '2D' : '3D')
      }
    })

    // 将 SDK 实例注册到 EditorContext
    setSDK(sdk)

    // 监听 SDK 的选择变化
    const renderer = sdk.get2DRenderer()
    if (renderer?.selector) {
      renderer.selector.onChange((object) => {
        if (object) {
          const nodeId = (object as any).nodeId
          if (nodeId) {
            selectNode(nodeId)
          }
        } else {
          selectNode(null)
        }
      })
    }

    console.log('SDK initialized:', sdk)

    return () => {
      sdk.dispose()
      setSDK(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次，不依赖任何 callback

  // 切换模式
  const handleModeSwitch = useCallback(
    (mode: '2D' | '3D') => {
      const sdk = sdkRef.current
      if (!sdk || currentMode === mode) return

      try {
        const targetMode = mode === '2D' ? '2d' : '3d'
        sdk.switchSceneMode(targetMode)
        setCurrentMode(mode)
      } catch (error) {
        console.error('Failed to switch mode:', error)
      }
    },
    [sdkRef, currentMode, setCurrentMode]
  )

  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // 处理拖拽放置
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()

      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (!jsonData) return

        const dragData = JSON.parse(jsonData)
        if (dragData.type !== 'shape') return

        // 获取放置位置（相对于容器）
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // 创建节点
        const node = getDefaultNodeConfig(dragData.shapeType, { x, z: y })

        // 添加到场景
        addNode(node)

        console.log('Dropped shape:', dragData.shapeType, 'at', { x, y })
      } catch (error) {
        console.error('Failed to handle drop:', error)
      }
    },
    [addNode]
  )

  return (
    <div className={`${styles.canvas} ${className || ''}`}>
      {/* SDK 渲染容器 */}
      <div
        id={CONTAINER_ID}
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* 模式切换器 */}
      <div className={styles.modeSwitcher}>
        <Space>
          <Button
            type={currentMode === '2D' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => handleModeSwitch('2D')}
            size="small"
          >
            2D
          </Button>
          <Button
            type={currentMode === '3D' ? 'primary' : 'default'}
            icon={<BlockOutlined />}
            onClick={() => handleModeSwitch('3D')}
            size="small"
          >
            3D
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default Canvas
