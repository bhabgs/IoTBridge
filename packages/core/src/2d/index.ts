import { Application, Container, FederatedPointerEvent } from "pixi.js";
import { SceneModel, SceneChangeEvent, SceneChangeCallback, SceneNodeChanges } from "../types";
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

  /** 内容容器（用于缩放和平移） */
  contentContainer: Container | null = null;

  /** 选择器 */
  selector: Selector2D | null = null;
  /** 变换器 */
  transformer: Transformer2D | null = null;

  /** 指针状态 */
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };
  /** 是否正在拖拽元素 */
  private isDraggingElement = false;
  /** 拖拽开始位置（用于检测是否发生移动） */
  private dragStartObjectPosition: { x: number; y: number } | null = null;

  /** 画布拖拽状态 */
  private isPanningCanvas = false;
  private panStartPosition = { x: 0, y: 0 };
  private panStartCanvasPosition = { x: 0, y: 0 };
  /** 是否按住空格键 */
  private isSpacePressed = false;

  /** 缩放限制 */
  private minZoom = 0.1;
  private maxZoom = 10;

  /** 场景数据变化回调 */
  private sceneChangeCallbacks: SceneChangeCallback[] = [];

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

    // 创建内容容器（用于缩放和平移）
    this.contentContainer = new Container();
    this.app.stage.addChild(this.contentContainer);

    // 创建选择器（禁用边界框，由变换器显示）
    // 选择器需要知道 contentContainer 来查找可选对象
    this.selector = new Selector2D(this.contentContainer, {
      showBoundingBox: false,
    });

    // 创建变换器（添加到 stage 而不是 contentContainer，以避免缩放影响）
    // 传入 contentContainer 用于坐标转换
    this.transformer = new Transformer2D(this.app.stage, this.app.canvas, {}, this.contentContainer);

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
      // 触发数据变化事件
      const nodeId = this.getNodeId(event.object);
      if (nodeId) {
        // 获取原始节点数据中的 y 值（高度）
        const originalY = this.getNodeOriginalY(nodeId);
        // 2D 坐标映射回 3D：
        // - position: 2D的x -> 3D的x，2D的y -> 3D的z，保持3D的y不变
        // - rotation: 2D的旋转 -> 3D的y轴旋转
        // - scale: 2D的scaleX -> 3D的scaleX，2D的scaleY -> 3D的scaleZ，保持3D的scaleY不变
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
        // 为元素启用拖拽功能
        this.enableDrag(displayObject);
      }
    }
  }

  /**
   * 触发场景数据变化事件
   */
  private emitSceneChange(event: SceneChangeEvent): void {
    // 同步更新 sceneModel
    this.syncNodeToSceneModel(event);
    // 触发回调
    for (const callback of this.sceneChangeCallbacks) {
      callback(event);
    }
  }

  /**
   * 将节点变化同步到 sceneModel
   */
  private syncNodeToSceneModel(event: SceneChangeEvent): void {
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
   * 根据 DisplayObject 获取节点 ID
   */
  private getNodeId(object: Container): string | null {
    return (object as any).nodeId ?? null;
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

        // 获取 contentContainer 的缩放比例
        const scale = this.contentContainer?.scale.x ?? 1;

        // 更新对象位置（需要将屏幕坐标的 delta 转换为内容坐标系的 delta）
        object.x = objectStartPosition.x + deltaX / scale;
        object.y = objectStartPosition.y + deltaY / scale;

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
        } else {
          // 拖拽结束，触发数据变化事件
          const nodeId = this.getNodeId(object);
          if (nodeId && objectStartPosition) {
            // 只有位置真正发生变化才触发
            if (
              object.x !== objectStartPosition.x ||
              object.y !== objectStartPosition.y
            ) {
              // 获取原始节点数据中的 y 值（高度）
              const originalY = this.getNodeOriginalY(nodeId);
              // 2D 坐标映射回 3D：2D的x -> 3D的x，2D的y -> 3D的z，保持3D的y不变
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
    window.addEventListener("keyup", this.onKeyUp);

    // 指针事件
    this.app.stage.on("pointerdown", this.onPointerDown);
    this.app.stage.on("pointerup", this.onPointerUp);
    this.app.stage.on("dblclick", this.onDoubleClick);

    // 画布缩放和拖拽事件
    this.app.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.app.canvas.addEventListener("pointerdown", this.onCanvasPointerDown);
    this.app.canvas.addEventListener("pointermove", this.onCanvasPointerMove);
    this.app.canvas.addEventListener("pointerup", this.onCanvasPointerUp);
    this.app.canvas.addEventListener("pointerleave", this.onCanvasPointerUp);
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
    const code = event.code.toLowerCase();

    // 空格键释放 - 禁用画布拖拽模式
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

    // 计算缩放因子
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const currentScale = this.contentContainer.scale.x;
    let newScale = currentScale * zoomFactor;

    // 限制缩放范围
    newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));

    if (newScale === currentScale) return;

    // 计算缩放中心点（鼠标位置）
    const worldPosBefore = {
      x: (mouseX - this.contentContainer.x) / currentScale,
      y: (mouseY - this.contentContainer.y) / currentScale,
    };

    // 应用新缩放
    this.contentContainer.scale.set(newScale, newScale);

    // 调整位置以保持鼠标位置不变
    const worldPosAfter = {
      x: (mouseX - this.contentContainer.x) / newScale,
      y: (mouseY - this.contentContainer.y) / newScale,
    };

    this.contentContainer.x += (worldPosAfter.x - worldPosBefore.x) * newScale;
    this.contentContainer.y += (worldPosAfter.y - worldPosBefore.y) * newScale;

    // 更新选择器和变换器
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 画布指针按下 - 开始拖拽画布
   */
  private onCanvasPointerDown = (event: PointerEvent): void => {
    // 中键拖拽或空格+左键拖拽
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

    // 更新选择器和变换器
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  };

  /**
   * 画布指针释放 - 结束拖拽画布
   */
  private onCanvasPointerUp = (event: PointerEvent): void => {
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
   * 添加场景数据变化监听
   * 当画布中的节点发生变化时（位置、旋转、缩放等），会触发此回调
   */
  onSceneChange(callback: SceneChangeCallback): void {
    this.sceneChangeCallbacks.push(callback);
  }

  /**
   * 移除场景数据变化监听
   */
  offSceneChange(callback: SceneChangeCallback): void {
    const index = this.sceneChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.sceneChangeCallbacks.splice(index, 1);
    }
  }

  // ============ 画布缩放和平移 API ============

  /**
   * 获取当前缩放级别
   */
  getZoom(): number {
    return this.contentContainer?.scale.x ?? 1;
  }

  /**
   * 设置缩放级别
   * @param zoom 缩放级别 (0.1 - 10)
   * @param centerX 缩放中心 X（可选，默认为画布中心）
   * @param centerY 缩放中心 Y（可选，默认为画布中心）
   */
  setZoom(zoom: number, centerX?: number, centerY?: number): void {
    if (!this.contentContainer || !this.app) return;

    const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    const currentScale = this.contentContainer.scale.x;

    if (newScale === currentScale) return;

    // 默认以画布中心为缩放中心
    const cx = centerX ?? this.app.canvas.width / 2;
    const cy = centerY ?? this.app.canvas.height / 2;

    // 计算缩放中心点
    const worldPosBefore = {
      x: (cx - this.contentContainer.x) / currentScale,
      y: (cy - this.contentContainer.y) / currentScale,
    };

    // 应用新缩放
    this.contentContainer.scale.set(newScale, newScale);

    // 调整位置以保持中心点不变
    const worldPosAfter = {
      x: (cx - this.contentContainer.x) / newScale,
      y: (cy - this.contentContainer.y) / newScale,
    };

    this.contentContainer.x += (worldPosAfter.x - worldPosBefore.x) * newScale;
    this.contentContainer.y += (worldPosAfter.y - worldPosBefore.y) * newScale;

    // 更新选择器和变换器
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  /**
   * 放大
   * @param factor 放大因子，默认 1.2
   */
  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.getZoom() * factor);
  }

  /**
   * 缩小
   * @param factor 缩小因子，默认 0.8
   */
  zoomOut(factor: number = 0.8): void {
    this.setZoom(this.getZoom() * factor);
  }

  /**
   * 重置缩放到 100%
   */
  resetZoom(): void {
    this.setZoom(1);
  }

  /**
   * 获取画布平移位置
   */
  getPan(): { x: number; y: number } {
    return {
      x: this.contentContainer?.x ?? 0,
      y: this.contentContainer?.y ?? 0,
    };
  }

  /**
   * 设置画布平移位置
   */
  setPan(x: number, y: number): void {
    if (!this.contentContainer) return;

    this.contentContainer.x = x;
    this.contentContainer.y = y;

    // 更新选择器和变换器
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
    }
  }

  /**
   * 重置画布位置到原点
   */
  resetPan(): void {
    this.setPan(0, 0);
  }

  /**
   * 重置视图（缩放和平移）
   */
  resetView(): void {
    this.resetZoom();
    this.resetPan();
  }

  /**
   * 适应内容到视图
   */
  fitToView(padding: number = 50): void {
    if (!this.contentContainer || !this.app) return;

    // 获取内容边界
    const bounds = this.contentContainer.getLocalBounds();
    if (bounds.width === 0 || bounds.height === 0) return;

    const canvasWidth = this.app.canvas.width;
    const canvasHeight = this.app.canvas.height;

    // 计算适合的缩放级别
    const scaleX = (canvasWidth - padding * 2) / bounds.width;
    const scaleY = (canvasHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, this.maxZoom);
    const clampedScale = Math.max(this.minZoom, scale);

    // 应用缩放
    this.contentContainer.scale.set(clampedScale, clampedScale);

    // 居中内容
    const scaledWidth = bounds.width * clampedScale;
    const scaledHeight = bounds.height * clampedScale;
    this.contentContainer.x = (canvasWidth - scaledWidth) / 2 - bounds.x * clampedScale;
    this.contentContainer.y = (canvasHeight - scaledHeight) / 2 - bounds.y * clampedScale;

    // 更新选择器和变换器
    if (this.selector?.selected) {
      this.selector.refreshBoundingBox();
      this.transformer?.updateControls();
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

    // 清理回调
    this.sceneChangeCallbacks = [];

    // 销毁选择器和变换器
    this.selector?.dispose();
    this.transformer?.dispose();

    if (this.app) {
      // 移除画布事件
      this.app.canvas.removeEventListener("wheel", this.onWheel);
      this.app.canvas.removeEventListener("pointerdown", this.onCanvasPointerDown);
      this.app.canvas.removeEventListener("pointermove", this.onCanvasPointerMove);
      this.app.canvas.removeEventListener("pointerup", this.onCanvasPointerUp);
      this.app.canvas.removeEventListener("pointerleave", this.onCanvasPointerUp);

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

    this.contentContainer = null;
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
