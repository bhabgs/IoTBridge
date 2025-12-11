import { SceneMode, SceneModel, SceneChangeEvent, SceneChangeCallback } from "./types";
import { Pixi2D } from "./2d";
import { Three3D } from "./3d";

// 导出 3D 选择和编辑相关类型
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

// 导出 2D 选择和编辑相关类型
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

// 导出场景数据变化相关类型
export type {
  SceneChangeType,
  SceneChangeEvent,
  SceneChangeCallback,
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
    } else if (mode === "3d") {
      this.target = new Three3D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
      // 绑定场景变化监听
      this.target.onSceneChange(this.sceneChangeHandler);
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
    this.sceneModel.sceneMode = sceneMode;

    try {
      this.init();
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
      node.transform = {
        ...node.transform,
        ...event.changes.transform,
      };
    }
  }

  /**
   * 添加场景数据变化监听
   * 当画布中的节点发生变化时（位置、旋转、缩放等），会触发此回调
   */
  onSceneChange(callback: SceneChangeCallback): void {
    this.onSceneChangeCallback = callback;
  }

  /**
   * 销毁 SDK 实例
   */
  dispose() {
    this.disposeCurrent();
    this.onModeChange = undefined;
    this.onSceneChangeCallback = undefined;
  }
}

export default IndustrialConfigSDK;
