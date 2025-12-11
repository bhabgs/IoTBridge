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

export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**--------- 颜色类型 ---------*/
export type ColorValue = string; // 支持 #RRGGBB / rgba() / css colors

export interface GradientStop {
  offset: number; // 0-1
  color: ColorValue;
}

export interface LinearGradient {
  type: "linear";
  angle?: number; // 角度（度），默认 0 为从左到右
  stops: GradientStop[];
}

export interface RadialGradient {
  type: "radial";
  center?: Vec2; // 中心点（0-1 归一化），默认 (0.5, 0.5)
  radius?: number; // 半径（0-1 归一化），默认 0.5
  stops: GradientStop[];
}

export type GradientFill = LinearGradient | RadialGradient;
export type FillValue = ColorValue | GradientFill;

/**--------- 通用类型和别名 ---------*/
export type ISODateString = string; // ISO 格式日期字符串

/** 节点类型枚举（可扩展） */
export type NodeType =
  | "group"
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "polyline"
  | "polygon"
  | "path"
  | "text"
  | "image"
  | "pipe"
  | "model3d"
  | "light"
  | "camera"
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

  // 图层管理
  layers?: Layer[];

  // 可复用组件库（Symbol definitions）
  symbols?: SymbolDefinition[];

  // 资源清单（图片 / 3D 模型 / 纹理等）
  assets?: AssetManifest;

  // -------- 3D 场景配置 --------
  // 相机
  camera?: CameraConfig;
  cameras?: CameraConfig[]; // 多相机支持
  activeCameraId?: string;

  // 灯光
  lights?: LightConfig[];

  // 环境
  environment?: EnvironmentConfig;

  // -------- 2D 视口配置 --------
  viewport?: ViewportConfig;

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

  // 所属图层 id
  layerId?: string;

  // -------- 基础状态 --------
  visible?: boolean; // 可见性，默认 true
  locked?: boolean; // 锁定编辑，默认 false
  opacity?: number; // 节点级透明度 0-1，默认 1
  zIndex?: number; // 2D 渲染层级顺序

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
  animations?: NodeAnimation[];

  // 约束与布局
  constraints?: NodeConstraints;

  // 自定义业务字段
  metadata?: Record<string, any>;

  // 子节点（Group 时使用）
  children?: SceneNode[];
}

/**--------- Transform（通用，2D/3D） ---------*/
export interface NodeTransform {
  position: Vec3; // 2D 时 z 可为 0 或忽略
  rotation?: Vec3; // 旋转角度（度），2D 时只使用 z 轴
  scale?: Vec3; // 缩放，默认 (1, 1, 1)
  anchor?: Vec3; // 锚点（pivot），以局部坐标系为准，默认 (0.5, 0.5, 0.5)
  skew?: Vec2; // 2D 斜切变换（度）
  quaternion?: Vec4; // 3D 四元数旋转（可选，优先级高于 rotation）
}

/**--------- 几何信息（Geometry） ---------*/
export interface NodeGeometry {
  // 基本盒模型
  width?: number;
  height?: number;
  depth?: number; // 3D 专用

  // 圆类
  radius?: number;
  radiusX?: number; // 椭圆 X 轴半径
  radiusY?: number; // 椭圆 Y 轴半径

  // 圆角
  cornerRadius?: number | [number, number, number, number]; // 单值或四角分别设置

  // 多点集合（polyline, polygon, pipe） -- 局部坐标系
  points?: Vec2[]; // 2D 点集
  points3d?: Vec3[]; // 3D 点集（管道、3D 折线等）
  closed?: boolean; // 多边形/折线是否闭合

  // 线条箭头
  startArrow?: ArrowConfig;
  endArrow?: ArrowConfig;

  // SVG Path 字符串，2D/3D 通用（3D 场景可能需要解析为曲线/路径）
  path?: string;

  // 指明几何形状
  shape?:
    | "rect"
    | "circle"
    | "ellipse"
    | "line"
    | "polyline"
    | "polygon"
    | "path"
    | "model"
    | "custom";

  // 引用外部模型（如 glTF）
  modelId?: string; // 对应 assets.models 中的 id

  // 额外扩展字段
  extras?: Record<string, any>;
}

