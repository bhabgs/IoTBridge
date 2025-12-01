import { useEffect, useRef, useCallback, useState } from 'react'
import 'pixi.js/unsafe-eval'
import { Application, Graphics, Text, Container, FederatedPointerEvent } from 'pixi.js'
import type { EditorElement } from '../types/element'

interface PixiCanvasProps {
  elements: EditorElement[]
  selectedIds: Set<string>
  onSelect: (id: string | null, addToSelection?: boolean) => void
  onSelectMultiple: (ids: string[]) => void
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void
}

export function PixiCanvas({
  elements,
  selectedIds,
  onSelect,
  onSelectMultiple,
  onUpdateElement
}: PixiCanvasProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const elementsContainerRef = useRef<Container | null>(null)
  const selectionBoxRef = useRef<Graphics | null>(null)
  const graphicsMapRef = useRef<Map<string, Graphics | Container>>(new Map())
  const [isReady, setIsReady] = useState(false)

  const onSelectRef = useRef(onSelect)
  const onSelectMultipleRef = useRef(onSelectMultiple)
  const onUpdateElementRef = useRef(onUpdateElement)

  onSelectRef.current = onSelect
  onSelectMultipleRef.current = onSelectMultiple
  onUpdateElementRef.current = onUpdateElement

  const dragStateRef = useRef<{
    isDragging: boolean
    elementId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  }>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  })

  const boxSelectRef = useRef<{
    isSelecting: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
  }>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  })

  const elementsRef = useRef<EditorElement[]>(elements)
  elementsRef.current = elements

  const drawGrid = useCallback((app: Application) => {
    const gridSize = 20
    const grid = new Graphics()
    const width = app.screen.width
    const height = app.screen.height

    grid.setStrokeStyle({ width: 1, color: 0xcccccc, alpha: 0.5 })

    for (let x = 0; x <= width; x += gridSize) {
      grid.moveTo(x, 0)
      grid.lineTo(x, height)
    }

    for (let y = 0; y <= height; y += gridSize) {
      grid.moveTo(0, y)
      grid.lineTo(width, y)
    }

    grid.stroke()
    return grid
  }, [])

  const getElementsInBox = useCallback(
    (x1: number, y1: number, x2: number, y2: number): string[] => {
      const left = Math.min(x1, x2)
      const right = Math.max(x1, x2)
      const top = Math.min(y1, y2)
      const bottom = Math.max(y1, y2)

      return elementsRef.current
        .filter((el) => {
          const elLeft = el.x
          const elRight = el.x + el.width
          const elTop = el.y
          const elBottom = el.y + el.height

          return elLeft < right && elRight > left && elTop < bottom && elBottom > top
        })
        .map((el) => el.id)
    },
    []
  )

  const updateSelectionBox = useCallback(() => {
    const box = selectionBoxRef.current
    const state = boxSelectRef.current
    if (!box || !state.isSelecting) return

    box.clear()

    const x = Math.min(state.startX, state.currentX)
    const y = Math.min(state.startY, state.currentY)
    const width = Math.abs(state.currentX - state.startX)
    const height = Math.abs(state.currentY - state.startY)

    box.rect(x, y, width, height)
    box.fill({ color: 0x4a90d9, alpha: 0.2 })
    box.stroke({ width: 1, color: 0x4a90d9, alpha: 0.8 })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initApp = async (): Promise<void> => {
      const app = new Application()
      await app.init({
        background: '#f5f5f5',
        resizeTo: containerRef.current!,
        antialias: true
      })

      if (!mounted) {
        app.destroy(true)
        return
      }

      containerRef.current!.appendChild(app.canvas)
      appRef.current = app

      const gridGraphics = drawGrid(app)
      app.stage.addChild(gridGraphics)

      const elementsContainer = new Container()
      app.stage.addChild(elementsContainer)
      elementsContainerRef.current = elementsContainer

      const selectionBox = new Graphics()
      app.stage.addChild(selectionBox)
      selectionBoxRef.current = selectionBox

      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        if (e.target === app.stage) {
          boxSelectRef.current = {
            isSelecting: true,
            startX: e.globalX,
            startY: e.globalY,
            currentX: e.globalX,
            currentY: e.globalY
          }
        }
      })

      app.stage.on('pointermove', (e: FederatedPointerEvent) => {
        const dragState = dragStateRef.current
        if (dragState.isDragging && dragState.elementId) {
          const newX = e.globalX - dragState.offsetX
          const newY = e.globalY - dragState.offsetY
          onUpdateElementRef.current(dragState.elementId, {
            x: Math.round(newX),
            y: Math.round(newY)
          })
          return
        }

        const boxState = boxSelectRef.current
        if (boxState.isSelecting) {
          boxState.currentX = e.globalX
          boxState.currentY = e.globalY
          updateSelectionBox()
        }
      })

      app.stage.on('pointerup', (e: FederatedPointerEvent) => {
        const boxState = boxSelectRef.current
        if (boxState.isSelecting) {
          const selectedElements = getElementsInBox(
            boxState.startX,
            boxState.startY,
            boxState.currentX,
            boxState.currentY
          )

          if (selectedElements.length > 0) {
            onSelectMultipleRef.current(selectedElements)
          } else if (e.target === app.stage) {
            onSelectRef.current(null)
          }

          boxSelectRef.current.isSelecting = false
          selectionBoxRef.current?.clear()
        }

        dragStateRef.current.isDragging = false
        dragStateRef.current.elementId = null
      })

      app.stage.on('pointerupoutside', () => {
        boxSelectRef.current.isSelecting = false
        selectionBoxRef.current?.clear()
        dragStateRef.current.isDragging = false
        dragStateRef.current.elementId = null
      })

      setIsReady(true)
    }

    initApp()

    return () => {
      mounted = false
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
        elementsContainerRef.current = null
        selectionBoxRef.current = null
        graphicsMapRef.current.clear()
        setIsReady(false)
      }
    }
  }, [drawGrid, getElementsInBox, updateSelectionBox])

  useEffect(() => {
    if (!isReady) return

    const container = elementsContainerRef.current
    if (!container) return

    const currentIds = new Set(elements.map((el) => el.id))
    const existingIds = new Set(graphicsMapRef.current.keys())

    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const obj = graphicsMapRef.current.get(id)
        if (obj) {
          container.removeChild(obj)
          obj.destroy()
          graphicsMapRef.current.delete(id)
        }
      }
    })

    const renderElement = (
      element: EditorElement,
      parentContainer: Container,
      isGroupChild = false
    ): void => {
      let displayObj = graphicsMapRef.current.get(element.id)
      const isSelected = selectedIds.has(element.id)

      if (element.type === 'rect') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'
          parentContainer.addChild(graphics)
          graphicsMapRef.current.set(element.id, graphics)
        }

        graphics.clear()
        graphics.rect(0, 0, element.width, element.height)
        graphics.fill({ color: 0x4a90d9 })

        if (isSelected && !isGroupChild) {
          graphics.stroke({ width: 3, color: 0xff6b35 })
        } else {
          graphics.stroke({ width: 1, color: 0x2c5282 })
        }

        graphics.position.set(element.x, element.y)

        if (!isGroupChild) {
          graphics.removeAllListeners('pointerdown')
          graphics.on('pointerdown', (e: FederatedPointerEvent) => {
            e.stopPropagation()
            const addToSelection = e.ctrlKey || e.metaKey
            onSelectRef.current(element.id, addToSelection)

            if (!addToSelection) {
              dragStateRef.current = {
                isDragging: true,
                elementId: element.id,
                startX: element.x,
                startY: element.y,
                offsetX: e.globalX - element.x,
                offsetY: e.globalY - element.y
              }
            }
          })
        }
      } else if (element.type === 'text') {
        let textContainer = displayObj as Container | undefined
        if (!textContainer) {
          textContainer = new Container()
          textContainer.eventMode = 'static'
          textContainer.cursor = 'pointer'
          parentContainer.addChild(textContainer)
          graphicsMapRef.current.set(element.id, textContainer)
        }

        textContainer.removeChildren()

        const bg = new Graphics()
        bg.rect(0, 0, element.width, element.height)
        bg.fill({ color: 0xffffff, alpha: 0.9 })

        if (isSelected && !isGroupChild) {
          bg.stroke({ width: 3, color: 0xff6b35 })
        } else {
          bg.stroke({ width: 1, color: 0xcccccc })
        }

        textContainer.addChild(bg)

        const text = new Text({
          text: element.text || '',
          style: {
            fontSize: 16,
            fill: 0x333333,
            fontFamily: 'Arial'
          }
        })
        text.x = 5
        text.y = (element.height - text.height) / 2
        textContainer.addChild(text)

        textContainer.position.set(element.x, element.y)

        if (!isGroupChild) {
          textContainer.removeAllListeners('pointerdown')
          textContainer.on('pointerdown', (e: FederatedPointerEvent) => {
            e.stopPropagation()
            const addToSelection = e.ctrlKey || e.metaKey
            onSelectRef.current(element.id, addToSelection)

            if (!addToSelection) {
              dragStateRef.current = {
                isDragging: true,
                elementId: element.id,
                startX: element.x,
                startY: element.y,
                offsetX: e.globalX - element.x,
                offsetY: e.globalY - element.y
              }
            }
          })
        }
      } else if (element.type === 'group') {
        let groupContainer = displayObj as Container | undefined
        if (!groupContainer) {
          groupContainer = new Container()
          groupContainer.eventMode = 'static'
          groupContainer.cursor = 'pointer'
          parentContainer.addChild(groupContainer)
          graphicsMapRef.current.set(element.id, groupContainer)
        }

        groupContainer.removeChildren()

        // Draw group border (dashed effect with segments)
        const border = new Graphics()
        const dashLength = 6
        const gapLength = 4
        const strokeColor = isSelected ? 0xff6b35 : 0x666666
        const strokeWidth = isSelected ? 2 : 1

        // Draw dashed rectangle
        const drawDashedLine = (
          x1: number,
          y1: number,
          x2: number,
          y2: number
        ): void => {
          const dx = x2 - x1
          const dy = y2 - y1
          const distance = Math.sqrt(dx * dx + dy * dy)
          const dashCount = Math.floor(distance / (dashLength + gapLength))
          const unitX = dx / distance
          const unitY = dy / distance

          for (let i = 0; i < dashCount; i++) {
            const startX = x1 + (dashLength + gapLength) * i * unitX
            const startY = y1 + (dashLength + gapLength) * i * unitY
            const endX = startX + dashLength * unitX
            const endY = startY + dashLength * unitY
            border.moveTo(startX, startY)
            border.lineTo(endX, endY)
          }
        }

        border.setStrokeStyle({ width: strokeWidth, color: strokeColor })

        // Top
        drawDashedLine(0, 0, element.width, 0)
        // Right
        drawDashedLine(element.width, 0, element.width, element.height)
        // Bottom
        drawDashedLine(element.width, element.height, 0, element.height)
        // Left
        drawDashedLine(0, element.height, 0, 0)

        border.stroke()
        groupContainer.addChild(border)

        // Render children
        if (element.children) {
          element.children.forEach((child) => {
            // Create a temporary container for child rendering
            const childGraphics = new Graphics()
            if (child.type === 'rect') {
              childGraphics.rect(0, 0, child.width, child.height)
              childGraphics.fill({ color: 0x4a90d9 })
              childGraphics.stroke({ width: 1, color: 0x2c5282 })
              childGraphics.position.set(child.x - element.x, child.y - element.y)
            } else if (child.type === 'text') {
              childGraphics.rect(0, 0, child.width, child.height)
              childGraphics.fill({ color: 0xffffff, alpha: 0.9 })
              childGraphics.stroke({ width: 1, color: 0xcccccc })
              childGraphics.position.set(child.x - element.x, child.y - element.y)

              const textObj = new Text({
                text: child.text || '',
                style: { fontSize: 16, fill: 0x333333, fontFamily: 'Arial' }
              })
              textObj.x = child.x - element.x + 5
              textObj.y = child.y - element.y + (child.height - 16) / 2
              groupContainer!.addChild(textObj)
            }
            groupContainer!.addChild(childGraphics)
          })
        }

        groupContainer.position.set(element.x, element.y)

        groupContainer.removeAllListeners('pointerdown')
        groupContainer.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: e.globalX - element.x,
              offsetY: e.globalY - element.y
            }
          }
        })
      }
    }

    elements.forEach((element) => {
      renderElement(element, container)
    })
  }, [elements, selectedIds, isReady])

  return <div ref={containerRef} className="pixi-canvas" />
}
