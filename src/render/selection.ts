import { Node } from "./node.ts";
import { Container } from "./container.ts";
import { isInstanceOf } from "../utils/typeCheck.ts";
import { forEachIterable } from "../utils/iterable.ts";

export type ValueFn<T extends Node, Datum, Result> = (
  this: T,
  datum: Datum,
  index: number,
  groups: T[] | Iterable<T>,
) => Result;

type KeyType = number | string;

export class Selection<
  SNodeType extends Node,
  Datum,
  PNodeType extends Node,
  PDatum,
> {
  private _parent?: PNodeType;
  private _nodes?: SNodeType[];
  private _datum?: Map<KeyType, Datum>;

  constructor(
    parent?: PNodeType,
    nodes?: SNodeType[],
    datum?: Map<KeyType, Datum>,
  ) {
    this._parent = parent;
    this._nodes = nodes;
    this._datum = datum;
  }

  data<NewDatum>(
    datum: NewDatum[] | Iterable<NewDatum>,
    keyFn?: ValueFn<SNodeType, NewDatum, number | string>,
  ): Selection<SNodeType, NewDatum, PNodeType, PDatum> {
    const key = keyFn ?? ((_: NewDatum, i: number) => i);
    const datumMap = new Map<KeyType, NewDatum>();
    forEachIterable(datum, (d, i) => {
      const k = key.call(d, i, datum);
      datumMap.set(k, d);
    });

    return new Selection(this._parent, this._nodes, datumMap);
  }

  selectByTag(tag: string) {
    if (isInstanceOf(this._parent, Container)) {
      const filteredNodes: Node[] = [];
      this._parent.each((node) => {
        if (node.tag() === tag) {
          filteredNodes.push(node);
        }
      });
      return new Selection(this._parent, filteredNodes);
    }
    return this;
  }
}

export function select() {}
