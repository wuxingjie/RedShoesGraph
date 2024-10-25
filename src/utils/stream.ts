import {
  filter,
  filterNot,
  filterNotNull,
  flatMap,
  generate,
  iterate,
  map,
  scanLeft,
  skip,
  skipWhile,
  slice,
  take,
  takeWhile,
  toArray,
  zip,
  zipWithIndex,
} from "./iterable";

class Stream<T> implements Iterable<T> {
  constructor(private it: Iterable<T>) {}

  static from<T>(it: Iterable<T>) {
    return new Stream(it);
  }

  static of<T>(...items: T[]) {
    return new Stream(items);
  }

  static generate<T>(supplier: () => T): Stream<T> {
    return Stream.from(generate(supplier));
  }

  static iterate<T>(seed: T, p: () => boolean, next: (v: T) => T): Stream<T> {
    return Stream.from(iterate(seed, p, next));
  }

  static zip<A, B>(a: Iterable<A>, b: Iterable<B>): Stream<[A, B]> {
    return Stream.from(zip(a, b));
  }

  [Symbol.iterator](): Iterator<T> {
    return this.it[Symbol.iterator]();
  }

  map<R>(m: (v: T, index: number) => R): Stream<R> {
    return Stream.from(map(m)(this));
  }

  flatMap<R>(m: (v: T) => Iterable<R>): Stream<R> {
    return Stream.from(flatMap(m)(this));
  }

  scanLeft<R>(init: R, op: (b: R, e: T) => R): Stream<R> {
    return Stream.from(scanLeft(init, op)(this));
  }

  filter(f: (e: T, index: number) => boolean): Stream<T> {
    return Stream.from(filter(f)(this));
  }

  filterNot(f: (e: T, index: number) => boolean): Stream<T> {
    return new Stream(filterNot(f)(this));
  }

  filterNotNull(): Stream<NonNullable<T>> {
    return new Stream(filterNotNull<T>()(this));
  }

  take(n: number): Stream<T> {
    return new Stream(take<T>(n)(this));
  }

  takeWhile(p: (e: T) => boolean): Stream<T> {
    return new Stream(takeWhile(p)(this));
  }

  skip(n: number): Stream<T> {
    return new Stream(skip<T>(n)(this));
  }

  skipWhile(p: (e: T) => boolean): Stream<T> {
    return new Stream(skipWhile(p)(this));
  }

  slice(from: number, until: number): Stream<T> {
    return new Stream(slice<T>(from, until)(this));
  }

  zip<B>(that: Iterable<B>): Stream<[T, B]> {
    return new Stream(zip(this, that));
  }

  zipWithIndex(): Stream<[T, number]> {
    return new Stream(zipWithIndex<T>()(this));
  }

  // -------------------------collectors-----------------------
  toArray(): T[] {
    return toArray<T>()(this);
  }
}

export { Stream };
