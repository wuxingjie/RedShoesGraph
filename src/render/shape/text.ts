import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";

export interface TextOptions extends ShapeOptions {
  text?: string;
  direction?: string;
  textDecoration?: string;
  align?: string;
  verticalAlign?: string;
  padding?: number;
  lineHeight?: number;
  letterSpacing?: number;
  wrap?: string;
  ellipsis?: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  fontVariant?: string;
  fontWeight?: string;
  textFill?: string;
  textStroke?: string;
  textStrokeWidth?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export class Text extends Shape<TextOptions> {
  constructor(options?: TextOptions) {
    super(options);
  }

  override applyPath(context: Context2D): void | Path2D {
    return undefined;
  }
}
