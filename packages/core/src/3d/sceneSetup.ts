import {
  Scene,
  Color,
  GridHelper,
  AxesHelper,
  AmbientLight,
  DirectionalLight,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
} from "three";
import { DEFAULT_COLORS } from "../shared/constants";

export interface SceneSetupOptions {
  backgroundColor?: number | string;
  gridSize?: number;
  gridDivisions?: number;
  showAxes?: boolean;
  axesSize?: number;
  showFloor?: boolean;
  floorColor?: number | string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

const defaultOptions: SceneSetupOptions = {
  backgroundColor: DEFAULT_COLORS.BACKGROUND_3D,
  gridSize: 10,
  gridDivisions: 20,
  showAxes: true,
  axesSize: 2,
  showFloor: true,
  floorColor: DEFAULT_COLORS.FLOOR,
  ambientLightIntensity: 0.5,
  directionalLightIntensity: 0.8,
};

/**
 * 场景初始化 - 设置背景、网格、坐标轴和灯光
 */
export function setupScene(
  scene: Scene,
  options: SceneSetupOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };

  // 设置背景色
  scene.background = new Color(opts.backgroundColor);

  // 添加网格辅助线
  const gridHelper = new GridHelper(
    opts.gridSize!,
    opts.gridDivisions!,
    DEFAULT_COLORS.GRID,
    DEFAULT_COLORS.GRID_SECONDARY
  );
  scene.add(gridHelper);

  // 添加坐标轴辅助
  if (opts.showAxes) {
    const axesHelper = new AxesHelper(opts.axesSize);
    scene.add(axesHelper);
  }

  // 添加地板
  if (opts.showFloor) {
    const floorGeometry = new PlaneGeometry(opts.gridSize!, opts.gridSize!);
    const floorMaterial = new MeshStandardMaterial({
      color: new Color(opts.floorColor),
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // 旋转到水平面
    floor.position.y = -0.001; // 略低于网格，避免 z-fighting
    floor.receiveShadow = true;
    floor.name = "__floor__";
    scene.add(floor);
  }

  // 添加环境光
  const ambientLight = new AmbientLight(0xffffff, opts.ambientLightIntensity);
  scene.add(ambientLight);

  // 添加平行光（带阴影）
  const directionalLight = new DirectionalLight(
    0xffffff,
    opts.directionalLightIntensity
  );
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  // 配置阴影
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);
}

