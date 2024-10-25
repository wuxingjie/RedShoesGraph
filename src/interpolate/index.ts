import { constFunc } from "../utils/functional";
import { Stream } from "../utils/stream";
import { isNull, isNumeric } from "../utils/typeCheck";

function number(a: number, b: number): (t: number) => number {
  return (t: number) => {
    return a * (1 - t) + b * t;
  };
}

function numberRound(a: number, b: number): (t: number) => number {
  const interpolateNumber = number(a, b);
  return (t: number) => {
    return Math.round(interpolateNumber(t));
  };
}

const numRegExp = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
const numRegExpSplit = /([-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?)/g;
function string(a: string, b: string): (t: number) => string {
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
function date(a: Date, b: Date): (t: number) => Date {
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
function numberArray(a: number[], b: number[]): (t: number) => number[] {
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

export {
  number as interpolateNumber,
  numberRound as interpolateNumberRound,
  string as interpolateString,
  date as interpolateDate,
  numberArray as interpolateNumberArray,
};
