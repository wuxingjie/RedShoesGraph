import * as d3 from "d3";
import { AdditionalEntity } from "./redShoesGraph.ts";

export function hierarchyScaleY(
  nodes: d3.HierarchyNode<AdditionalEntity>[],
  nodeSize: number,
): ScaleY {
  const linear = d3.scaleLinear(
    [0, nodes.length - 1],
    [0, nodes.length * nodeSize],
  );
  const nodesById = new Map(nodes.map((n) => [n.data.id, n]));
  function scaleY(id: string): number | undefined {
    const index = nodesById.get(id)?.data.index;
    return index !== undefined ? linear(index) : undefined;
  }
  scaleY.domain = () => nodes.map((n) => n.data.id);
  return scaleY;
}

export interface ScaleY {
  (id: string): number | undefined;
  domain(): string[];
}
