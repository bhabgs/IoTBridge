import { Application, Container, FederatedPointerEvent } from "pixi.js";
import { SceneModel } from "../types";
import {
  Pixi2DOptions,
  TransformMode2D,
  TransformChangeEvent2D,
} from "./types";
import { nodeFactory2D } from "./nodeFactory";
import { Selector2D, SelectionChangeCallback2D } from "./selector";
import { Transformer2D } from "./transformer";

/**
 * Pixi2D - 2D 编辑器核心类
 */
export class Pixi2D {
  app: Application | null = null;
  container: HTMLElement;
  sceneModel: SceneModel;
  options: Pixi2DOptions;

  /** 选择器 */
  selector: Selector2D | null = null;
  /** 变换器 */
  transformer: Transformer2D | null = null;

  /** 指针状态 */
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };
  /** 是否正在拖拽元素 */
  private isDraggingElement = false;

  /** 初始化 Promise */
  private initPromise: Promise<void>;

  constructor(options: Pixi2DOptions) {
    const { container, sceneModel } = options;
    this.container = container;
    this.sceneModel = sceneModel;
    this.options = options;

    this.initPromise = this.init();
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      background: this.options.backgroundColor ?? "#1a1a2e",
      resizeTo: this.options.autoResize !== false ? this.container : undefined,
      antialias: true,
    });

    this.container.appendChild(this.app.canvas);

    // 启用舞台交互
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    // 创建选择器（禁用边界框，由变换器显示）
    this.selector = new Selector2D(this.app.stage, {
      showBoundingBox: false,
    });

    // 创建变换器
    this.transformer = new Transformer2D(this.app.stage, this.app.canvas);

    // 设置选择变化时的处理
    this.selector.onChange((object) => {
      if (object) {
        this.transformer!.attach(object);
      } else {
        this.transformer!.detach();
      }
    });

    // 变换过程中更新边界框
    this.transformer.onTransformChange(() => {
      this.selector!.refreshBoundingBox();
    });

    this.transformer.onTransformEnd(() => {
      this.selector!.refreshBoundingBox();
    });

    // 加载节点
    this.loadNodes();

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 等待初始化完成
   */
  async ready(): Promise<void> {
    return this.initPromise;
  }

  /**
   * 加载场景节点
   */
  loadNodes(): void {
    if (!this.app) return;

    const nodes = this.sceneModel.nodes;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const displayObject = nodeFactory2D.createDisplayObject(node);
      if (displayObject) {
        this.app.stage.addChild(displayObject);
        // 为元素启用拖拽功能
        this.enableDrag(displayObject);
      }
    }
  }

  /**
   * 为元素启用拖拽功能
   */
  private enableDrag(object: Container): void {
    if (!this.app) return;

    let isDragging = false;
    let hasMoved = false; // 标记是否真正移动了
    let dragStartPoint: { x: number; y: number } | null = null;
    let objectStartPosition: { x: number; y: number } | null = null;

    // 指针按下
    object.on("pointerdown", (e: FederatedPointerEvent) => {
      // 如果正在使用变换控制器，不处理拖拽
      if (this.transformer?.isDraggingObject()) {
        return;
      }

      e.stopPropagation();
      isDragging = true;
      hasMoved = false;
      dragStartPoint = { x: e.globalX, y: e.globalY };
      objectStartPosition = { x: object.x, y: object.y };

      // 设置光标
      object.cursor = "move";
    });

    // 指针移动（使用全局事件，确保移出元素也能继续拖拽）
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !dragStartPoint || !objectStartPosition) return;

      const rect = this.app!.canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaX = currentX - dragStartPoint.x;
      const deltaY = currentY - dragStartPoint.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 如果移动距离超过阈值，认为是拖拽
      if (distance > 3) {
        if (!hasMoved) {
          hasMoved = true;
          this.isDraggingElement = true;
        }

        // 更新对象位置
        object.x = objectStartPosition.x + deltaX;
        object.y = objectStartPosition.y + deltaY;

        // 如果对象被选中，更新变换控制器和边界框
        if (this.selector?.selected === object) {
          this.transformer?.updateControls();
          this.selector.refreshBoundingBox();
        }
      }
    };

    // 指针释放
    const onPointerUp = () => {
      if (isDragging) {
        // 如果没有真正移动，认为是点击，应该选择对象
        if (!hasMoved) {
          // 选择对象
          this.selector?.select(object);
        }

        isDragging = false;
        hasMoved = false;
        this.isDraggingElement = false;
        dragStartPoint = null;
        objectStartPosition = null;
        object.cursor = "pointer";

        // 更新边界框
        if (this.selector?.selected === object) {
          this.selector.refreshBoundingBox();
        }
      }
    };

    // 绑定全局事件
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    // 在对象销毁时移除事件监听
    object.on("destroyed", () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    });
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (!this.app) return;

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);

    // 指针事件
    this.app.stage.on("pointerdown", this.onPointerDown);
    this.app.stage.on("pointerup", this.onPointerUp);
    this.app.stage.on("dblclick", this.onDoubleClick);
  }

  /**
   * 窗口大小变化处理
   */
  private onResize = (): void => {
    if (!this.app) return;

    // PixiJS 会自动处理 resizeTo，这里可以添加额外处理
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 键盘按下事件
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    // 变换模式快捷键
    if (key === "2") {
      this.transformer?.setMode("rotate");
      return;
    }
    if (key === "3") {
      this.transformer?.setMode("scale");
      return;
    }

    // 删除选中对象
    if (key === "delete" || key === "backspace") {
      this.deleteSelected();
      return;
    }

    // 取消选择 (Escape)
    if (key === "escape") {
      this.selector?.deselect();
      return;
    }
  };

  /**
   * 获取鼠标位置
   */
  private getPointerPosition(event: FederatedPointerEvent): {
    x: number;
    y: number;
  } {
    return {
      x: event.global.x,
      y: event.global.y,
    };
  }

  /**
   * 指针按下事件
   */
  private onPointerDown = (event: FederatedPointerEvent): void => {
    const pos = this.getPointerPosition(event);
    this.pointerDownPosition.x = pos.x;
    this.pointerDownPosition.y = pos.y;
  };

  /**
   * 指针释放事件
   */
  private onPointerUp = (event: FederatedPointerEvent): void => {
    const pos = this.getPointerPosition(event);
    this.pointerUpPosition.x = pos.x;
    this.pointerUpPosition.y = pos.y;

    // 如果正在拖拽元素，不处理选择（元素自己的 onPointerUp 会处理选择）
    if (this.isDraggingElement) {
      return;
    }

    // 检查是否是点击（而不是拖拽）
    const dx = this.pointerUpPosition.x - this.pointerDownPosition.x;
    const dy = this.pointerUpPosition.y - this.pointerDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果移动距离很小，认为是点击
    if (distance < 5) {
      // 如果正在拖拽变换控制器，不处理选择
      if (!this.transformer?.isDraggingObject()) {
        // 尝试选择点击位置的对象，如果没有对象则取消选择
        const selected = this.selector?.selectByPoint(
          this.pointerUpPosition.x,
          this.pointerUpPosition.y
        );
        // 如果没有选中任何对象，取消选择
        if (!selected) {
          this.selector?.deselect();
        }
      }
    }
  };

  /**
   * 双击事件 - 聚焦到对象
   */
  private onDoubleClick = (event: FederatedPointerEvent): void => {
    const pos = this.getPointerPosition(event);
    const object = this.selector?.getObjectAtPoint(pos.x, pos.y);

    if (object) {
      this.focusOnObject(object);
    }
  };

  /**
   * 聚焦到对象
   */
  focusOnObject(object: Container): void {
    // 2D 场景中的聚焦可以通过滚动或缩放来实现
    // 这里简单地确保对象可见
    const bounds = object.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // 可以在这里添加平移画布的逻辑
    console.log(`Focus on object at (${centerX}, ${centerY})`);
  }

  /**
   * 删除选中的对象
   */
  deleteSelected(): void {
    const selected = this.selector?.selected;
    if (selected && selected.parent) {
      this.selector?.deselect();
      selected.parent.removeChild(selected);
      selected.destroy();
    }
  }

  /**
   * 选择对象
   */
  select(object: Container | null): void {
    this.selector?.select(object);
  }

  /**
   * 通过节点 ID 选择对象
   */
  selectByNodeId(nodeId: string): Container | null {
    return this.selector?.selectByNodeId(nodeId) ?? null;
  }

  /**
   * 取消选择
   */
  deselect(): void {
    this.selector?.deselect();
  }

  /**
   * 获取当前选中的对象
   */
  getSelected(): Container | null {
    return this.selector?.selected ?? null;
  }

  /**
   * 设置变换模式
   */
  setTransformMode(mode: TransformMode2D): void {
    this.transformer?.setMode(mode);
  }

  /**
   * 获取当前变换模式
   */
  getTransformMode(): TransformMode2D {
    return this.transformer?.getMode() ?? "scale";
  }

  /**
   * 添加选择变化监听
   */
  onSelectionChange(callback: SelectionChangeCallback2D): void {
    this.selector?.onChange(callback);
  }

  /**
   * 添加变换结束监听
   */
  onTransformEnd(callback: (event: TransformChangeEvent2D) => void): void {
    this.transformer?.onTransformEnd(callback);
  }

  /**
   * 销毁 Pixi2D 实例
   */
  dispose(): void {
    // 移除事件监听
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);

    // 销毁选择器和变换器
    this.selector?.dispose();
    this.transformer?.dispose();

    if (this.app) {
      // 移除 canvas
      if (this.app.canvas && this.app.canvas.parentNode) {
        this.app.canvas.parentNode.removeChild(this.app.canvas);
      }
      // 销毁应用
      this.app.destroy(true, {
        children: true,
        texture: true,
      });
      this.app = null;
    }
  }
}

// 导出类型和模块
export { Selector2D, SelectionChangeCallback2D } from "./selector";
export {
  Transformer2D,
  TransformChangeCallback2D,
  TransformStartCallback2D,
  TransformEndCallback2D,
} from "./transformer";
export { NodeFactory2D, nodeFactory2D, parseColor } from "./nodeFactory";
export {
  Pixi2DOptions,
  TransformMode2D,
  TransformChangeEvent2D,
} from "./types";
