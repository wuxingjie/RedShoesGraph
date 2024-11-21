export interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export class Color implements RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static from(colorString: string): Color {
    colorString = colorString.trim().toLowerCase();

    if (colorString.startsWith("#")) {
      return Color.parseHex(colorString);
    } else if (colorString.startsWith("rgb")) {
      return Color.parseRgb(colorString);
    } else if (colorString.startsWith("hsl")) {
      return Color.parseHsl(colorString);
    } else {
      return Color.parseNamedColor(colorString);
    }
  }

  static parseHex(hex: string): Color {
    let r: number, g: number, b: number, a: number;
    if (hex.length === 4 || hex.length === 5) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
      if (hex.length === 5) {
        a = parseInt(hex[4] + hex[4], 16) / 255;
      } else {
        a = 1;
      }
      return new Color(r, g, b, a);
    } else if (hex.length === 7 || hex.length === 9) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
      if (hex.length === 9) {
        a = parseInt(hex.substring(7, 9), 16) / 255;
      } else {
        a = 1;
      }
      return new Color(r, g, b, a);
    }
    return black;
  }

  static parseRgb(rgb: string): Color {
    const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d?.?\d+)?\)/;
    const result = rgbaRegex.exec(rgb);

    if (result) {
      let r = parseInt(result[1]);
      let g = parseInt(result[2]);
      let b = parseInt(result[3]);
      let a = result[4] !== undefined ? parseFloat(result[4]) : 1;
      return new Color(r, g, b, a);
    }
    return black;
  }

  static parseHsl(hsl: string): Color {
    const hslaRegex = /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,?\s*(\d?.?\d+)?\)/;
    const result = hslaRegex.exec(hsl);

    if (result) {
      const h = parseInt(result[1]);
      const s = parseInt(result[2]) / 100;
      const l = parseInt(result[3]) / 100;
      const a = result[4] !== undefined ? parseFloat(result[4]) : 1;
      const { r, g, b } = Color.hslToRgb(h, s, l);
      return new Color(r, g, b, a);
    }
    return black;
  }

  static hslToRgb(
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  static parseNamedColor(colorName: string): Color {
    const colors: { [key: string]: string } = {
      red: "#ff0000",
      green: "#008000",
      blue: "#0000ff",
      white: "#ffffff",
      black: "#000000",
      // 可添加更多预定义颜色
    };

    if (colors[colorName]) {
      return Color.parseHex(colors[colorName]);
    }
    throw new Error("unknown color name: " + colorName);
  }

  // 获取 RGBA 格式
  toRGBA(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  // 获取 RGB 格式
  toRGB(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  // 获取 HEX 格式
  toHex(): string {
    const rHex = this.r.toString(16).padStart(2, "0");
    const gHex = this.g.toString(16).padStart(2, "0");
    const bHex = this.b.toString(16).padStart(2, "0");
    const aHex =
      this.a < 1
        ? Math.round(this.a * 255)
            .toString(16)
            .padStart(2, "0")
        : "";
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }

  // 获取 HSL 格式
  toHSL(): string {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));

      switch (max) {
        case r:
          h = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / delta + 2;
          break;
        case b:
          h = (r - g) / delta + 4;
          break;
      }

      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  // 获取 HSLA 格式
  toHSLA(): string {
    return `${this.toHSL()}${this.a < 1 ? `, ${this.a}` : ""}`;
  }

  valueOf(): string {
    return this.toRGBA();
  }

  toString(): string {
    return this.toRGBA();
  }
}

const black = new Color();
