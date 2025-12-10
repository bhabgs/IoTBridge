import core from 'core'
import styles from './index.module.less'
import { useEffect, useRef } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (containerRef.current) {
      const sdk = new core({
        container: containerRef.current
      })
      console.log(sdk)
    }
  }, [containerRef.current])
  return (
    <div className={styles.canvas}>
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

      {/* 初始化提示 */}
      {/* <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: 14
        }}
      >
        正在初始化画布...
      </div> */}
    </div>
  )
}

export default Canvas
