import { Shape, ShapeOptions } from "./shape.ts";
import { Context2D } from "../canvas.ts";
import { computed } from "../../utils/observable.ts";
import { last } from "../../utils/array.ts";

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
  wrap?: "anywhere" | "break-word";
  ellipsis?: boolean;
}

type LinesToDraw = {
  line: string;
  translateY: number;
  textMetrics: TextMetrics;
}[];
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

  private applyTextStyle(ctx: CanvasRenderingContext2D) {
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
  }

  override applyContext(context: Context2D): void | Path2D {
    const text = this.text();
    if (text === undefined) {
      return;
    }
    context
      .apply((nativeCtx) => this.applyTextStyle(nativeCtx))
      .apply((ctx) => {
        const width = this.width(),
          height = this.height();

        const verticalAlign = this.getOption("verticalAlign");
        if (verticalAlign && height) {
          switch (verticalAlign) {
            case "middle": {
              ctx.translate(0, height >> 1);
              break;
            }
            case "bottom": {
              ctx.translate(0, height);
              break;
            }
            case "top":
            default: {
              ctx.translate(0, 0);
            }
          }
        }

        const fixedWidth = width !== undefined;
        if (fixedWidth) {
          const maxWidth = width;
          const lines = text.split("\n");
          const linesToDraw: LinesToDraw = [];
          let currentTotalHeight = 0;

          for (let line of lines) {
            let textMetrics = measureText(ctx, line);
            let [lineWidth, lineHeight] = getTextWidthHeight(textMetrics);
            if (lineWidth > maxWidth) {
              while (line.length > 0) {
                let low = 0,
                  high = line.length,
                  match = "";
                //matchWidth = 0;
                while (low < high) {
                  const mid = (low + high) >> 1;
                  const subStr = line.slice(0, mid + 1);
                  textMetrics = measureText(ctx, subStr);
                  const subStrWidth = getTextWidth(textMetrics);
                  if (subStrWidth <= maxWidth) {
                    low = mid + 1;
                    match = subStr;
                    //matchWidth = subStrWidth;
                  } else {
                    high = mid;
                  }
                }
                if (match) {
                  addLineToDraw(
                    linesToDraw,
                    match,
                    currentTotalHeight,
                    textMetrics,
                  );
                  currentTotalHeight += lineHeight;
                  if (
                    this._shouldHandleEllipsis(currentTotalHeight, lineHeight)
                  ) {
                    this._tryToAddEllipsisToLastLine(linesToDraw, ctx);
                    break;
                  }
                  line = line.slice(low);
                  if (line.length > 0) {
                    textMetrics = measureText(ctx, line);
                    [lineWidth, lineHeight] = getTextWidthHeight(textMetrics);
                    if (lineWidth <= maxWidth) {
                      addLineToDraw(
                        linesToDraw,
                        line,
                        currentTotalHeight,
                        textMetrics,
                      );
                      currentTotalHeight += lineHeight;
                      break;
                    }
                  }
                } else {
                  break;
                }
              }
            } else {
              addLineToDraw(linesToDraw, line, currentTotalHeight, textMetrics);
              currentTotalHeight += lineHeight;
              if (this._shouldHandleEllipsis(currentTotalHeight, lineHeight)) {
                this._tryToAddEllipsisToLastLine(linesToDraw, ctx);
                break;
              }
            }
          } // end line loop
          linesToDraw.forEach((line) => this._fillAndStroke(context, line));
        } else {
          this._fillAndStroke(context, {
            line: text,
            translateY: 0,
            textMetrics: measureText(ctx, text),
          });
        }
      });
  }
  private _shouldHandleEllipsis(
    currentTotalHeight: number,
    lineHeight: number,
  ) {
    const maxHeight = this.height();
    const wrap = this.getOption("wrap");
    return (
      maxHeight !== undefined &&
      wrap !== undefined &&
      currentTotalHeight + lineHeight > maxHeight
    );
  }

  private _tryToAddEllipsisToLastLine(
    lines: LinesToDraw,
    ctx: CanvasRenderingContext2D,
  ) {
    const maxWidth = this.width()!;
    let lastLine = last(lines);
    let lastLineText = lastLine?.line;
    if (lastLine && lastLineText) {
      const haveSpace =
        getTextWidth(measureText(ctx, lastLineText + "...")) < maxWidth;
      if (haveSpace) {
        lastLineText += "...";
      } else {
        lastLineText = lastLineText.slice(0, lastLineText.length - 3) + "...";
      }
      lastLine.line = lastLineText;
    }
  }

  private _fillAndStroke(context: Context2D, line: LinesToDraw[0]): void {
    context.apply((ctx) => {
      const x = this.x() ?? 0,
        y = this.y()! + line.translateY;
      if (this.fillStyle()) {
        ctx.fillText(line.line, x, y);
      }
      if (this.strokeStyle()) {
        ctx.strokeText(line.line, x, y);
      }
      // 绘制文本装饰, 下划线之类的
      const textDecoration = this.getOption("textDecoration");

      if (textDecoration) {
        /*const textHeight =
     textMetrics.actualBoundingBoxAscent +
     textMetrics.actualBoundingBoxDescent;*/
        /*const bounds = {
        top: y - textMetrics.actualBoundingBoxAscent,
        right: x + textMetrics.actualBoundingBoxRight,
        bottom: y + textMetrics.actualBoundingBoxDescent,
        left: x - textMetrics.actualBoundingBoxLeft
      };*/
        const textMetrics = line.textMetrics;
        const textWidth =
          Math.abs(textMetrics.actualBoundingBoxLeft) +
          Math.abs(textMetrics.actualBoundingBoxRight);
        const actualY =
          textDecoration === "underline"
            ? y + textMetrics.actualBoundingBoxDescent
            : textDecoration === "line-through"
              ? y -
                textMetrics.actualBoundingBoxAscent +
                ((textMetrics.actualBoundingBoxAscent +
                  textMetrics.actualBoundingBoxDescent) >>
                  1)
              : textDecoration === "overline"
                ? y - textMetrics.actualBoundingBoxAscent
                : y;
        ctx.beginPath();
        ctx.moveTo(x, actualY); // 起始点（x, y）
        ctx.lineTo(x + textWidth, actualY); // 终点（x + 文本宽度, y）
        ctx.stroke();
      }
    });
  }

  override remove() {
    super.remove();
    this._font.destroy();
  }

  protected override doFill(_: Context2D, __?: Path2D): void | Path2D {}

  protected override doStoke(_: Context2D, __?: Path2D): void | Path2D {}

  override hasFill(): boolean {
    return false;
  }

  override hasStroke(): boolean {
    return false;
  }

  text(): TextOptions["text"];
  text(key: TextOptions["text"]): this;
  text(key?: TextOptions["text"]): TextOptions["text"] | this {
    if (key === undefined) return this.getOption("text");
    this.setOption("text", key);
    return this;
  }
} // end class

function measureText(ctx: CanvasRenderingContext2D, text: string) {
  return ctx.measureText(text);
}

function getTextWidthHeight(textMetrics: TextMetrics): [number, number] {
  return [
    getTextWidth(textMetrics),
    textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent,
  ];
}

function getTextWidth(textMetrics: TextMetrics): number {
  return textMetrics.width;
  /*return [
    Math.abs(textMetrics.actualBoundingBoxLeft) +
      Math.abs(textMetrics.actualBoundingBoxRight),
  ];*/
}

function addLineToDraw(
  lines: LinesToDraw,
  line: string,
  translateY: number,
  textMetrics: TextMetrics,
) {
  lines.push({
    line: line,
    translateY: translateY,
    textMetrics,
  });
}
