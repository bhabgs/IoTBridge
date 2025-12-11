/**
 * @fileoverview 共享常量定义
 */

/**
 * 默认颜色值
 */
export const DEFAULT_COLORS = {
  /** 默认填充颜色 */
  FILL: 0xcccccc,
  /** 默认描边颜色 */
  STROKE: 0x000000,
  /** 选择框颜色 */
  SELECTION: 0x007bff,
  /** 变换控制器颜色 */
  TRANSFORM_HANDLE: 0x1890ff,
  /** 2D 背景颜色 */
  BACKGROUND_2D: '#1a1a2e',
  /** 3D 背景颜色 */
  BACKGROUND_3D: 0x1a1a2e,
  /** 网格颜色 */
  GRID: 0x444444,
} as const;

/**
 * 默认尺寸
 */
export const DEFAULT_SIZES = {
  /** 默认宽度 */
  WIDTH: 100,
  /** 默认高度 */
  HEIGHT: 100,
  /** 默认深度 */
  DEPTH: 100,
  /** 默认半径 */
  RADIUS: 50,
  /** 默认描边宽度 */
  STROKE_WIDTH: 2,
  /** 变换控制器手柄大小 */
  TRANSFORM_HANDLE: 10,
  /** 选择框边距 */
  SELECTION_PADDING: 5,
} as const;

/**
 * 缩放限制
 */
export const ZOOM_LIMITS = {
  /** 2D 最小缩放 */
  MIN_2D: 0.1,
  /** 2D 最大缩放 */
  MAX_2D: 10,
  /** 3D 最小距离 */
  MIN_DISTANCE_3D: 0.5,
  /** 3D 最大距离 */
  MAX_DISTANCE_3D: 50,
} as const;

/**
 * 交互阈值
 */
export const INTERACTION_THRESHOLDS = {
  /** 点击判定距离（像素） */
  CLICK_DISTANCE: 5,
  /** 拖拽开始距离（像素） */
  DRAG_START_DISTANCE: 3,
  /** 双击间隔（毫秒） */
  DOUBLE_CLICK_INTERVAL: 300,
} as const;

/**
 * 动画参数
 */
export const ANIMATION = {
  /** 阻尼系数 */
  DAMPING_FACTOR: 0.05,
  /** 移动速度（世界单位/帧） */
  MOVE_SPEED: 0.05,
  /** 鼠标旋转速度（弧度/像素） */
  MOUSE_ROTATE_SPEED: 0.003,
  /** 键盘旋转速度（弧度/帧） */
  KEY_ROTATE_SPEED: 0.02,
} as const;

/**
 * 快捷键映射
 */
export const HOTKEYS = {
  /** 删除 */
  DELETE: ['delete', 'backspace'],
  /** 取消选择 */
  DESELECT: 'escape',
  /** 平移模式 */
  TRANSLATE: '1',
  /** 旋转模式 */
  ROTATE: '2',
  /** 缩放模式 */
  SCALE: '3',
  /** 切换空间 */
  TOGGLE_SPACE: 'x',
  /** 平移画布 */
  PAN_CANVAS: 'space',
} as const;

/**
 * 颜色名称到十六进制的映射
 */
export const COLOR_NAME_MAP: Record<string, number> = {
  red: 0xff0000,
  green: 0x00ff00,
  blue: 0x0000ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  white: 0xffffff,
  black: 0x000000,
  orange: 0xffa500,
  purple: 0x800080,
  pink: 0xffc0cb,
  gray: 0x808080,
  grey: 0x808080,
} as const;
