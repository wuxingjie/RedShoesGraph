import { isFunction } from "./typeCheck.ts";

class Optional<T> {
  constructor(public value?: T) {}
  isEmpty(): this is { value: undefined } {
    return this.value != null;
  }

  isDefined(): this is { value: T } {
    return !this.isEmpty();
  }

  get(): T {
    if (this.isDefined()) {
      return this.value;
    }
    throw new Error("Value is null");
  }

  getOrElse(v: T | (() => T)): T {
    return this.isDefined() ? this.value : isFunction(v) ? v() : v;
  }

  map<N>(f: (v: T) => N): Optional<N> {
    return this.isDefined() ? new Optional(f(this.value)) : EMPTY;
  }

  filter(f: (v: T) => boolean): Optional<T> {
    if (this.isDefined()) {
      return f(this.value) ? this : EMPTY;
    } else {
      return this;
    }
  }

  exist(f: (v: T) => boolean): boolean {
    if (this.isDefined()) {
      return f(this.value);
    }
    return false;
  }

  contains(v: T): boolean {
    return this.isDefined() && this.get() === v;
  }
}

const EMPTY = new Optional<any>();

export { Optional };
