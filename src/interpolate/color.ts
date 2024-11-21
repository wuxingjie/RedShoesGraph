import { constFunc } from "../utils/functional.ts";

function linear(a: number, d: number) {
  return function (t: number) {
    return a + t * d;
  };
}

function exponential(a: number, b: number, y: number) {
  a = Math.pow(a, y);
  b = Math.pow(b, y) - a;
  y = 1 / y;
  return function (t: number) {
    return Math.pow(a + t * b, y);
  };
}

export function gamma(y: number) {
  return y === 1
    ? nogamma
    : function (a: number, b: number) {
        return b - a ? exponential(a, b, y) : constFunc(isNaN(a) ? b : a);
      };
}

export function nogamma(a: number, b: number) {
  const d = b - a;
  return d ? linear(a, d) : constFunc(isNaN(a) ? b : a);
}
