import {
  emptyIterable,
  forEachIterable,
  toIterable,
} from "../utils/iterable.ts";

export interface NodeOptions {
  id?: string;
  name?: string;
  tag?: string;
}

export class HierarchyNode<N extends HierarchyNode<N>> {
  readonly id?: string;
  readonly name?: string;
  readonly tag?: string;

  private _datum: any;

  parent?: HierarchyNode<N>;

  private _children?: Set<HierarchyNode<N>>;

  constructor(opts?: NodeOptions) {
    this.id = opts?.id;
    this.name = opts?.name;
    this.tag = opts?.tag;
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

  appendChild(els: HierarchyNode<N> | Iterable<HierarchyNode<N>>) {
    const children = (this._children =
      this._children ?? new Set<HierarchyNode<N>>());
    forEachIterable(toIterable(els), (e) => {
      e.parent = this;
      children.add(e);
    });
  }

  sortChildren(
    compareFn?: (a: HierarchyNode<N>, b: HierarchyNode<N>) => number,
  ): void {
    if (this._children == null) {
      return;
    }
    // 将 Set 转换为数组并排序
    const sortedArray = Array.from(this.children).sort(compareFn);

    // 将排序后的数组转换回 Set
    this._children = new Set(sortedArray);
  }

  get children(): Iterable<HierarchyNode<N>> {
    return this._children ?? emptyIterable();
  }
}
