// scene-model-types.ts
// 完整的 TypeScript 类型定义（适用于 2D & 3D 工业组态 / 数字孪生 编辑器）
// 说明：这套类型旨在同时驱动 Konva(2D) 与 Three.js(3D)，并支持 Group / Symbol / Instance / Overrides

/**--------- 基础向量类型 ---------*/
export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**--------- 通用类型和别名 ---------*/
export type ISODateString = string; // ISO 格式日期字符串

/** 节点类型枚举（可扩展） */
export type NodeType =
  | "group"
  | "rect"
  | "circle"
  | "line"
  | "polygon"
  | "path"
  | "text"
  | "image"
  | "pipe"
  | "model3d"
  | "symbol-instance"
  | "custom";

/** 场景渲染模式 */
export type SceneMode = "2d" | "3d" | "auto";

/**--------- SceneModel（顶层） ---------*/
export interface SceneModel {
  id: string;
  name?: string;

  // 版本 & 时间
  version: string;
  createdAt?: ISODateString | number;
  updatedAt?: ISODateString | number;

  // 渲染模式
  sceneMode?: SceneMode;

  // 场景内容
  nodes: SceneNode[];

  // 可复用组件库（Symbol definitions）
  symbols?: SymbolDefinition[];

  // 资源清单（图片 / 3D 模型 / 纹理等）
  assets?: AssetManifest;

  // 业务元信息
  meta?: SceneMeta;
}

/**--------- SceneNode（场景节点/图元） ---------*/
export interface SceneNode {
  id: string;
  type: NodeType;

  // 可读名称
  name?: string;

  // 父节点 id（null 或 undefined 视为根节点）
  parentId?: string | null;

  // 如果此节点是 Symbol 的实例，则指向 symbolId
  symbolRef?: string;

  // 实例覆盖：仅记录被覆盖的字段
  overrides?: NodeOverrides;

  // 变换：位置 / 旋转 / 缩放 / 锚点
  transform: NodeTransform;

  // 几何：宽高 / 点集 / path 等
  geometry?: NodeGeometry;

  // 材质（3D）或基础填充（2D）
  material?: NodeMaterial;

  // 2D 专用样式（文本 / stroke / fill 等）
  style?: NodeStyle;

  // 交互与绑定
  interaction?: NodeInteraction;

  // 动画列表
  animation?: NodeAnimation[];

  // 自定义业务字段
  metadata?: Record<string, any>;

  // 子节点（Group 时使用）
  children?: SceneNode[];
}

/**--------- Transform（通用，2D/3D） ---------*/
export interface NodeTransform {
  position: Vec3; // 2D 时 z 可为 0 或忽略
  rotation?: Vec3; // 以弧度或度数为约定（在项目中统一）
  scale?: Vec3;
  anchor?: Vec3; // 锚点（pivot），以局部坐标系为准
}

/**--------- 几何信息（Geometry） ---------*/
export interface NodeGeometry {
  // 基本盒模型
  width?: number;
  height?: number;
  depth?: number; // 3D 专用

  // 圆类
  radius?: number;

  // 多点集合（polyline, polygon, pipe） -- 局部坐标系
  points?: Vec2[];

  // SVG Path 字符串，2D/3D 通用（3D 场景可能需要解析为曲线/路径）
  path?: string;

  // 指明几何形状
  shape?: "rect" | "circle" | "line" | "polygon" | "path" | "model" | "custom";

  // 引用外部模型（如 glTF）
  modelId?: string; // 对应 assets.models 中的 id

  // 额外扩展字段
  extras?: Record<string, any>;
}

/**--------- 材质（Material） ---------*/
export interface NodeMaterial {
  // 基础颜色
  color?: string; // 支持 #RRGGBB / rgba() / css colors
  opacity?: number;
  transparent?: boolean;

  // 纹理/贴图
  textureId?: string; // 引用 assets.textures

  // 3D 专用属性（基于 PBR 简化）
  metalness?: number;
  roughness?: number;
  emissive?: string;

