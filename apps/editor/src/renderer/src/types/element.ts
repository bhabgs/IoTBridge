export interface EditorElement {
  id: string
  type: 'rect' | 'text'
  x: number
  y: number
  width: number
  height: number
  text?: string
}
