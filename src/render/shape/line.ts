import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";

export interface LineOptions extends ShapeOptions {
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
}

export class Line extends Shape {
  private x1: number;
  private x2: number;
  private y1: number;
  private y2: number;

  constructor(options?: LineOptions) {
    super(options);
    this.x1 = options?.x1 ?? 0;
    this.x2 = options?.x2 ?? 0;
    this.y1 = options?.y1 ?? 0;
    this.y2 = options?.y2 ?? 0;
  }

  override applyPath(_: Context2D): void | Path2D {
    const path = new Path2D();
    path.moveTo(this.x1, this.y1);
    path.lineTo(this.x2, this.y2);
    return path;
  }
}
