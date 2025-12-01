import { useEffect, useRef, useCallback } from 'react'
import 'pixi.js/unsafe-eval'
import { Application, Graphics, Text, Container, FederatedPointerEvent } from 'pixi.js'
import type { EditorElement } from '../types/element'

interface PixiCanvasProps {
  elements: EditorElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void
}

export function PixiCanvas({
  elements,
  selectedId,
  onSelect,
  onUpdateElement
}: PixiCanvasProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const elementsContainerRef = useRef<Container | null>(null)
  const graphicsMapRef = useRef<Map<string, Graphics | Container>>(new Map())
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

  const initApp = useCallback(async () => {
    if (!containerRef.current || appRef.current) return

    const app = new Application()
    await app.init({
      background: '#f5f5f5',
      resizeTo: containerRef.current,
      antialias: true
    })

    containerRef.current.appendChild(app.canvas)
    appRef.current = app

    const gridGraphics = drawGrid(app)
    app.stage.addChild(gridGraphics)

    const elementsContainer = new Container()
    app.stage.addChild(elementsContainer)
    elementsContainerRef.current = elementsContainer

    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.target === app.stage) {
        onSelect(null)
      }
    })

    app.stage.on('pointermove', (e: FederatedPointerEvent) => {
      const state = dragStateRef.current
      if (state.isDragging && state.elementId) {
        const newX = e.globalX - state.offsetX
        const newY = e.globalY - state.offsetY
        onUpdateElement(state.elementId, { x: Math.round(newX), y: Math.round(newY) })
      }
    })

    app.stage.on('pointerup', () => {
      dragStateRef.current.isDragging = false
      dragStateRef.current.elementId = null
    })

    app.stage.on('pointerupoutside', () => {
      dragStateRef.current.isDragging = false
      dragStateRef.current.elementId = null
    })
  }, [onSelect, onUpdateElement, drawGrid])

  useEffect(() => {
    initApp()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [initApp])

  useEffect(() => {
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

    elements.forEach((element) => {
      let displayObj = graphicsMapRef.current.get(element.id)
      const isSelected = element.id === selectedId

      if (element.type === 'rect') {
        let graphics = displayObj as Graphics | undefined
        if (!graphics) {
          graphics = new Graphics()
          graphics.eventMode = 'static'
          graphics.cursor = 'pointer'

          graphics.on('pointerdown', (e: FederatedPointerEvent) => {
            e.stopPropagation()
            onSelect(element.id)
            dragStateRef.current = {
              isDragging: true,
              elementId: element.id,
              startX: element.x,
              startY: element.y,
              offsetX: e.globalX - element.x,
              offsetY: e.globalY - element.y
            }
          })

          container.addChild(graphics)
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
          onSelect(element.id)
          dragStateRef.current = {
            isDragging: true,
            elementId: element.id,
            startX: element.x,
            startY: element.y,
            offsetX: e.globalX - element.x,
            offsetY: e.globalY - element.y
          }
        })
      } else if (element.type === 'text') {
        let textContainer = displayObj as Container | undefined
        if (!textContainer) {
          textContainer = new Container()
          textContainer.eventMode = 'static'
          textContainer.cursor = 'pointer'

          container.addChild(textContainer)
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
          }
        })
        text.x = 5
        text.y = (element.height - text.height) / 2
        textContainer.addChild(text)

        textContainer.position.set(element.x, element.y)

        textContainer.removeAllListeners('pointerdown')
        textContainer.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation()
          onSelect(element.id)
          dragStateRef.current = {
            isDragging: true,
            elementId: element.id,
            startX: element.x,
            startY: element.y,
            offsetX: e.globalX - element.x,
            offsetY: e.globalY - element.y
          }
        })
      }
    })
  }, [elements, selectedId, onSelect, onUpdateElement])

  return <div ref={containerRef} className="pixi-canvas" />
}
