import { useEffect, useRef, useCallback, useState } from 'react'
import 'pixi.js/unsafe-eval'
import { Application, Graphics, Text, Container, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js'
import type { EditorElement, ElementType } from '../types/element'

interface PixiCanvasProps {
  elements: EditorElement[]
  selectedIds: Set<string>
  onSelect: (id: string | null, addToSelection?: boolean) => void
  onSelectMultiple: (ids: string[]) => void
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void
  onDropElement: (type: ElementType, x: number, y: number) => void
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.1

export function PixiCanvas({
  elements,
  selectedIds,
  onSelect,
  onSelectMultiple,
  onUpdateElement,
  onDropElement
}: PixiCanvasProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const viewportRef = useRef<Container | null>(null)
  const gridRef = useRef<Graphics | null>(null)
  const elementsContainerRef = useRef<Container | null>(null)
  const selectionBoxRef = useRef<Graphics | null>(null)
  const graphicsMapRef = useRef<Map<string, Graphics | Container>>(new Map())
  const [isReady, setIsReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const spaceRef = useRef(false)

  const onSelectRef = useRef(onSelect)
  const onSelectMultipleRef = useRef(onSelectMultiple)
  const onUpdateElementRef = useRef(onUpdateElement)
  const onDropElementRef = useRef(onDropElement)

  onSelectRef.current = onSelect
  onSelectMultipleRef.current = onSelectMultiple
  onUpdateElementRef.current = onUpdateElement
  onDropElementRef.current = onDropElement

  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

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

  const panStateRef = useRef<{
    isPanning: boolean
    startX: number
    startY: number
    viewportStartX: number
    viewportStartY: number
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    viewportStartX: 0,
    viewportStartY: 0
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

  const redrawGrid = useCallback(() => {
    const app = appRef.current
    const grid = gridRef.current
    if (!app || !grid) return

    const gridSize = 20
    // Draw larger grid to cover panning area
    const width = app.screen.width * 3
    const height = app.screen.height * 3

    grid.clear()
    grid.setStrokeStyle({ width: 1, color: 0xcccccc, alpha: 0.5 })

    for (let x = -width; x <= width * 2; x += gridSize) {
      grid.moveTo(x, -height)
      grid.lineTo(x, height * 2)
    }

    for (let y = -height; y <= height * 2; y += gridSize) {
      grid.moveTo(-width, y)
      grid.lineTo(width * 2, y)
    }

    grid.stroke()
  }, [])

  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const viewport = viewportRef.current
    if (!viewport) return { x: screenX, y: screenY }

    return {
      x: (screenX - viewport.x) / viewport.scale.x,
      y: (screenY - viewport.y) / viewport.scale.y
    }
  }, [])

  const getElementsInBox = useCallback(
    (x1: number, y1: number, x2: number, y2: number): string[] => {
      // Convert screen coordinates to world coordinates
      const start = screenToWorld(x1, y1)
      const end = screenToWorld(x2, y2)

      const left = Math.min(start.x, end.x)
      const right = Math.max(start.x, end.x)
      const top = Math.min(start.y, end.y)
      const bottom = Math.max(start.y, end.y)

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
    [screenToWorld]
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

  const handleZoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const viewport = viewportRef.current
    if (!viewport) return

    const oldZoom = zoomRef.current
    let newZoom = oldZoom + delta

    // Clamp zoom
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

    if (newZoom === oldZoom) return

    // Calculate world position before zoom
    const worldX = (centerX - viewport.x) / oldZoom
    const worldY = (centerY - viewport.y) / oldZoom

    // Apply new zoom
    viewport.scale.set(newZoom)

    // Adjust position to zoom towards cursor
    viewport.x = centerX - worldX * newZoom
    viewport.y = centerY - worldY * newZoom

    setZoom(newZoom)
  }, [])

  const zoomIn = useCallback(() => {
    const app = appRef.current
    if (!app) return
    handleZoom(ZOOM_STEP, app.screen.width / 2, app.screen.height / 2)
  }, [handleZoom])

  const zoomOut = useCallback(() => {
    const app = appRef.current
    if (!app) return
    handleZoom(-ZOOM_STEP, app.screen.width / 2, app.screen.height / 2)
  }, [handleZoom])

  const resetZoom = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scale.set(1)
    viewport.x = 0
    viewport.y = 0
    setZoom(1)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const initApp = async (): Promise<void> => {
      const app = new Application()
      await app.init({
        background: '#f5f5f5',
        resizeTo: containerRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      if (!mounted) {
        app.destroy(true)
        return
      }

      containerRef.current!.appendChild(app.canvas)
      appRef.current = app

      // Create viewport container for zoom/pan
      const viewport = new Container()
      app.stage.addChild(viewport)
      viewportRef.current = viewport

      // Create grid graphics inside viewport
      const grid = new Graphics()
      viewport.addChild(grid)
      gridRef.current = grid

      const elementsContainer = new Container()
      viewport.addChild(elementsContainer)
      elementsContainerRef.current = elementsContainer

      // Selection box is outside viewport (screen space)
      const selectionBox = new Graphics()
      app.stage.addChild(selectionBox)
      selectionBoxRef.current = selectionBox

      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      // Handle wheel for zoom
      app.stage.on('wheel', (e: FederatedWheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
        handleZoom(delta, e.globalX, e.globalY)
      })

      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        // Middle mouse button, Alt+click, or Space+click for panning
        if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && spaceRef.current)) {
          panStateRef.current = {
            isPanning: true,
            startX: e.globalX,
            startY: e.globalY,
            viewportStartX: viewport.x,
            viewportStartY: viewport.y
          }
          return
        }

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
        // Handle panning
        const panState = panStateRef.current
        if (panState.isPanning) {
          const dx = e.globalX - panState.startX
          const dy = e.globalY - panState.startY
          viewport.x = panState.viewportStartX + dx
          viewport.y = panState.viewportStartY + dy
          return
        }

        const dragState = dragStateRef.current
        if (dragState.isDragging && dragState.elementId) {
          const worldPos = screenToWorld(e.globalX, e.globalY)
          const newX = worldPos.x - dragState.offsetX
          const newY = worldPos.y - dragState.offsetY
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
        // End panning
        if (panStateRef.current.isPanning) {
          panStateRef.current.isPanning = false
          return
        }

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
        panStateRef.current.isPanning = false
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
        viewportRef.current = null
        gridRef.current = null
        elementsContainerRef.current = null
        selectionBoxRef.current = null
        graphicsMapRef.current.clear()
        setIsReady(false)
      }
    }
  }, [getElementsInBox, updateSelectionBox, handleZoom, screenToWorld])

  // Redraw grid when ready and handle resize
  useEffect(() => {
    if (!isReady) return

    redrawGrid()

    const handleResize = (): void => {
      redrawGrid()
      if (appRef.current) {
        appRef.current.stage.hitArea = appRef.current.screen
      }
    }

    window.addEventListener('resize', handleResize)

    const container = containerRef.current
    let resizeObserver: ResizeObserver | null = null

    if (container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(container)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [isReady, redrawGrid])

  // Handle spacebar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceRef.current = true
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        spaceRef.current = false
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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

    const renderElement = (element: EditorElement, parentContainer: Container): void => {
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

        if (isSelected) {
          graphics.stroke({ width: 3, color: 0xff6b35 })
        } else {
          graphics.stroke({ width: 1, color: 0x2c5282 })
        }

        graphics.position.set(element.x, element.y)

        graphics.removeAllListeners('pointerdown')
        graphics.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
      } else if (element.type === 'circle' || element.type === 'ellipse') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'
          parentContainer.addChild(graphics)
          graphicsMapRef.current.set(element.id, graphics)
        }

        graphics.clear()
        const rx = element.width / 2
        const ry = element.height / 2
        graphics.ellipse(rx, ry, rx, ry)
        graphics.fill({ color: 0x48bb78 })

        if (isSelected) {
          graphics.stroke({ width: 3, color: 0xff6b35 })
        } else {
          graphics.stroke({ width: 1, color: 0x276749 })
        }

        graphics.position.set(element.x, element.y)

        graphics.removeAllListeners('pointerdown')
        graphics.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
      } else if (element.type === 'triangle') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'
          parentContainer.addChild(graphics)
          graphicsMapRef.current.set(element.id, graphics)
        }

        graphics.clear()
        graphics.moveTo(element.width / 2, 0)
        graphics.lineTo(element.width, element.height)
        graphics.lineTo(0, element.height)
        graphics.closePath()
        graphics.fill({ color: 0xed8936 })

        if (isSelected) {
          graphics.stroke({ width: 3, color: 0xff6b35 })
        } else {
          graphics.stroke({ width: 1, color: 0xc05621 })
        }

        graphics.position.set(element.x, element.y)

        graphics.removeAllListeners('pointerdown')
        graphics.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
      } else if (element.type === 'diamond') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'
          parentContainer.addChild(graphics)
          graphicsMapRef.current.set(element.id, graphics)
        }

        graphics.clear()
        const hw = element.width / 2
        const hh = element.height / 2
        graphics.moveTo(hw, 0)
        graphics.lineTo(element.width, hh)
        graphics.lineTo(hw, element.height)
        graphics.lineTo(0, hh)
        graphics.closePath()
        graphics.fill({ color: 0x9f7aea })

        if (isSelected) {
          graphics.stroke({ width: 3, color: 0xff6b35 })
        } else {
          graphics.stroke({ width: 1, color: 0x6b46c1 })
        }

        graphics.position.set(element.x, element.y)

        graphics.removeAllListeners('pointerdown')
        graphics.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
      } else if (element.type === 'line') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'
          parentContainer.addChild(graphics)
          graphicsMapRef.current.set(element.id, graphics)
        }

        graphics.clear()
        const strokeWidth = isSelected ? 4 : 3
        const strokeColor = isSelected ? 0xff6b35 : 0x4a5568
        graphics.setStrokeStyle({ width: strokeWidth, color: strokeColor })
        graphics.moveTo(0, element.height / 2)
        graphics.lineTo(element.width, element.height / 2)
        graphics.stroke()

        // Add hit area for easier selection
        graphics.rect(0, 0, element.width, element.height)
        graphics.fill({ color: 0xffffff, alpha: 0.01 })

        graphics.position.set(element.x, element.y)

        graphics.removeAllListeners('pointerdown')
        graphics.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
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

        if (isSelected) {
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
          },
          resolution: window.devicePixelRatio * 2
        })
        text.x = 5
        text.y = (element.height - text.height) / 2
        textContainer.addChild(text)

        textContainer.position.set(element.x, element.y)

        textContainer.removeAllListeners('pointerdown')
        textContainer.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          const addToSelection = e.ctrlKey || e.metaKey
          onSelectRef.current(element.id, addToSelection)

          if (!addToSelection) {
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
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

        const border = new Graphics()
        const dashLength = 6
        const gapLength = 4
        const strokeColor = isSelected ? 0xff6b35 : 0x666666
        const strokeWidth = isSelected ? 2 : 1

        const drawDashedLine = (x1: number, y1: number, x2: number, y2: number): void => {
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
        drawDashedLine(0, 0, element.width, 0)
        drawDashedLine(element.width, 0, element.width, element.height)
        drawDashedLine(element.width, element.height, 0, element.height)
        drawDashedLine(0, element.height, 0, 0)
        border.stroke()
        groupContainer.addChild(border)

        if (element.children) {
          element.children.forEach((child) => {
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
                style: { fontSize: 16, fill: 0x333333, fontFamily: 'Arial' },
                resolution: window.devicePixelRatio * 2
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
            const worldPos = screenToWorld(e.globalX, e.globalY)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: worldPos.x - element.x,
              offsetY: worldPos.y - element.y
            }
          }
        })
      }
    }

    elements.forEach((element) => {
      renderElement(element, container)
    })
  }, [elements, selectedIds, isReady, screenToWorld])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const elementType = e.dataTransfer.getData('element-type') as ElementType
    if (!elementType || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Convert screen coordinates to world coordinates
    const worldPos = screenToWorld(screenX, screenY)

    // Get element size based on type
    const getSize = (type: ElementType): { width: number; height: number } => {
      switch (type) {
        case 'rect': return { width: 100, height: 80 }
        case 'circle': return { width: 80, height: 80 }
        case 'ellipse': return { width: 100, height: 60 }
        case 'triangle': return { width: 80, height: 70 }
        case 'diamond': return { width: 80, height: 80 }
        case 'line': return { width: 100, height: 4 }
        case 'text': return { width: 120, height: 30 }
        default: return { width: 100, height: 80 }
      }
    }

    const size = getSize(elementType)
    const x = Math.round(worldPos.x - size.width / 2)
    const y = Math.round(worldPos.y - size.height / 2)

    onDropElementRef.current(elementType, x, y)
  }, [screenToWorld])

  return (
    <div
      className={`pixi-canvas-wrapper ${isSpacePressed ? 'pan-mode' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className="pixi-canvas" />
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={zoomIn} title="Zoom In">+</button>
        <button className="zoom-btn zoom-reset" onClick={resetZoom} title="Reset Zoom">⟲</button>
      </div>
    </div>
  )
}
