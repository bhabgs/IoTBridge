import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  AmbientLight,
  DirectionalLight,
} from "three";
import { SceneModel } from "../types";

export class Three3D {
  container: HTMLElement;
  sceneModel: SceneModel;
  scene: Scene = new Scene();
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  animationId: number | null = null;

  constructor({
    container,
    sceneModel,
  }: {
    container: HTMLElement;
    sceneModel: SceneModel;
  }) {
    this.container = container;
    this.sceneModel = sceneModel;

    // 创建相机
    const { clientWidth, clientHeight } = container;
    this.camera = new PerspectiveCamera(
      75,
      clientWidth / clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(200, 200, 200);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.init();
    this.animate();
    this.bindEvents();
  }

  init() {
    // 添加环境光
    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // 添加平行光
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);

    // 创建示例立方体
    const geometry = new BoxGeometry(100, 100, 100);
    const material = new MeshBasicMaterial({
      color: 0xff0000,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(0, 10, 0);
    this.scene.add(mesh);
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  bindEvents() {
    window.addEventListener("resize", this.onResize);
  }

  onResize = () => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
