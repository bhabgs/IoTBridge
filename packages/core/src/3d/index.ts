import { Scene, PerspectiveCamera, WebGLRenderer, Vector3 } from "three";
// @ts-ignore - Three.js examples don't have proper type declarations
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneModel } from "../types";
import { Three3DOptions } from "./types";
import { nodeFactory } from "./nodeFactory";
import { setupScene } from "./sceneSetup";

/**
 * Three3D - 3D 编辑器核心类（仅加载节点）
 */
export class Three3D {
  container: HTMLElement;
  sceneModel: SceneModel;
  scene: Scene = new Scene();
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  orbitControls: InstanceType<typeof OrbitControls>;
  animationId: number | null = null;

  // 键盘控制
  private keys = new Set<string>();
  private moveSpeed = 0.05; // 移动速度（世界单位）

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
    this.orbitControls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
