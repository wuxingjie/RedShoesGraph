import { Rect } from "../commonTypes.ts";
import { Shape } from "./shape/shape.ts";

export class Canvas {
  private readonly _canvasEl: HTMLCanvasElement;
  private readonly _ctx: Context2D;

  constructor(width: number, height: number) {
    this._canvasEl = document.createElement("canvas");
    this._ctx = new Context2D(this._canvasEl.getContext("2d")!);
    this.setSize(width, height);
  }

  get canvasElement(): HTMLCanvasElement {
    return this._canvasEl;
  }

  get ctx(): Context2D {
    return this._ctx;
  }

  setSize(width: number, height: number) {
    this._canvasEl.width = width;
    this._canvasEl.height = height;
    this._canvasEl.style.width = width + "px";
    this._canvasEl.style.height = height + "px";
  }
}

export type NativeContext2DCallback<T> = (
  nativeCtx: CanvasRenderingContext2D,
) => T;

export class Context2D {
  constructor(private ctx: CanvasRenderingContext2D) {}

  static clearRect(rect?: Rect): NativeContext2DCallback<void> {
    return (ctx) => {
      if (rect) {
        const { x, y, width, height } = rect;
        ctx.clearRect(x, y, width, height);
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    };
  }

  static statesIsolation(
    fn: NativeContext2DCallback<void>,
  ): NativeContext2DCallback<void> {
    return (ctx) => {
      ctx.save();
      fn(ctx);
      ctx.restore();
    };
  }

  static path(
    fn: NativeContext2DCallback<void>,
    closePath: boolean = false,
  ): NativeContext2DCallback<void> {
    return (ctx) => {
      ctx.beginPath();
      fn(ctx);
      if (closePath) {
        ctx.closePath();
      }
    };
  }

  static applyShape(shape: Shape): NativeContext2DCallback<void> {
    return (ctx) => {
      const fillStyle = shape.fillStyle(),
        strokeStyle = shape.strokeStyle(),
        lineWidth = shape.lineWidth();
      if (fillStyle) ctx.fillStyle = fillStyle;
      if (strokeStyle) ctx.strokeStyle = strokeStyle;
      if (lineWidth) ctx.lineWidth = lineWidth;
      const matrixValues = shape.getAbsoluteTransform().getMatrixValues();
      ctx.setTransform(
        matrixValues[0],
        matrixValues[1],
        matrixValues[2],
        matrixValues[3],
        matrixValues[4],
        matrixValues[5],
      );
    };
  }

  static measureText(str: string): NativeContext2DCallback<TextMetrics> {
    return (ctx) => ctx.measureText(str);
  }

  apply(fn: NativeContext2DCallback<void>): this {
    fn(this.ctx);
    return this;
  }

  call<T>(fn: NativeContext2DCallback<T>): T {
    return fn(this.ctx);
  }
}
