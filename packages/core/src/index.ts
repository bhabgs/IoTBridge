import { Application } from "pixi.js";
import * as THREE from "three";
import { SceneModel } from "./types";
import { Pixi2D } from "./2d";
import { Three3D } from "./3d";

// 导出选择和编辑相关类型
export { Selector, SelectionChangeCallback, SelectorOptions } from "./3d/selector";
export { Transformer, TransformMode, TransformSpace, TransformChangeEvent, TransformerOptions } from "./3d/transformer";
export { Three3D } from "./3d";
export { Pixi2D } from "./2d";

class IndustrialConfigSDK {
  sceneModel: SceneModel = {
    id: "1",
    version: "1.0.0",
    sceneMode: "3d",
    nodes: [
      // 两个矩形
      {
        id: "1",
        type: "rect",
        transform: {
          position: { x: 0, y: 50, z: 0 },
        },
        geometry: {
          width: 100,
          height: 100,
          depth: 100,
        },
        material: {
          color: "yellow",
        },
      },
      {
        id: "2",
        type: "rect",
        transform: {
          position: { x: 150, y: 50, z: 0 },
        },
        geometry: {
          width: 100,
          height: 100,
          depth: 100,
        },
        material: {
          color: "green",
        },
      },
      // {
      //   id: "3",
      //   type: "rect",
      //   transform: {
      //     position: { x: 200, y: 50, z: 0 },
      //   },
      //   geometry: {
      //     width: 100,
      //     height: 100,
      //     depth: 100,
      //   },
      //   material: {
      //     color: "red",
      //   },
      // },
    ],
    assets: {},
    symbols: [],
    meta: {},
  };
  container: HTMLElement;
  target: Pixi2D | Three3D | THREE.Scene | Application | null = null;
  constructor({
    container,
    sceneModel,
  }: {
    container: HTMLElement;
    sceneModel?: SceneModel;
  }) {
    this.container = container;
    this.sceneModel = sceneModel || this.sceneModel;
    this.init();
  }

  init() {
    if (!this.container) {
      throw new Error("Container is required");
    }

    if (this.sceneModel.sceneMode === "2d") {
      this.target = new Pixi2D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
    }

    if (this.sceneModel.sceneMode === "3d") {
      this.target = new Three3D({
        container: this.container,
        sceneModel: this.sceneModel,
      });
    }
    this.loadNodes();
  }

  loadNodes() {
    if (this.sceneModel.sceneMode === "2d") {
      // 2d 场景加载节点
    } else {
      // 3d 场景加载节点
    }
  }

  switchSceneMode(sceneMode: "2d" | "3d") {
    if (this.sceneModel.sceneMode === sceneMode) {
      return;
    }
    this.sceneModel.sceneMode = sceneMode;
    this.init();
  }
}

export default IndustrialConfigSDK;
