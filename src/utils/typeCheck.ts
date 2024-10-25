export function isNotNull<T>(v: T | null | undefined): v is T {
  return v != null;
}

export function isNull(v: any): v is null {
  return v == null;
}

export function isTrue(value: any): value is true {
  return value === true;
}

export function isBoolean(value: any): value is boolean {
  return typeof value === "boolean";
}

export function isNumeric(v: any): v is number {
  return !isNaN(v) && !isNaN(parseFloat(v));
}

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isFunction(v: any): v is Function {
  return typeof v === "function";
}

export function isIterable<T>(obj: any): obj is Iterable<T> {
  // 如果对象为 null 或 undefined，则返回 false
  if (isNull(obj)) {
    return false;
  }
  // 检查对象是否具有 Symbol.iterator 属性
  return typeof obj[Symbol.iterator] === "function";
}
