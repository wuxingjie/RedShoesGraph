// copy from https://github.com/d3/d3-array/blob/main/src/bisector.js

import { ascending, descending } from "./sorting.ts";

export interface Bisector<T, U> {
  left(array: ArrayLike<T>, x: U, lo?: number, hi?: number): number;
  right(array: ArrayLike<T>, x: U, lo?: number, hi?: number): number;
  center(array: ArrayLike<T>, x: U, lo?: number, hi?: number): number;
}
export function bisector<T, U>(accessor: (x: T) => U): Bisector<T, U>;
export function bisector<T, U>(
  comparator: (a: T, b: U) => number,
): Bisector<T, U>;

export function bisector<T, U>(f: Function): Bisector<T, U> {
  let compare1: (a: U, b: U) => number,
    compare2: (d: T, x: U) => number,
    delta: Function;

  // f is accessor
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x) => ascending(f(d), x);
    delta = (d: T, x: any) => f(d) - x;
  } else {
    // f is comparator
    // @ts-ignore
    compare1 = f === ascending || f === descending ? f : () => 0;
    // @ts-ignore
    compare2 = f;
    delta = f;
  }

  function left(a: ArrayLike<T>, x: U, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function right(a: ArrayLike<T>, x: U, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function center(a: ArrayLike<T>, x: U, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }

  return { left, center, right };
}

const ascendingBisect = bisector(ascending);
export const bisectRight = ascendingBisect.right;
export const bisectLeft = ascendingBisect.left;
export const bisectCenter = bisector((a: any) => +a).center;
export default bisectRight;
