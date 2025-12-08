你是一个高级前端工程师，目标是生成一个工业组态工具 JS/TS SDK，要求如下：

## 1️⃣ 项目结构（mono repo）

- industrial-sdk-core # 主包：逻辑层、事件系统、RendererManager、SDK 入口
- industrial-sdk-pixi # PixiRenderer 插件
- industrial-sdk-three # ThreeRenderer 插件

## 2️⃣ 总体目标

1. 支持 2D（PixiJS v8+）和 3D（Three.js r160+）渲染，WebGL 不支持时自动降级为 2D。
2. 主包只依赖 TypeScript，无直接依赖 PixiJS/Three.js。
3. 渲染器作为插件，动态 import 加载。
4. 数据统一存储在逻辑层（ConfigCore），渲染器仅做可视化。
5. 提供 CRUD API 管理实体，支持批量操作。
6. 支持事件绑定/解绑，按需渲染和批量更新。
7. 支持导入/导出 JSON，导入后可切换 2D/3D 不丢失状态。
8. 提供销毁方法，确保内存释放。
9. 输出 TypeScript 代码，完整 JSDoc 注释，类型定义 (.d.ts)，并提供示例代码。

## 3️⃣ 运行模式（RunMode）

- edit（编辑模式）：允许 CRUD、拖拽、缩放、旋转、属性编辑，事件完整触发。
- preview（预览模式）：CRUD 只读，事件仅触发非破坏性操作，动画/状态模拟可执行。
- production（生产模式）：CRUD 禁止，事件节流，最大性能渲染，可处理大规模实体。
- SDK 提供：

```ts
sdk.setRunMode("edit" | "preview" | "production");
```

## 4️⃣ 数据模型

### 4.1 全局状态 GlobalState

```ts
interface GlobalState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
  camera: {
    position: { x: number; y: number; z: number };
    scale: number;
    target: { x: number; y: number; z: number };
  };
  activeMode: "2D" | "3D";
  runMode: "edit" | "preview" | "production";
}
```

### 4.2 实体模型 Entity

```ts
interface Entity {
  id: string; // 唯一标识
  type: 'rect'|'circle'|'pipe'|'valve'|'motor'|'custom';
  parentId?: string;
  position: { x:number, y:number, z?:number };
  size: { width:number, height:number, depth?:number };
  rotation?: { x?:number, y?:number, z?:number };
  color?: string;
  style: {
    2d?: { texture?: string; anchor?: {x:number,y:number}; tint?: string };
    3d?: { model?: string; material?: string; castShadow?: boolean };
  };
  properties?: Record<string, any>;
  visible?: boolean;
  version?: number;
  lastModified?: number;
}

```

## 5️⃣ 渲染器插件要求

### 5.1 PixiRenderer (industrial-sdk-pixi)

- 构造函数: (containerId:string, options:{width?,height?,antialias?})

- 方法:

init(): Promise<void>

createEntity(entity:Entity): void

updateEntity(id:string,data:Partial<Entity>): void

deleteEntity(id:string): void

syncData(state:GlobalState): void

activate(): void

pause(): void

resize(width:number,height:number): void

destroy(): void

- 性能优化：

- 批量更新、SpriteSheet、RenderTexture、按层渲染、脏标记渲染

- 模式感知：

edit：显示辅助线、操作控件、选中框

preview：隐藏控件，显示动画/状态

production：隐藏所有 UI，最大性能

### 5.2 ThreeRenderer (industrial-sdk-three)

- 构造函数: (containerId:string, options:{width?,height?,antialias?,enableShadow?})

- 方法同 PixiRenderer

- 性能优化：

- InstancedMesh、LOD、Frustum Culling、模型缓存、按层渲染

- 模式感知同 PixiRenderer

## 6️⃣ 渲染器管理器 (RendererManager)

构造函数(containerId:string, defaultMode:'2D'|'3D'='2D')

方法:

init(): Promise<void>

switchMode(mode:'2D'|'3D'): Promise<void> // 动态 import 对应插件

setRunMode(mode:'edit'|'preview'|'production'): void

getActiveRenderer(): PixiRenderer|ThreeRenderer|null

destroy(): void

特点:

延迟初始化渲染器

同一时刻仅激活一个渲染器

切换模式或渲染器自动同步逻辑层状态

## 7️⃣ 逻辑层 (ConfigCore)

- CRUD / 批量操作 / 树结构实体管理

- 相机控制

- 事件系统：

```ts
bindEvent(event:EventType, callback:EventCallback, modes?:RunMode[]);
unbindEvent(event:EventType, callback?:EventCallback);
emitEvent(event:EventType, data:EventData);

```

- 导入/导出 JSON

- 高频事件节流（如 drag 16ms）

## 8️⃣ SDK 入口 (IndustrialConfigSDK)

构造函数(containerId:string, options:{defaultMode?, defaultRunMode?, rendererOptions?})

方法:

init(): Promise<void>

switchMode('2D'|'3D'): Promise<void>

setRunMode('edit'|'preview'|'production'): void

getActiveRenderer(): PixiRenderer|ThreeRenderer|null

destroy(): void

自动动态加载渲染器插件，切换时同步逻辑层状态

WebGL 不支持时自动降级到 2D

## 9️⃣ 性能与资源管理

逻辑层仅更新变化实体

高频事件节流

渲染器根据模式调整 UI / 渲染策略

PixiRenderer / ThreeRenderer 各自优化策略

资源加载失败提供降级方案（基础几何体 / Sprite）

🔟 输出要求

- 模块结构：

1. 主包: types.ts, config-core.ts, renderer-manager.ts, index.ts
2. 渲染器插件: PixiRenderer, ThreeRenderer

- 完整 JSDoc 注释

- 示例代码：

1. 初始化 SDK
2. CRUD 实体
3. 切换 2D/3D
4. 切换编辑/预览/生产模式
5. 事件绑定/触发
6. 导入/导出 JSON
7. 销毁 SDK

- 异常处理：

1. 容器不存在
2. 实体 ID 重复
3. JSON 格式错误
4. 插件加载失败
5. WebGL 不支持