/**--------- 箭头配置 ---------*/
export interface ArrowConfig {
  enabled?: boolean;
  type?: "triangle" | "arrow" | "circle" | "diamond" | "custom";
  size?: number;
  fill?: ColorValue;
  stroke?: ColorValue;
}

/**--------- 材质（Material） ---------*/
export interface NodeMaterial {
  // 材质类型
  type?: "basic" | "standard" | "physical" | "phong" | "lambert" | "toon";

  // 基础颜色
  color?: ColorValue;
  opacity?: number;
  transparent?: boolean;

  // 纹理/贴图
  textureId?: string; // 引用 assets.textures（漫反射/基础色贴图）
  normalMapId?: string; // 法线贴图
  aoMapId?: string; // 环境遮蔽贴图
  roughnessMapId?: string; // 粗糙度贴图
  metalnessMapId?: string; // 金属度贴图
  emissiveMapId?: string; // 自发光贴图
  displacementMapId?: string; // 位移贴图
  envMapId?: string; // 环境贴图

  // PBR 属性
  metalness?: number; // 金属度 0-1
  roughness?: number; // 粗糙度 0-1
  emissive?: ColorValue; // 自发光颜色
  emissiveIntensity?: number; // 自发光强度

  // 渲染设置
  side?: "front" | "back" | "double"; // 渲染面
  wireframe?: boolean; // 线框模式
  flatShading?: boolean; // 平面着色
  depthTest?: boolean;
  depthWrite?: boolean;

  // 自定义额外字段
  extras?: Record<string, any>;
}

/**--------- 2D 样式（Style） ---------*/
export interface NodeStyle {
  // 边框/描边
  stroke?: ColorValue | GradientFill;
  strokeWidth?: number;
  lineDash?: number[];
  lineDashOffset?: number;
  lineCap?: "round" | "square" | "butt";
  lineJoin?: "round" | "bevel" | "miter";
  miterLimit?: number;

  // 填充
  fill?: FillValue;

  // 阴影
  shadow?: ShadowConfig;

  // 滤镜/特效
  filters?: FilterEffect[];

  // 混合模式
  blendMode?: BlendMode;

  // 文本
  text?: string; // 文本内容
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  textBaseline?: "top" | "middle" | "bottom" | "alphabetic";
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: "none" | "underline" | "line-through";
  textWrap?: "none" | "word" | "char";

  // 透明度（覆盖 material.opacity）
  opacity?: number;

  // 额外字段
  extras?: Record<string, any>;
}

/**--------- 阴影配置 ---------*/
export interface ShadowConfig {
  color?: ColorValue;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
  spread?: number; // CSS box-shadow spread
  inset?: boolean; // 内阴影
}

/**--------- 滤镜效果 ---------*/
export interface FilterEffect {
  type:
    | "blur"
    | "brightness"
    | "contrast"
    | "grayscale"
    | "hue-rotate"
    | "invert"
    | "saturate"
    | "sepia"
    | "drop-shadow"
    | "glow";
  value?: number;
  // drop-shadow / glow 专用
  color?: ColorValue;
  offsetX?: number;
  offsetY?: number;
}

/**--------- 混合模式 ---------*/
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

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

  // 播放控制
  delay?: number; // 延迟开始（毫秒）
  iterations?: number; // 播放次数，Infinity 表示无限循环
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode?: "none" | "forwards" | "backwards" | "both";
  easing?: EasingType; // 全局缓动函数

  // 触发方式
  autoPlay?: boolean; // 自动播放
  triggerEvent?: string; // 触发事件名
  triggerBinding?: string; // 数据绑定触发

  /** @deprecated 使用 iterations: Infinity 替代 */
  loop?: boolean;
}

export interface AnimationKeyFrame {
  time: number; // 0 .. duration（毫秒）
  value: any; // number | Vec2 | Vec3 | string | ColorValue
  easing?: EasingType; // 到下一帧的缓动函数
}

