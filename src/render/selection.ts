import { Node } from "./node.ts";
import { Container } from "./container.ts";
import { isFunction, isInstanceOf } from "../utils/typeCheck.ts";
import { forEachIterable } from "../utils/iterable.ts";
import { constFunc } from "../utils/functional.ts";

export type ValueFn<Datum, Result, thisType = unknown> = (
  this: thisType,
  datum: Datum,
  index: number,
) => Result;

type KeyType = number | string;

export class Selection<
  SNodeType extends Node,
  Datum,
  PNodeType extends Node,
  PDatum,
> {
  private readonly _parents?: PNodeType[];
  private readonly _nodes?: SNodeType[];
  private _enter?: Datum[];
  private _update?: SNodeType[];
  private _exit?: SNodeType[];

  constructor(parents?: PNodeType[], nodes?: SNodeType[]) {
    this._parents = parents;
    this._nodes = nodes;
  }

  data<NewDatum>(
    datum: NewDatum[] | Iterable<NewDatum>,
    keyFn?: ValueFn<NewDatum, KeyType>,
  ): Selection<SNodeType, NewDatum, PNodeType, PDatum> {
    keyFn = keyFn ?? ((_: NewDatum, i: number) => i);
    // 创建映射用于查找已有节点
    const existingKeyMap = new Map<KeyType, SNodeType>();
    this._nodes?.forEach((node, i) => {
      const key = keyFn(node.datum(), i);
      existingKeyMap.set(key, node);
    });
    const enter: NewDatum[] = [];
    const update: SNodeType[] = [];
    const exit: (SNodeType | undefined)[] | undefined = this._nodes?.slice();
    forEachIterable(datum, (d, i) => {
      const k = keyFn(d, i);
      if (existingKeyMap.has(k)) {
        update.push(existingKeyMap.get(k)!);
        if (exit) {
          exit[i] = undefined; // 置空,后续使用过滤空
        }
      } else {
        enter.push(d);
      }
    });

    const newSelection = new Selection<SNodeType, NewDatum, PNodeType, PDatum>(
      this._parents,
      this._nodes,
    );
    newSelection._enter = enter;
    newSelection._update = update;
    newSelection._exit = exit?.filter((d) => d !== undefined);
    return newSelection;
  }

  join(
    enter: (d: Datum) => SNodeType,
    update?: (n: SNodeType) => void,
    exit?: (n: SNodeType) => void,
  ) {
    if (this._enter) this._enter.forEach(enter);
    if (this._update && update) this._update.forEach(update);
    if (this._exit) {
      exit = exit ?? ((n: SNodeType) => n.remove());
      this._exit.forEach(exit);
    }
    return this;
  }

  option<
    K extends SNodeType extends Node<infer Options> ? keyof Options : never,
    V extends SNodeType extends Node<infer Options> ? Options[K] : never,
  >(name: K, v: V | ValueFn<Datum, V, SNodeType>) {
    if (!isFunction(v)) {
      v = constFunc(v);
    }
    this._nodes?.forEach((n, i) => {
      n.setOption(name, v.call(n, n.datum(), i));
    });
    return this;
  }

  append<ChildType extends Node>(
    n: ChildType | ValueFn<Datum, ChildType, SNodeType>,
  ) {}

  selectByTag(tag: string) {
    const filteredNodes: Node[] = [];
    for (const parent of this._parents ?? []) {
      if (isInstanceOf(parent, Container)) {
        parent.each((node) => {
          if (node.tag() === tag) {
            filteredNodes.push(node);
          }
        });
      }
    }
    return new Selection<Node, any, PNodeType, PDatum>(
      this._parents,
      filteredNodes,
    );
  }
}

export function select() {}
