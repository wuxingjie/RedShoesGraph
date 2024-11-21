import { isArrayOfType, isNumeric } from "../utils/typeCheck.ts";
import { Node } from "../render/node.ts";

export interface AxisScale<Domain> {
  (d: Domain): number;
  domain(): Domain[];
  ticks(count?: number): Domain[];
}

export enum Orient {
  Top,
  Bottom,
  Left,
  Right,
}

export class Axis<Domain> extends Node {
  private _scale: AxisScale<Domain>;
  private _orient: Orient;
  private _ticks: number = 10;
  private _tickFormatter: (d: Domain) => string = (d: Domain) => String(d);
  constructor(orient: Orient, scale: AxisScale<Domain>) {
    super();
    this._orient = orient;
    this._scale = scale;
    const domain = scale.domain();
    if (isArrayOfType(domain, isNumeric)) {
      this._tickFormatter = (d: Domain) => String(d); // TODO
    } else if (isArrayOfType(domain, (d) => d instanceof Date)) {
      this._tickFormatter = (d: Domain) => String(d); // TODO
    }
  }

  axisScale(): AxisScale<Domain>;
  axisScale(scale: AxisScale<Domain>): this;
  axisScale(scale?: AxisScale<Domain>): AxisScale<Domain> | this {
    if (scale !== undefined) {
      this._scale = scale;
      return this;
    }
    return this._scale;
  }

  orient(): Orient;
  orient(orient: Orient): this;
  orient(orient?: Orient): Orient | this {
    if (orient !== undefined) {
      this._orient = orient;
      return this;
    }
    return this._orient;
  }

  draw(): this {
    const scale = this._scale;
    const labels = scale.ticks(this._ticks).map(this._tickFormatter);

    return this;
  }
}
