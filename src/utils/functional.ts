export type Runner = () => void;

export function constFunc<T>(a: T): () => T {
  return () => a;
}

export function identity<T>(a: T): T {
  return a;
}

export function safe<T>(fn: () => T): () => T {
  return () => {
    return safeRun(fn);
  };
}

export function safeRun<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    console.error(e);
    return undefined as any;
  }
}

export interface ChainableFunction<T, R> {
  (v: T): R;

  andThen<N>(f: (v: R) => N): ChainableFunction<T, N>;
}

export function chainable<T, R>(func: (v: T) => R): ChainableFunction<T, R> {
  // @ts-ignore
  func.andThen = <N>(n: (v: R) => N): ChainableFunction<T, N> => {
    return chainable((v: T) => n(func(v)));
  };
  return func as ChainableFunction<T, R>;
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T;
export function compose<T, R>(fn1: (arg: T) => R): (arg: T) => R;
export function compose<T, R, U>(
  fn1: (arg: T) => R,
  fn2: (arg: R) => U,
): (arg: T) => U;
export function compose<T, R, U, V>(
  fn1: (arg: T) => R,
  fn2: (arg: R) => U,
  fn3: (arg: U) => V,
): (arg: T) => V;
// ...可以继续扩展更多函数参数, 但是一般不用, 比如有四个函数可以两两组合,实际上一般只需要两个函数组合即可
export function compose<T>(...fns: Function[]): (arg: T) => any {
  return (arg: T) => {
    return fns.reduce((acc, fn) => fn(acc), arg);
  };
}
