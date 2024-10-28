import { isFunction } from "./typeCheck.ts";

export function getOrDefault<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: V | (() => V),
): V {
  if (map.has(key)) {
    return map.get(key)!;
  }
  return isFunction(defaultValue) ? defaultValue() : defaultValue;
}

export function computeIfAbsent<K, V>(
  map: Map<K, V>,
  key: K,
  fn: (key: K) => V,
): V {
  if (!map.has(key)) {
    const value = fn(key);
    map.set(key, value);
    return value;
  }
  return map.get(key)!;
}

export function computeIfPresent<K, V>(
  map: Map<K, V>,
  key: K,
  fn: (key: K, value: V) => V,
): V | undefined {
  if (map.has(key)) {
    const value = fn(key, map.get(key)!);
    map.set(key, value);
    return value;
  }
  return undefined;
}

export function compute<K, V>(map: Map<K, V>, key: K, fn: (v?: V) => V): V {
  const newValue = fn(map.get(key));
  map.set(key, newValue);
  return newValue;
}
