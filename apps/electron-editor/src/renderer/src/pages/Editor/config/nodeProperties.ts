/**
 * @fileoverview 节点属性配置 - 入口文件
 *
 * 模块结构:
 * - propertyTypes.ts  - 类型定义
 * - sharedFields.ts   - 共享字段
 * - pathUtils.ts      - 路径工具函数
 * - shapes/           - 各图形类型配置
 */

import type { NodeType } from 'core'
import type { NodePropertyConfig } from './propertyTypes'
import {
  rectConfig,
  circleConfig,
  ellipseConfig,
  lineConfig,
  polygonConfig,
  polylineConfig,
  textConfig,
  groupConfig
} from './shapes'

// 导出类型
export type { PropertyFieldType, PropertyField, PropertySection, NodePropertyConfig } from './propertyTypes'

// 导出共享字段（供扩展使用）
export {
  basicSection,
  position3DFields,
  rotationField,
  appearanceSection,
  strokeFields,
  fillStrokeFields
} from './sharedFields'

// 导出路径工具函数
export { getValueByPath, setValueByPath } from './pathUtils'

/**
 * 所有节点类型的属性配置
 */
export const nodePropertyConfigs: Partial<Record<NodeType, NodePropertyConfig>> = {
  rect: rectConfig,
  circle: circleConfig,
  ellipse: ellipseConfig,
  line: lineConfig,
  polygon: polygonConfig,
  polyline: polylineConfig,
  text: textConfig,
  group: groupConfig
  // 其他类型（path, image, pipe, model3d, light, camera, symbol-instance, custom）可以在需要时添加
}

/**
 * 根据节点类型获取属性配置
 */
export function getNodePropertyConfig(nodeType: NodeType): NodePropertyConfig | null {
  return nodePropertyConfigs[nodeType] || null
}
