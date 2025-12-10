import { Application, Graphics } from "pixi.js";
import { SceneModel } from "../types";

export class Pixi2D {
  app: Application | null = null;
  container: HTMLElement;
  sceneModel: SceneModel;
  constructor({
    container,
    sceneModel,
  }: {
    container: HTMLElement;
    sceneModel: SceneModel;
  }) {
    this.container = container;
    this.sceneModel = sceneModel;

    this.init();
  }
  init() {
    this.app = new Application({});
    console.log(this.container.clientWidth);
    this.app
      .init({
        width: this.container.clientWidth,
        height: this.container.clientHeight,
        background: "#1099bb",
        resizeTo: window,
      })
      .then(() => {
        this.container.appendChild(this.app!.canvas);
        this.loadNodes();
      })
      .catch((err) => {
        console.error(err);
      });
  }
  loadNodes() {
    console.log(this.sceneModel.nodes);
    const graphics = new Graphics();

    // Rectangle
    for (const node of this.sceneModel.nodes) {
      graphics.rect(
        node.transform.position.x,
        node.transform.position.y,
        node.geometry?.width || 0,
        node.geometry?.height || 0
      );
      graphics.fill(0xde3249);
      this.app!.stage.addChild(graphics);
    }
  }
}
