import { SceneMode, SceneModel } from "./types";
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

// SDK 只支持 "2d" 和 "3d" 模式

export interface SDKOptions {
  container: HTMLElement;
  sceneModel?: SceneModel;
  onModeChange?: (mode: SceneMode) => void;
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

  constructor(options: SDKOptions) {
    const { container, sceneModel, onModeChange } = options;
    this.container = container;
    this.sceneModel = sceneModel || this.sceneModel;
    this.onModeChange = onModeChange;

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
    } else if (mode === "3d") {
      this.target = new Three3D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
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
   * 销毁 SDK 实例
   */
  dispose() {
    this.disposeCurrent();
    this.onModeChange = undefined;
  }
}

export default IndustrialConfigSDK;
