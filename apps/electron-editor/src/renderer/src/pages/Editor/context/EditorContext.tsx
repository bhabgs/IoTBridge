import { createContext, useContext, useState, ReactNode } from 'react'

export interface CanvasElement {
  id: string
  type: 'rect' | 'circle' | 'polygon' | 'arrow' | 'line' | 'text' | 'component'
  name: string
  x: number
  y: number
  width: number
  height: number
  children?: CanvasElement[]
  componentType?: string // 组件类型，如 'pump', 'valve' 等
  [key: string]: any // 其他属性
}

interface EditorContextType {
  elements: CanvasElement[]
  selectedElementId: string | null
  addElement: (element: Partial<CanvasElement> & Pick<CanvasElement, 'type' | 'name' | 'x' | 'y' | 'width' | 'height'>) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  selectElement: (id: string | null) => void
  getSelectedElement: () => CanvasElement | null
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
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const addElement = (element: Partial<CanvasElement> & Pick<CanvasElement, 'type' | 'name' | 'x' | 'y' | 'width' | 'height'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } as CanvasElement
    setElements((prev) => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    )
  }

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    if (selectedElementId === id) {
      setSelectedElementId(null)
    }
  }

  const selectElement = (id: string | null) => {
    setSelectedElementId(id)
  }

  const getSelectedElement = (): CanvasElement | null => {
    return elements.find((el) => el.id === selectedElementId) || null
  }

  return (
    <EditorContext.Provider
      value={{
        elements,
        selectedElementId,
        addElement,
        updateElement,
        deleteElement,
        selectElement,
        getSelectedElement
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

