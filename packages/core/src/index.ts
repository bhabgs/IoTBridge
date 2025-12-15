import { SceneMode, SceneModel, SceneChangeEvent, SceneChangeCallback, ViewportState, ViewportState2D, ViewportState3D, SceneNode } from "./types";
import { Pixi2D } from "./2d";
import { Three3D } from "./3d";

// ============ 共享模块导出 ============
export {
  EventEmitter,
  CoordinateSystem,
  DEFAULT_COLORS,
  DEFAULT_SIZES,
  ZOOM_LIMITS,
  INTERACTION_THRESHOLDS,
  ANIMATION,
  HOTKEYS,
  COLOR_NAME_MAP,
} from "./shared";

export type {
  BaseRendererOptions,
  ISelector,
  ITransformer,
  INodeFactory,
  IRenderer,
  TransformMode as BaseTransformMode,
  TransformSpace as BaseTransformSpace,
  PointerPosition,
  TransformState,
} from "./shared";

// ============ 3D 模块导出 ============
export {
  Selector,
  SelectionChangeCallback,
  SelectorOptions,
} from "./3d/selector";
export {
  Transformer,
  TransformMode,
  TransformSpace,
  TransformChangeEvent,
  TransformerOptions,
} from "./3d/transformer";
export { Three3D } from "./3d";

// ============ 2D 模块导出 ============
export {
  Pixi2D,
  Selector2D,
  SelectionChangeCallback2D,
  Transformer2D,
  TransformChangeCallback2D,
  TransformStartCallback2D,
  TransformEndCallback2D,
  NodeFactory2D,
  nodeFactory2D,
  parseColor,
  Pixi2DOptions,
  TransformMode2D,
  TransformChangeEvent2D,
} from "./2d";

// ============ 类型导出 ============
export type {
  SceneChangeType,
  SceneChangeEvent,
  SceneChangeCallback,
  SceneNodeChanges,
  ViewportState,
  ViewportState2D,
  ViewportState3D,
  SceneNode,
  SceneModel,
  NodeType,
  NodeTransform,
  NodeGeometry,
  NodeMaterial,
  NodeStyle,
  Vec2,
  Vec3,
  Vec4,
  ColorValue,
  GradientFill,
  SceneMode,
} from "./types";

// SDK 只支持 "2d" 和 "3d" 模式

export interface SDKOptions {
  container: HTMLElement;
  sceneModel?: SceneModel;
  onModeChange?: (mode: SceneMode) => void;
  /** 场景数据变化回调 */
  onSceneChange?: SceneChangeCallback;
}

class IndustrialConfigSDK {
  sceneModel: SceneModel = {
    id: "1",
    version: "1.0.0",
    sceneMode: "3d",
    nodes: [
      // 两个矩形
      {
        id: "1",
        type: "rect",
        transform: {
          position: { x: 0, y: 50, z: 0 },
        },
        geometry: {
          width: 100,
          height: 100,
          depth: 100,
        },
        material: {
          color: "yellow",
        },
      },
      {
        id: "2",
        type: "rect",
        transform: {
          position: { x: 150, y: 50, z: 0 },
        },
        geometry: {
          width: 100,
          height: 100,
          depth: 100,
        },
        material: {
          color: "green",
        },
      },
    ],
    assets: {},
    symbols: [],
    meta: {},
  };
  container: HTMLElement;
  target: Pixi2D | Three3D | null = null;
  private onModeChange?: (mode: SceneMode) => void;
  private onSceneChangeCallback?: SceneChangeCallback;
  /** 内部场景变化处理器 */
  private sceneChangeHandler: SceneChangeCallback;
  /** 视口状态缓存 - 用于在切换模式时保持视图状态 */
  private viewportStateCache: ViewportState = {};
  /** 选择变化回调 */
  private selectionChangeCallbacks: ((nodeId: string | null) => void)[] = [];

  constructor(options: SDKOptions) {
    const { container, sceneModel, onModeChange, onSceneChange } = options;
    this.container = container;
    this.sceneModel = sceneModel || this.sceneModel;
    this.onModeChange = onModeChange;
    this.onSceneChangeCallback = onSceneChange;

    // 创建场景变化处理器
    this.sceneChangeHandler = (event: SceneChangeEvent) => {
      // 同步更新 SDK 的 sceneModel
      this.syncSceneModel(event);
      // 触发外部回调
      this.onSceneChangeCallback?.(event);
    };

    if (!this.container) {
      throw new Error("Container is required");
    }

    this.init();
  }

