import { isPlainObject } from "./typeCheck.ts";
import { computeIfAbsent } from "./map.ts";
import { Runner, safe } from "./functional.ts";

type Observer = (
  property: string,
  target: any,
  value: any,
  oldValue: any,
) => void;

export type Cancel = Runner;

class Observable<T extends object> {
  private readonly _value: T;
  private readonly _observers: Map<string, Set<Observer>> = new Map();

  constructor(value: T) {
    this._value = this._createProxy(value);
  }

  get value(): T {
    return this._value;
  }

  private _notify(property: string, target: any, value: any, oldValue: any) {
    this._observers
      .get(property)
      ?.forEach((observer) => observer(property, target, value, oldValue));
  }

  public observe(property: string, observer: Observer): Cancel {
    const propObservers = computeIfAbsent(
      this._observers,
      property,
      () => new Set(),
    );
    propObservers.add(observer);
    return () => {
      propObservers.delete(observer);
      if (propObservers.size === 0) {
        this._observers.delete(property);
      }
    };
  }

  private _createProxy(obj: any): T {
    const handler: ProxyHandler<T> = {
      set: (target: any, property: string, value: any) => {
        const oldValue = target[property];
        target[property] = value;
        this._notify(property, target, value, oldValue);
        return true;
      },
      get: (target: any, property: string): any => {
        const propValue = target[property];

        if (!(propValue instanceof Observable) && isPlainObject(propValue)) {
          const observable = new Observable(propValue);
          target[property] = observable.value; // 替换为 observable 的值
          return observable.value;
        }

        if (currentComputed) {
          currentComputed.observe(property, this);
        }

        return propValue;
      },
    };
    return new Proxy(obj, handler);
  }
}

let currentComputed: Computed<any> | null = null;

class Computed<T> {
  private readonly computeFn: () => T;
  private _value: T | undefined;
  private _isDirty: boolean;
  private _observed: boolean;
  private cancelObserve: Cancel[] = [];
  private subComputed?: Computed<unknown>[];

  constructor(computeFn: () => T) {
    this.computeFn = safe(computeFn); // 不抛异常
    this._value = undefined;
    this._isDirty = true;
    this._observed = false;
  }

  observe(property: string, dep: Observable<any>) {
    if (!this._observed) {
      const cancel = dep.observe(property, () => (this.isDirty = true));
      this.cancelObserve.push(cancel);
    }
  }

  addSubComputed(dep: Computed<any>) {
    const subComputed = this.subComputed ?? (this.subComputed = []);
    subComputed.push(dep);
  }

  set isDirty(value: boolean) {
    this._isDirty = value;
    this.subComputed?.forEach((dep) => (dep.isDirty = true));
  }

  get value(): T {
    const tempComputed = currentComputed;
    // 计算属性依赖
    if (currentComputed) {
      this.addSubComputed(currentComputed);
    }
    if (!this._observed) {
      currentComputed = this; // 设置当前计算属性
    }
    // 脏了,重新计算
    if (this._isDirty) {
      this._value = this.computeFn(); // 计算值，自动收集依赖
      this._isDirty = false; // 清除脏标记
    }
    this._observed = true;
    // 还原
    currentComputed = tempComputed;
    return this._value!;
  }

  destroy() {
    this.cancelObserve.forEach((cancel) => cancel());
    // @ts-ignore
    this._value = null;
    // @ts-ignore
    this.cancelObserve = null;
    // @ts-ignore
    this.dependencies = null;
  }
}

export function observable<T extends object>(source: T): T {
  if (isPlainObject(source)) {
    return new Observable(source).value;
  } else {
    throw new Error("source type is not PlainObject");
  }
}

export function computed<T>(fn: () => T): Computed<T> {
  return new Computed(fn);
}
