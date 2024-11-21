// copy from https://github.com/d3/d3-array/blob/main/src/ticks.js

const e10 = Math.sqrt(50),
  e5 = Math.sqrt(10),
  e2 = Math.sqrt(2);
export function tickSpec(
  start: number,
  stop: number,
  count: number,
): [number, number, number] {
  const step = (stop - start) / Math.max(0, count),
    power = Math.floor(Math.log10(step)),
    error = step / Math.pow(10, power),
    factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2)
    return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}

export function ticks(start: number, stop: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }
  if (start === stop) {
    return [start];
  }
  const reverse = start > stop;
  const [i1, i2, inc] = tickSpec(
    reverse ? stop : start,
    reverse ? start : stop,
    count,
  );
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1,
    ticks = new Array<number>(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
  }
  return ticks;
}

export function tickIncrement(start: number, stop: number, count: number) {
  return tickSpec(start, stop, count)[2];
}

export function tickStep(start: number, stop: number, count: number) {
  const reverse = stop < start,
    inc = reverse
      ? tickIncrement(stop, start, count)
      : tickIncrement(start, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}
