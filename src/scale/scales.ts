import continuousScale from "./continuousScale.ts";
import { constFunc, identity } from "../utils/functional.ts";
import {
  interpolateDate,
  interpolateNumber,
  interpolateRgb,
} from "../interpolate";
import { NumericScale, PowerScale, Scale, TimeScale } from "./scale.ts";
import { tickIncrement, ticks } from "../utils/ticks.ts";
import { timeTickInterval, timeTicks } from "../utils/time/ticks.ts";
import {
  isArrayOfType,
  isInstanceOfType,
  isNumeric,
  isObject,
  isString,
} from "../utils/typeCheck.ts";
import { RGBA } from "../utils/color.ts";
import {
  CountableTimeInterval,
  TimeInterval,
} from "../utils/time/timeInterval.ts";

export function scaleLinear<R = number | string | RGBA>(
  domain: Date[],
  range: R[],
): TimeScale<R>;
export function scaleLinear<R = number | string | RGBA>(
  domain: number[],
  range: R[],
): NumericScale<R>;
export function scaleLinear<R = number | string | RGBA>(
  domain: (number | Date)[],
  range: R[],
  gamma?: number,
): NumericScale<R> | TimeScale<R> {
  if (isArrayOfType(domain, isInstanceOfType(Date))) {
    return timeScale(domain, range, gamma);
  } else if (isArrayOfType(domain, isNumeric)) {
    return numericScale(domain, range, gamma);
  }
  throw new Error("Invalid domain");
}

export function powScale<D extends number | Date, R = number | string | RGBA>(
  domain: D[],
  range: R[],
  exponent: number = 1,
  gamma?: number,
): PowerScale<D, R> {
  const transform =
    exponent === 1
      ? [identity, identity]
      : exponent === 0.5
        ? [transformSqrt, transformSquare]
        : [transformPow(exponent), transformPow(1 / exponent)];

  let scale: Scale<any, R> | undefined;
  if (isArrayOfType(domain, isInstanceOfType(Date))) {
    scale = timeScale(
      domain,
      range,
      gamma,
      (d) => new Date(transform[0](d.getTime())),
      (d) => new Date(transform[1](d.getTime())),
    );
  } else if (isArrayOfType(domain, isNumeric)) {
    scale = numericScale(domain, range, gamma, transform[0], transform[1]);
  }

  if (scale) {
    return Object.assign(scale, {
      exponent(e: number) {
        return powScale(scale.domain(), scale.range(), e, gamma);
      },
    });
  }
  throw new Error("Invalid domain");
}

function numericScale<R = number | string | RGBA>(
  domain: number[],
  range: R[],
  gamma?: number,
  transform?: (d: number) => number,
  unTransform?: (r: number) => number,
): NumericScale<R> {
  const scale: Scale<number, R> = continuousScale<number, R>(
    domain,
    range,
    normalize,
    // @ts-ignore
    isArrayOfType(range, isString)
      ? gamma !== undefined
        ? interpolateRgb.gamma(gamma)
        : interpolateRgb
      : interpolateNumber,
    transform,
    normalize,
    interpolateNumber,
    unTransform,
  );
  const numScale = Object.assign(scale, {
    ticks(count?: number): number[] {
      return ticks(
        scale.domain()[0],
        scale.domain()[scale.domain().length - 1],
        count ?? 10,
      );
    },
    nice(count: number = 10): NumericScale<R> {
      const d: number[] = numScale.domain();
      let i0: number = 0;
      let i1: number = d.length - 1;
      let start = d[i0];
      let stop = d[i1];
      let preStep: number | undefined;
      let step: number;
      let maxIter = 10;

      if (stop < start) {
        step = start;
        start = stop;
        stop = step;
        step = i0;
        i0 = i1;
        i1 = step;
      }

      while (maxIter-- > 0) {
        step = tickIncrement(start, stop, count);
        if (step === preStep) {
          d[i0] = start;
          d[i1] = stop;
          return numScale.domain(d);
        } else if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
        } else {
          break;
        }
        preStep = step;
      }

      return numScale;
    },
  });
  return numScale;
}

function timeScale<R = number | string | RGBA>(
  domain: Date[],
  range: R[],
  gamma?: number,
  transform?: (d: Date) => Date,
  unTransform?: (r: Date) => Date,
): TimeScale<R> {
  const scale: Scale<Date, R> = continuousScale<Date, R>(
    domain,
    range,
    normalize,
    // @ts-ignore
    isArrayOfType(range, isString)
      ? gamma !== undefined
        ? interpolateRgb.gamma(gamma)
        : interpolateRgb
      : interpolateNumber,
    transform,
    normalize,
    interpolateDate,
    unTransform,
  );

  const timeScale = Object.assign(scale, {
    ticks(count?: number): Date[] {
      const domain = scale.domain();
      return timeTicks(domain[0], domain[domain.length - 1], count ?? 10);
    },
    nice,
  });

  function nice(count?: number): TimeScale<R>;
  function nice(interval: CountableTimeInterval): TimeScale<R>;
  function nice(interval?: number | CountableTimeInterval): TimeScale<R> {
    const d = timeScale.domain();
    let timeInterval: TimeInterval | null = null;
    if (interval === undefined) {
      timeInterval = timeTickInterval(
        d[0],
        d[d.length - 1],
        isNumeric(interval) ? interval : 10,
      );
    } else if (isObject(interval)) {
      timeInterval = interval;
    }

    if (timeInterval != null) {
      const domain = scale.domain().slice();

      let i0 = 0,
        i1 = domain.length - 1,
        x0 = domain[i0],
        x1 = domain[i1],
        t: any;

      if (x1 < x0) {
        t = i0;
        i0 = i1;
        i1 = t;
        t = x0;
        x0 = x1;
        x1 = t;
      }

      domain[i0] = timeInterval.floor(x0);
      domain[i1] = timeInterval.ceil(x1);
      return timeScale.domain(domain);
    }
    return timeScale;
  }
  return timeScale;
}

function transformPow(exponent: number) {
  return function (x: number): number {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}

function transformSqrt(x: number) {
  return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
}

function transformSquare(x: number) {
  return x < 0 ? -x * x : x * x;
}

function normalize(a: any, b: any): (x: any) => number {
  return (b -= a = +a)
    ? function (x: any) {
        return (x - a) / b;
      }
    : constFunc(isNaN(b) ? NaN : 0.5);
}
