import core from 'core'
import styles from './index.module.less'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Button, Space } from 'antd'
import { AppstoreOutlined, BlockOutlined } from '@ant-design/icons'
import data from './data'

/** Canvas 组件属性 */
interface CanvasProps {
  className?: string
  /** 初始渲染模式 */
  defaultMode?: '2D' | '3D'
  /** 初始运行模式 */
  defaultRunMode?: 'edit' | 'preview' | 'production'
}

/** 容器 ID */
const CONTAINER_ID = 'industrial-canvas-container'

const Canvas = ({ className, defaultMode = '2D', defaultRunMode = 'edit' }: CanvasProps) => {
  // TODO: 未来使用 defaultRunMode 来控制编辑/预览/生产模式
  void defaultRunMode
  const containerRef = useRef<HTMLDivElement>(null)
  const sdkRef = useRef<InstanceType<typeof core> | null>(null)
  const [currentMode, setCurrentMode] = useState<'2D' | '3D'>(defaultMode)

  // 初始化 SDK
  useEffect(() => {
    if (containerRef.current && !sdkRef.current) {
      const sdk = new core({
        container: containerRef.current,
        sceneModel: data,
        onModeChange: (mode) => {
          // 同步状态
          setCurrentMode(mode === '2d' ? '2D' : '3D')
        }
      })

      sdkRef.current = sdk
      console.log('SDK initialized:', sdk)
    }

    // 清理函数
    return () => {
      if (sdkRef.current) {
        sdkRef.current.dispose()
        sdkRef.current = null
      }
    }
  }, [defaultMode])

  // 切换模式
  const handleModeSwitch = useCallback(
    (mode: '2D' | '3D') => {
      if (!sdkRef.current || currentMode === mode) {
        return
      }

      try {
        const targetMode = mode === '2D' ? '2d' : '3d'
        sdkRef.current.switchSceneMode(targetMode)
        setCurrentMode(mode)
      } catch (error) {
        console.error('Failed to switch mode:', error)
      }
    },
    [currentMode]
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
