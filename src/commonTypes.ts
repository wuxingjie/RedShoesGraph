export interface XY {
  x: number;
  y: number;
}

export interface WH {
  width: number;
  height: number;
}

export interface Rect extends XY, WH {}
