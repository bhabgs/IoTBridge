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
  /** 帮助文本 */
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

/**
 * 基础属性（所有节点都有）
 */
const basicSection: PropertySection = {
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
const position3DFields: PropertyField[] = [
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
const rotationField: PropertyField = {
  key: 'rotation',
  label: '旋转 (度)',
  type: 'number',
  defaultValue: 0,
  min: -360,
  max: 360,
  dataPath: 'transform.rotation.y'
}

/**
 * 通用外观属性
 */
const appearanceSection: PropertySection = {
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
 * 矩形属性配置
 */
const rectConfig: NodePropertyConfig = {
  nodeType: 'rect',
  displayName: '矩形',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'width',
          label: '宽度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.width',
          show2D: true
        },
        {
          key: 'depth',
          label: '高度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.depth',
          show2D: true
        },
        {
          key: 'width',
          label: '长度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.width',
          show3D: true
        },
        {
          key: 'depth',
          label: '宽度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.depth',
          show3D: true
        },
        {
          key: 'height',
          label: '高度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.height',
          show3D: true
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}

/**
 * 圆形属性配置
 */
const circleConfig: NodePropertyConfig = {
  nodeType: 'circle',
  displayName: '圆形',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'radius',
          label: '半径',
          type: 'number',
          defaultValue: 50,
          min: 1,
          dataPath: 'geometry.radius'
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}

/**
 * 椭圆属性配置
 */
const ellipseConfig: NodePropertyConfig = {
  nodeType: 'ellipse',
  displayName: '椭圆',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'radiusX',
          label: 'X 半径',
          type: 'number',
          defaultValue: 60,
          min: 1,
          dataPath: 'geometry.radiusX'
        },
        {
          key: 'radiusY',
          label: 'Y 半径',
          type: 'number',
          defaultValue: 40,
          min: 1,
          dataPath: 'geometry.radiusY'
        },
        rotationField
      ]
    },
    appearanceSection
  ]
}

/**
 * 线条属性配置
 */
const lineConfig: NodePropertyConfig = {
  nodeType: 'line',
  displayName: '线条',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: position3DFields
    },
    {
      title: '外观',
      fields: [
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
    }
  ]
}

/**
 * 多边形属性配置
 */
const polygonConfig: NodePropertyConfig = {
  nodeType: 'polygon',
  displayName: '多边形',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: [...position3DFields, rotationField]
    },
    {
      title: '外观',
      fields: [
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
    }
  ]
}

/**
 * 文本属性配置
 */
const textConfig: NodePropertyConfig = {
  nodeType: 'text',
  displayName: '文本',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'width',
          label: '宽度',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.width'
        },
        {
          key: 'height',
          label: '高度',
          type: 'number',
          defaultValue: 30,
          min: 1,
          dataPath: 'geometry.height'
        },
        rotationField
      ]
    },
    {
      title: '文本',
      fields: [
        {
          key: 'text',
          label: '文本内容',
          type: 'text',
          defaultValue: '文本',
          placeholder: '请输入文本内容',
          rows: 3,
          dataPath: 'style.text'
        },
        {
          key: 'fontSize',
          label: '字号',
          type: 'number',
          defaultValue: 16,
          min: 8,
          max: 72,
          dataPath: 'style.fontSize'
        }
      ]
    },
    {
      title: '外观',
      fields: [
        {
          key: 'fill',
          label: '颜色',
          type: 'color',
          defaultValue: '#303133',
          dataPath: 'style.fill'
        }
      ]
    }
  ]
}

/**
 * 折线属性配置
 */
const polylineConfig: NodePropertyConfig = {
  nodeType: 'polyline',
  displayName: '折线',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: position3DFields
    },
    {
      title: '外观',
      fields: [
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
    }
  ]
}

/**
 * 组属性配置
 */
const groupConfig: NodePropertyConfig = {
  nodeType: 'group',
  displayName: '组',
  sections: [
    basicSection,
    {
      title: '位置',
      fields: [...position3DFields, rotationField]
    }
  ]
}

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

/**
 * 从数据路径获取值
 */
export function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

/**
 * 通过数据路径设置值
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  let target = obj

  for (const key of keys) {
    if (!(key in target)) {
      target[key] = {}
    }
    target = target[key]
  }

  target[lastKey] = value
  return obj
}
