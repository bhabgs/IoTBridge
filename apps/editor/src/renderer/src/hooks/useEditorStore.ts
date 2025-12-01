import { useState, useCallback } from 'react'
import type { EditorElement, ElementType, Point } from '../types/element'

let idCounter = 0
const generateId = (): string => `el_${Date.now()}_${idCounter++}`

export interface EditorStore {
  elements: EditorElement[]
  selectedIds: Set<string>
  addRect: () => void
  addText: () => void
  addElementAt: (type: ElementType, x: number, y: number) => void
  addPipe: (startElementId: string, endElementId: string, points: Point[]) => void
  deleteSelected: () => void
  selectElement: (id: string | null, addToSelection?: boolean) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  updateElement: (id: string, updates: Partial<EditorElement>) => void
  getSelectedElements: () => EditorElement[]
  groupSelected: () => void
  ungroupSelected: () => void
  canGroup: () => boolean
  canUngroup: () => boolean
  exportJSON: () => string
  importJSON: (json: string) => boolean
}

export function useEditorStore(): EditorStore {
  const [elements, setElements] = useState<EditorElement[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const addRect = useCallback(() => {
    const newElement: EditorElement = {
      id: generateId(),
      type: 'rect',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 100,
      height: 80
    }
    setElements((prev) => [...prev, newElement])
    setSelectedIds(new Set([newElement.id]))
  }, [])

  const addText = useCallback(() => {
    const newElement: EditorElement = {
      id: generateId(),
      type: 'text',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 120,
      height: 30,
      text: 'Text'
    }
    setElements((prev) => [...prev, newElement])
    setSelectedIds(new Set([newElement.id]))
  }, [])

  const addElementAt = useCallback((type: ElementType, x: number, y: number) => {
    const getDefaults = (t: ElementType): {
      width: number
      height: number
      fillColor: string
      strokeColor: string
      strokeWidth: number
      opacity: number
    } => {
      switch (t) {
        case 'rect':
          return { width: 100, height: 80, fillColor: '#4a90d9', strokeColor: '#2c5282', strokeWidth: 1, opacity: 1 }
        case 'circle':
          return { width: 80, height: 80, fillColor: '#48bb78', strokeColor: '#276749', strokeWidth: 1, opacity: 1 }
        case 'ellipse':
          return { width: 100, height: 60, fillColor: '#48bb78', strokeColor: '#276749', strokeWidth: 1, opacity: 1 }
        case 'triangle':
          return { width: 80, height: 70, fillColor: '#ed8936', strokeColor: '#c05621', strokeWidth: 1, opacity: 1 }
        case 'diamond':
          return { width: 80, height: 80, fillColor: '#9f7aea', strokeColor: '#6b46c1', strokeWidth: 1, opacity: 1 }
        case 'line':
          return { width: 100, height: 4, fillColor: 'transparent', strokeColor: '#4a5568', strokeWidth: 3, opacity: 1 }
        case 'text':
          return { width: 120, height: 30, fillColor: '#ffffff', strokeColor: '#cccccc', strokeWidth: 1, opacity: 1 }
        default:
          return { width: 100, height: 80, fillColor: '#4a90d9', strokeColor: '#2c5282', strokeWidth: 1, opacity: 1 }
      }
    }

    const defaults = getDefaults(type)
    const newElement: EditorElement = {
      id: generateId(),
      type,
      x,
      y,
      width: defaults.width,
      height: defaults.height,
      fillColor: defaults.fillColor,
      strokeColor: defaults.strokeColor,
      strokeWidth: defaults.strokeWidth,
      opacity: defaults.opacity,
      ...(type === 'text' ? { text: 'Text', fontSize: 16 } : {})
    }
    setElements((prev) => [...prev, newElement])
    setSelectedIds(new Set([newElement.id]))
  }, [])

  const addPipe = useCallback((startElementId: string, endElementId: string, points: Point[]) => {
    if (points.length < 2) return

    // Calculate bounding box
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    // Normalize points relative to bounding box
    const normalizedPoints = points.map(p => ({
      x: p.x - minX,
      y: p.y - minY
    }))

    const newElement: EditorElement = {
      id: generateId(),
      type: 'pipe',
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      points: normalizedPoints,
      pipeWidth: 8,
      strokeColor: '#4a5568',
      fillColor: '#718096',
      opacity: 1,
      startElementId,
      endElementId
    }
    setElements((prev) => [...prev, newElement])
    setSelectedIds(new Set([newElement.id]))
  }, [])

  const deleteSelected = useCallback(() => {
    if (selectedIds.size > 0) {
      setElements((prev) => prev.filter((el) => !selectedIds.has(el.id)))
      setSelectedIds(new Set())
    }
  }, [selectedIds])

  const selectElement = useCallback((id: string | null, addToSelection = false) => {
    if (id === null) {
      setSelectedIds(new Set())
    } else if (addToSelection) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        return newSet
      })
    } else {
      setSelectedIds(new Set([id]))
    }
  }, [])

  const selectElements = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setElements((prev) => {
      const updateRecursive = (elements: EditorElement[]): EditorElement[] => {
        return elements.map((el) => {
          if (el.id === id) {
            const updated = { ...el, ...updates }
            // If it's a group and position changed, update children positions too
            if (el.type === 'group' && el.children && (updates.x !== undefined || updates.y !== undefined)) {
              const dx = (updates.x ?? el.x) - el.x
              const dy = (updates.y ?? el.y) - el.y
              updated.children = el.children.map((child) => ({
                ...child,
                x: child.x + dx,
                y: child.y + dy
              }))
            }
            return updated
          }
          if (el.type === 'group' && el.children) {
            return { ...el, children: updateRecursive(el.children) }
          }
          return el
        })
      }
      return updateRecursive(prev)
    })
  }, [])

  const getSelectedElements = useCallback((): EditorElement[] => {
    return elements.filter((el) => selectedIds.has(el.id))
  }, [elements, selectedIds])

  const canGroup = useCallback((): boolean => {
    return selectedIds.size >= 2
  }, [selectedIds])

  const canUngroup = useCallback((): boolean => {
    if (selectedIds.size !== 1) return false
    const selected = elements.find((el) => selectedIds.has(el.id))
    return selected?.type === 'group'
  }, [selectedIds, elements])

  const groupSelected = useCallback(() => {
    if (selectedIds.size < 2) return

    const selectedElements = elements.filter((el) => selectedIds.has(el.id))
    if (selectedElements.length < 2) return

    // Calculate bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    selectedElements.forEach((el) => {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    })

    const group: EditorElement = {
      id: generateId(),
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      children: selectedElements
    }

    setElements((prev) => [...prev.filter((el) => !selectedIds.has(el.id)), group])
    setSelectedIds(new Set([group.id]))
  }, [selectedIds, elements])

  const ungroupSelected = useCallback(() => {
    if (selectedIds.size !== 1) return

    const groupId = Array.from(selectedIds)[0]
    const group = elements.find((el) => el.id === groupId)
    if (!group || group.type !== 'group' || !group.children) return

    setElements((prev) => [...prev.filter((el) => el.id !== groupId), ...group.children!])
    setSelectedIds(new Set(group.children.map((el) => el.id)))
  }, [selectedIds, elements])

  const exportJSON = useCallback((): string => {
    return JSON.stringify(elements, null, 2)
  }, [elements])

  const importJSON = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) return false

      const validateElement = (item: unknown): item is EditorElement => {
        if (typeof item !== 'object' || item === null) return false
        const el = item as Record<string, unknown>
        if (typeof el.id !== 'string') return false
        if (el.type !== 'rect' && el.type !== 'text' && el.type !== 'group') return false
        if (typeof el.x !== 'number' || typeof el.y !== 'number') return false
        if (typeof el.width !== 'number' || typeof el.height !== 'number') return false
        if (el.type === 'group' && el.children) {
          if (!Array.isArray(el.children)) return false
          return el.children.every(validateElement)
        }
        return true
      }

      const validElements = parsed.filter(validateElement)
      setElements(validElements)
      setSelectedIds(new Set())
      return true
    } catch {
      return false
    }
  }, [])

  return {
    elements,
    selectedIds,
    addRect,
    addText,
    addElementAt,
    addPipe,
    deleteSelected,
    selectElement,
    selectElements,
    clearSelection,
    updateElement,
    getSelectedElements,
    groupSelected,
    ungroupSelected,
    canGroup,
    canUngroup,
    exportJSON,
    importJSON
  }
}