  // 自定义额外字段
  extras?: Record<string, any>;
}

/**--------- 2D 样式（Style） ---------*/
export interface NodeStyle {
  // 边框/描边
  stroke?: string;
  strokeWidth?: number;
  lineDash?: number[];
  lineCap?: "round" | "square" | "butt";

  // 填充
  fill?: string;

  // 文本
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  textBaseline?: "top" | "middle" | "bottom" | "alphabetic";

  // 透明度（覆盖 material.opacity）
  opacity?: number;

  // 额外字段
  extras?: Record<string, any>;
}

/**--------- 交互与绑定（Interaction） ---------*/
export interface NodeInteraction {
  draggable?: boolean;
  selectable?: boolean;
  resizable?: boolean;
  rotatable?: boolean;

  // 事件表达式或命令 ID（在编辑器运行时由脚本/规则系统解析执行）
  events?: {
    onClick?: string;
    onDoubleClick?: string;
    onHover?: string;
    onContextMenu?: string;
  };

  // 数据绑定表达式，例如 ["device.temp", "format:0.0"] 或自定义表达式
  bindings?: BindingExpression[];
}

export interface BindingExpression {
  id?: string; // 绑定项 id
  path: string; // 数据源路径，例如 "devices.pump1.temperature"
  formatter?: string; // 格式化器名或表达式
  refreshIntervalMs?: number; // 自动刷新间隔
}

/**--------- 动画（Animation） ---------*/
export interface NodeAnimation {
  id: string;
  name?: string;

  // 需要动画的属性，比如 "transform.position.x" 或 "material.emissive"
  property: string;

  // 键帧列表
  keyframes: AnimationKeyFrame[];

  // 动画时长（毫秒）
  duration: number;
  loop?: boolean;
  easing?: string; // easing 名称或表达式
}

export interface AnimationKeyFrame {
  time: number; // 0 .. duration
  value: any; // number | Vec2 | Vec3 | string
  easing?: string;
}

/**--------- 资源清单（Asset Manifest） ---------*/
export interface AssetManifest {
  images?: AssetItem[]; // 图片
  models?: AssetItem[]; // 3D 模型，例如 glTF
  textures?: AssetItem[]; // 纹理贴图
  icons?: AssetItem[]; // 缩略图 / UI icon
}

export interface AssetItem {
  id: string;
  name?: string;
  type: "image" | "model" | "texture" | "icon" | string;
  url: string; // 本地路径或远程 URL
  sizeBytes?: number;
  meta?: Record<string, any>;
}

/**--------- Symbol（组件定义） ---------*/
export interface SymbolDefinition {
  id: string;
  name?: string;
  description?: string;
  // 组件根节点（通常为 type="group"）
  root: SceneNode;
  // 缩略图或预览图（可选）
  thumbnailId?: string; // 引用 assets.icons 或 assets.images
  tags?: string[];
  meta?: Record<string, any>;
}

/**--------- 实例覆盖（Overrides） ---------*/
export interface NodeOverrides {
  transform?: Partial<NodeTransform>;
  geometry?: Partial<NodeGeometry>;
  material?: Partial<NodeMaterial>;
  style?: Partial<NodeStyle>;
  metadata?: Record<string, any>;
  // 支持按路径覆盖，例如 { "children.0.transform.position.x": 10 }
  pathOverrides?: Record<string, any>;
}

/**--------- 场景元信息（业务相关） ---------*/
export interface SceneMeta {
  author?: string;
  description?: string;
  tags?: string[];
  projectId?: string;

  // 设备点/数据绑定映射
  deviceMapping?: Record<string, any>;
  extras?: Record<string, any>;
}

/**--------- 辅助类型 / 工具类型（可选） ---------*/
export interface SelectionState {
  selectedIds: string[];
  primaryId?: string | null;
}

export interface HistoryEntry<T = any> {
  id: string;
  timestamp: number;
  description?: string;
  patch: T; // 可序列化的补丁/命令
}
