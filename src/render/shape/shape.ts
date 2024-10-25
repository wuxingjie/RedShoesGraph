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
      ctx.fillStrokeShape(this);
    }
    return this;
  }

  abstract applyPath(context: Context2D): void | Path2D;

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
