import core from 'core'
import styles from './index.module.less'
import { useEffect, useRef, useCallback } from 'react'
import { Button, Space } from 'antd'
import { AppstoreOutlined, BlockOutlined } from '@ant-design/icons'
import { useEditor } from '../../context/EditorContext'
import { createDefaultNode, getDragData, handleDragOver } from '@renderer/utils'
import data from './data'

/** Canvas 组件属性 */
interface CanvasProps {
  className?: string
  /** 初始运行模式 */
  defaultRunMode?: 'edit' | 'preview' | 'production'
}

/** 容器 ID */
const CONTAINER_ID = 'industrial-canvas-container'

const Canvas = ({ className, defaultRunMode = 'edit' }: CanvasProps) => {
  void defaultRunMode
  const containerRef = useRef<HTMLDivElement>(null)
  const { sdkRef, setSDK, selectNode, addNode, currentMode, setCurrentMode } = useEditor()

  // 使用 ref 保存最新的回调函数引用
  const selectNodeRef = useRef(selectNode)
  const setSDKRef = useRef(setSDK)
  const setCurrentModeRef = useRef(setCurrentMode)
  selectNodeRef.current = selectNode
  setSDKRef.current = setSDK
  setCurrentModeRef.current = setCurrentMode

  // 初始化 SDK - 只在组件挂载时执行一次
  useEffect(() => {
    if (!containerRef.current) return

    const sdk = new core({
      container: containerRef.current,
      sceneModel: data,
      onModeChange: (mode) => {
        setCurrentModeRef.current(mode === '2d' ? '2D' : '3D')
      }
    })

    // 将 SDK 实例注册到 EditorContext
    setSDKRef.current(sdk)

    // 注册选择变化监听（SDK 会在模式切换时自动重新绑定）
    sdk.onSelectionChange((nodeId) => {
      selectNodeRef.current(nodeId)
    })

    console.log('SDK initialized:', sdk)

    return () => {
      sdk.dispose()
      setSDKRef.current(null)
    }
  }, []) // 只在组件挂载时执行一次

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

  // 处理拖拽放置
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()

      const dragData = getDragData(e)
      if (!dragData || dragData.type !== 'shape') return

      // 获取放置位置（相对于容器）
      const container = containerRef.current
      const sdk = sdkRef.current
      if (!container || !sdk) return

      const rect = container.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top

      // 使用 SDK 将屏幕坐标转换为世界坐标
      const worldPos = sdk.screenToWorldPosition(screenX, screenY)

      // 创建节点并添加到场景
      const node = createDefaultNode(dragData.shapeType, { x: worldPos.x, z: worldPos.z })
      addNode(node)
    },
    [addNode, sdkRef]
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
