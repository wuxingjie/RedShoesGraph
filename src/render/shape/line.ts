import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";

export interface LineOptions extends ShapeOptions {
  points?: number[];
  closed?: boolean;
}

export class Line<
  Options extends LineOptions = LineOptions,
> extends Shape<Options> {
  constructor(options?: Options) {
    super(options);
  }

  override applyContext(ctx: Context2D): void | Path2D {
    ctx
      .apply((nativeCtx) => {
        const points = this.getOption("points") ?? [];
        if (points.length % 2 !== 0) {
          throw new Error("points must be even");
        }
        if (points.length >= 4) {
          nativeCtx.moveTo(points[0], points[1]);
          for (let i = 2; i < points.length; i += 2) {
            nativeCtx.lineTo(points[i], points[i + 1]);
          }
        }
      })
      .apply((nativeCtx) => {
        if (this.getOption("closed")) {
          nativeCtx.closePath();
        }
      });
  }
}
