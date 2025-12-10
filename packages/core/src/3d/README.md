# 3D 编辑器操作手册

## 概述

3D 编辑器提供了完整的三维场景编辑功能，包括对象选择、变换（移动、旋转、缩放）和相机控制。

## 快捷键

### 选择操作

| 快捷键 | 功能 |
|--------|------|
| `鼠标左键点击` | 选择对象（点击空白处取消选择） |
| `鼠标左键双击` | 聚焦到对象（相机移动到对象位置） |
| `Escape` | 取消选择 |
| `Delete` / `Backspace` | 删除选中对象 |

### 变换模式

| 快捷键 | 功能 |
|--------|------|
| `1` | 移动模式（Translate） |
| `2` | 旋转模式（Rotate） |
| `3` | 缩放模式（Scale） |
| `X` | 切换坐标系（世界坐标系 ↔ 本地坐标系） |

### 相机控制

| 快捷键 | 功能 |
|--------|------|
| `W` | 相机向前移动 |
| `S` | 相机向后移动 |
| `A` | 相机向左移动 |
| `D` | 相机向右移动 |
| `E` / `Space` | 相机向上移动 |
| `Q` / `Shift` | 相机向下移动 |
| `鼠标左键拖拽` | 旋转视角（OrbitControls） |
| `鼠标右键拖拽` | 平移视角 |
| `鼠标滚轮` | 缩放视角 |

### 变换操作（选中对象后）

| 操作 | 功能 |
|------|------|
| `拖拽坐标轴` | 沿轴向移动/旋转/缩放 |
| `拖拽平面` | 在平面内移动（移动模式下） |
| `拖拽圆环` | 绕轴旋转（旋转模式下） |

## API 使用

### 基本用法

```typescript
import { Three3D } from '@iot-bridge/core';

const editor = new Three3D({
  container: document.getElementById('container'),
  sceneModel: sceneModel,
});
```

### 选择操作

```typescript
// 监听选择变化
editor.onSelectionChange((object) => {
  if (object) {
    console.log('选中对象:', object.name, object.userData.nodeId);
  } else {
    console.log('取消选择');
  }
});

// 程序化选择对象
editor.select(object3D);           // 通过 Object3D 实例选择
editor.selectByNodeId('node-1');   // 通过 nodeId 选择
editor.deselect();                 // 取消选择

// 获取当前选中对象
const selected = editor.getSelected();
```

### 变换操作

```typescript
// 设置变换模式
editor.setTransformMode('translate');  // 移动
editor.setTransformMode('rotate');     // 旋转
editor.setTransformMode('scale');      // 缩放

// 获取当前变换模式
const mode = editor.getTransformMode();

// 设置变换空间
editor.setTransformSpace('world');  // 世界坐标系
editor.setTransformSpace('local');  // 本地坐标系

// 监听变换结束事件
editor.onTransformEnd((event) => {
  console.log('变换模式:', event.mode);
  console.log('对象:', event.object);
  console.log('新位置:', event.position);
  console.log('新旋转:', event.rotation);
  console.log('新缩放:', event.scale);
});
```

### 相机操作

```typescript
// 聚焦到对象
editor.focusOnObject(object3D);

// 直接访问相机
editor.camera.position.set(5, 5, 5);
editor.orbitControls.target.set(0, 0, 0);
```

### 删除对象

```typescript
// 删除选中的对象
editor.deleteSelected();
```

### 高级用法

```typescript
// 直接访问选择器
editor.selector.onChange((object) => { /* ... */ });
editor.selector.selectByUuid('uuid-string');

// 直接访问变换器
editor.transformer.setTranslationSnap(0.5);  // 设置移动捕捉为 0.5 单位
editor.transformer.setRotationSnap(15);      // 设置旋转捕捉为 15 度
editor.transformer.setScaleSnap(0.1);        // 设置缩放捕捉为 0.1

// 监听变换过程
editor.transformer.onTransformChange((event) => {
  // 实时获取变换数据
});

editor.transformer.onTransformStart((object) => {
  // 变换开始时触发
});
```

## 类型定义

### TransformMode

```typescript
type TransformMode = 'translate' | 'rotate' | 'scale';
```

### TransformSpace

```typescript
type TransformSpace = 'world' | 'local';
```

### TransformChangeEvent

```typescript
interface TransformChangeEvent {
  object: Object3D;
  mode: TransformMode;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
}
```

### SelectionChangeCallback

```typescript
type SelectionChangeCallback = (object: Object3D | null) => void;
```

## 文件结构

```
src/3d/
├── index.ts        # Three3D 主类，整合所有功能
├── selector.ts     # 选择器，处理对象选择逻辑
├── transformer.ts  # 变换器，处理对象变换逻辑
├── nodeFactory.ts  # 节点工厂，创建 3D 对象
├── sceneSetup.ts   # 场景设置，初始化灯光、网格等
├── materials.ts    # 材质工具函数
├── types.ts        # 类型定义
└── README.md       # 本文档
```
