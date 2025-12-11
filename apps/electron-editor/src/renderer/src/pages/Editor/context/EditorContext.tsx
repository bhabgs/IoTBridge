import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import type IndustrialConfigSDK from 'core'
import type { SceneNode, SceneChangeEvent } from 'core'

/** 编辑器上下文类型 */
interface EditorContextType {
  /** SDK 实例引用 */
  sdkRef: React.MutableRefObject<InstanceType<typeof IndustrialConfigSDK> | null>
  /** 设置 SDK 实例 */
  setSDK: (sdk: InstanceType<typeof IndustrialConfigSDK> | null) => void
  /** 当前选中的节点 ID */
  selectedNodeId: string | null
  /** 选中节点 */
  selectNode: (nodeId: string | null) => void
  /** 获取选中的节点数据 */
  getSelectedNode: () => SceneNode | null
  /** 添加节点 */
  addNode: (node: SceneNode) => string | null
  /** 更新节点 */
  updateNode: (nodeId: string, updates: Partial<SceneNode>) => boolean
  /** 删除节点 */
  deleteNode: (nodeId: string) => boolean
  /** 获取所有节点 */
  getNodes: () => SceneNode[]
  /** 当前渲染模式 */
  currentMode: '2D' | '3D'
  /** 设置渲染模式 */
  setCurrentMode: (mode: '2D' | '3D') => void
}

const EditorContext = createContext<EditorContextType | null>(null)

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}

interface EditorProviderProps {
  children: ReactNode
}

export const EditorProvider = ({ children }: EditorProviderProps) => {
  const sdkRef = useRef<InstanceType<typeof IndustrialConfigSDK> | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<'2D' | '3D'>('2D')
  // 用于触发重渲染
  const [, forceUpdate] = useState({})

  const setSDK = useCallback((sdk: InstanceType<typeof IndustrialConfigSDK> | null) => {
    sdkRef.current = sdk

    if (sdk) {
      // 监听场景变化事件
      sdk.onSceneChange((event: SceneChangeEvent) => {
        // 处理节点删除
        if (event.type === 'remove' && event.nodeId === selectedNodeId) {
          setSelectedNodeId(null)
        }
        // 触发重渲染以同步属性面板
        forceUpdate({})
      })
    }
  }, [selectedNodeId])

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId)
    // 同步到 SDK
    sdkRef.current?.selectNodeById(nodeId)
  }, [])

  const getSelectedNode = useCallback((): SceneNode | null => {
    if (!selectedNodeId || !sdkRef.current) return null
    return sdkRef.current.getNode(selectedNodeId)
  }, [selectedNodeId])

  const addNode = useCallback((node: SceneNode): string | null => {
    if (!sdkRef.current) return null
    const nodeId = sdkRef.current.addNode(node)
    if (nodeId) {
      setSelectedNodeId(nodeId)
    }
    return nodeId
  }, [])

  const updateNode = useCallback((nodeId: string, updates: Partial<SceneNode>): boolean => {
    if (!sdkRef.current) return false
    const result = sdkRef.current.updateNode(nodeId, updates)
    if (result) {
      forceUpdate({})
    }
    return result
  }, [])

  const deleteNode = useCallback((nodeId: string): boolean => {
    if (!sdkRef.current) return false
    const result = sdkRef.current.removeNode(nodeId)
    if (result && selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
    return result
  }, [selectedNodeId])

  const getNodes = useCallback((): SceneNode[] => {
    if (!sdkRef.current) return []
    return sdkRef.current.getNodes()
  }, [])

  return (
    <EditorContext.Provider
      value={{
        sdkRef,
        setSDK,
        selectedNodeId,
        selectNode,
        getSelectedNode,
        addNode,
        updateNode,
        deleteNode,
        getNodes,
        currentMode,
        setCurrentMode
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}
