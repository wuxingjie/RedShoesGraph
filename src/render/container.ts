import { Node, NodeOptions } from "./node";
import {
  emptyIterable,
  forEachIterable,
  toIterable,
} from "../utils/iterable.ts";

export interface ContainerOptions extends NodeOptions {
  clipX?: number;
  clipY?: number;
  clipWidth?: number;
  clipHeight?: number;
}

export class Container<
  Options extends ContainerOptions = ContainerOptions,
  ItemType extends Node = Node,
> extends Node<Options> {
  private _children?: Set<ItemType>;

  hasChildren() {
    return this._children != null && this._children.size > 0;
  }

  add(els: ItemType | Iterable<ItemType>) {
    const children = (this._children = this._children ?? new Set<ItemType>());

    forEachIterable(toIterable(els), (e) => {
      e.parent = this;
      children.add(e);
    });
  }

  removeChildren(els: ItemType | Iterable<ItemType>) {
    const children = this._children;
    if (children == null) {
      return;
    }

    forEachIterable(toIterable(els), (e) => {
      e.parent = undefined;
      children.delete(e);
    });
  }

  removeAllChildren() {
    this.removeChildren(this.children);
  }

  sortChildren(compareFn?: (a: ItemType, b: ItemType) => number): void {
    if (this._children == null) {
      return;
    }
    // 将 Set 转换为数组并排序
    const sortedArray = Array.from(this.children).sort(compareFn);

    // 将排序后的数组转换回 Set
    this._children = new Set(sortedArray);
  }

  get children(): Iterable<ItemType> {
    return this._children ?? emptyIterable();
  }

  override draw(): this {
    for (const child of this.children) {
      child.draw();
    }
    return this;
  }
}
