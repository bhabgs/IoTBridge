# Industrial SDK Core

工业组态工具 SDK 核心包 - 提供逻辑层、事件系统、渲染器管理和 SDK 入口。

## 安装

```bash
pnpm add industrial-sdk-core
```

## 可选渲染器插件

- `industrial-sdk-pixi` - PixiJS 2D 渲染器
- `industrial-sdk-three` - Three.js 3D 渲染器

## 快速开始

### 1. 初始化 SDK

```typescript
import { IndustrialConfigSDK } from 'industrial-sdk-core';

// 创建 SDK 实例
const sdk = new IndustrialConfigSDK('canvas-container', {
  defaultMode: '2D',           // 默认渲染模式
  defaultRunMode: 'edit',      // 默认运行模式
  rendererOptions: {
    width: 1920,
    height: 1080,
    antialias: true,
    backgroundColor: '#1a1a2e'
  }
});

// 初始化
await sdk.init();
```

### 2. CRUD 实体

```typescript
// 创建实体
const entity = sdk.createEntity({
  type: 'motor',
  position: { x: 200, y: 200 },
  size: { width: 80, height: 60 },
  color: '#3498db',
  style: {
    '2d': { texture: 'motor.png' },
    '3d': { model: 'motor.glb', castShadow: true }
  },
  properties: {
    name: '电机1',
    power: 100
  }
});

// 批量创建
const entities = sdk.createEntities([
  { type: 'rect', position: { x: 100, y: 100 }, size: { width: 50, height: 50 }, style: {} },
  { type: 'circle', position: { x: 200, y: 100 }, size: { width: 60, height: 60 }, style: {} }
]);

// 更新实体
sdk.updateEntity(entity.id, {
  position: { x: 300, y: 300 },
  color: '#e74c3c'
});

// 批量更新
sdk.updateEntities([
  { id: 'entity-1', position: { x: 100, y: 200 } },
  { id: 'entity-2', color: '#00ff00' }
]);

// 删除实体
sdk.deleteEntity(entity.id);

// 批量删除
sdk.deleteEntities(['entity-1', 'entity-2']);
```

### 3. 切换 2D/3D 模式

```typescript
// 切换到 3D 模式
await sdk.switchMode('3D');

// 切换回 2D 模式
await sdk.switchMode('2D');

// 获取当前模式
const currentMode = sdk.getActiveMode(); // '2D' | '3D'
```

### 4. 切换运行模式

```typescript
// 编辑模式 - 允许完整 CRUD、拖拽、缩放
sdk.setRunMode('edit');

// 预览模式 - CRUD 只读，可执行动画
sdk.setRunMode('preview');

// 生产模式 - CRUD 禁止，最大性能
sdk.setRunMode('production');

// 获取当前运行模式
const runMode = sdk.getRunMode();
```

### 5. 事件绑定

```typescript
// 监听实体点击
sdk.on('entity:click', (data) => {
  console.log('点击实体:', data.entityId);
});

// 监听拖拽 (仅编辑模式)
sdk.on('entity:drag', (data) => {
  console.log('拖拽位置:', data.position);
}, ['edit']);

// 监听模式切换
sdk.on('mode:change', (data) => {
  console.log('模式切换:', data.previousMode, '->', data.currentMode);
});

// 解绑事件
sdk.off('entity:click', myCallback);
sdk.off('entity:click'); // 解绑所有
```

### 6. 相机控制

```typescript
// 设置相机位置
sdk.setCameraPosition({ x: 100, y: 100 });

// 设置缩放
sdk.setCameraScale(1.5);

// 设置观察目标
sdk.setCameraTarget({ x: 0, y: 0, z: 0 });

// 获取相机状态
const camera = sdk.getCamera();

// 重置相机
sdk.resetCamera();
```

### 7. 导入/导出 JSON

```typescript
// 导出状态
const data = sdk.exportJSON();
localStorage.setItem('config', JSON.stringify(data));

// 导入状态
const savedData = JSON.parse(localStorage.getItem('config'));
sdk.importJSON(savedData);
```

### 8. 销毁 SDK

```typescript
sdk.destroy();
```

## 事件类型

| 事件类型 | 描述 |
|---------|------|
| `entity:create` | 实体创建 |
| `entity:update` | 实体更新 |
| `entity:delete` | 实体删除 |
| `entity:select` | 实体选中 |
| `entity:deselect` | 取消选中 |
| `entity:click` | 实体点击 |
| `entity:dblclick` | 实体双击 |
| `entity:dragstart` | 开始拖拽 |
| `entity:drag` | 拖拽中 |
| `entity:dragend` | 拖拽结束 |
| `entity:hover` | 鼠标悬停 |
| `entity:hoverend` | 悬停结束 |
| `mode:change` | 渲染模式切换 |
| `runmode:change` | 运行模式切换 |
| `camera:move` | 相机移动 |
| `camera:zoom` | 相机缩放 |
| `state:change` | 状态变化 |
| `state:import` | 导入状态 |
| `state:export` | 导出状态 |

## 实体类型

| 类型 | 描述 |
|------|------|
| `rect` | 矩形/立方体 |
| `circle` | 圆形/球体 |
| `pipe` | 管道 |
| `valve` | 阀门 |
| `motor` | 电机 |
| `custom` | 自定义 |

## 异常处理

```typescript
import { SDKError, SDKErrorCode } from 'industrial-sdk-core';

try {
  await sdk.init();
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case SDKErrorCode.CONTAINER_NOT_FOUND:
        console.error('容器不存在');
        break;
      case SDKErrorCode.WEBGL_NOT_SUPPORTED:
        console.error('WebGL 不支持');
        break;
      case SDKErrorCode.PLUGIN_LOAD_FAILED:
        console.error('插件加载失败');
        break;
      // ...
    }
  }
}
```

## API 文档

详细 API 文档请参考源码中的 JSDoc 注释。

## License

MIT

