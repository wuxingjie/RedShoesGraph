import { Group } from "./group.ts";
import { Shape } from "./shape/shape.ts";
import { Container, ContainerOptions } from "./container.ts";
import { Canvas } from "./canvas.ts";

export interface LayerOptions extends ContainerOptions {
  clearBeforeDraw?: boolean;
}

export class Layer extends Container<LayerOptions, Group | Shape> {
  readonly canvas: Canvas = new Canvas(0, 0);
  private _waitingForDraw: boolean = false;

  constructor(options?: LayerOptions) {
    super({
      clearBeforeDraw: options?.clearBeforeDraw ?? true,
      ...options,
    });
  }

  override getLayer(): Layer | undefined {
    return this;
  }

  override setSize(width: number, height: number) {
    super.setSize(width, height);
    this.canvas.setSize(width, height);
  }

  batchDraw(): this {
    if (!this._waitingForDraw) {
      this._waitingForDraw = true;
      requestAnimationFrame(() => {
        if (this.clearBeforeDraw()) {
          this.canvas.ctx.clearRect();
        }
        this.draw();
        this._waitingForDraw = false;
      });
    }
    return this;
  }

  clearBeforeDraw(): LayerOptions["clearBeforeDraw"];
  clearBeforeDraw(key: LayerOptions["clearBeforeDraw"]): this;
  clearBeforeDraw(
    key?: LayerOptions["clearBeforeDraw"],
  ): LayerOptions["clearBeforeDraw"] | this {
    if (key === undefined) return this.getOption("clearBeforeDraw");
    this.setOption("clearBeforeDraw", key);
    return this;
  }
}
