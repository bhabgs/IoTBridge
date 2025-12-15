/**
 * @fileoverview 属性配置类型定义
 */

import type { NodeType } from 'core'

/**
 * 属性字段类型
 */
export type PropertyFieldType =
  | 'string'
  | 'number'
  | 'color'
  | 'text'
  | 'select'
  | 'boolean'
  | 'slider'

/**
 * 属性字段定义
 */
export interface PropertyField {
  /** 字段键名 */
  key: string
  /** 显示标签 */
  label: string
  /** 字段类型 */
  type: PropertyFieldType
  /** 默认值 */
  defaultValue?: any
  /** 最小值（number 类型） */
  min?: number
  /** 最大值（number 类型） */
  max?: number
  /** 步长（number 类型） */
  step?: number
  /** 是否必填 */
  required?: boolean
  /** 占位符 */
  placeholder?: string
  /** 选项列表（select 类型） */
  options?: Array<{ label: string; value: any }>
  /** 帮助文��� */
  helpText?: string
  /** 是否在 3D 模式下显示 */
  show3D?: boolean
  /** 是否在 2D 模式下显示 */
  show2D?: boolean
  /** 行数（text 类型） */
  rows?: number
  /** 数据路径（用于嵌套属性，如 "transform.position.x"） */
  dataPath?: string
  /** 自定义验证函数 */
  validator?: (value: any) => boolean | string
}

/**
 * 属性分组
 */
export interface PropertySection {
  /** 分组标题 */
  title: string
  /** 分组内的字段 */
  fields: PropertyField[]
  /** 是否可折叠 */
  collapsible?: boolean
  /** 默认是否展开 */
  defaultExpanded?: boolean
}

/**
 * 节点类型的属性配置
 */
export interface NodePropertyConfig {
  /** 节点类型 */
  nodeType: NodeType
  /** 显示名称 */
  displayName: string
  /** 属性分组 */
  sections: PropertySection[]
}
