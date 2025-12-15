# 坐标系统和尺寸说明

## 坐标系统

### 世界坐标系

项目使用统一的世界坐标系：

```
Y (高度/垂直)
 ↑
 |
 |____→ X (宽度/左右)
/
Z (深度/前后)
```

### 2D 和 3D 坐标映射

| 维度 | SceneNode 属性 | 2D 视图 (俯视图) | 3D 视图 |
|------|--------------|---------------|---------|
| **X 轴** | `transform.position.x` | 屏幕 X (水平) | 世界 X (左右) |
| **Y 轴** | `transform.position.y` | 不显示（高度） | 世界 Y (高度) |
| **Z 轴** | `transform.position.z` | 屏幕 Y (垂直) | 世界 Z (前后) |

### 2D 模式特性

- **视角**：俯视图（从上往下看）
- **显示坐标**：X 和 Z（Y 被投影到 Z）
- **原点位置**：屏幕中心 (0, 0)
- **Y 坐标**：不可见，但保存在数据中

### 3D 模式特性

- **视角**：透视相机，默认位置 (3, 3, 3)
- **显示坐标**：X、Y、Z 全部可见
- **原点位置**：世界中心 (0, 0, 0)
- **地面**：Y = 0 平面

## 尺寸和缩放

### 像素到世界单位的转换

```typescript
const SCALE = 0.01
// 100 像素 = 1 世界单位
```

### 尺寸属性映射

#### 矩形 (rect)

| SceneNode 属性 | 含义 | 2D | 3D |
|---------------|------|----|----|
| `geometry.width` | X 轴尺寸 | 宽度 | 长度 |
| `geometry.depth` | Z 轴尺寸 | 高度 | 宽度 |
| `geometry.height` | Y 轴尺寸 | 不使用 | 高度 |

**示例：**
```typescript
{
  type: 'rect',
  geometry: {
    width: 100,   // X 轴：100px = 1 世界单位
    height: 100,  // Y 轴：100px = 1 世界单位
    depth: 100    // Z 轴：100px = 1 世界单位
  }
}
// 在 3D 中显示为 1×1×1 的立方体
```

#### 圆形 (circle)

| SceneNode 属性 | 含义 | 2D | 3D |
|---------------|------|----|----|
| `geometry.radius` | 半径 | 圆形半径 | 球体半径 |

**示例：**
```typescript
{
  type: 'circle',
  geometry: {
    radius: 50    // 50px = 0.5 世界单位
  }
}
// 在 3D 中显示为半径 0.5 的球体
```

#### 椭圆 (ellipse)

| SceneNode 属性 | 含义 | 2D | 3D |
|---------------|------|----|----|
| `geometry.radiusX` | X 轴半径 | 横向半径 | X 轴缩放 |
| `geometry.radiusY` | Y 轴半径 | 纵向半径 | Y 轴缩放 |

## 3D 渲染细节

### 对象定位

所有 3D 对象默认**底部**放置在 `position.y` 指定的高度：

```typescript
// 对于矩形（高度为 100px = 1 世界单位）
position.y = 0  → 对象底部在地面，顶部在高度 1
position.y = 50 → 对象底部在高度 0.5，顶部在高度 1.5
```

这是通过几何体中心偏移实现的：
```typescript
boxGeometry.translate(0, height / 2, 0)
```

### 相机设置

- **类型**：透视相机 (PerspectiveCamera)
- **视角**：75°
- **初始位置**：(3, 3, 3) 世界单位
- **初始目标**：(0, 0, 0) 原点
- **近裁剪面**：0.01
- **远裁剪面**：100

### 光照

- **环境光**：强度 0.5，提供基础照明
- **平行光**：强度 0.8，位置 (5, 10, 5)，产生阴影

### 地面和网格

- **地面平面**：Y = -0.001（略低于网格，避免 z-fighting）
- **网格大小**：10 世界单位 × 10 世界单位
- **网格细分**：20 × 20

## 常见问题

### Q: 为什么在 3D 中看不到我的对象？

**可能的原因：**

1. **深度太小**
   ```typescript
   // ❌ 错误：depth 只有 10px = 0.1 世界单位，太薄了
   geometry: { width: 100, height: 100, depth: 10 }

   // ✅ 正确：所有维度都是 100px = 1 世界单位
   geometry: { width: 100, height: 100, depth: 100 }
   ```

2. **位置太远**
   - 相机位置在 (3, 3, 3)，可视范围约 10 个世界单位
   - 如果对象位置超过 ±5 个世界单位，可能看不见

3. **尺寸太小**
   - 半径 5px = 0.05 世界单位，从远处很难看见
   - 建议最小尺寸 50px (0.5 世界单位)

### Q: 2D 和 3D 的坐标为什么不一样？

**答：** 2D 是俯视图，Y 轴（高度）被投影到屏幕 Y 轴（对应世界 Z 轴）。

```
2D 视图（俯视）:          3D 视图（透视）:
  ↑ Y (屏幕垂直)            Y ↑ (高度)
  |                         |
  |                         |
  +---→ X (屏幕水平)        +---→ X
                           /
                          Z
```

### Q: 如何调整对象在 3D 中的可见性？

**建议：**

1. **合适的尺寸**：50-200px (0.5-2 世界单位)
2. **合适的位置**：在原点附近 (-3 到 +3 范围内)
3. **合适的颜色**：避免与背景色 (#1a1a2e) 过于接近
4. **使用轨道控制**：鼠标拖拽旋转视角，滚轮缩放

### Q: 为什么矩形在 3D 中是立方体？

**答：** 在 3D 模式下，矩形被渲染为 BoxGeometry（立方体）。如果需要平面，应该使用专门的平面类型，或者将 `height` 设置得很小（如 1px）。

## 最佳实践

### 创建 3D 对象

```typescript
// ✅ 推荐：立方体
{
  type: 'rect',
  geometry: { width: 100, height: 100, depth: 100 }
}

// ✅ 推荐：长方体
{
  type: 'rect',
  geometry: { width: 200, height: 50, depth: 100 }
}

// ⚠️ 注意：薄板（可能难以看见）
{
  type: 'rect',
  geometry: { width: 100, height: 5, depth: 100 }
}
```

### 位置定位

```typescript
// ✅ 推荐：在地面上
transform: {
  position: { x: 0, y: 0, z: 0 }
}

// ✅ 推荐：悬浮在空中
transform: {
  position: { x: 0, y: 100, z: 0 }  // 1 世界单位高
}

// ❌ 避免：位置太远
transform: {
  position: { x: 1000, y: 0, z: 1000 }  // 10 世界单位外
}
```

### 相机控制

- **旋转**：鼠标左键拖拽
- **平移**：鼠标右键拖拽或中键拖拽
- **缩放**：鼠标滚轮
- **重置视角**：双击对象可聚焦（正在实现中）

## 调试技巧

### 检查对象是否在场景中

```javascript
// 在浏览器控制台
const sdk = window.sdk // 假设 SDK 实例被暴露
const renderer = sdk.get3DRenderer()
const nodes = renderer.scene.children
console.log('场景中的对象：', nodes)
```

### 检查对象的世界坐标

```javascript
const object = renderer.scene.getObjectByName('你的对象名称')
console.log('世界位置：', object.position)
console.log('世界尺寸：', object.scale)
```

### 调整相机位置

```javascript
// 临时调整相机以找到对象
renderer.camera.position.set(5, 5, 5)
renderer.camera.lookAt(0, 0, 0)
```
