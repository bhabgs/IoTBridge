import {
  Scene,
  Color,
  GridHelper,
  AxesHelper,
  AmbientLight,
  DirectionalLight,
} from "three";

export interface SceneSetupOptions {
  backgroundColor?: number | string;
  gridSize?: number;
  gridDivisions?: number;
  showAxes?: boolean;
  axesSize?: number;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

const defaultOptions: SceneSetupOptions = {
  backgroundColor: 0xf0f0f0,
  gridSize: 1000,
  gridDivisions: 20,
  showAxes: true,
  axesSize: 200,
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
    0x888888,
    0xcccccc
  );
  scene.add(gridHelper);

  // 添加坐标轴辅助
  if (opts.showAxes) {
    const axesHelper = new AxesHelper(opts.axesSize);
    scene.add(axesHelper);
  }

  // 添加环境光
  const ambientLight = new AmbientLight(0xffffff, opts.ambientLightIntensity);
  scene.add(ambientLight);

  // 添加平行光
  const directionalLight = new DirectionalLight(
    0xffffff,
    opts.directionalLightIntensity
  );
  directionalLight.position.set(100, 100, 100);
  scene.add(directionalLight);
}

