import {
  emptyIterable,
  forEachIterable,
  toIterable,
} from "../utils/iterable.ts";

export interface ElementOptions {
  id?: string;
  name?: string;
  tag?: string;
  zIndex?: number;
}
export abstract class Element {
  readonly id?: string;
  readonly name?: string;
  readonly tag?: string;
  zIndex: number;

  private _datum: any;

  parent?: Element;

  private _children?: Set<Element>;

  constructor(opts?: ElementOptions) {
    this.id = opts?.id;
    this.name = opts?.name;
    this.tag = opts?.tag;
    this.zIndex = opts?.zIndex ?? 0;
  }

  get datum() {
    return this._datum;
  }

  set datum(d: any) {
    this._datum = d;
  }

  isRoot() {
    return this.parent == null;
  }

  isLeaf() {
    return !this.hasChildren();
  }

  hasChildren() {
    return this._children != null && this._children.size > 0;
  }

  appendChild(els: Element | Iterable<Element>) {
    const children = (this._children = this._children ?? new Set<Element>());
    forEachIterable(toIterable(els), (e) => {
      e.parent = this;
      children.add(e);
    });
  }

  sortChildren(compareFn?: (a: Element, b: Element) => number): void {
    if (this._children == null) {
      return;
    }
    // 将 Set 转换为数组并排序
    const sortedArray = Array.from(this.children).sort(compareFn);

    // 如果需要，可以将排序后的数组转换回 Set
    this._children = new Set(sortedArray);
  }

  get children(): Iterable<Element> {
    return this._children ?? emptyIterable();
  }
}
