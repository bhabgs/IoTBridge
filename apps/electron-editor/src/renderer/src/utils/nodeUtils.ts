/**
 * @fileoverview 节点工具函数 - ID 生成和默认配置
 */

import type { SceneNode } from 'core'

/**
 * 生成唯一节点 ID
 */
export const generateNodeId = (): string => {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 图形类型到默认名称的映射
 */
const SHAPE_NAMES: Record<string, string> = {
  rect: '矩形',
  circle: '圆形',
  ellipse: '椭圆',
  line: '线条',
  polygon: '多边形',
  text: '文本',
  polyline: '折线',
  group: '组'
}

/**
 * 获取图形的默认名称
 */
export const getShapeName = (shapeType: string): string => {
  return SHAPE_NAMES[shapeType] || shapeType
}

/**
 * 根据图形类型获取默认节点配置
 */
export const createDefaultNode = (
  shapeType: string,
  position: { x: number; y?: number; z: number }
): SceneNode => {
  const baseNode = {
    id: generateNodeId(),
    transform: {
      position: { x: position.x, y: position.y ?? 0, z: position.z }
    }
  }

  switch (shapeType) {
    case 'rect':
      return {
        ...baseNode,
        type: 'rect',
        name: '矩形',
        geometry: { width: 100, height: 100, depth: 100 },
        material: { color: '#4A90D9' }
      } as SceneNode

    case 'circle':
      return {
        ...baseNode,
        type: 'circle',
        name: '圆形',
        geometry: { radius: 50 },
        material: { color: '#E6A23C' }
      } as SceneNode

    case 'ellipse':
      return {
        ...baseNode,
        type: 'ellipse',
        name: '椭圆',
        geometry: { radiusX: 60, radiusY: 40 },
        material: { color: '#F56C6C' }
      } as SceneNode

    case 'line':
      return {
        ...baseNode,
        type: 'line',
        name: '线条',
        geometry: {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
          ]
        },
        style: { stroke: '#909399', strokeWidth: 2 }
      } as SceneNode

    case 'polygon':
      return {
        ...baseNode,
        type: 'polygon',
        name: '多边形',
        geometry: {
          points: [
            { x: 50, y: 0 },
            { x: 100, y: 35 },
            { x: 80, y: 90 },
            { x: 20, y: 90 },
            { x: 0, y: 35 }
          ],
          closed: true
        },
        style: { fill: '#67C23A', stroke: '#409EFF', strokeWidth: 2 }
      } as SceneNode

    case 'text':
      return {
        ...baseNode,
        type: 'text',
        name: '文本',
        geometry: { width: 100, height: 30 },
        style: {
          text: '文本',
          fontSize: 16,
          fill: '#303133'
        }
      } as SceneNode

    default:
      return {
        ...baseNode,
        type: 'rect',
        name: '矩形',
        geometry: { width: 100, height: 100, depth: 10 },
        material: { color: '#4A90D9' }
      } as SceneNode
  }
}

/**
 * 复制节点（生成新 ID 并偏移位置）
 */
export const duplicateNode = (node: SceneNode, offset = 20): SceneNode => {
  return {
    ...node,
    id: generateNodeId(),
    name: `${node.name || node.type} (副本)`,
    transform: {
      ...node.transform,
      position: {
        x: (node.transform?.position?.x ?? 0) + offset,
        y: node.transform?.position?.y ?? 0,
        z: (node.transform?.position?.z ?? 0) + offset
      }
    }
  }
}