  /**
   * 初始化场景
   */
  init() {
    // 清理旧实例
    this.disposeCurrent();

    // 根据场景模式创建对应的渲染器
    const mode = this.sceneModel.sceneMode;
    if (mode === "2d") {
      this.target = new Pixi2D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
      // 绑定场景变化监听
      this.target.onSceneChange(this.sceneChangeHandler);
      // 绑定选择变化监听
      this.bindSelectionChangeHandler();
    } else if (mode === "3d") {
      this.target = new Three3D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
      // 绑定场景变化监听
      this.target.onSceneChange(this.sceneChangeHandler);
      // 绑定选择变化监听
      this.bindSelectionChangeHandler();
    } else {
      // 如果模式是 "auto" 或其他不支持的值，默认使用 "3d"
      const defaultMode: SceneMode = "3d";
      console.warn(
        `Unsupported scene mode: ${mode}. Using default mode: ${defaultMode}`
      );
      this.sceneModel.sceneMode = defaultMode;
      this.target = new Three3D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
      // 绑定场景变化监听
      this.target.onSceneChange(this.sceneChangeHandler);
      // 绑定选择变化监听
      this.bindSelectionChangeHandler();
    }
  }

  /**
   * 绑定选择变化处理器到当前渲染器
   */
  private bindSelectionChangeHandler(): void {
    if (!this.target) return;

    const handleSelectionChange = (object: any) => {
      const nodeId = object?.nodeId ?? object?.userData?.nodeId ?? null;
      for (const callback of this.selectionChangeCallbacks) {
        callback(nodeId);
      }
    };

    if (this.target instanceof Pixi2D) {
      // 等待 2D 渲染器初始化完成
      this.target.ready().then(() => {
        if (this.target instanceof Pixi2D && this.target.selector) {
          this.target.selector.onChange(handleSelectionChange);
        }
      });
    } else if (this.target instanceof Three3D) {
      this.target.selector.onChange(handleSelectionChange);
    }
  }

