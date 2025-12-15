import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Vector2, Object3D, Box3, Raycaster, Plane } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneModel, SceneNode, SceneChangeEvent, SceneChangeCallback, SceneNodeChanges, ViewportState3D } from "../types";
import { Three3DOptions } from "./types";
import { nodeFactory } from "./nodeFactory";
import { setupScene } from "./sceneSetup";
import { Selector, SelectionChangeCallback } from "./selector";
import { Transformer, TransformMode, TransformSpace, TransformChangeEvent } from "./transformer";

/** 像素到世界单位的转换比例：100px = 1 world unit */
const SCALE = 0.01;

/** 将世界单位转换回像素值 */
function toPixelUnit(worldUnit: number): number {
  return worldUnit / SCALE;
}

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
  private rotateSpeed = 0.003; // 鼠标旋转速度（弧度/像素）
  private keyRotateSpeed = 0.02; // 键盘旋转速度（弧度/帧）

  // 指针状态
  private pointerDownPosition = { x: 0, y: 0 };
  private pointerUpPosition = { x: 0, y: 0 };

  // 鼠标右键拖拽旋转相关
  private isRightMouseDown = false;
  private lastMousePosition = { x: 0, y: 0 };

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
    // 启用阴影
    this.renderer.shadowMap.enabled = true;
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
        // 将世界单位转换回像素单位（position 需要转换，rotation 是弧度转角度，scale 不需要转换）
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
   * 根据 Object3D 获取节点 ID
   */
  private getNodeId(object: Object3D): string | null {
    return object.userData?.nodeId ?? null;
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
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("dblclick", this.onDoubleClick);

    // 禁用右键菜单
    this.renderer.domElement.addEventListener("contextmenu", this.onContextMenu);
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

    // 处理方向键（视角旋转）
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      this.keys.add(key);
      event.preventDefault();
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

    // 处理方向键
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      this.keys.delete(key);
    }
  };

  /**
   * 处理键盘移动
   */
  private handleKeyboardMovement() {
    if (this.keys.size === 0) return;

    // 处理方向键视角旋转
    this.handleArrowKeyRotation();

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
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("dblclick", this.onDoubleClick);
    this.renderer.domElement.removeEventListener("contextmenu", this.onContextMenu);
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
    // 右键按下 - 开始视角旋转
    if (event.button === 2) {
      this.isRightMouseDown = true;
      this.lastMousePosition.x = event.clientX;
      this.lastMousePosition.y = event.clientY;
      // 禁用 OrbitControls 避免冲突
      this.orbitControls.enabled = false;
      return;
    }

    // 左键点击 - 用于选择
    if (event.button !== 0) return;

    const pos = this.getPointerPosition(event);
    this.pointerDownPosition.x = pos.x;
    this.pointerDownPosition.y = pos.y;
  };

  /**
   * 指针释放事件
   */
  private onPointerUp = (event: PointerEvent): void => {
    // 右键释放
    if (event.button === 2) {
      this.isRightMouseDown = false;
      // 重新启用 OrbitControls
      this.orbitControls.enabled = true;
      return;
    }

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
   * 指针移动事件 - 用于右键拖拽旋转视角
   */
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isRightMouseDown) return;

    const deltaX = event.clientX - this.lastMousePosition.x;
    const deltaY = event.clientY - this.lastMousePosition.y;

    this.lastMousePosition.x = event.clientX;
    this.lastMousePosition.y = event.clientY;

    // 围绕目标点旋转相机
    this.rotateCamera(-deltaX * this.rotateSpeed, -deltaY * this.rotateSpeed);
  };

  /**
   * 禁用右键菜单
   */
  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  /**
   * 旋转相机视角
   * @param deltaYaw 水平旋转角度（弧度）
   * @param deltaPitch 垂直旋转角度（弧度）
   */
  private rotateCamera(deltaYaw: number, deltaPitch: number): void {
    // 获取相机到目标点的向量
    const offset = new Vector3();
    offset.copy(this.camera.position).sub(this.orbitControls.target);

    // 转换为球坐标
    const spherical = { radius: 0, theta: 0, phi: 0 };
    spherical.radius = offset.length();
    spherical.theta = Math.atan2(offset.x, offset.z); // 水平角度
    spherical.phi = Math.acos(Math.min(1, Math.max(-1, offset.y / spherical.radius))); // 垂直角度

    // 应用旋转
    spherical.theta += deltaYaw;
    spherical.phi += deltaPitch;

    // 限制垂直角度，防止翻转
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    // 转换回笛卡尔坐标
    offset.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    offset.y = spherical.radius * Math.cos(spherical.phi);
    offset.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

    // 更新相机位置
    this.camera.position.copy(this.orbitControls.target).add(offset);
    this.camera.lookAt(this.orbitControls.target);
  }

  /**
   * 处理方向键旋转视角
   */
  private handleArrowKeyRotation(): void {
    let deltaYaw = 0;
    let deltaPitch = 0;

    // 左箭头 - 向左旋转
    if (this.keys.has("arrowleft")) {
      deltaYaw = this.keyRotateSpeed;
    }
    // 右箭头 - 向右旋转
    if (this.keys.has("arrowright")) {
      deltaYaw = -this.keyRotateSpeed;
    }
    // 上箭头 - 向上旋转
    if (this.keys.has("arrowup")) {
      deltaPitch = -this.keyRotateSpeed;
    }
    // 下箭头 - 向下旋转
    if (this.keys.has("arrowdown")) {
      deltaPitch = this.keyRotateSpeed;
    }

    if (deltaYaw !== 0 || deltaPitch !== 0) {
      this.rotateCamera(deltaYaw, deltaPitch);
    }
  }

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

  // ============ 视口状态保存/恢复 ============

  /**
   * 获取当前视口状态
   * 用于在切换模式前保存状态
   */
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

  /**
   * 设置视口状态
   * 用于在切换模式后恢复状态
   */
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
    // 更新控制器
    this.orbitControls.update();
  }

  // ============ 节点管理方法 ============

  /**
   * 将屏幕坐标转换为世界坐标（在地面 y=0 平面上）
   * 通过射线投射计算鼠标指向的地面位置
   * @param screenX 屏幕 X 坐标（相对于容器）
   * @param screenY 屏幕 Y 坐标（相对于容器）
   * @returns 世界坐标（像素单位）
   */
  screenToWorldPosition(screenX: number, screenY: number): { x: number; y: number; z: number } {
    const rect = this.container.getBoundingClientRect();

    // 将屏幕坐标转换为归一化设备坐标 (-1 到 1)
    const ndcX = (screenX / rect.width) * 2 - 1;
    const ndcY = -(screenY / rect.height) * 2 + 1;

    // 创建射线
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(ndcX, ndcY), this.camera);

    // 定义地面平面 (y = 0)
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0);

    // 计算射线与地面的交点
    const intersection = new Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

    if (!hit) {
      // 如果射线没有命中地面（相机朝上时），返回默认位置
      return { x: 0, y: 0, z: 0 };
    }

    // 将 Three.js 世界单位转换为像素单位
    return {
      x: intersection.x / SCALE,
      y: 0,
      z: intersection.z / SCALE,
    };
  }

  /**
   * 获取当前选中的节点 ID
   */
  getSelectedNodeId(): string | null {
    const selected = this.selector.selected;
    if (!selected) return null;
    return selected.userData?.nodeId ?? null;
  }

  /**
   * 通过节点 ID 选中节点
   */
  selectNodeById(nodeId: string | null): void {
    if (!nodeId) {
      this.selector.deselect();
      return;
    }
    this.selector.selectByNodeId(nodeId);
  }

  /**
   * 根据节点 ID 查找 Object3D
   */
  private findObjectByNodeId(nodeId: string): Object3D | null {
    let found: Object3D | null = null;
    this.scene.traverse((object) => {
      if (object.userData?.nodeId === nodeId) {
        found = object;
      }
    });
    return found;
  }

  /**
   * 获取节点数据
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
   * 添加节点到场景
   * @param node 节点数据
   * @returns 添加的节点 ID
   */
  addNode(node: SceneNode): string {
    // 添加到 sceneModel
    this.sceneModel.nodes.push(node);

    // 创建 3D 对象并添加到场景
    const object = nodeFactory.createObject3D(node);
    if (object) {
      this.scene.add(object);
    }

    // 触发变化事件
    this.emitSceneChange({
      type: "add",
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

    // 从场景中移除 Object3D
    const object = this.findObjectByNodeId(nodeId);
    if (object) {
      // 如果是当前选中的，先取消选择
      if (this.selector.selected === object) {
        this.selector.deselect();
        this.transformer.detach();
      }
      object.parent?.remove(object);
    }

    // 触发变化事件
    this.emitSceneChange({
      type: "remove",
      nodeId: nodeId,
      node: removedNode,
    });

    return true;
  }

  /**
   * 更新节点属性
   */
  updateNode(nodeId: string, updates: Partial<SceneNode>): boolean {
    const node = this.sceneModel.nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // 深度合并更新到 sceneModel 中的节点
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

    // 更新 3D 对象
    const object = this.findObjectByNodeId(nodeId);
    if (object) {
      // 检查是否需要重新创建对象（geometry、material、style 变化时需要重建）
      const needsRebuild = updates.geometry || updates.material || updates.style;

      if (needsRebuild) {
        // 保存当前状态
        const wasSelected = this.selector.selected === object;
        const parent = object.parent;

        // 移除旧对象
        if (parent) {
          parent.remove(object);
        }

        // 创建新对象
        const newObject = nodeFactory.createObject3D(node);
        if (newObject && parent) {
          parent.add(newObject);

          // 恢复选中状态
          if (wasSelected) {
            this.selector.select(newObject);
            this.transformer.attach(newObject);
          }
        }
      } else {
        // 只更新 transform
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
        if (this.selector.selected === object) {
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
      type: "transform",
      nodeId: nodeId,
      node: node,
      changes: changes,
    });

    return true;
  }
}
