export type ElementType = 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'line' | 'text' | 'group'

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
}