export type EasingType =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "ease-in-quad"
  | "ease-out-quad"
  | "ease-in-out-quad"
  | "ease-in-cubic"
  | "ease-out-cubic"
  | "ease-in-out-cubic"
  | "ease-in-elastic"
  | "ease-out-elastic"
  | "ease-in-out-elastic"
  | "ease-in-bounce"
  | "ease-out-bounce"
  | "ease-in-out-bounce"
  | string; // 支持自定义 cubic-bezier

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
  // 基础状态覆盖
  visible?: boolean;
  locked?: boolean;
  opacity?: number;

  // 结构覆盖
  transform?: Partial<NodeTransform>;
  geometry?: Partial<NodeGeometry>;
  material?: Partial<NodeMaterial>;
  style?: Partial<NodeStyle>;
  constraints?: Partial<NodeConstraints>;
  interaction?: Partial<NodeInteraction>;
  metadata?: Record<string, any>;

  // 支持按路径覆盖，例如 { "children.0.transform.position.x": 10 }
  pathOverrides?: Record<string, any>;

  // 子节点覆盖（按子节点 id 索引）
  childOverrides?: Record<string, NodeOverrides>;
}

/**--------- 图层（Layer） ---------*/
export interface Layer {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  order?: number; // 图层顺序
  color?: ColorValue; // 图层标识色（编辑器中使用）
}

/**--------- 相机配置（Camera） ---------*/
export type CameraType = "perspective" | "orthographic";

export interface CameraConfig {
  id: string;
  name?: string;
  type: CameraType;

  // 位置与朝向
  position: Vec3;
  target?: Vec3; // lookAt 目标点
  up?: Vec3; // 上方向，默认 (0, 1, 0)

  // 透视相机参数
  fov?: number; // 视场角（度），默认 50

  // 正交相机参数
  zoom?: number; // 正交缩放，默认 1

  // 通用参数
  near?: number; // 近裁剪面，默认 0.1
  far?: number; // 远裁剪面，默认 2000
  aspect?: number; // 宽高比（通常由视口自动计算）

  // 相机控制器
  controls?: CameraControls;
}

export interface CameraControls {
  type?: "orbit" | "fly" | "first-person" | "trackball" | "map" | "none";
  enabled?: boolean;

  // 旋转/缩放/平移
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;

  // 距离限制
  minDistance?: number;
  maxDistance?: number;

  // 极角限制（垂直方向）
  minPolarAngle?: number; // 弧度
  maxPolarAngle?: number;

  // 方位角限制（水平方向）
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;

  // 缩放限制
  minZoom?: number;
  maxZoom?: number;

  // 自动旋转
  autoRotate?: boolean;
  autoRotateSpeed?: number;

  // 阻尼/惯性
  enableDamping?: boolean;
  dampingFactor?: number;
}

/**--------- 灯光配置（Light） ---------*/
export type LightType =
  | "ambient"
  | "directional"
  | "point"
  | "spot"
  | "hemisphere"
  | "rect-area";

export interface LightConfig {
  id: string;
  name?: string;
  type: LightType;

  // 基础属性
  color?: ColorValue;
  intensity?: number;
  visible?: boolean;

  // 位置（ambient 除外）
  position?: Vec3;

  // 方向光 / 聚光灯目标
  target?: Vec3;

  // 聚光灯专用
  angle?: number; // 锥角（弧度）
  penumbra?: number; // 半影衰减 0-1
  decay?: number; // 衰减系数

  // 点光源 / 聚光灯
  distance?: number; // 照射距离，0 表示无限

  // 半球光专用
  groundColor?: ColorValue;

  // 矩形区域光专用
  width?: number;
  height?: number;

  // 阴影
  castShadow?: boolean;
  shadow?: LightShadowConfig;
}

export interface LightShadowConfig {
  mapSize?: number; // 阴影贴图分辨率
  bias?: number;
  normalBias?: number;
  radius?: number; // 阴影模糊半径
  camera?: {
    near?: number;
    far?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    fov?: number;
  };
}

/**--------- 环境配置（Environment） ---------*/
export interface EnvironmentConfig {
  // 背景
  background?: ColorValue | "transparent";
  backgroundTextureId?: string; // 背景图/HDR

  // 环境贴图（用于反射）
  envMapId?: string;
  envMapIntensity?: number;

  // 天空盒
  skybox?: SkyboxConfig;

  // 雾效
  fog?: FogConfig;

  // 色调映射
  toneMapping?: "none" | "linear" | "reinhard" | "cineon" | "aces" | "agx";
  toneMappingExposure?: number;

  // 后处理
  postProcessing?: PostProcessingConfig;
}

