/**
 * @fileoverview 渲染器基类 - 2D/3D 渲染器的通用实现
 * 抽取共享逻辑，减少代码重复
 */

import type {
  SceneModel,
  SceneNode,
  SceneChangeEvent,
  SceneChangeCallback,
  SceneNodeChanges,
} from '../types';
import { EventEmitter } from './EventEmitter';
import type { ISelector, ITransformer } from './interfaces';

/**
 * 渲染器事件类型定义
 */
export interface RendererEvents {
  /** 场景数据变化 */
  sceneChange: SceneChangeEvent;
  /** 选择变化 */
  selectionChange: string | null;
  /** 模式变化 */
  modeChange: string;
}

/**
 * 基础渲染器选项
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
 * 抽象基类 - 渲染器基础实现
 * 提供 2D 和 3D 渲染器的共享逻辑
 */
export abstract class BaseRenderer<
  TDisplayObject,
  TViewportState,
  TSelector extends ISelector<TDisplayObject> = ISelector<TDisplayObject>,
  TTransformer extends ITransformer<TDisplayObject> = ITransformer<TDisplayObject>
> {
  /** 容器元素 */
  readonly container: HTMLElement;

  /** 场景数据模型 */
  sceneModel: SceneModel;

  /** 选择器 */
  selector: TSelector | null = null;

  /** 变换器 */
  transformer: TTransformer | null = null;

  /** 事件发射器 */
  protected events = new EventEmitter<RendererEvents>();

  /** 节点 ID 到显示对象的映射缓存（O(1) 查找） */
  protected nodeMap: Map<string, TDisplayObject> = new Map();

  /** 鼠标是否在画布上 */
  protected isCanvasHovered = false;

  /** 场景数据变化回调（兼容旧 API） */
  private sceneChangeCallbacks: SceneChangeCallback[] = [];

  constructor(options: BaseRendererOptions) {
    this.container = options.container;
    this.sceneModel = options.sceneModel;
  }

  // ============ 抽象方法（子类必须实现） ============

  /** 创建显示对象 */
  protected abstract createDisplayObject(node: SceneNode): TDisplayObject | null;

  /** 添加显示对象到场景 */
  protected abstract addDisplayObjectToScene(object: TDisplayObject): void;

  /** 从场景移除显示对象 */
  protected abstract removeDisplayObjectFromScene(object: TDisplayObject): void;

  /** 更新显示对象的变换 */
  protected abstract updateDisplayObjectTransform(
    object: TDisplayObject,
    updates: Partial<SceneNode>
  ): void;

  /** 销毁显示对象 */
  protected abstract destroyDisplayObject(object: TDisplayObject): void;

  /** 获取视口状态 */
  abstract getViewportState(): TViewportState;

  /** 设置视口状态 */
  abstract setViewportState(state: TViewportState): void | Promise<void>;

  /** 屏幕坐标转世界坐标 */
  abstract screenToWorldPosition(
    screenX: number,
    screenY: number
  ): { x: number; y: number; z: number };

  /** 初始化 */
  abstract init(): Promise<void> | void;

  /** 销毁 */
  abstract dispose(): void;

  // ============ 节点管理方法（共享实现） ============

  /**
   * 添加节点到场景
   * @param node 节点数据
   * @returns 添加的节点 ID
   */
  addNode(node: SceneNode): string {
    // 添加到 sceneModel
    this.sceneModel.nodes.push(node);

    // 创建显示对象并添加到场景
    const displayObject = this.createDisplayObject(node);
    if (displayObject) {
      this.addDisplayObjectToScene(displayObject);
      // 添加到缓存
      this.nodeMap.set(node.id, displayObject);
    }

    // 触发变化事件
    this.emitSceneChange({
      type: 'add',
      nodeId: node.id,
      node: node,
    });

    return node.id;
  }

  /**
   * 移除节点
   * @param nodeId 节点 ID
   */
  removeNode(nodeId: string): boolean {
    // 从 sceneModel 中移除
    const nodeIndex = this.sceneModel.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return false;

    const removedNode = this.sceneModel.nodes.splice(nodeIndex, 1)[0];

    // 从场景中移除显示对象
    const displayObject = this.nodeMap.get(nodeId);
    if (displayObject) {
      // 如果是当前选中的，先取消选择
      if (this.selector?.selected === displayObject) {
        this.selector.deselect();
        this.transformer?.detach();
      }
      this.removeDisplayObjectFromScene(displayObject);
      this.destroyDisplayObject(displayObject);
      // 从缓存移除
      this.nodeMap.delete(nodeId);
    }

    // 触发变化事件
    this.emitSceneChange({
      type: 'remove',
      nodeId: nodeId,
      node: removedNode,
    });

    return true;
  }

  /**
   * 更新节点属性
   * @param nodeId 节点 ID
   * @param updates 更新的属性
   */
  updateNode(nodeId: string, updates: Partial<SceneNode>): boolean {
    const node = this.sceneModel.nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // 深度合并更新到 sceneModel 中的节点
    this.mergeNodeUpdates(node, updates);

    // 更新显示对象
    const displayObject = this.nodeMap.get(nodeId);
    if (displayObject) {
      // 检查是否需要重新创建对象
      const needsRebuild = updates.geometry || updates.material || updates.style;

      if (needsRebuild) {
        this.rebuildDisplayObject(nodeId, node, displayObject);
      } else {
        // 只更新 transform
        this.updateDisplayObjectTransform(displayObject, updates);

        // 刷新选择框
        if (this.selector?.selected === displayObject) {
          this.selector.refreshBoundingBox();
        }
      }
    }

    // 构建变化事件
    const changes: SceneNodeChanges = {};
    if (updates.transform) changes.transform = updates.transform;
    if (updates.geometry) changes.geometry = updates.geometry;
    if (updates.material) changes.material = updates.material;
    if (updates.style) changes.style = updates.style;
    if (updates.name !== undefined) changes.name = updates.name;

    this.emitSceneChange({
      type: 'transform',
      nodeId: nodeId,
      node: node,
      changes: changes,
    });

    return true;
  }

  /**
   * 获取节点数据
   * @param nodeId 节点 ID
   */
  getNode(nodeId: string): SceneNode | null {
    return this.sceneModel.nodes.find((n) => n.id === nodeId) || null;
  }

  /**
   * 获取所有节点
   */
  getNodes(): SceneNode[] {
    return [...this.sceneModel.nodes];
  }

  /**
   * 获取当前选中的节点 ID
   */
  getSelectedNodeId(): string | null {
    const selected = this.selector?.selected;
    if (!selected) return null;
    return this.getNodeIdFromDisplayObject(selected);
  }

  /**
   * 通过节点 ID 选中节点
   */
  selectNodeById(nodeId: string | null): void {
    if (!nodeId) {
      this.selector?.deselect();
      this.transformer?.detach();
      return;
    }

    const displayObject = this.nodeMap.get(nodeId);
    if (displayObject) {
      this.selector?.select(displayObject);
      this.transformer?.attach(displayObject);
    }
  }

  /**
   * 删除选中的对象
   */
  deleteSelected(): void {
    const selected = this.selector?.selected;
    if (!selected) return;

    const nodeId = this.getNodeIdFromDisplayObject(selected);
    if (nodeId) {
      this.removeNode(nodeId);
    }
  }

  // ============ 通过 ID 查找显示对象（O(1)） ============

  /**
   * 通过节点 ID 查找显示对象
   * 使用缓存实现 O(1) 查找
   */
  protected findDisplayObjectByNodeId(nodeId: string): TDisplayObject | null {
    return this.nodeMap.get(nodeId) || null;
  }

  /**
   * 从显示对象获取节点 ID
   * 子类需要根据各自的实现来获取 nodeId
   */
  protected abstract getNodeIdFromDisplayObject(object: TDisplayObject): string | null;

  // ============ 场景同步方法 ============

  /**
   * 触发场景数据变化事件
   */
  protected emitSceneChange(event: SceneChangeEvent): void {
    // 同步更新 sceneModel
    this.syncNodeToSceneModel(event);

    // 使用 EventEmitter 触发事件
    this.events.emit('sceneChange', event);

    // 兼容旧 API：触发回调数组
    for (const callback of this.sceneChangeCallbacks) {
      callback(event);
    }
  }

  /**
   * 将节点变化同步到 sceneModel
   */
  protected syncNodeToSceneModel(event: SceneChangeEvent): void {
    const nodeIndex = this.sceneModel.nodes.findIndex((n) => n.id === event.nodeId);
    if (nodeIndex === -1) return;

    const node = this.sceneModel.nodes[nodeIndex];

    if (event.type === 'transform' && event.changes?.transform) {
      const transformChanges = event.changes.transform;
      // 只更新有值的字段
      if (transformChanges.position) {
        node.transform.position = transformChanges.position;
      }
      if (transformChanges.rotation) {
        node.transform.rotation = transformChanges.rotation;
      }
      if (transformChanges.scale) {
        node.transform.scale = transformChanges.scale;
      }
    }
  }

  // ============ 事件监听方法 ============

  /**
   * 添加场景数据变化监听（新 API）
   */
  onSceneChange(callback: SceneChangeCallback): () => void {
    // 同时支持新旧 API
    this.sceneChangeCallbacks.push(callback);
    const unsubscribe = this.events.on('sceneChange', callback);

    return () => {
      unsubscribe();
      const index = this.sceneChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.sceneChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 移除场景数据变化监听
   */
  offSceneChange(callback: SceneChangeCallback): void {
    const index = this.sceneChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.sceneChangeCallbacks.splice(index, 1);
    }
    this.events.off('sceneChange', callback);
  }

  // ============ 键盘事件过滤 ============

  /**
   * 检查是否应该处理键盘事件
   * 只有当鼠标在画布上且焦点不在输入框时才处理
   */
  protected shouldHandleKeyboardEvent(): boolean {
    // 如果鼠标不在画布上，不处理
    if (!this.isCanvasHovered) return false;

    // 如果焦点在输入框、文本框或可编辑元素上，不处理
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable'))
    ) {
      return false;
    }

    return true;
  }

  /**
   * 鼠标进入画布
   */
  protected onCanvasPointerEnter = (): void => {
    this.isCanvasHovered = true;
  };

  /**
   * 鼠标离开画布
   */
  protected onCanvasPointerLeave = (): void => {
    this.isCanvasHovered = false;
  };

  // ============ 辅助方法 ============

  /**
   * 深度合并节点更新
   */
  protected mergeNodeUpdates(node: SceneNode, updates: Partial<SceneNode>): void {
    if (updates.transform) {
      node.transform = { ...node.transform, ...updates.transform };
      if (updates.transform.position) {
        node.transform.position = { ...node.transform.position, ...updates.transform.position };
      }
      if (updates.transform.rotation) {
        node.transform.rotation = { ...node.transform.rotation, ...updates.transform.rotation };
      }
      if (updates.transform.scale) {
        node.transform.scale = { ...node.transform.scale, ...updates.transform.scale };
      }
    }
    if (updates.geometry) {
      node.geometry = { ...node.geometry, ...updates.geometry };
    }
    if (updates.material) {
      node.material = { ...node.material, ...updates.material };
    }
    if (updates.style) {
      node.style = { ...node.style, ...updates.style };
    }
    if (updates.name !== undefined) {
      node.name = updates.name;
    }
  }

  /**
   * 重建显示对象（当 geometry/material/style 变化时）
   */
  protected rebuildDisplayObject(
    nodeId: string,
    node: SceneNode,
    oldObject: TDisplayObject
  ): void {
    // 保存当前状态
    const wasSelected = this.selector?.selected === oldObject;

    // 移除旧对象
    this.removeDisplayObjectFromScene(oldObject);
    this.destroyDisplayObject(oldObject);

    // 创建新对象
    const newObject = this.createDisplayObject(node);
    if (newObject) {
      this.addDisplayObjectToScene(newObject);
      // 更新缓存
      this.nodeMap.set(nodeId, newObject);

      // 恢复选中状态
      if (wasSelected) {
        this.selector?.select(newObject);
        this.transformer?.attach(newObject);
      }
    } else {
      // 如果创建失败，从缓存移除
      this.nodeMap.delete(nodeId);
    }
  }

  /**
   * 加载节点到缓存
   * 子类在 loadNodes 时应调用此方法来填充缓存
   */
  protected cacheDisplayObject(nodeId: string, object: TDisplayObject): void {
    this.nodeMap.set(nodeId, object);
  }

  /**
   * 清空缓存
   */
  protected clearCache(): void {
    this.nodeMap.clear();
  }

  /**
   * 基础清理（子类 dispose 时调用）
   */
  protected disposeBase(): void {
    // 清空回调
    this.sceneChangeCallbacks = [];
    // 清空事件
    this.events.dispose();
    // 清空缓存
    this.clearCache();
  }
}
