import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Object3D, Box3 } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneModel, SceneChangeEvent, SceneChangeCallback } from "../types";
import { Three3DOptions } from "./types";
import { nodeFactory } from "./nodeFactory";
import { setupScene } from "./sceneSetup";
import { Selector, SelectionChangeCallback } from "./selector";
import { Transformer, TransformMode, TransformSpace, TransformChangeEvent } from "./transformer";

/**
 * Three3D - 3D 编辑器核心类
 */
export class Three3D {
  container: HTMLElement;
  sceneModel: SceneModel;
  scene: Scene = new Scene();
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  orbitControls: InstanceType<typeof OrbitControls>;
  animationId: number | null = null;

  /** 选择器 */
  selector: Selector;
  /** 变换器 */
  transformer: Transformer;

  // 键盘控制
  private keys = new Set<string>();
  private moveSpeed = 0.05; // 移动速度（世界单位）

  // 指针状态
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };

  /** 场景数据变化回调 */
  private sceneChangeCallbacks: SceneChangeCallback[] = [];

  constructor(options: Three3DOptions) {
    const { container, sceneModel } = options;
    this.container = container;
    this.sceneModel = sceneModel;

    // 创建相机
    const { clientWidth, clientHeight } = container;
    this.camera = new PerspectiveCamera(
      75,
      clientWidth / clientHeight,
      0.01,
      100
    );
    this.camera.position.set(3, 3, 3);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 创建轨道控制器（支持缩放和旋转）
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls.enableDamping = true; // 启用阻尼，使旋转更平滑
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 0.5; // 最小缩放距离
    this.orbitControls.maxDistance = 50; // 最大缩放距离
    this.orbitControls.enablePan = true; // 启用平移

    // 创建选择器
    this.selector = new Selector(this.scene, this.camera);

    // 创建变换器
    this.transformer = new Transformer(this.camera, this.renderer.domElement);
    this.scene.add(this.transformer.getHelper());

    // 设置选择变化时的处理
    this.selector.onChange((object) => {
      if (object) {
        this.transformer.attach(object);
      } else {
        this.transformer.detach();
      }
    });

    // 设置变换时禁用轨道控制器
    this.transformer.onTransformStart(() => {
      this.orbitControls.enabled = false;
    });

    this.transformer.onTransformEnd((event) => {
      this.orbitControls.enabled = true;
      this.selector.refreshBoundingBox();
      // 触发数据变化事件
      const nodeId = this.getNodeId(event.object);
      if (nodeId) {
        this.emitSceneChange({
          type: "transform",
          nodeId,
          changes: {
            transform: {
              position: event.position
                ? { x: event.position.x, y: event.position.y, z: event.position.z }
                : undefined,
              rotation: event.rotation
                ? { x: event.rotation.x, y: event.rotation.y, z: event.rotation.z }
                : undefined,
              scale: event.scale
                ? { x: event.scale.x, y: event.scale.y, z: event.scale.z }
                : undefined,
            },
          },
        });
      }
    });

    // 变换过程中更新边界框
    this.transformer.onTransformChange(() => {
      this.selector.refreshBoundingBox();
    });

    this.init();
    this.animate();
    this.bindEvents();
  }

  /**
   * 初始化场景
   */
  init() {
    // 设置场景（背景、网格、灯光等）
    setupScene(this.scene);

    // 加载节点
    this.loadNodes();
  }

  /**
   * 加载场景节点
   */
  loadNodes() {
    const nodes = this.sceneModel.nodes;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const object = nodeFactory.createObject3D(node);
      if (object) {
        this.scene.add(object);
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
      node.transform = {
        ...node.transform,
        ...event.changes.transform,
      };
    }
  }

  /**
   * 根据 Object3D 获取节点 ID
   */
  private getNodeId(object: Object3D): string | null {
    return (object as any).nodeId ?? null;
  }

  /**
   * 动画循环
   */
  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.handleKeyboardMovement(); // 处理键盘移动
    this.orbitControls.update(); // 更新控制器
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * 绑定事件
   */
  bindEvents() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    // 指针事件（用于选择）
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    this.renderer.domElement.addEventListener("dblclick", this.onDoubleClick);
  }

  /**
   * 窗口大小变化处理
   */
  onResize = () => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  /**
   * 键盘按下事件
   */
  onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 变换模式快捷键
    // W 键切换移动模式（当不在相机移动状态时）
    if (key === "1") {
      this.transformer.setMode("translate");
      return;
    }
    // E 键切换旋转模式（当不在相机移动状态时）
    if (key === "2") {
      this.transformer.setMode("rotate");
      return;
    }
    // R 键切换缩放模式
    if (key === "3") {
      this.transformer.setMode("scale");
      return;
    }

    // 删除选中对象
    if (key === "delete" || key === "backspace") {
      this.deleteSelected();
      return;
    }

    // 取消选择 (Escape)
    if (key === "escape") {
      this.selector.deselect();
      return;
    }

    // 切换变换空间 (X 键)
    if (key === "x") {
      const currentSpace = this.transformer.getSpace();
      this.transformer.setSpace(currentSpace === "world" ? "local" : "world");
      return;
    }

    // 处理空格键（使用 code 更可靠）
    if (code === "space") {
      this.keys.add(" ");
      event.preventDefault();
      return;
    }

    // 处理 Shift 键
    if (code === "shiftleft" || code === "shiftright") {
      this.keys.add("shift");
      event.preventDefault();
      return;
    }

    // 处理 WASD、QE
    if (["w", "a", "s", "d", "q", "e"].includes(key)) {
      this.keys.add(key);
      event.preventDefault(); // 防止页面滚动
    }
  };

  /**
   * 键盘释放事件
   */
  onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 处理空格键
    if (code === "space") {
      this.keys.delete(" ");
      return;
    }

    // 处理 Shift 键
    if (code === "shiftleft" || code === "shiftright") {
      this.keys.delete("shift");
      return;
    }

    // 处理其他键
    if (["w", "a", "s", "d", "q", "e"].includes(key)) {
      this.keys.delete(key);
    }
  };

  /**
   * 处理键盘移动
   */
  private handleKeyboardMovement() {
    if (this.keys.size === 0) return;

    // 获取相机的前方向（朝向目标的方向）
    const direction = new Vector3();
    this.camera.getWorldDirection(direction);

    // 获取相机的右方向（垂直于前方向和上方向）
    const right = new Vector3();
    right.crossVectors(direction, this.camera.up).normalize();

    // 获取相机的上方向
    const up = new Vector3(0, 1, 0);

    const moveVector = new Vector3(0, 0, 0);

    // W - 向前
    if (this.keys.has("w")) {
      moveVector.add(direction);
    }
    // S - 向后
    if (this.keys.has("s")) {
      moveVector.sub(direction);
    }
    // A - 向左
    if (this.keys.has("a")) {
      moveVector.sub(right);
    }
    // D - 向右
    if (this.keys.has("d")) {
      moveVector.add(right);
    }
    // Q 或 Shift - 向下
    if (this.keys.has("q") || this.keys.has("shift")) {
      moveVector.sub(up);
    }
    // E 或空格 - 向上
    if (this.keys.has("e") || this.keys.has(" ")) {
      moveVector.add(up);
    }

    // 归一化并应用速度
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(this.moveSpeed);
      this.camera.position.add(moveVector);
      // 更新轨道控制器的目标点，保持视角一致
      this.orbitControls.target.add(moveVector);
    }
  }

  /**
   * 销毁
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.renderer.domElement.removeEventListener("dblclick", this.onDoubleClick);
    // 清理回调
    this.sceneChangeCallbacks = [];
    this.selector.dispose();
    this.transformer.dispose();
    this.orbitControls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  // ============ 选择和编辑相关方法 ============

  /**
   * 获取鼠标在容器中的归一化位置 (0-1)
   */
  private getPointerPosition(event: PointerEvent | MouseEvent): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  /**
   * 指针按下事件
   */
  private onPointerDown = (event: PointerEvent): void => {
    // 只处理左键点击
    if (event.button !== 0) return;

    const pos = this.getPointerPosition(event);
    this.pointerDownPosition.x = pos.x;
    this.pointerDownPosition.y = pos.y;
  };

  /**
   * 指针释放事件
   */
  private onPointerUp = (event: PointerEvent): void => {
    // 只处理左键
    if (event.button !== 0) return;

    const pos = this.getPointerPosition(event);
    this.pointerUpPosition.x = pos.x;
    this.pointerUpPosition.y = pos.y;

    // 检查是否是点击（而不是拖拽）
    const dx = this.pointerUpPosition.x - this.pointerDownPosition.x;
    const dy = this.pointerUpPosition.y - this.pointerDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果移动距离很小，认为是点击
    if (distance < 0.01) {
      // 如果正在拖拽变换控制器，不处理选择
      if (!this.transformer.isDraggingObject()) {
        this.selector.selectByPointer(this.pointerUpPosition);
      }
    }
  };

  /**
   * 双击事件 - 聚焦到对象
   */
  private onDoubleClick = (event: MouseEvent): void => {
    const pos = this.getPointerPosition(event);
    const intersects = this.selector.getPointerIntersects(pos);

    if (intersects.length > 0) {
      this.focusOnObject(intersects[0]);
    }
  };

  /**
   * 聚焦到对象
   */
  focusOnObject(object: Object3D): void {
    // 计算对象的包围盒中心和大小
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2 || 2; // 如果大小为0，使用默认距离

    // 设置相机位置
    const direction = new Vector3();
    this.camera.getWorldDirection(direction);
    direction.negate().normalize();

    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.orbitControls.target.copy(center);
    this.orbitControls.update();
  }

  /**
   * 删除选中的对象
   */
  deleteSelected(): void {
    const selected = this.selector.selected;
    if (selected && selected.parent) {
      this.selector.deselect();
      selected.parent.remove(selected);
    }
  }

  /**
   * 选择对象
   */
  select(object: Object3D | null): void {
    this.selector.select(object);
  }

  /**
   * 通过节点 ID 选择对象
   */
  selectByNodeId(nodeId: string): Object3D | null {
    return this.selector.selectByNodeId(nodeId);
  }

  /**
   * 取消选择
   */
  deselect(): void {
    this.selector.deselect();
  }

  /**
   * 获取当前选中的对象
   */
  getSelected(): Object3D | null {
    return this.selector.selected;
  }

  /**
   * 设置变换模式
   */
  setTransformMode(mode: TransformMode): void {
    this.transformer.setMode(mode);
  }

  /**
   * 获取当前变换模式
   */
  getTransformMode(): TransformMode {
    return this.transformer.getMode();
  }

  /**
   * 设置变换空间
   */
  setTransformSpace(space: TransformSpace): void {
    this.transformer.setSpace(space);
  }

  /**
   * 添加选择变化监听
   */
  onSelectionChange(callback: SelectionChangeCallback): void {
    this.selector.onChange(callback);
  }

  /**
   * 添加变换结束监听
   */
  onTransformEnd(callback: (event: TransformChangeEvent) => void): void {
    this.transformer.onTransformEnd(callback);
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
}
