import * as d3 from "d3";
import { Entities, Entity, Events, Padding } from "./redShoesGraph.ts";
import { ScaleTime } from "d3";

export interface ScaleY {
  (id: string): number | undefined;
  domain(): string[];
}
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

export interface HierarchyYAxis {
  (): void;
  scale(): ScaleY;
}

export type AdditionalEntity = Entity & {
  index: number; // tree index
  collapse: false; // 折叠
  show: true; // 更加当前X轴的时间区间是否显示
};

export function hierarchyYAxis(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  entities: Entities,
  color: (_: string) => string,
  nodeSize: number,
  supLineWidth: number,
): HierarchyYAxis {
  container.attr("class", "hierarchyYAxis");
  const root = d3
    .stratify<AdditionalEntity>()
    .id((d) => d.id)
    .parentId((d) => d.parentId)(
      // 注意下面eachBefore里面修改了index属性
      // map 一下，避免修改原始对象，看情况其实也可以自己修改原始对象
      entities.map((e) => ({ ...e, index: 0 })) as AdditionalEntity[],
    )
    .eachBefore(
      (
        (i) => (d) =>
          (d.data.index = i++)
      )(0),
    );
  const nodes = root.descendants();
  const scaleY = hierarchyScaleY(nodes, nodeSize);
  const ticks = container.append("g").attr("class", "ticks");
  const yAxisLinks = container
    .append("g")
    .attr("class", "yAxisLinks")
    .attr("fill", "none")
    .attr("stroke", "#999");
  function render() {
    const tickGroup = ticks
      .selectAll()
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(0,${scaleY(d.data.id)})`);

    // 画圈圈
    tickGroup
      .join("circle")
      .attr("cx", (d) => d.depth * nodeSize)
      .attr("r", 2.5)
      .attr("fill", (d) => (d.children ? null : "#999"));
    // 文本
    tickGroup
      .join("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => d.depth * nodeSize + 6)
      .text((d) => {
        const name = d.data.name ?? d.data.id;
        // TODO 根据缩放时的时间来显示对应区间的个数,use sum()
        return `${name} (${d.count().value})`;
      });
    // 横线
    tickGroup
      .join("line")
      .attr("x1", supLineWidth)
      .attr("x2", (_) => 3 * nodeSize + 60)
      .attr("stroke", (d) => color(d.data.id))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", "0.5");
    // 文本提示
    tickGroup.join("title").text((d) =>
      d
        .ancestors()
        .reverse()
        .map((d) => d.data.name)
        .join("/"),
    );

    // 父子连线
    yAxisLinks
      .selectAll()
      .data(root.links())
      .join("path")
      .attr(
        "d",
        (d) => `
        M${d.source.depth * nodeSize}, ${scaleY(d.source.data.id)}
        V${scaleY(d.target.data.id)}
        h${nodeSize}
      `,
      );
  }
  render.scale = () => scaleY;
  return render;
}

export interface XAxis {
  (): void;
  scale(): d3.ScaleTime<number, number>;
}

export function timeXAxis(
  container: d3.Selection<SVGGElement, undefined, any, undefined>,
  events: Events,
  width: number,
  padding: Padding,
): XAxis {
  container = container
    .attr("class", "xAxis")
    .attr("transform", `translate(${padding.left}, ${padding.bottom})`);
  const extent = d3.extent(events, (d) => d.time.start);
  let x = d3
    .scaleTime()
    .domain(extent as [number, number])
    .range([0, width]);
  function render() {
    container.call(
      d3
        .axisTop(x)
        .ticks((width - padding.left - padding.right) / 80)
        .tickSizeOuter(0),
    );
  }
  render.scale = () => x;
  return render;
}
