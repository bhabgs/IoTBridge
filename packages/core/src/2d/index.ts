import { Application, Container, FederatedPointerEvent } from "pixi.js";
import { SceneNode, ViewportState2D } from "../types";
import { Pixi2DOptions, TransformMode2D, TransformChangeEvent2D } from "./types";
import { nodeFactory2D } from "./nodeFactory";
import { Selector2D, SelectionChangeCallback2D } from "./selector";
import { Transformer2D } from "./transformer";
import { DEFAULT_COLORS } from "../shared/constants";
import { BaseRenderer, BaseRendererOptions } from "../shared/BaseRenderer";
import { KeyBindingManager, createKeyBindingManager } from "../shared/KeyBindings";

/**
 * Pixi2D - 2D 编辑器核心类
 * 继承 BaseRenderer 以复用通用逻辑
 */
export class Pixi2D extends BaseRenderer<Container, ViewportState2D, Selector2D, Transformer2D> {
  app: Application | null = null;
  options: Pixi2DOptions;

  /** 内容容器（用于缩放和平移） */
  contentContainer: Container | null = null;

  /** 键盘绑定管理器 */
  private keyBindings: KeyBindingManager;

  /** 指针状态 */
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };
  /** 是否正在拖拽元素 */
  private isDraggingElement = false;
  /** 拖拽开始位置（用于检测是否发生移动） */
  private dragStartObjectPosition: { x: number; z: number } | null = null;

  /** 画布拖拽状态 */
  private isPanningCanvas = false;
  private panStartPosition = { x: 0, y: 0 };
  private panStartCanvasPosition = { x: 0, y: 0 };
  /** 是否按住空格键 */
  private isSpacePressed = false;

  /** 缩放限制 */
  private minZoom = 0.1;
  private maxZoom = 10;

  /** 初始化 Promise */
  private initPromise: Promise<void>;

  constructor(options: Pixi2DOptions) {
    super(options as BaseRendererOptions);
    this.options = options;
    this.keyBindings = createKeyBindingManager();
    this.initPromise = this.init();
  }

  // ============ 实现抽象方法 ============

  /**
   * 创建显示对象
   */
  protected createDisplayObject(node: SceneNode): Container | null {
    const displayObject = nodeFactory2D.createDisplayObject(node);
    if (displayObject) {
      this.enableDrag(displayObject);
    }
    return displayObject;
  }

  /**
   * 添加显示对象到场景
   */
  protected addDisplayObjectToScene(object: Container): void {
    if (this.contentContainer) {
      this.contentContainer.addChild(object);
    }
  }

  /**
   * 从场景移除显示对象
   */
  protected removeDisplayObjectFromScene(object: Container): void {
    if (this.contentContainer) {
      this.contentContainer.removeChild(object);
    }
  }

  /**
   * 更新显示对象的变换
   */
  protected updateDisplayObjectTransform(object: Container, updates: Partial<SceneNode>): void {
    if (updates.transform?.position) {
      object.position.set(
        updates.transform.position.x,
        updates.transform.position.z
      );
    }
    if (updates.transform?.rotation) {
      object.rotation = (updates.transform.rotation.y * Math.PI) / 180;
    }
    if (updates.transform?.scale) {
      object.scale.set(
        updates.transform.scale.x,
        updates.transform.scale.z
      );
    }

    // 刷新选择框和变换控制器
    if (this.selector?.selected === object) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  /**
   * 销毁显示对象
   */
  protected destroyDisplayObject(object: Container): void {
    object.destroy();
  }

  /**
   * 从显示对象获取节点 ID
   */
  protected getNodeIdFromDisplayObject(object: Container): string | null {
    return (object as any).nodeId ?? null;
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      background: this.options.backgroundColor ?? DEFAULT_COLORS.BACKGROUND_2D,
      resizeTo: this.options.autoResize !== false ? this.container : undefined,
      antialias: true,
    });

    this.container.appendChild(this.app.canvas);

    // 启用舞台交互
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    // 创建内容容器（用于缩放和平移）
    this.contentContainer = new Container();
    this.app.stage.addChild(this.contentContainer);

    // 将世界原点 (0, 0) 定位到屏幕中心
    this.contentContainer.position.set(
      this.container.clientWidth / 2,
      this.container.clientHeight / 2
    );

    // 创建选择器
    this.selector = new Selector2D(this.contentContainer, {
      showBoundingBox: false,
    });

    // 创建变换器
    this.transformer = new Transformer2D(
      this.app.stage,
      this.app.canvas,
      {},
      this.contentContainer
    );

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

    this.transformer.onTransformEnd((event) => {
      this.selector!.refreshBoundingBox();
      this.handleTransformEnd(event);
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
    if (!this.app || !this.contentContainer) return;

    const nodes = this.sceneModel.nodes;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const displayObject = nodeFactory2D.createDisplayObject(node);
      if (displayObject) {
        this.contentContainer.addChild(displayObject);
        this.enableDrag(displayObject);
        // 添加到缓存
        this.cacheDisplayObject(node.id, displayObject);
      }
    }
  }

  /**
   * 处理变换结束
   */
  private handleTransformEnd(event: TransformChangeEvent2D): void {
    const nodeId = this.getNodeIdFromDisplayObject(event.object);
    if (nodeId) {
      const originalY = this.getNodeOriginalY(nodeId);
      const originalScale = this.getNodeOriginalScale(nodeId);

      this.emitSceneChange({
        type: "transform",
        nodeId,
        changes: {
          transform: {
            position: event.position
              ? { x: event.position.x, y: originalY, z: event.position.y }
              : undefined,
            rotation: event.rotation !== undefined
              ? { x: 0, y: event.rotation, z: 0 }
              : undefined,
            scale: event.scale
              ? { x: event.scale.x, y: originalScale.y, z: event.scale.y }
              : undefined,
          },
        },
      });
    }
  }

  /**
   * 获取节点在 sceneModel 中的原始 Y 值（高度）
   */
  private getNodeOriginalY(nodeId: string): number {
    const node = this.sceneModel.nodes.find((n) => n.id === nodeId);
    return node?.transform.position.y ?? 0;
  }

  /**
   * 获取节点在 sceneModel 中的原始 Scale 值
   */
  private getNodeOriginalScale(nodeId: string): { x: number; y: number; z: number } {
    const node = this.sceneModel.nodes.find((n) => n.id === nodeId);
    return node?.transform.scale ?? { x: 1, y: 1, z: 1 };
  }

  /**
   * 为元素启用拖拽功能
   */
  private enableDrag(object: Container): void {
    if (!this.app) return;

    let isDragging = false;
    let hasMoved = false;
    let dragStartPoint: { x: number; y: number } | null = null;
    let objectStartPosition: { x: number; y: number } | null = null;

    object.on("pointerdown", (e: FederatedPointerEvent) => {
      if (this.transformer?.isDraggingObject()) {
        return;
      }

      e.stopPropagation();
      isDragging = true;
      hasMoved = false;
      dragStartPoint = { x: e.globalX, y: e.globalY };
      objectStartPosition = { x: object.x, y: object.y };
      object.cursor = "move";
    });

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !dragStartPoint || !objectStartPosition) return;

      const rect = this.app!.canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaX = currentX - dragStartPoint.x;
      const deltaY = currentY - dragStartPoint.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 3) {
        if (!hasMoved) {
          hasMoved = true;
          this.isDraggingElement = true;
        }

        const scale = this.contentContainer?.scale.x ?? 1;
        object.x = objectStartPosition.x + deltaX / scale;
        object.y = objectStartPosition.y + deltaY / scale;

        if (this.selector?.selected === object) {
          this.transformer?.updateControls();
          this.selector.refreshBoundingBox();
        }
      }
    };

    const onPointerUp = () => {
      if (isDragging) {
        if (!hasMoved) {
          this.selector?.select(object);
        } else {
          const nodeId = this.getNodeIdFromDisplayObject(object);
          if (nodeId && objectStartPosition) {
            if (
              object.x !== objectStartPosition.x ||
              object.y !== objectStartPosition.y
            ) {
              const originalY = this.getNodeOriginalY(nodeId);
              this.emitSceneChange({
                type: "transform",
                nodeId,
                changes: {
                  transform: {
                    position: { x: object.x, y: originalY, z: object.y },
                  },
                },
              });
            }
          }
        }

        isDragging = false;
        hasMoved = false;
        this.isDraggingElement = false;
        dragStartPoint = null;
        objectStartPosition = null;
        object.cursor = "pointer";

        if (this.selector?.selected === object) {
          this.selector.refreshBoundingBox();
        }
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

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
    window.addEventListener("keyup", this.onKeyUp);

    this.app.stage.on("pointerdown", this.onPointerDown);
    this.app.stage.on("pointerup", this.onPointerUp);
    this.app.stage.on("dblclick", this.onDoubleClick);

    this.app.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.app.canvas.addEventListener("pointerdown", this.onCanvasPointerDown);
    this.app.canvas.addEventListener("pointermove", this.onCanvasPointerMove);
    this.app.canvas.addEventListener("pointerup", this.onCanvasPointerUp);
    this.app.canvas.addEventListener("pointerleave", this.onCanvasPointerUp);

    this.app.canvas.addEventListener("pointerenter", this.onCanvasPointerEnter);
    this.app.canvas.addEventListener("pointerleave", this.onCanvasPointerLeave);
  }

  /**
   * 窗口大小变化处理
   */
  private onResize = (): void => {
    if (!this.app) return;
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 键盘按下事件
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent()) return;

    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 空格键 - 启用画布拖拽模式
    if (code === "space" && !this.isSpacePressed) {
      this.isSpacePressed = true;
      if (this.app?.canvas) {
        this.app.canvas.style.cursor = "grab";
      }
      event.preventDefault();
      return;
    }

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
   * 键盘释放事件
   */
  private onKeyUp = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent()) return;

    const code = event.code.toLowerCase();

    if (code === "space") {
      this.isSpacePressed = false;
      this.isPanningCanvas = false;
      if (this.app?.canvas) {
        this.app.canvas.style.cursor = "default";
      }
    }
  };

  /**
   * 鼠标滚轮事件 - 缩放画布
   */
  private onWheel = (event: WheelEvent): void => {
    if (!this.contentContainer || !this.app) return;

    event.preventDefault();

    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const currentScale = this.contentContainer.scale.x;
    let newScale = currentScale * zoomFactor;
    newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));

    if (newScale === currentScale) return;

    const worldPosBefore = {
      x: (mouseX - this.contentContainer.x) / currentScale,
      y: (mouseY - this.contentContainer.y) / currentScale,
    };

    this.contentContainer.scale.set(newScale, newScale);

    const worldPosAfter = {
      x: (mouseX - this.contentContainer.x) / newScale,
      y: (mouseY - this.contentContainer.y) / newScale,
    };

    this.contentContainer.x += (worldPosAfter.x - worldPosBefore.x) * newScale;
    this.contentContainer.y += (worldPosAfter.y - worldPosBefore.y) * newScale;

    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 画布指针按下 - 开始拖拽画布
   */
  private onCanvasPointerDown = (event: PointerEvent): void => {
    if (event.button === 1 || (event.button === 0 && this.isSpacePressed)) {
      this.isPanningCanvas = true;
      this.panStartPosition = { x: event.clientX, y: event.clientY };
      this.panStartCanvasPosition = {
        x: this.contentContainer?.x ?? 0,
        y: this.contentContainer?.y ?? 0,
      };
      if (this.app?.canvas) {
        this.app.canvas.style.cursor = "grabbing";
      }
      event.preventDefault();
    }
  };

  /**
   * 画布指针移动 - 拖拽画布
   */
  private onCanvasPointerMove = (event: PointerEvent): void => {
    if (!this.isPanningCanvas || !this.contentContainer) return;

    const deltaX = event.clientX - this.panStartPosition.x;
    const deltaY = event.clientY - this.panStartPosition.y;

    this.contentContainer.x = this.panStartCanvasPosition.x + deltaX;
    this.contentContainer.y = this.panStartCanvasPosition.y + deltaY;

    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 画布指针释放 - 结束拖拽画布
   */
  private onCanvasPointerUp = (): void => {
    if (this.isPanningCanvas) {
      this.isPanningCanvas = false;
      if (this.app?.canvas) {
        this.app.canvas.style.cursor = this.isSpacePressed ? "grab" : "default";
      }
    }
  };

  /**
   * 获取鼠标位置
   */
  private getPointerPosition(event: FederatedPointerEvent): { x: number; y: number } {
    return { x: event.global.x, y: event.global.y };
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

    if (this.isDraggingElement) {
      return;
    }

    const dx = this.pointerUpPosition.x - this.pointerDownPosition.x;
    const dy = this.pointerUpPosition.y - this.pointerDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      if (!this.transformer?.isDraggingObject()) {
        const selected = this.selector?.selectByPoint(
          this.pointerUpPosition.x,
          this.pointerUpPosition.y
        );
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
    const bounds = object.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    console.log(`Focus on object at (${centerX}, ${centerY})`);
  }

  // ============ 公共 API ============

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

  // ============ 画布缩放和平移 API ============

  getZoom(): number {
    return this.contentContainer?.scale.x ?? 1;
  }

  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    if (!this.contentContainer || !this.app) return;

    const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    const currentScale = this.contentContainer.scale.x;

    if (newScale === currentScale) return;

    const cx = centerX ?? this.app.canvas.width / 2;
    const cy = centerY ?? this.app.canvas.height / 2;

    const worldPosBefore = {
      x: (cx - this.contentContainer.x) / currentScale,
      y: (cy - this.contentContainer.y) / currentScale,
    };

    this.contentContainer.scale.set(newScale, newScale);

    const worldPosAfter = {
      x: (cx - this.contentContainer.x) / newScale,
      y: (cy - this.contentContainer.y) / newScale,
    };

    this.contentContainer.x += (worldPosAfter.x - worldPosBefore.x) * newScale;
    this.contentContainer.y += (worldPosAfter.y - worldPosBefore.y) * newScale;

    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.getZoom() * factor);
  }

  zoomOut(factor: number = 0.8): void {
    this.setZoom(this.getZoom() * factor);
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  /**
   * 将屏幕坐标转换为世界坐标
   */
  screenToWorldPosition(screenX: number, screenY: number): { x: number; y: number; z: number } {
    if (!this.contentContainer) {
      return { x: screenX, y: 0, z: screenY };
    }

    const scale = this.contentContainer.scale.x;
    const panX = this.contentContainer.x;
    const panY = this.contentContainer.y;

    const worldX = (screenX - panX) / scale;
    const worldZ = (screenY - panY) / scale;

    return { x: worldX, y: 0, z: worldZ };
  }

  getPan(): { x: number; y: number } {
    return {
      x: this.contentContainer?.x ?? 0,
      y: this.contentContainer?.y ?? 0,
    };
  }

  setPan(x: number, y: number): void {
    if (!this.contentContainer) return;

    this.contentContainer.x = x;
    this.contentContainer.y = y;

    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  resetPan(): void {
    this.setPan(0, 0);
  }

  resetView(): void {
    this.resetZoom();
    this.resetPan();
  }

  fitToView(padding: number = 50): void {
    if (!this.contentContainer || !this.app) return;

    const bounds = this.contentContainer.getLocalBounds();
    if (bounds.width === 0 || bounds.height === 0) return;

    const canvasWidth = this.app.canvas.width;
    const canvasHeight = this.app.canvas.height;

    const scaleX = (canvasWidth - padding * 2) / bounds.width;
    const scaleY = (canvasHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, this.maxZoom);
    const clampedScale = Math.max(this.minZoom, scale);

    this.contentContainer.scale.set(clampedScale, clampedScale);

    const scaledWidth = bounds.width * clampedScale;
    const scaledHeight = bounds.height * clampedScale;
    this.contentContainer.x = (canvasWidth - scaledWidth) / 2 - bounds.x * clampedScale;
    this.contentContainer.y = (canvasHeight - scaledHeight) / 2 - bounds.y * clampedScale;

    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  // ============ 视口状态保存/恢复 ============

  getViewportState(): ViewportState2D {
    return {
      pan: this.getPan(),
      zoom: this.getZoom(),
    };
  }

  async setViewportState(state: ViewportState2D): Promise<void> {
    await this.ready();

    if (state.pan) {
      this.setPan(state.pan.x, state.pan.y);
    }
    if (state.zoom !== undefined) {
      this.setZoom(state.zoom);
    }
  }

  /**
   * 销毁 Pixi2D 实例
   */
  dispose(): void {
    // 移除事件监听
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);

    // 销毁选择器和变换器
    this.selector?.dispose();
    this.transformer?.dispose();

    if (this.app) {
      this.app.canvas.removeEventListener("wheel", this.onWheel);
      this.app.canvas.removeEventListener("pointerdown", this.onCanvasPointerDown);
      this.app.canvas.removeEventListener("pointermove", this.onCanvasPointerMove);
      this.app.canvas.removeEventListener("pointerup", this.onCanvasPointerUp);
      this.app.canvas.removeEventListener("pointerleave", this.onCanvasPointerUp);
      this.app.canvas.removeEventListener("pointerenter", this.onCanvasPointerEnter);
      this.app.canvas.removeEventListener("pointerleave", this.onCanvasPointerLeave);

      if (this.app.canvas && this.app.canvas.parentNode) {
        this.app.canvas.parentNode.removeChild(this.app.canvas);
      }
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }

    this.contentContainer = null;

    // 调用基类清理
    this.disposeBase();
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
export { Pixi2DOptions, TransformMode2D, TransformChangeEvent2D } from "./types";
