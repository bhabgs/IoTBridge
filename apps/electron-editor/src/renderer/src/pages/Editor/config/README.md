# 节点属性配置系统

## 概述

本配置系统采用声明式方式定义不同节点类型的属性，使得添加新的节点类型或修改现有属性变得简单直观。

## 核心概念

### 1. PropertyField（属性字段）

定义单个属性字段的所有信息：

```typescript
interface PropertyField {
  key: string                    // 字段键名
  label: string                  // 显示标签
  type: PropertyFieldType        // 字段类型
  defaultValue?: any             // 默认值
  min?: number                   // 最小值（number 类型）
  max?: number                   // 最大值（number 类型）
  step?: number                  // 步长（number 类型）
  required?: boolean             // 是否必填
  placeholder?: string           // 占位符
  options?: Array<{...}>         // 选项列表（select 类型）
  helpText?: string              // 帮助文本
  show3D?: boolean               // 是否在 3D 模式下显示
  show2D?: boolean               // 是否在 2D 模式下显示
  rows?: number                  // 行数（text 类型）
  dataPath?: string              // 数据路径（如 "transform.position.x"）
  validator?: (value: any) => boolean | string  // 自定义验证
}
```

### 2. PropertySection（属性分组）

将相关的属性字段组织在一起：

```typescript
interface PropertySection {
  title: string                  // 分组标题
  fields: PropertyField[]        // 分组内的字段
  collapsible?: boolean          // 是否可折叠
  defaultExpanded?: boolean      // 默认是否展开
}
```

### 3. NodePropertyConfig（节点配置）

完整定义一个节点类型的所有属性：

```typescript
interface NodePropertyConfig {
  nodeType: NodeType             // 节点类型
  displayName: string            // 显示名称
  sections: PropertySection[]    // 属性分组
}
```

## 支持的字段类型

- `string` - 文本输入框
- `number` - 数字输入框
- `color` - 颜色选择器
- `text` - 多行文本框
- `select` - 下拉选择
- `boolean` - 布尔值（可扩展为 Switch/Checkbox）
- `slider` - 滑块（目前使用 InputNumber）

## 如何添加新的节点类型

### 步骤 1：定义属性配置

在 `nodeProperties.ts` 中添加新的配置：

```typescript
const myNewShapeConfig: NodePropertyConfig = {
  nodeType: 'myNewShape',
  displayName: '我的新图形',
  sections: [
    // 基础信息（通常复用 basicSection）
    basicSection,

    // 位置和尺寸
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,  // 复用位置字段
        {
          key: 'myCustomSize',
          label: '自定义尺寸',
          type: 'number',
          defaultValue: 100,
          min: 1,
          dataPath: 'geometry.myCustomSize'
        },
        rotationField  // 复用旋转字段
      ]
    },

    // 外观
    {
      title: '外观',
      fields: [
        {
          key: 'myColor',
          label: '颜色',
          type: 'color',
          defaultValue: '#4A90D9',
          dataPath: 'material.color'
        },
        {
          key: 'opacity',
          label: '不透明度',
          type: 'slider',
          defaultValue: 1,
          min: 0,
          max: 1,
          step: 0.1,
          dataPath: 'material.opacity'
        }
      ]
    }
  ]
}
```

### 步骤 2：注册配置

将新配置添加到 `nodePropertyConfigs` 中：

```typescript
export const nodePropertyConfigs: Partial<Record<NodeType, NodePropertyConfig>> = {
  // ... 现有配置
  myNewShape: myNewShapeConfig
}
```

### 步骤 3：完成！

配置完成后，PropertySettings 组件会自动：
- ✅ 渲染新节点类型的属性面板
- ✅ 处理表单值变化
- ✅ 同步数据到节点模型
- ✅ 支持 2D/3D 模式切换

## 数据路径（dataPath）说明

`dataPath` 用于指定属性在节点数据中的位置，支持嵌套路径：

| dataPath | 对应的节点数据路径 |
|----------|------------------|
| `name` | `node.name` |
| `transform.position.x` | `node.transform.position.x` |
| `geometry.width` | `node.geometry.width` |
| `material.color` | `node.material.color` |
| `style.fill` | `node.style.fill` |

## 模式相关显示控制

