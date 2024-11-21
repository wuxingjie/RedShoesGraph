import { Container } from "./container.ts";
import { XY } from "../commonTypes.ts";
import { Layer } from "./layer.ts";
import { Stage } from "./stage.ts";
import { computed, observable } from "../utils/observable.ts";
import { Transformer } from "./transformer.ts";
import { degreesToArc } from "./utils.ts";

export interface NodeOptions<Datum = unknown> {
  id?: string;
  name?: string;
  tag?: string;
  datum?: Datum;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  listening?: boolean;
  opacity?: number;
  scale?: XY;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  rotation?: number;
  rotationDeg?: number;
  offset?: XY;
  offsetX?: number;
  offsetY?: number;
  draggable?: boolean;
  dragDistance?: number;
  dragBoundFunc?: (this: Node, pos: XY) => XY;
  preventDefault?: boolean;
  autoDraw?: boolean;
  //globalCompositeOperation?: globalCompositeOperationType;
}

export type NodeOptionsGetterSetter = {
  [key in keyof Required<NodeOptions>]: (
    key?: NodeOptions[key],
  ) => NodeOptions[key] | Node;
};

export abstract class Node<Options extends NodeOptions = NodeOptions>
  implements NodeOptionsGetterSetter
{
  parent?: Container;
  private readonly _options: Options;
  private readonly _transform = computed(() => {
    const trans = new Transformer();
    const transX = (this.x() ?? 0) + (this._options.offsetX ?? 0),
      transY = (this.y() ?? 0) + (this._options.offsetY ?? 0),
      scaleX = this._options.scaleX ?? this._options.scale?.x ?? 1,
      scaleY = this._options.scaleY ?? this._options.scale?.y ?? 1,
      rotation =
        this._options.rotation ??
        (this._options.rotationDeg !== undefined
          ? degreesToArc(this._options.rotationDeg!)
          : 0),
      skewX = this._options.skewX ?? 0,
      skewY = this._options.skewY ?? 0;
    if (transX !== 0) {
      trans.translateX(transX);
    }
    if (transY !== 0) {
      trans.translateY(transY);
    }
    if (scaleX !== 1 || scaleY !== 1) {
      trans.scale(scaleX, scaleY);
    }
    if (rotation !== 0) {
      trans.rotate(rotation);
    }
    if (skewX !== 0 || skewY !== 0) {
      trans.skew(skewX, skewY);
    }
    return trans;
  });
  private readonly _absoluteTransform = computed(() => {
    const transform = this.getTransform();
    return this.parent?.getTransform()?.copy().multiply(transform) ?? transform;
  });

  protected constructor(opts?: Options) {
    const options = opts ?? ({} as Options);
    this._options = observable(options);
  }

  getOption<T extends keyof Options>(name: T): Options[T];
  getOption<T extends keyof Options>(
    name: T,
    def: Options[T],
  ): Exclude<Options[T], undefined>;
  getOption<T extends keyof Options>(
    name: T,
    def?: Options[T],
  ): Options[T] | Exclude<Options[T], undefined> {
    return this._options[name] ?? def!;
  }

  setOption<T extends keyof Options>(name: T, value: Options[T]): this {
    this._options[name] = value;
    this.requestDraw();
    return this;
  }

  setOptions(options: Partial<Options>): this {
    Object.assign(this._options, options);
    this.requestDraw();
    return this;
  }

  getLayer(): Layer | undefined {
    return this.parent?.getLayer();
  }

  getStage(): Stage | undefined {
    return this.parent?.getStage();
  }

  setSize(width: number, height: number) {
    this.setOption("width", width);
    this.setOption("height", height);
  }

  private requestDraw() {
    if (this.autoDraw()) {
      this.getLayer()?.batchDraw();
    }
  }

  abstract draw(): this;

  getAbsoluteTransform(): Transformer {
    return this._absoluteTransform.value;
  }

  getTransform(): Transformer {
    return this._transform.value;
  }

  ancestors(includeSelf: boolean = false): Iterable<Node> {
    const self = this;
    function* gen() {
      if (includeSelf) {
        yield self;
      }
      yield* self.parent?.ancestors(true) ?? [];
    }
    return gen();
  }

  remove() {
    this.parent?.removeChildren(this);
    this._transform.destroy();
    this._absoluteTransform.destroy();
  }

  // -------------------------- getter setter -----------------------------
  id(): NodeOptions["id"];
  id(key: NodeOptions["id"]): this;
  id(key?: NodeOptions["id"]): NodeOptions["id"] | this {
    if (key === undefined) return this.getOption("id");
    this.setOption("id", key);
    return this;
  }

  name(): NodeOptions["name"];
  name(key: NodeOptions["name"]): this;
  name(key?: NodeOptions["name"]): NodeOptions["name"] | this {
    if (key === undefined) return this.getOption("name");
    this.setOption("name", key);
    return this;
  }

  tag(): NodeOptions["tag"];
  tag(key: NodeOptions["tag"]): this;
  tag(key?: NodeOptions["tag"]): NodeOptions["tag"] | this {
    if (key === undefined) return this.getOption("tag");
    this.setOption("tag", key);
    return this;
  }

  datum(): NodeOptions["datum"];
  datum(key: NodeOptions["datum"]): this;
  datum(key?: NodeOptions["datum"]): NodeOptions["datum"] | this {
    if (key === undefined) return this.getOption("datum");
    this.setOption("datum", key);
    return this;
  }

  x(): NodeOptions["x"];
  x(key: NodeOptions["x"]): this;
  x(key?: NodeOptions["x"]): NodeOptions["x"] | this {
    if (key === undefined) return this.getOption("x");
    this.setOption("x", key);
    return this;
  }

  y(): NodeOptions["y"];
  y(key: NodeOptions["y"]): this;
  y(key?: NodeOptions["y"]): NodeOptions["y"] | this {
    if (key === undefined) return this.getOption("y");
    this.setOption("y", key);
    return this;
  }

  width(): NodeOptions["width"];
  width(key: NodeOptions["width"]): this;
  width(key?: NodeOptions["width"]): NodeOptions["width"] | this {
    if (key === undefined) return this.getOption("width");
    this.setOption("width", key);
    return this;
  }

  height(): NodeOptions["height"];
  height(key: NodeOptions["height"]): this;
  height(key?: NodeOptions["height"]): NodeOptions["height"] | this {
    if (key === undefined) return this.getOption("height");
    this.setOption("height", key);
    return this;
  }

  visible(): NodeOptions["visible"];
  visible(key: NodeOptions["visible"]): this;
  visible(key?: NodeOptions["visible"]): NodeOptions["visible"] | this {
    if (key === undefined) return this.getOption("visible");
    this.setOption("visible", key);
    return this;
  }

  listening(): NodeOptions["listening"];
  listening(key: NodeOptions["listening"]): this;
  listening(key?: NodeOptions["listening"]): NodeOptions["listening"] | this {
    if (key === undefined) return this.getOption("listening");
    this.setOption("listening", key);
    return this;
  }

  opacity(): NodeOptions["opacity"];
  opacity(key: NodeOptions["opacity"]): this;
  opacity(key?: NodeOptions["opacity"]): NodeOptions["opacity"] | this {
    if (key === undefined) return this.getOption("opacity");
    this.setOption("opacity", key);
    return this;
  }

  scale(): NodeOptions["scale"];
  scale(key: NodeOptions["scale"]): this;
  scale(key?: NodeOptions["scale"]): NodeOptions["scale"] | this {
    if (key === undefined) return this.getOption("scale");
    this.setOption("scale", key);
    return this;
  }

  scaleX(): NodeOptions["scaleX"];
  scaleX(key: NodeOptions["scaleX"]): this;
  scaleX(key?: NodeOptions["scaleX"]): NodeOptions["scaleX"] | this {
    if (key === undefined) return this.getOption("scaleX");
    this.setOption("scaleX", key);
    return this;
  }

  skewX(): NodeOptions["skewX"];
  skewX(key: NodeOptions["skewX"]): this;
  skewX(key?: NodeOptions["skewX"]): NodeOptions["skewX"] | this {
    if (key === undefined) return this.getOption("skewX");
    this.setOption("skewX", key);
    return this;
  }

  skewY(): NodeOptions["skewY"];
  skewY(key: NodeOptions["skewY"]): this;
  skewY(key?: NodeOptions["skewY"]): NodeOptions["skewY"] | this {
    if (key === undefined) return this.getOption("skewY");
    this.setOption("skewY", key);
    return this;
  }

  scaleY(): NodeOptions["scaleY"];
  scaleY(key: NodeOptions["scaleY"]): this;
  scaleY(key?: NodeOptions["scaleY"]): NodeOptions["scaleY"] | this {
    if (key === undefined) return this.getOption("scaleY");
    this.setOption("scaleY", key);
    return this;
  }

  rotation(): NodeOptions["rotation"];
  rotation(key: NodeOptions["rotation"]): this;
  rotation(key?: NodeOptions["rotation"]): NodeOptions["rotation"] | this {
    if (key === undefined) return this.getOption("rotation");
    this.setOption("rotation", key);
    return this;
  }

  rotationDeg(): NodeOptions["rotationDeg"];
  rotationDeg(key: NodeOptions["rotationDeg"]): this;
  rotationDeg(
    key?: NodeOptions["rotationDeg"],
  ): NodeOptions["rotationDeg"] | this {
    if (key === undefined) return this.getOption("rotationDeg");
    this.setOption("rotationDeg", key);
    return this;
  }

  offset(): NodeOptions["offset"];
  offset(key: NodeOptions["offset"]): this;
  offset(key?: NodeOptions["offset"]): NodeOptions["offset"] | this {
    if (key === undefined) return this.getOption("offset");
    this.setOption("offset", key);
    return this;
  }

  offsetX(): NodeOptions["offsetX"];
  offsetX(key: NodeOptions["offsetX"]): this;
  offsetX(key?: NodeOptions["offsetX"]): NodeOptions["offsetX"] | this {
    if (key === undefined) return this.getOption("offsetX");
    this.setOption("offsetX", key);
    return this;
  }

  offsetY(): NodeOptions["offsetY"];
  offsetY(key: NodeOptions["offsetY"]): this;
  offsetY(key?: NodeOptions["offsetY"]): NodeOptions["offsetY"] | this {
    if (key === undefined) return this.getOption("offsetY");
    this.setOption("offsetY", key);
    return this;
  }

  draggable(): NodeOptions["draggable"];
  draggable(key: NodeOptions["draggable"]): this;
  draggable(key?: NodeOptions["draggable"]): NodeOptions["draggable"] | this {
    if (key === undefined) return this.getOption("draggable");
    this.setOption("draggable", key);
    return this;
  }

  dragDistance(): NodeOptions["dragDistance"];
  dragDistance(key: NodeOptions["dragDistance"]): this;
  dragDistance(
    key?: NodeOptions["dragDistance"],
  ): NodeOptions["dragDistance"] | this {
    if (key === undefined) return this.getOption("dragDistance");
    this.setOption("dragDistance", key);
    return this;
  }

  dragBoundFunc(): NodeOptions["dragBoundFunc"];
  dragBoundFunc(key: NodeOptions["dragBoundFunc"]): this;
  dragBoundFunc(
    key?: NodeOptions["dragBoundFunc"],
  ): NodeOptions["dragBoundFunc"] | this {
    if (key === undefined) return this.getOption("dragBoundFunc");
    this.setOption("dragBoundFunc", key);
    return this;
  }

  preventDefault(): NodeOptions["preventDefault"];
  preventDefault(key: NodeOptions["preventDefault"]): this;
  preventDefault(
    key?: NodeOptions["preventDefault"],
  ): NodeOptions["preventDefault"] | this {
    if (key === undefined) return this.getOption("preventDefault");
    this.setOption("preventDefault", key);
    return this;
  }

  autoDraw(): NodeOptions["autoDraw"];
  autoDraw(key: NodeOptions["autoDraw"]): this;
  autoDraw(key?: NodeOptions["autoDraw"]): NodeOptions["autoDraw"] | this {
    if (key === undefined) return this.getOption("autoDraw");
    this.setOption("autoDraw", key);
    return this;
  }
}