export interface SkyboxConfig {
  type: "color" | "cubemap" | "equirectangular" | "procedural";
  textureId?: string; // cubemap 或 equirectangular 纹理
  color?: ColorValue;
  // 程序化天空参数
  turbidity?: number;
  rayleigh?: number;
  sunPosition?: Vec3;
}

export interface FogConfig {
  type: "linear" | "exponential" | "exponential-squared";
  color?: ColorValue;
  near?: number; // linear
  far?: number; // linear
  density?: number; // exponential
}

export interface PostProcessingConfig {
  enabled?: boolean;
  bloom?: {
    enabled?: boolean;
    threshold?: number;
    intensity?: number;
    radius?: number;
  };
  ssao?: {
    enabled?: boolean;
    radius?: number;
    intensity?: number;
  };
  // 可扩展更多后处理效果
  extras?: Record<string, any>;
}

/**--------- 2D 视口配置（Viewport） ---------*/
export interface ViewportConfig {
  x: number; // 视口中心 X
  y: number; // 视口中心 Y
  zoom: number; // 缩放比例
  minZoom?: number;
  maxZoom?: number;
  rotation?: number; // 视口旋转（度）

  // 网格/辅助线
  grid?: GridConfig;
}

export interface GridConfig {
  enabled?: boolean;
  size?: number; // 网格大小
  divisions?: number;
  color?: ColorValue;
  snap?: boolean; // 是否吸附网格
}

/**--------- 节点约束（Constraints） ---------*/
export interface NodeConstraints {
  // 相对父容器的约束
  horizontal?: "left" | "center" | "right" | "stretch" | "scale";
  vertical?: "top" | "center" | "bottom" | "stretch" | "scale";

  // 固定距离约束
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;

  // 保持宽高比
  aspectRatio?: number;

  // 固定尺寸
  fixedWidth?: boolean;
  fixedHeight?: boolean;
}

/**--------- 场景元信息（业务相关） ---------*/
export interface SceneMeta {
  author?: string;
  description?: string;
  tags?: string[];
  projectId?: string;

  // 画布尺寸（2D）
  canvasWidth?: number;
  canvasHeight?: number;

  // 单位
  unit?: "px" | "mm" | "cm" | "m" | "in";
  pixelRatio?: number;

  // 设备点/数据绑定映射
  deviceMapping?: Record<string, any>;
  extras?: Record<string, any>;
}

/**--------- 辅助类型 / 工具类型（可选） ---------*/
export interface SelectionState {
  selectedIds: string[];
  primaryId?: string | null;
}

/**--------- 场景数据变化事件 ---------*/
export type SceneChangeType = "transform" | "geometry" | "material" | "style" | "add" | "remove" | "reorder";

/** 场景节点变化数据（支持部分更新） */
export interface SceneNodeChanges {
  transform?: Partial<NodeTransform>;
  geometry?: Partial<NodeGeometry>;
  material?: Partial<NodeMaterial>;
  style?: Partial<NodeStyle>;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  zIndex?: number;
  name?: string;
}

export interface SceneChangeEvent {
  /** 变化类型 */
  type: SceneChangeType;
  /** 变化的节点 ID */
  nodeId: string;
  /** 变化的节点数据（更新后的完整节点或部分数据） */
  node?: SceneNode;
  /** 变化的具体字段（可选，用于细粒度更新） */
  changes?: SceneNodeChanges;
}

/** 场景数据变化回调 */
export type SceneChangeCallback = (event: SceneChangeEvent) => void;

export interface HistoryEntry<T = any> {
  id: string;
  timestamp: number;
  description?: string;
  patch: T; // 可序列化的补丁/命令
}

/**--------- 视口状态（用于保存/恢复视图） ---------*/
/** 2D 视口状态 */
export interface ViewportState2D {
  /** 平移位置 */
  pan: { x: number; y: number };
  /** 缩放级别 */
  zoom: number;
}

/** 3D 视口状态 */
export interface ViewportState3D {
  /** 相机位置 */
  cameraPosition: { x: number; y: number; z: number };
  /** 轨道控制器目标点 */
  controlsTarget: { x: number; y: number; z: number };
  /** 相机缩放（用于正交相机） */
  cameraZoom?: number;
}

/** 统一视口状态 */
export interface ViewportState {
  /** 2D 视口状态 */
  viewport2D?: ViewportState2D;
  /** 3D 视口状态 */
  viewport3D?: ViewportState3D;
}
