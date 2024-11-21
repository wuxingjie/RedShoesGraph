export type MatrixValues = [number, number, number, number, number, number];

export class Transformer {
  private a: number; // scaleX
  private b: number; // shearXY
  private c: number; // shearYX
  private d: number; // scaleY
  private e: number; // translateX
  private f: number; // translateY

  constructor(matrix?: MatrixValues) {
    // 初始化为单位矩阵
    this.a = matrix?.[0] ?? 1;
    this.b = matrix?.[1] ?? 0;
    this.c = matrix?.[2] ?? 0;
    this.d = matrix?.[3] ?? 1;
    this.e = matrix?.[4] ?? 0;
    this.f = matrix?.[5] ?? 0;
  }

  // 平移
  translate(tx: number, ty: number): this {
    this.e += tx;
    this.f += ty;
    return this;
  }

  translateX(tx: number): this {
    this.e += tx;
    return this;
  }

  translateY(ty: number): this {
    this.f += ty;
    return this;
  }

  // 旋转(弧度)
  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const a = this.a * cos - this.b * sin;
    const b = this.a * sin + this.b * cos;
    const c = this.c * cos - this.d * sin;
    const d = this.c * sin + this.d * cos;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return this;
  }

  // 缩放
  scale(sx: number, sy: number): this {
    this.a *= sx;
    this.d *= sy;
    return this;
  }

  // 倾斜(弧度)
  skew(sx: number, sy: number): this {
    const a = this.a + this.b * sy;
    const b = this.a * sx + this.b;
    const c = this.c + this.d * sy;
    const d = this.c * sx + this.d;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return this;
  }

  multiply(other: Transformer): this {
    const a = this.a * other.a + this.b * other.c;
    const b = this.a * other.b + this.b * other.d;
    const c = this.c * other.a + this.d * other.c;
    const d = this.c * other.b + this.d * other.d;
    const e = this.e + other.e;
    const f = this.f + other.f;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;

    return this;
  }

  copy(): Transformer {
    return new Transformer([this.a, this.b, this.c, this.d, this.e, this.f]);
  }

  reset(): this {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }

  // 获取最终的变换矩阵的6个值
  getMatrixValues(): MatrixValues {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }
}
