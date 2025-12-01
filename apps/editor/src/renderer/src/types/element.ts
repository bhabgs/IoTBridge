export type ElementType = 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'line' | 'pipe' | 'text' | 'group'

export interface Point {
  x: number
  y: number
}

export interface EditorElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  text?: string
  children?: EditorElement[]
  // Style properties
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  opacity?: number
  fontSize?: number
  // Pipe specific properties
  points?: Point[]
  pipeWidth?: number
  startElementId?: string
  endElementId?: string
}
