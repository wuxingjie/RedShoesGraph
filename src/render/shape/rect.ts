import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";

export interface RectOptions extends ShapeOptions {
  cornerRadius?: number; // use https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/roundRect
}

export class Rect extends Shape<RectOptions> {
  constructor(options?: RectOptions) {
    super(options);
  }

  override applyContext(context: Context2D): void | Path2D {
    context.apply((ctx) => {
      ctx.roundRect(
        this.x()!,
        this.y()!,
        this.width()!,
        this.height()!,
        this.getOption("cornerRadius"),
      );
    });
  }
}
