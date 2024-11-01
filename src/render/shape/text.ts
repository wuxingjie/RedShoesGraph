import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";
import { computed } from "../../utils/observable.ts";

const defaultFontSize = 12;

export interface TextOptions
  extends ShapeOptions,
    Partial<Omit<CanvasTextDrawingStyles, "font">> {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontVariant?: string;
  fontWeight?: string;
  fontStretch?: CanvasFontStretch;
  lineHeight?: number;
  textDecoration?: "line-through" | "underline" | "overline";
  verticalAlign?: "top" | "bottom" | "middle";
  padding?: number;
  wrap?: string;
  ellipsis?: boolean;
}

/**
 * 参考
 * @see
 * {@link https://developer.mozilla.org/zh-CN/docs/Web/CSS/font} font 属性
 * {@link https://erikonarheim.com/posts/canvas-text-metrics/} 文本测量
 */
export class Text extends Shape<TextOptions> {
  // see https://developer.mozilla.org/zh-CN/docs/Web/CSS/font
  private _font = computed(() => {
    const fontSize = this.getOption("fontSize") ?? defaultFontSize,
      fontFamily = this.getOption("fontFamily") ?? "caption",
      fontStyle = this.getOption("fontStyle") ?? "normal",
      fontVariant = this.getOption("fontVariant") ?? "normal",
      fontWeight = this.getOption("fontWeight") ?? "normal",
      fontStretch = this.getOption("fontStretch") ?? "normal",
      lineHeight = this.getOption("lineHeight") ?? "normal";

    return `${fontStretch} ${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px/${lineHeight} ${fontFamily}`;
  });

  constructor(options?: TextOptions) {
    super(options);
  }

  override applyContext(context: Context2D): void | Path2D {
    context.apply((ctx) => {
      const x = this.x() ?? 0,
        y = this.y() ?? 0,
        width = this.width(),
        height = this.height();

      ctx.font = this._font.value;

      const direction = this.getOption("direction");
      if (direction) {
        ctx.direction = direction;
      }

      const fontKerning = this.getOption("fontKerning");
      if (fontKerning) {
        ctx.fontKerning = fontKerning;
      }

      const fontStretch = this.getOption("fontStretch");
      if (fontStretch) {
        ctx.fontStretch = fontStretch;
      }

      const fontVariantCaps = this.getOption("fontVariantCaps");
      if (fontVariantCaps) {
        ctx.fontVariantCaps = fontVariantCaps;
      }

      const letterSpacing = this.getOption("letterSpacing");
      if (letterSpacing) {
        ctx.letterSpacing = letterSpacing;
      }

      const textAlign = this.getOption("textAlign");
      if (textAlign) {
        ctx.textAlign = textAlign;
      }

      const textBaseline = this.getOption("textBaseline");
      if (textBaseline) {
        ctx.textBaseline = textBaseline;
      }

      const textRendering = this.getOption("textRendering");
      if (textRendering) {
        ctx.textRendering = textRendering;
      }

      const wordSpacing = this.getOption("wordSpacing");
      if (wordSpacing) {
        ctx.wordSpacing = wordSpacing;
      }

      // 绘制文本装饰, 下划线之类的
      const textDecoration = this.getOption("textDecoration");
      const textMetrics = ctx.measureText(this.text()!);
      const textWidth =
        Math.abs(textMetrics.actualBoundingBoxLeft) +
        Math.abs(textMetrics.actualBoundingBoxRight);
      /*const textHeight =
        textMetrics.actualBoundingBoxAscent +
        textMetrics.actualBoundingBoxDescent;*/
      if (textDecoration) {
        /*const bounds = {
          top: y - textMetrics.actualBoundingBoxAscent,
          right: x + textMetrics.actualBoundingBoxRight,
          bottom: y + textMetrics.actualBoundingBoxDescent,
          left: x - textMetrics.actualBoundingBoxLeft
        };*/

        const actualY =
          textDecoration === "underline"
            ? y + textMetrics.actualBoundingBoxDescent
            : textDecoration === "line-through"
              ? y -
                textMetrics.actualBoundingBoxAscent +
                (textMetrics.actualBoundingBoxAscent +
                  textMetrics.actualBoundingBoxDescent) /
                  2
              : textDecoration === "overline"
                ? y - textMetrics.actualBoundingBoxAscent
                : y;
        ctx.beginPath();
        ctx.moveTo(x, actualY); // 起始点（x, y）
        ctx.lineTo(x + textWidth, actualY); // 终点（x + 文本宽度, y）
        ctx.stroke();
      }

      /*
        文本横向对齐 "center" | "end" | "left" | "right" | "start";
        start：文本的起始点在指定的 x 坐标上，具体行为依赖于文本的方向（如从左到右或从右到左）。
        end：文本的结束点在指定的 x 坐标上，同样依赖于文本的方向。
       */
      const actualWidth = width ?? textWidth;
      if (textAlign) {
        if (textAlign === "center") {
          ctx.translate(actualWidth / 2, 0);
        } else if (textAlign === "right") {
          ctx.translate(actualWidth, 0);
        } else if (textAlign === "left") {
          ctx.translate(0, 0);
        } else if (textAlign === "end") {
          ctx.translate(actualWidth, 0);
        } else if (textAlign === "start") {
          ctx.translate(0, 0);
        }
      }
    });
  }

  override remove() {
    super.remove();
    this._font.destroy();
  }

  protected doFill(context: Context2D, _?: Path2D): void | Path2D {
    context.apply((nativeContext) => {
      const text = this.text();
      nativeContext.fillText(text!, this.x()!, this.y()!);
    });
  }

  protected doStoke(context: Context2D, _?: Path2D): void | Path2D {
    context.apply((nativeContext) => {
      const text = this.text();
      nativeContext.strokeText(text!, this.x()!, this.y()!);
    });
  }

  hasFill(): boolean {
    return super.hasFill() && !!this.text();
  }

  hasStroke(): boolean {
    return super.hasStroke() && !!this.text();
  }

  text(): TextOptions["text"];
  text(key: TextOptions["text"]): this;
  text(key?: TextOptions["text"]): TextOptions["text"] | this {
    if (key === undefined) return this.getOption("text");
    this.setOption("text", key);
    return this;
  }
}
