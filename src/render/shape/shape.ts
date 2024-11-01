import { Node, NodeOptions } from "../node.ts";
import { Context2D } from "../canvas.ts";

export interface ShapeOptions extends NodeOptions {
  zIndex?: number;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
}

/**
 * @see https://paulbourke.net/geometry/pointlineplane/
 */
export abstract class Shape<
  Options extends ShapeOptions = ShapeOptions,
> extends Node<Options> {
  protected constructor(opts?: Options) {
    super(opts);
  }

  override draw(): this {
    const ctx = this.getLayer()?.canvas.ctx;
    if (ctx) {
      ctx
        .apply((nativeCtx) => {
          nativeCtx.save();
          nativeCtx.beginPath();
        })
        .apply(Context2D.applyShape(this))
        .apply(() => {
          const path = this.applyContext(ctx);
          if (this.hasFill()) {
            this.doFill(ctx, path || undefined);
          }
          if (this.hasStroke()) {
            this.doStoke(ctx, path || undefined);
          }
        })
        .apply((nativeCtx) => nativeCtx.restore());
    }
    return this;
  }

  abstract applyContext(context: Context2D): void | Path2D;

  protected doFill(context: Context2D, path?: Path2D): void | Path2D {
    context.apply((ctx) => {
      if (path) {
        ctx.fill(path);
      } else {
        ctx.fill();
      }
    });
  }

  protected doStoke(context: Context2D, path?: Path2D): void | Path2D {
    context.apply((ctx) => {
      if (path) {
        ctx.stroke(path);
      } else {
        ctx.stroke();
      }
    });
  }

  hasFill(): boolean {
    return this.fillStyle() !== undefined;
  }

  hasStroke(): boolean {
    return this.strokeStyle() !== undefined;
  }

  // --------------getter setter--------------
  zIndex(): ShapeOptions["zIndex"];
  zIndex(key: ShapeOptions["zIndex"]): this;
  zIndex(key?: ShapeOptions["zIndex"]): ShapeOptions["zIndex"] | this {
    if (key === undefined) return this.getOption("zIndex");
    this.setOption("zIndex", key);
    return this;
  }

  fillStyle(): ShapeOptions["fillStyle"];
  fillStyle(key: ShapeOptions["fillStyle"]): this;
  fillStyle(key?: ShapeOptions["fillStyle"]): ShapeOptions["fillStyle"] | this {
    if (key === undefined) return this.getOption("fillStyle");
    this.setOption("fillStyle", key);
    return this;
  }

  strokeStyle(): ShapeOptions["strokeStyle"];
  strokeStyle(key: ShapeOptions["strokeStyle"]): this;
  strokeStyle(
    key?: ShapeOptions["strokeStyle"],
  ): ShapeOptions["strokeStyle"] | this {
    if (key === undefined) return this.getOption("strokeStyle");
    this.setOption("strokeStyle", key);
    return this;
  }

  lineWidth(): ShapeOptions["lineWidth"];
  lineWidth(key: ShapeOptions["lineWidth"]): this;
  lineWidth(key?: ShapeOptions["lineWidth"]): ShapeOptions["lineWidth"] | this {
    if (key === undefined) return this.getOption("lineWidth");
    this.setOption("lineWidth", key);
    return this;
  }
}
