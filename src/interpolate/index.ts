import { constFunc } from "../utils/functional";
import { Stream } from "../utils/stream";
import { isNull, isNumeric, isString } from "../utils/typeCheck";
import { Color, RGBA } from "../utils/color.ts";
import { gamma } from "./color.ts";

export type Interpolator<T> = (t: number) => T;

export type InterpolatorFactory<T, R = T> = (a: T, b: T) => (t: number) => R;

function number(a: number, b: number): Interpolator<number> {
  return (t: number) => {
    return a * (1 - t) + b * t;
  };
}

function numberRound(a: number, b: number): Interpolator<number> {
  const interpolateNumber = number(a, b);
  return (t: number) => {
    return Math.round(interpolateNumber(t));
  };
}

const numRegExp = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
const numRegExpSplit = /([-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?)/g;
function string(a: string, b: string): Interpolator<string> {
  numRegExp.lastIndex = numRegExpSplit.lastIndex = 0;
  const aNumbers = Stream.generate(() => numRegExp.exec(a))
    .takeWhile(isNull)
    .filterNotNull()
    .map((r) => Number(r[0]))
    .toArray();

  let numIndex = 0;
  const tokenFunctions = Stream.from(b.split(numRegExpSplit))
    .map((r) => {
      // number
      if (isNumeric(r) && aNumbers[numIndex] !== undefined) {
        const numInterp = number(aNumbers[numIndex], Number(r));
        numIndex++;
        return numInterp;
      }
      // string
      return constFunc(r);
    })
    .toArray();
  return (t: number) => {
    return tokenFunctions.map((f) => f(t)).join("");
  };
}

/**
 * 注意每次返回的Date为同一对象
 * @param a
 * @param b
 */
function date(a: Date, b: Date): Interpolator<Date> {
  const interp = number(+a, +b);
  const d = new Date();
  return (t: number): Date => {
    d.setTime(interp(t));
    return d;
  };
}

/**
 * 注意每次调用返回的是同一数组对象
 * @param a
 * @param b
 */
function numberArray(a: number[], b: number[]): Interpolator<number[]> {
  let i = 0;
  //  每个元素的插值器函数
  const funcs = Stream.from(b)
    .takeWhile(() => a[i++] === undefined)
    .map((e, i) => number(a[i], e))
    .toArray();
  const res = b.slice();
  return (t: number): number[] => {
    funcs.forEach((f, i) => (res[i] = f(t)));
    return res;
  };
}

export interface ColorGammaInterpolationFactory extends Function {
  (a: string | RGBA, b: string | RGBA): (t: number) => string;
  gamma(g: number): ColorGammaInterpolationFactory;
}

function rgbColor(g: number): ColorGammaInterpolationFactory {
  const color = gamma(g);
  function rgb(
    start: string | RGBA,
    end: string | RGBA,
  ): (t: number) => string {
    const aRgba = isString(start) ? Color.from(start) : start;
    const bRgba = isString(end) ? Color.from(end) : end;
    const r = color(aRgba.r, bRgba.r);
    const g = color(aRgba.g, bRgba.g);
    const b = color(aRgba.b, bRgba.b);
    const a = color(aRgba.a, bRgba.a);

    return (t) => {
      return `rgba(${r(t)}, ${g(t)}, ${b(t)}, ${a(t)})`;
    };
  }

  rgb.gamma = rgbColor;
  return rgb;
}

const interpolateRgb = rgbColor(1);

export {
  number as interpolateNumber,
  numberRound as interpolateNumberRound,
  string as interpolateString,
  date as interpolateDate,
  numberArray as interpolateNumberArray,
  interpolateRgb,
};