使用 `show2D` 和 `show3D` 控制字段在不同模式下的显示：

```typescript
// 只在 3D 模式显示
{
  key: 'height',
  label: '高度',
  type: 'number',
  show3D: true,
  dataPath: 'geometry.height'
}

// 只在 2D 模式显示
{
  key: 'width',
  label: '宽度',
  type: 'number',
  show2D: true,
  dataPath: 'geometry.width'
}

// 两种模式都显示（默认）
{
  key: 'rotation',
  label: '旋转',
  type: 'number',
  dataPath: 'transform.rotation.y'
}
```

## 复用常用字段

### 复用基础信息

```typescript
sections: [
  basicSection,  // 包含 name 和 type 字段
  // ... 其他分组
]
```

### 复用位置字段

```typescript
{
  title: '位置',
  fields: [
    ...position3DFields,  // 包含 x, y, z(3D) 字段
    // ... 其他字段
  ]
}
```

### 复用旋转字段

```typescript
{
  title: '变换',
  fields: [
    rotationField,  // 旋转字段
    // ... 其他字段
  ]
}
```

### 复用外观分组

```typescript
sections: [
  // ... 其他分组
  appearanceSection  // 包含颜色字段
]
```

## 自定义验证

添加自定义验证逻辑：

```typescript
{
  key: 'email',
  label: '邮箱',
  type: 'string',
  validator: (value) => {
    if (!value) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) || '请输入有效的邮箱地址'
  },
  dataPath: 'metadata.email'
}
```

## 示例：完整的图形配置

```typescript
const starConfig: NodePropertyConfig = {
  nodeType: 'star',
  displayName: '星形',
  sections: [
    basicSection,
    {
      title: '位置和尺寸',
      fields: [
        ...position3DFields,
        {
          key: 'points',
          label: '角数',
          type: 'number',
          defaultValue: 5,
          min: 3,
          max: 20,
          step: 1,
          dataPath: 'geometry.points',
          helpText: '星形的角数量'
        },
        {
          key: 'innerRadius',
          label: '内半径',
          type: 'number',
          defaultValue: 30,
          min: 1,
          dataPath: 'geometry.innerRadius'
        },
        {
          key: 'outerRadius',
          label: '外半径',
          type: 'number',
          defaultValue: 50,
          min: 1,
          dataPath: 'geometry.outerRadius'
        },
        rotationField
      ]
    },
    {
      title: '外观',
      fields: [
        {
          key: 'fill',
          label: '填充颜色',
          type: 'color',
          defaultValue: '#FFD700',
          dataPath: 'style.fill'
        },
        {
          key: 'stroke',
          label: '边框颜色',
          type: 'color',
          defaultValue: '#FFA500',
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
```

## 扩展字段类型

如需添加新的字段类型，需要：

1. 在 `PropertyFieldType` 中添加类型定义
2. 在 `DynamicPropertyEditor.tsx` 中添加对应的渲染逻辑

```typescript
// 1. 添加类型
export type PropertyFieldType =
  | 'string'
  | 'number'
  | 'myNewType'  // 新类型

// 2. 添加渲染逻辑
case 'myNewType':
  return <MyCustomComponent {...props} />
```

## 最佳实践

1. **复用现有配置**：尽可能复用 `basicSection`、`position3DFields`、`rotationField` 等
2. **语义化的 key**：使用有意义的键名，如 `radius` 而不是 `r`
3. **合理的默认值**：为所有字段提供合理的默认值
4. **清晰的标签**：使用用户友好的中文标签
5. **适当的分组**：将相关字段组织在同一个 section 中
6. **添加帮助文本**：为复杂字段添加 `helpText` 说明
7. **设置合理范围**：为数字字段设置 `min`/`max` 防止无效值

## 故障排查

### 字段不显示

检查：
- `show2D`/`show3D` 配置是否正确
- 是否正确注册到 `nodePropertyConfigs`
- TypeScript 类型是否正确

### 值不更新

检查：
- `dataPath` 是否正确
- 节点数据结构是否匹配
- 是否正确处理了特殊情况（如颜色转换）

### 类型错误

检查：
- 是否导入了正确的类型
- `NodeType` 是否包含自定义类型
- 配置对象的类型定义是否完整
