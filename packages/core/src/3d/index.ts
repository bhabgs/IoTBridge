import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Vector2, Object3D, Box3, Raycaster, Plane } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneNode, ViewportState3D } from "../types";
import { Three3DOptions } from "./types";
import { nodeFactory } from "./nodeFactory";
import { setupScene } from "./sceneSetup";
import { Selector, SelectionChangeCallback } from "./selector";
import { Transformer, TransformMode, TransformSpace, TransformChangeEvent } from "./transformer";
import { BaseRenderer, BaseRendererOptions } from "../shared/BaseRenderer";
import { KeyBindingManager, createKeyBindingManager } from "../shared/KeyBindings";

/** 像素到世界单位的转换比例：100px = 1 world unit */
const SCALE = 0.01;

/** 将世界单位转换回像素值 */
function toPixelUnit(worldUnit: number): number {
  return worldUnit / SCALE;
}

/**
 * Three3D - 3D 编辑器核心类
 * 继承 BaseRenderer 以复用通用逻辑
 */
export class Three3D extends BaseRenderer<Object3D, ViewportState3D, Selector, Transformer> {
  scene: Scene = new Scene();
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  orbitControls: InstanceType<typeof OrbitControls>;
  animationId: number | null = null;

  /** 键盘绑定管理器 */
  private keyBindings: KeyBindingManager;

  // 键盘控制
  private keys = new Set<string>();
  private moveSpeed = 0.05;
  private rotateSpeed = 0.003;
  private keyRotateSpeed = 0.02;