  /**
   * 清理当前实例
   */
  private disposeCurrent() {
    if (this.target) {
      // 调用各渲染器的 dispose 方法
      if (this.target instanceof Three3D) {
        this.target.dispose();
      } else if (this.target instanceof Pixi2D) {
        this.target.dispose();
      }
      this.target = null;
    }

    // 清空容器中的所有子元素
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  /**
   * 加载节点（已由各渲染器内部处理，此方法保留用于兼容）
   */
  loadNodes() {
    // 节点加载已由 Pixi2D 和 Three3D 在初始化时自动处理
    // 此方法保留用于向后兼容或手动触发重新加载
    if (this.target instanceof Three3D) {
      // Three3D 的节点在构造函数中已加载
    } else if (this.target instanceof Pixi2D) {
      // Pixi2D 的节点在 init 完成后加载
    }
  }

  /**
   * 切换场景模式
   */
  switchSceneMode(sceneMode: SceneMode) {
    if (this.sceneModel.sceneMode === sceneMode) {
      console.warn(`Already in ${sceneMode} mode`);
      return;
    }

    const previousMode = this.sceneModel.sceneMode;

    // 保存当前视口状态
    this.saveCurrentViewportState();

    this.sceneModel.sceneMode = sceneMode;

    try {
      this.init();

      // 恢复目标模式的视口状态
      this.restoreViewportState(sceneMode);

      // 触发模式变化回调
      this.onModeChange?.(sceneMode);
    } catch (error) {
      // 如果切换失败，恢复原模式
      this.sceneModel.sceneMode = previousMode;
      console.error(`Failed to switch to ${sceneMode} mode:`, error);
      throw error;
    }
  }

  /**
   * 保存当前视口状态到缓存
   */
  private saveCurrentViewportState(): void {
    if (!this.target) return;

    const currentMode = this.sceneModel.sceneMode;

    if (currentMode === "2d" && this.target instanceof Pixi2D) {
      this.viewportStateCache.viewport2D = this.target.getViewportState();
    } else if (currentMode === "3d" && this.target instanceof Three3D) {
      this.viewportStateCache.viewport3D = this.target.getViewportState();
    }
  }

  /**
   * 恢复指定模式的视口状态
   */
  private restoreViewportState(mode: SceneMode): void {
    if (!this.target) return;

    if (mode === "2d" && this.target instanceof Pixi2D) {
      const state = this.viewportStateCache.viewport2D;
      if (state) {
        this.target.setViewportState(state);
      }
    } else if (mode === "3d" && this.target instanceof Three3D) {
      const state = this.viewportStateCache.viewport3D;
      if (state) {
        this.target.setViewportState(state);
      }
    }
  }

  /**
   * 获取当前视口状态
   */
  getViewportState(): ViewportState {
    // 先保存当前状态
    this.saveCurrentViewportState();
    return { ...this.viewportStateCache };
  }

  /**
   * 设置视口状态（同时设置 2D 和 3D 状态缓存）
   */
  setViewportState(state: ViewportState): void {
    if (state.viewport2D) {
      this.viewportStateCache.viewport2D = state.viewport2D;
    }
    if (state.viewport3D) {
      this.viewportStateCache.viewport3D = state.viewport3D;
    }

    // 如果当前渲染器存在，立即应用对应的状态
    const currentMode = this.sceneModel.sceneMode;
    this.restoreViewportState(currentMode as SceneMode);
  }

  /**
   * 获取当前场景模式
   */
  getSceneMode(): SceneMode {
    const mode = this.sceneModel.sceneMode;
    // 确保返回的是 "2d" 或 "3d"
    if (mode === "2d" || mode === "3d") {
      return mode;
    }
    return "3d"; // 默认返回 "3d"
  }

  /**
   * 更新场景模型（会重新加载节点）
   */
  updateSceneModel(sceneModel: Partial<SceneModel>) {
    this.sceneModel = { ...this.sceneModel, ...sceneModel };
    // 如果模式改变，需要切换（只处理 "2d" 或 "3d"）
    if (
      sceneModel.sceneMode &&
      (sceneModel.sceneMode === "2d" || sceneModel.sceneMode === "3d") &&
      sceneModel.sceneMode !== this.getSceneMode()
    ) {
      this.switchSceneMode(sceneModel.sceneMode);
    } else {
      // 否则重新初始化当前模式
      this.init();
    }
  }

  /**
   * 获取当前渲染器实例
   */
  getRenderer(): Pixi2D | Three3D | null {
    return this.target;
  }

  /**
   * 获取 2D 渲染器（如果当前是 2D 模式）
   */
  get2DRenderer(): Pixi2D | null {
    return this.target instanceof Pixi2D ? this.target : null;
  }

  /**
   * 获取 3D 渲染器（如果当前是 3D 模式）
   */
  get3DRenderer(): Three3D | null {
    return this.target instanceof Three3D ? this.target : null;
  }

  /**
   * 同步场景模型数据
   */
  private syncSceneModel(event: SceneChangeEvent): void {
    const nodeIndex = this.sceneModel.nodes.findIndex(
      (n) => n.id === event.nodeId
    );
    if (nodeIndex === -1) return;

    const node = this.sceneModel.nodes[nodeIndex];

    if (event.type === "transform" && event.changes?.transform) {
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

  /**
   * 添加场景数据变化监听
   * 当画布中的节点发生变化时（位置、旋转、缩放等），会触发此回调
   */
  onSceneChange(callback: SceneChangeCallback): void {
    this.onSceneChangeCallback = callback;
  }

  // ============ 节点管理方法（代理到渲染器） ============

  /**
   * 添加节点到场景
   * @param node 节点数据
   * @returns 添加的节点 ID
   */
  addNode(node: SceneNode): string | null {
    if (this.target instanceof Pixi2D) {
      return this.target.addNode(node);
    }
    if (this.target instanceof Three3D) {
      return this.target.addNode(node);
    }
    return null;
  }

  /**
   * 移除节点
   * @param nodeId 节点 ID
   */
  removeNode(nodeId: string): boolean {
    if (this.target instanceof Pixi2D) {
      return this.target.removeNode(nodeId);
    }
    if (this.target instanceof Three3D) {
      return this.target.removeNode(nodeId);
    }
    return false;
  }

  /**
   * 更新节点属性
   * @param nodeId 节点 ID
   * @param updates 更新的属性
   */
  updateNode(nodeId: string, updates: Partial<SceneNode>): boolean {
    if (this.target instanceof Pixi2D) {
      return this.target.updateNode(nodeId, updates);
    }
    if (this.target instanceof Three3D) {
      return this.target.updateNode(nodeId, updates);
    }
    return false;
  }

  /**
   * 获取节点数据
   * @param nodeId 节点 ID
   */
  getNode(nodeId: string): SceneNode | null {
    if (this.target instanceof Pixi2D) {
      return this.target.getNode(nodeId);
    }
    if (this.target instanceof Three3D) {
      return this.target.getNode(nodeId);
    }
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
    if (this.target instanceof Pixi2D) {
      return this.target.getSelectedNodeId();
    }
    if (this.target instanceof Three3D) {
      return this.target.getSelectedNodeId();
    }
    return null;
  }

  /**
   * 通过节点 ID 选中节点
   */
  selectNodeById(nodeId: string | null): void {
    if (this.target instanceof Pixi2D) {
      this.target.selectNodeById(nodeId);
    }
    if (this.target instanceof Three3D) {
      this.target.selectNodeById(nodeId);
    }
  }

  /**
   * 将屏幕坐标转换为世界坐标
   * 在 3D 模式下，返回射线与地面 (y=0) 的交点
   * 在 2D 模式下，考虑画布缩放和平移
   * @param screenX 屏幕 X 坐标（相对于容器）
   * @param screenY 屏幕 Y 坐标（相对于容器）
   * @returns 世界坐标（像素单位）
   */
  screenToWorldPosition(screenX: number, screenY: number): { x: number; y: number; z: number } {
    if (this.target instanceof Pixi2D) {
      return this.target.screenToWorldPosition(screenX, screenY);
    }
    if (this.target instanceof Three3D) {
      const pos = this.target.screenToWorldPosition(screenX, screenY);
      return pos || { x: 0, y: 0, z: 0 };
    }
    return { x: screenX, y: 0, z: screenY };
  }

  /**
   * 添加选择变化监听
   * 当选中的节点发生变化时触发回调
   * @param callback 回调函数，参数为选中的节点 ID（取消选择时为 null）
   */
  onSelectionChange(callback: (nodeId: string | null) => void): void {
    this.selectionChangeCallbacks.push(callback);
  }

  /**
   * 移除选择变化监听
   */
  offSelectionChange(callback: (nodeId: string | null) => void): void {
    const index = this.selectionChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.selectionChangeCallbacks.splice(index, 1);
    }
  }

  // ============ 导入导出方法 ============

  /**
   * 导出场景数据为 JSON 字符串
   * @returns JSON 字符串
   */
  exportScene(): string {
    return JSON.stringify(this.sceneModel, null, 2);
  }

  /**
   * 导出场景数据为 JSON 文件并下载
   * @param filename 文件名（可选，默认为 "scene.json"）
   */
  exportSceneToFile(filename: string = "scene.json"): void {
    const json = this.exportScene();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 从 JSON 字符串导入场景数据
   * @param json JSON 字符串
   * @throws 如果 JSON 格式无效
   */
  importScene(json: string): void {
    try {
      const sceneModel: SceneModel = JSON.parse(json);

      // 验证基本结构
      if (!sceneModel.nodes || !Array.isArray(sceneModel.nodes)) {
        throw new Error("Invalid scene model: missing or invalid nodes array");
      }

      // 更新场景模型
      this.updateSceneModel(sceneModel);
    } catch (error) {
      console.error("Failed to import scene:", error);
      throw error;
    }
  }

  /**
   * 从文件导入场景数据
   * @returns Promise，在文件选择和导入完成后 resolve
   */
  importSceneFromFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";

      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          reject(new Error("No file selected"));
          return;
        }

        try {
          const text = await file.text();
          this.importScene(text);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error("File selection cancelled"));
      };

      input.click();
    });
  }

  /**
   * 销毁 SDK 实例
   */
  dispose() {
    this.disposeCurrent();
    this.onModeChange = undefined;
    this.onSceneChangeCallback = undefined;
    this.selectionChangeCallbacks = [];
  }
}

export default IndustrialConfigSDK;
