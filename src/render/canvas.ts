import { Shape } from "./shape/shape.ts";
import { Rect } from "../commonTypes.ts";

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

export class Context2D {
  constructor(private ctx: CanvasRenderingContext2D) {}

  clearRect(rect?: Rect): Context2D {
    if (rect) {
      const { x, y, width, height } = rect;
      this.ctx.clearRect(x, y, width, height);
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    return this;
  }

  rect(x: number, y: number, width: number, height: number): Context2D {
    this.ctx.rect(x, y, width, height);
    return this;
  }

  moveTo(x: number, y: number): Context2D {
    this.ctx.moveTo(x, y);
    return this;
  }

  lineTo(x: number, y: number): Context2D {
    this.ctx.lineTo(x, y);
    return this;
  }

  arcTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
  ): Context2D {
    this.ctx.arcTo(x1, y1, x2, y2, radius);
    return this;
  }

  translate(x: number, y: number): Context2D {
    this.ctx.translate(x, y);
    return this;
  }

  save(): Context2D {
    this.ctx.save();
    return this;
  }

  restore(): Context2D {
    this.ctx.restore();
    return this;
  }

  beginPath(): Context2D {
    this.ctx.beginPath();
    return this;
  }

  closePath(): Context2D {
    this.ctx.closePath();
    return this;
  }

  fillStrokeShape(shape: Shape) {
    this.ctx.save();
    this.ctx.beginPath();
    if (shape.fillStyle()) {
      this.ctx.fillStyle = shape.fillStyle()!;
      const path = shape.applyPath(this);
      if (path) {
        this.ctx.fill(path);
      }
      this.ctx.fill();
    }
    if (shape.strokeStyle()) {
      this.ctx.strokeStyle = shape.strokeStyle()!;
      const path = shape.applyPath(this);
      if (path) {
        this.ctx.stroke(path);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
