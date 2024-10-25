import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";

export interface RectOptions extends ShapeOptions {
  cornerRadius?: number | number[];
}

export class Rect extends Shape {
  constructor(options?: RectOptions) {
    super(options);
  }

  override applyPath(context: Context2D): void | Path2D {
    context.rect(this.x()!, this.y()!, this.width()!, this.height()!);
    return undefined;
  }
}
