/**
 * @fileoverview 拖拽工具函数 - 统一处理拖拽事件
 */

/**
 * 拖拽数据类型
 */
export type DragDataType = 'shape' | 'component'

/**
 * 图形拖拽数据
 */
export interface ShapeDragData {
  type: 'shape'
  shapeType: string
  label: string
}

/**
 * 组件拖拽数据
 */
export interface ComponentDragData {
  type: 'component'
  groupKey: string
  itemKey: string
  label: string
  componentType: string
}

/**
 * 拖拽数据联合类型
 */
export type DragData = ShapeDragData | ComponentDragData

/**
 * 拖拽数据的 MIME 类型
 */
export const DRAG_DATA_TYPE = 'application/json'

/**
 * 创建图形拖拽数据
 */
export const createShapeDragData = (shapeType: string, label: string): ShapeDragData => ({
  type: 'shape',
  shapeType,
  label
})

/**
 * 创建组件拖拽数据
 */
export const createComponentDragData = (
  groupKey: string,
  itemKey: string,
  label: string
): ComponentDragData => ({
  type: 'component',
  groupKey,
  itemKey,
  label,
  componentType: `${groupKey}-${itemKey}`
})

/**
 * 设置拖拽数据到 dataTransfer
 */
export const setDragData = (e: React.DragEvent, data: DragData): void => {
  e.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify(data))
  e.dataTransfer.effectAllowed = 'copy'
}

/**
 * 从 dataTransfer 获取拖拽数据
 */
export const getDragData = (e: React.DragEvent): DragData | null => {
  try {
    const jsonData = e.dataTransfer.getData(DRAG_DATA_TYPE)
    if (!jsonData) return null
    return JSON.parse(jsonData) as DragData
  } catch {
    return null
  }
}

/**
 * 处理拖拽开始时的视觉效果
 */
export const handleDragStartVisual = (e: React.DragEvent): void => {
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = '0.5'
  }
}

/**
 * 处理拖拽结束时的视觉效果
 */
export const handleDragEndVisual = (e: React.DragEvent): void => {
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = '1'
  }
}

/**
 * 处理拖拽经过事件
 */
export const handleDragOver = (e: React.DragEvent): void => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

/**
 * 创建拖拽开始处理器
 */
export const createDragStartHandler = (data: DragData) => {
  return (e: React.DragEvent): void => {
    setDragData(e, data)
    handleDragStartVisual(e)
  }
}

/**
 * 创建拖拽结束处理器
 */
export const createDragEndHandler = () => {
  return handleDragEndVisual
}
