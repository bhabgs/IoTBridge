/**
 * @fileoverview 共享字段定义 - 多个节点类型复用的字段
 */

import type { PropertyField, PropertySection } from './propertyTypes'

/**
 * 基础属性（所有节点都有）
 */
export const basicSection: PropertySection = {
  title: '基础信息',
  fields: [
    {
      key: 'name',
      label: '名称',
      type: 'string',
      placeholder: '节点名称',
      dataPath: 'name'
    },
    {
      key: 'type',
      label: '类型',
      type: 'string',
      dataPath: 'type'
    }
  ]
}

/**
 * 位置属性（3D 模式）
 */
export const position3DFields: PropertyField[] = [
  {
    key: 'x',
    label: 'X',
    type: 'number',
    defaultValue: 0,
    dataPath: 'transform.position.x'
  },
  {
    key: 'y',
    label: 'Y',
    type: 'number',
    defaultValue: 0,
    dataPath: 'transform.position.z', // 2D 的 Y 对应 3D 的 Z
    show2D: true
  },
  {
    key: 'z',
    label: 'Z (高度)',
    type: 'number',
    defaultValue: 0,
    dataPath: 'transform.position.y', // 3D 的高度
    show3D: true
  }
]

/**
 * 旋转属性
 */
export const rotationField: PropertyField = {
  key: 'rotation',
  label: '旋转 (度)',
  type: 'number',
  defaultValue: 0,
  min: -360,
  max: 360,
  dataPath: 'transform.rotation.y'
}

/**
 * 通用外观属性（填充颜色）
 */
export const appearanceSection: PropertySection = {
  title: '外观',
  fields: [
    {
      key: 'color',
      label: '颜色',
      type: 'color',
      defaultValue: '#4A90D9',
      dataPath: 'material.color' // 也会同步到 style.fill
    }
  ]
}

/**
 * 描边样式字段
 */
export const strokeFields: PropertyField[] = [
  {
    key: 'stroke',
    label: '颜色',
    type: 'color',
    defaultValue: '#909399',
    dataPath: 'style.stroke'
  },
  {
    key: 'strokeWidth',
    label: '线宽',
    type: 'number',
    defaultValue: 2,
    min: 1,
    max: 20,
    dataPath: 'style.strokeWidth'
  }
]

/**
 * 填充+描边样式字段
 */
export const fillStrokeFields: PropertyField[] = [
  {
    key: 'fill',
    label: '填充颜色',
    type: 'color',
    defaultValue: '#67C23A',
    dataPath: 'style.fill'
  },
  {
    key: 'stroke',
    label: '边框颜色',
    type: 'color',
    defaultValue: '#409EFF',
    dataPath: 'style.stroke'
  },
  {
    key: 'strokeWidth',
    label: '边框宽度',
    type: 'number',
    defaultValue: 2,
    min: 0,
    max: 20,
    dataPath: 'style.strokeWidth'
  }
]
