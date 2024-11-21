export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

export function binarySearch<T>(
  arr: T[],
  target: T,
  low: number = 0,
  high: number = arr.length - 1,
) {
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = arr[mid];
    if (midVal === target) return mid;
    if (midVal > target) high = mid - 1;
    else low = mid + 1;
  }
}
