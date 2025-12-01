import { useState, useCallback } from 'react'
import type { EditorElement } from '../types/element'

let idCounter = 0
const generateId = (): string => `el_${Date.now()}_${idCounter++}`

export interface EditorStore {
  elements: EditorElement[]
  selectedId: string | null
  addRect: () => void
  addText: () => void
  deleteSelected: () => void
  selectElement: (id: string | null) => void
  updateElement: (id: string, updates: Partial<EditorElement>) => void
  getSelectedElement: () => EditorElement | undefined
  exportJSON: () => string
  importJSON: (json: string) => boolean
}

export function useEditorStore(): EditorStore {
  const [elements, setElements] = useState<EditorElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
    setSelectedId(newElement.id)
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
    setSelectedId(newElement.id)
  }, [])

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setElements((prev) => prev.filter((el) => el.id !== selectedId))
      setSelectedId(null)
    }
  }, [selectedId])

  const selectElement = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    )
  }, [])

  const getSelectedElement = useCallback((): EditorElement | undefined => {
    return elements.find((el) => el.id === selectedId)
  }, [elements, selectedId])

  const exportJSON = useCallback((): string => {
    return JSON.stringify(elements, null, 2)
  }, [elements])

  const importJSON = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) return false

      const validElements = parsed.filter(
        (item): item is EditorElement =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          (item.type === 'rect' || item.type === 'text') &&
          typeof item.x === 'number' &&
          typeof item.y === 'number' &&
          typeof item.width === 'number' &&
          typeof item.height === 'number'
      )

      setElements(validElements)
      setSelectedId(null)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    elements,
    selectedId,
    addRect,
    addText,
    deleteSelected,
    selectElement,
    updateElement,
    getSelectedElement,
    exportJSON,
    importJSON
  }
}
