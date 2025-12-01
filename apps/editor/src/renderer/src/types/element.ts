export interface EditorElement {
  id: string
  type: 'rect' | 'text' | 'group'
  x: number
  y: number
  width: number
  height: number
  text?: string
  children?: EditorElement[]
}
