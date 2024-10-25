import { Layer } from "./layer.ts";
import { Container, ContainerOptions } from "./container.ts";
import { forEachIterable, toIterable } from "../utils/iterable.ts";
import { isString } from "../utils/typeCheck.ts";

export interface StageOptions extends ContainerOptions {
  container: HTMLDivElement | string;
}

export class Stage extends Container<StageOptions, Layer> {
  private container: HTMLDivElement;
  constructor(options: StageOptions) {
    super(options);
    this.container = isString(options.container)
      ? (document.getElementById(options.container) as HTMLDivElement)
      : options.container;
  }

  override getLayer(): Layer | undefined {
    return undefined;
  }

  override getStage(): Stage | undefined {
    return this;
  }

  override add(els: Iterable<Layer> | Layer) {
    forEachIterable(toIterable(els), (layer) => {
      layer.setSize(this.width()!, this.height()!);
      layer.parent = this;
      super.add(layer);
      this.container.append(layer.canvas.canvasElement);
    });
  }
}