  // 指针状态
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };

  // 鼠标右键拖拽旋转相关
  private isRightMouseDown = false;
  private lastMousePosition = { x: 0, y: 0 };

  constructor(options: Three3DOptions) {
    super(options as BaseRendererOptions);
    this.keyBindings = createKeyBindingManager();

    // 创建相机
    const { clientWidth, clientHeight } = this.container;
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
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 创建轨道控制器
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 50;
    this.orbitControls.enablePan = true;

    // 创建选择器
    this.selector = new Selector(this.scene, this.camera);

    // 创建变换器
    this.transformer = new Transformer(this.camera, this.renderer.domElement);
    this.scene.add(this.transformer.getHelper());

    // 设置选择变化时的处理
    this.selector.onChange((object) => {
      if (object) {
        this.transformer!.attach(object);
      } else {
        this.transformer!.detach();
      }
    });

    // 设置变换时禁用轨道控制器
    this.transformer.onTransformStart(() => {
      this.orbitControls.enabled = false;
    });

    this.transformer.onTransformEnd((event) => {
      this.orbitControls.enabled = true;
      this.selector!.refreshBoundingBox();
      this.handleTransformEnd(event);
    });

    this.transformer.onTransformChange(() => {
      this.selector!.refreshBoundingBox();
    });

    this.init();
    this.animate();
    this.bindEvents();
  }

  // ============ 实现抽象方法 ============

  /**
   * 创建显示对象
   */
  protected createDisplayObject(node: SceneNode): Object3D | null {
    return nodeFactory.createObject3D(node);
  }

  /**
   * 添加显示对象到场景
   */
  protected addDisplayObjectToScene(object: Object3D): void {
    this.scene.add(object);
  }

  /**
   * 从场景移除显示对象
   */
  protected removeDisplayObjectFromScene(object: Object3D): void {
    object.parent?.remove(object);
  }

  /**
   * 更新显示对象的变换
   */
  protected updateDisplayObjectTransform(object: Object3D, updates: Partial<SceneNode>): void {
    if (updates.transform?.position) {
      object.position.set(
        updates.transform.position.x * SCALE,
        updates.transform.position.y * SCALE,
        updates.transform.position.z * SCALE
      );
    }
    if (updates.transform?.rotation) {
      object.rotation.set(
        (updates.transform.rotation.x * Math.PI) / 180,
        (updates.transform.rotation.y * Math.PI) / 180,
        (updates.transform.rotation.z * Math.PI) / 180
      );
    }
    if (updates.transform?.scale) {
      object.scale.set(
        updates.transform.scale.x,
        updates.transform.scale.y,
        updates.transform.scale.z
      );
    }

    // 刷新选择框
    if (this.selector?.selected === object) {
      this.selector.refreshBoundingBox();
    }
  }

  /**
   * 销毁显示对象
   */
  protected destroyDisplayObject(object: Object3D): void {
    // Three.js objects don't have a destroy method, just remove from parent
    object.parent?.remove(object);
  }

  /**
   * 从显示对象获取节点 ID
   */
  protected getNodeIdFromDisplayObject(object: Object3D): string | null {
    return object.userData?.nodeId ?? null;
  }

  /**
   * 初始化场景
   */
  init(): void {
    setupScene(this.scene);
    this.loadNodes();
  }

  /**
   * 加载场景节点
   */
  loadNodes(): void {
    const nodes = this.sceneModel.nodes;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const object = nodeFactory.createObject3D(node);
      if (object) {
        this.scene.add(object);
        // 添加到缓存
        this.cacheDisplayObject(node.id, object);
      }
    }
  }

  /**
   * 处理变换结束
   */
  private handleTransformEnd(event: TransformChangeEvent): void {
    const nodeId = this.getNodeIdFromDisplayObject(event.object);
    if (nodeId) {
      this.emitSceneChange({
        type: "transform",
        nodeId,
        changes: {
          transform: {
            position: event.position
              ? {
                  x: toPixelUnit(event.position.x),
                  y: toPixelUnit(event.position.y),
                  z: toPixelUnit(event.position.z),
                }
              : undefined,
            rotation: event.rotation
              ? {
                  x: (event.rotation.x * 180) / Math.PI,
                  y: (event.rotation.y * 180) / Math.PI,
                  z: (event.rotation.z * 180) / Math.PI,
                }
              : undefined,
            scale: event.scale
              ? { x: event.scale.x, y: event.scale.y, z: event.scale.z }
              : undefined,
          },
        },
      });
    }
  }

  /**
   * 动画循环
   */
  animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.handleKeyboardMovement();
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * 绑定事件
   */
  bindEvents(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("dblclick", this.onDoubleClick);

    this.renderer.domElement.addEventListener("pointerenter", this.onCanvasPointerEnter);
    this.renderer.domElement.addEventListener("pointerleave", this.onCanvasPointerLeave);

    this.renderer.domElement.addEventListener("contextmenu", this.onContextMenu);
  }

  /**
   * 窗口大小变化处理
   */
  onResize = (): void => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  /**
   * 键盘按下事件
   */
  onKeyDown = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent()) return;

    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    // 变换模式快捷键
    if (key === "1") {
      this.transformer?.setMode("translate");
      return;
    }
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

    // 切换变换空间 (X 键)
    if (key === "x") {
      const currentSpace = this.transformer?.getSpace();
      this.transformer?.setSpace(currentSpace === "world" ? "local" : "world");
      return;
    }

    // 处理空格键
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
      event.preventDefault();
    }

    // 处理方向键
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      this.keys.add(key);
      event.preventDefault();
    }
  };

  /**
   * 键盘释放事件
   */
  onKeyUp = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent()) return;

    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();

    if (code === "space") {
      this.keys.delete(" ");
      return;
    }

    if (code === "shiftleft" || code === "shiftright") {
      this.keys.delete("shift");
      return;
    }

    if (["w", "a", "s", "d", "q", "e"].includes(key)) {
      this.keys.delete(key);
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      this.keys.delete(key);
    }
  };

  /**
   * 处理键盘移动
   */
  private handleKeyboardMovement(): void {
    if (this.keys.size === 0) return;

    this.handleArrowKeyRotation();

    const direction = new Vector3();
    this.camera.getWorldDirection(direction);

    const right = new Vector3();
    right.crossVectors(direction, this.camera.up).normalize();

    const up = new Vector3(0, 1, 0);
    const moveVector = new Vector3(0, 0, 0);

    if (this.keys.has("w")) moveVector.add(direction);
    if (this.keys.has("s")) moveVector.sub(direction);
    if (this.keys.has("a")) moveVector.sub(right);
    if (this.keys.has("d")) moveVector.add(right);
    if (this.keys.has("q") || this.keys.has("shift")) moveVector.sub(up);
    if (this.keys.has("e") || this.keys.has(" ")) moveVector.add(up);

    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(this.moveSpeed);
      this.camera.position.add(moveVector);
      this.orbitControls.target.add(moveVector);
    }
  }

  /**
   * 处理方向键旋转视角
   */
  private handleArrowKeyRotation(): void {
    let deltaYaw = 0;
    let deltaPitch = 0;

    if (this.keys.has("arrowleft")) deltaYaw = this.keyRotateSpeed;
    if (this.keys.has("arrowright")) deltaYaw = -this.keyRotateSpeed;
    if (this.keys.has("arrowup")) deltaPitch = -this.keyRotateSpeed;
    if (this.keys.has("arrowdown")) deltaPitch = this.keyRotateSpeed;

    if (deltaYaw !== 0 || deltaPitch !== 0) {
      this.rotateCamera(deltaYaw, deltaPitch);
    }
  }

  /**
   * 旋转相机视角
   */
  private rotateCamera(deltaYaw: number, deltaPitch: number): void {
    const offset = new Vector3();
    offset.copy(this.camera.position).sub(this.orbitControls.target);

    const spherical = { radius: 0, theta: 0, phi: 0 };
    spherical.radius = offset.length();
    spherical.theta = Math.atan2(offset.x, offset.z);
    spherical.phi = Math.acos(Math.min(1, Math.max(-1, offset.y / spherical.radius)));

    spherical.theta += deltaYaw;
    spherical.phi += deltaPitch;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    offset.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    offset.y = spherical.radius * Math.cos(spherical.phi);
    offset.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

    this.camera.position.copy(this.orbitControls.target).add(offset);
    this.camera.lookAt(this.orbitControls.target);
  }

  /**
   * 获取鼠标在容器中的归一化位置
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
    if (event.button === 2) {
      this.isRightMouseDown = true;
      this.lastMousePosition.x = event.clientX;
      this.lastMousePosition.y = event.clientY;
      this.orbitControls.enabled = false;
      return;
    }

    if (event.button !== 0) return;

    const pos = this.getPointerPosition(event);
    this.pointerDownPosition.x = pos.x;
    this.pointerDownPosition.y = pos.y;
  };

  /**
   * 指针释放事件
   */
  private onPointerUp = (event: PointerEvent): void => {
    if (event.button === 2) {
      this.isRightMouseDown = false;
      this.orbitControls.enabled = true;
      return;
    }

    if (event.button !== 0) return;

    const pos = this.getPointerPosition(event);
    this.pointerUpPosition.x = pos.x;
    this.pointerUpPosition.y = pos.y;

    const dx = this.pointerUpPosition.x - this.pointerDownPosition.x;
    const dy = this.pointerUpPosition.y - this.pointerDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.01) {
      if (!this.transformer?.isDraggingObject()) {
        this.selector?.selectByPointer(this.pointerUpPosition);
      }
    }
  };

  /**
   * 指针移动事件
   */
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isRightMouseDown) return;

    const deltaX = event.clientX - this.lastMousePosition.x;
    const deltaY = event.clientY - this.lastMousePosition.y;

    this.lastMousePosition.x = event.clientX;
    this.lastMousePosition.y = event.clientY;

    this.rotateCamera(-deltaX * this.rotateSpeed, -deltaY * this.rotateSpeed);
  };

  /**
   * 禁用右键菜单
   */
  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  /**
   * 双击事件 - 聚焦到对象
   */
  private onDoubleClick = (event: MouseEvent): void => {
    const pos = this.getPointerPosition(event);
    const intersects = this.selector?.getPointerIntersects(pos);

    if (intersects && intersects.length > 0) {
      this.focusOnObject(intersects[0]);
    }
  };

  /**
   * 聚焦到对象
   */
  focusOnObject(object: Object3D): void {
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2 || 2;

    const direction = new Vector3();
    this.camera.getWorldDirection(direction);
    direction.negate().normalize();

    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.orbitControls.target.copy(center);
    this.orbitControls.update();
  }

  // ============ 公共 API ============

  /**
   * 选择对象
   */
  select(object: Object3D | null): void {
    this.selector?.select(object);
  }

  /**
   * 通过节点 ID 选择对象
   */
  selectByNodeId(nodeId: string): Object3D | null {
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
  getSelected(): Object3D | null {
    return this.selector?.selected ?? null;
  }

  /**
   * 设置变换模式
   */
  setTransformMode(mode: TransformMode): void {
    this.transformer?.setMode(mode);
  }

  /**
   * 获取当前变换模式
   */
  getTransformMode(): TransformMode {
    return this.transformer?.getMode() ?? "translate";
  }

  /**
   * 设置变换空间
   */
  setTransformSpace(space: TransformSpace): void {
    this.transformer?.setSpace(space);
  }

  /**
   * 添加选择变化监听
   */
  onSelectionChange(callback: SelectionChangeCallback): void {
    this.selector?.onChange(callback);
  }

  /**
   * 添加变换结束监听
   */
  onTransformEnd(callback: (event: TransformChangeEvent) => void): void {
    this.transformer?.onTransformEnd(callback);
  }

  // ============ 视口状态保存/恢复 ============

  getViewportState(): ViewportState3D {
    return {
      cameraPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      controlsTarget: {
        x: this.orbitControls.target.x,
        y: this.orbitControls.target.y,
        z: this.orbitControls.target.z,
      },
      cameraZoom: this.camera.zoom,
    };
  }

  setViewportState(state: ViewportState3D): void {
    if (state.cameraPosition) {
      this.camera.position.set(
        state.cameraPosition.x,
        state.cameraPosition.y,
        state.cameraPosition.z
      );
    }
    if (state.controlsTarget) {
      this.orbitControls.target.set(
        state.controlsTarget.x,
        state.controlsTarget.y,
        state.controlsTarget.z
      );
    }
    if (state.cameraZoom !== undefined) {
      this.camera.zoom = state.cameraZoom;
      this.camera.updateProjectionMatrix();
    }
    this.orbitControls.update();
  }

  /**
   * 将屏幕坐标转换为世界坐标
   */
  screenToWorldPosition(screenX: number, screenY: number): { x: number; y: number; z: number } {
    const rect = this.container.getBoundingClientRect();

    const ndcX = (screenX / rect.width) * 2 - 1;
    const ndcY = -(screenY / rect.height) * 2 + 1;

    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera);

    const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    const intersection = new Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

    if (!hit) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: intersection.x / SCALE,
      y: 0,
      z: intersection.z / SCALE,
    };
  }

  /**
   * 销毁
   */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("dblclick", this.onDoubleClick);
    this.renderer.domElement.removeEventListener("pointerenter", this.onCanvasPointerEnter);
    this.renderer.domElement.removeEventListener("pointerleave", this.onCanvasPointerLeave);
    this.renderer.domElement.removeEventListener("contextmenu", this.onContextMenu);

    this.selector?.dispose();
    this.transformer?.dispose();
    this.orbitControls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    // 调用基类清理
    this.disposeBase();
  }
}
