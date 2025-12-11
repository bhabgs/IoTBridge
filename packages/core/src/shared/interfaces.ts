/**
 * @fileoverview 共享接口定义 - 2D/3D 渲染器的通用接口
 */

import type { SceneModel, SceneNode, SceneChangeCallback, SceneChangeEvent } from '../types';

/**
 * 渲染器基础选项
 */
export interface BaseRendererOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 场景数据模型 */
  sceneModel: SceneModel;
  /** 背景颜色 */
  backgroundColor?: string | number;
  /** 是否自动调整大小 */
  autoResize?: boolean;
}

/**
 * 选择器接口
 */
export interface ISelector<T> {
  /** 当前选中的对象 */
  selected: T | null;

  /** 选择对象 */
  select(object: T | null): void;

  /** 取消选择 */
  deselect(): void;

  /** 通过节点 ID 选择 */
  selectByNodeId(nodeId: string): T | null;

  /** 刷新边界框 */
  refreshBoundingBox(): void;

  /** 添加选择变化监听 */
  onChange(callback: (object: T | null) => void): void;

  /** 销毁 */
  dispose(): void;
}

/**
 * 变换模式
 */
export type TransformMode = 'translate' | 'rotate' | 'scale';

/**
 * 变换空间（3D 专用）
 */
export type TransformSpace = 'world' | 'local';

/**
 * 变换器接口
 */
export interface ITransformer<T> {
  /** 附加到对象 */
  attach(object: T): void;

  /** 分离 */
  detach(): void;

  /** 设置模式 */
  setMode(mode: TransformMode): void;

  /** 获取模式 */
  getMode(): TransformMode;

  /** 是否正在拖拽 */
  isDraggingObject(): boolean;

  /** 更新控制器 */
  updateControls(): void;

  /** 添加变换开始监听 */
  onTransformStart(callback: () => void): void;

  /** 添加变换过程监听 */
  onTransformChange(callback: () => void): void;

  /** 添加变换结束监听 */
  onTransformEnd(callback: (event: any) => void): void;

  /** 销毁 */
  dispose(): void;
}

/**
 * 节点工厂接口
 */
export interface INodeFactory<T> {
  /** 创建显示对象 */
  createDisplayObject(node: SceneNode): T | null;
}

/**
 * 渲染器基础接口
 */
export interface IRenderer<T, ViewportState> {
  /** 场景数据模型 */
  sceneModel: SceneModel;

  /** 选择器 */
  selector: ISelector<T> | null;

  /** 变换器 */
  transformer: ITransformer<T> | null;

  // ============ 生命周期 ============

  /** 初始化 */
  init(): Promise<void> | void;

  /** 等待就绪 */
  ready(): Promise<void>;

  /** 销毁 */
  dispose(): void;

  // ============ 节点管理 ============

  /** 添加节点 */
  addNode(node: SceneNode): string | null;

  /** 移除节点 */
  removeNode(nodeId: string): boolean;

  /** 更新节点 */
  updateNode(nodeId: string, updates: Partial<SceneNode>): boolean;

  /** 获取节点 */
  getNode(nodeId: string): SceneNode | null;

  /** 获取所有节点 */
  getNodes(): SceneNode[];

  // ============ 选择 ============

  /** 获取选中节点 ID */
  getSelectedNodeId(): string | null;

  /** 通过 ID 选择节点 */
  selectNodeById(nodeId: string | null): void;

  // ============ 视口 ============

  /** 获取视口状态 */
  getViewportState(): ViewportState;

  /** 设置视口状态 */
  setViewportState(state: ViewportState): void | Promise<void>;

  // ============ 事件 ============

  /** 添加场景变化监听 */
  onSceneChange(callback: SceneChangeCallback): void;

  /** 移除场景变化监听 */
  offSceneChange(callback: SceneChangeCallback): void;
}

/**
 * 指针位置
 */
export interface PointerPosition {
  x: number;
  y: number;
}

/**
 * 变换状态
 */
export interface TransformState {
  position?: { x: number; y: number; z?: number };
  rotation?: number | { x: number; y: number; z: number };
  scale?: { x: number; y: number; z?: number };
}
