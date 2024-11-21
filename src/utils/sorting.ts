export function ascending(a: any, b: any) {
  return a == null || b == null
    ? NaN
    : a < b
      ? -1
      : a > b
        ? 1
        : a >= b
          ? 0
          : NaN;
}

export function descending(a: any, b: any) {
  return a == null || b == null
    ? NaN
    : b < a
      ? -1
      : b > a
        ? 1
        : b >= a
          ? 0
          : NaN;
}
