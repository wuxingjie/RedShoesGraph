import { isObject } from "./typeCheck.ts";
import { computeIfAbsent } from "./map.ts";

type Observer = (
  property: string,
  target: any,
  value: any,
  oldValue: any,
) => void;

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

  public observe(property: string, observer: Observer) {
    const propObservers = computeIfAbsent(
      this._observers,
      property,
      () => new Set(),
    );
    propObservers.add(observer);
    return () => {
      propObservers.delete(observer);
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
        if (isObject(target[property])) {
          const obj: any = new Observable(target[property]).value;
          return obj[property];
        }
        if (currentComputed) {
          currentComputed.addDependency(property, this); // 收集依赖
        }
        return target[property];
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

  constructor(computeFn: () => T) {
    this.computeFn = computeFn;
    this._value = undefined;
    this._isDirty = true;
  }

  addDependency(property: string, dep: Observable<any>) {
    dep.observe(property, () => (this._isDirty = true));
  }

  get value(): T {
    if (this._isDirty) {
      currentComputed = this; // 设置当前计算属性
      this._value = this.computeFn(); // 计算值，自动收集依赖
      currentComputed = null; // 清除当前计算属性
      this._isDirty = false; // 清除脏标记
    }
    return this._value!;
  }
}

// 示例使用
interface Person {
  name: string;
  age: number;
}

const person = new Observable<Person>({
  name: "Alice",
  age: 30,
});

// 创建一个计算属性，直接通过计算函数捕获特定属性
const computedDescription = new Computed(() => {
  return `${person.value.name} is ${person.value.age} years old.`;
});

// 使用计算属性
console.log(computedDescription.value); // 输出: Alice is 30 years old.

// 观察计算属性的变化
person.observe(() => {
  console.log(`Description changed: ${computedDescription.value}`);
});

// 修改值
person.value.name = "Bob"; // 输出: Description changed: Bob is 30 years old.
person.value.age = 31; // 输出: Description changed: Bob is 31 years old.

export function observable<T extends object>(source: T): T {
  if (isObject(source)) {
    return new Observable(source).value;
  } else {
    throw new Error("source type is not object/");
  }
}
