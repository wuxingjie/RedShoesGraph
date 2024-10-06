import * as d3 from "d3";
import { Entities, Entity, Events, Padding } from "./redShoesGraph.ts";
import { EventMarker } from "./event.ts";
import { ScrollBar } from "./scrollBar.ts";

export interface ScaleY {
  (id: string): number | undefined;
  domain(): string[];
  domain(ids: string[]): this;
  rangeStartOffset(n: number): this;
  ticks(): d3.HierarchyNode<AdditionalEntity>[];
  links(): d3.HierarchyLink<AdditionalEntity>[];
}

export type AdditionalEntity = Entity & {
  index: number; // tree index
  collapse: boolean; // 折叠
  show: boolean; // 更改当前X轴的时间区间是否显示
};

export function hierarchyScaleY(entities: Entities, nodeSize: number): ScaleY {
  function createRootNode(entities: Entities) {
    return d3
      .stratify<AdditionalEntity>()
      .id((d) => d.id)
      .parentId((d) => d.parentId)(
        // 注意下面eachBefore里面添加了一些属性,所以as AdditionalEntity[]
        entities as AdditionalEntity[],
      )
      .eachBefore(
        ((i) => (d) => {
          d.data.index = i++;
          d.data.show = true;
          d.data.collapse = d.data.collapse ?? false;
        })(0),
      );
  }
  let root = createRootNode(entities);
  const nodes = root.descendants();
  const nodesById = new Map(nodes.map((n) => [n.data.id, n]));
  const _scale = d3.scaleLinear(
    [0, nodes.length],
    [0, nodes.length * nodeSize],
  );
  function scaleY(id: string): number | undefined {
    const index = nodesById.get(id)?.data.index;
    return index !== undefined ? _scale(index) : undefined;
  }

  let domainValues: string[] = entities.map((e) => e.id);
  function domain(): string[];
  function domain(ids: string[]): ScaleY;
  function domain(ids?: string[]): ScaleY | string[] {
    if (ids) {
      domainValues = ids;
      return scaleY;
    } else {
      return domainValues;
    }
  }

  const [start, end] = _scale.range();
  function rangeStartOffset(n: number): ScaleY {
    _scale.range([start + n, end + n]);
    return scaleY;
  }

  function ticks(): d3.HierarchyNode<AdditionalEntity>[] {
    const filtered = new Map<string, AdditionalEntity>();
    domainValues.forEach((id) => {
      const n = nodesById.get(id)!;
      for (const ancestor of n.ancestors().reverse()) {
        if (!filtered.has(ancestor.data.id)) {
          filtered.set(ancestor.data.id, ancestor.data);
        }
        // 如果节点collapse， break掉，子节点就不会加入进来
        if (ancestor.data.collapse) break;
      }
    });
    if (filtered.size === 0) {
      root = d3.hierarchy({} as AdditionalEntity);
      return [];
    }
    root = createRootNode(
      Array.from(filtered.values()).sort((a, b) => a.index - b.index),
    );
    return root.descendants();
  }

  function links(): d3.HierarchyLink<AdditionalEntity>[] {
    return root.links();
  }

  scaleY.domain = domain;
  scaleY.rangeStartOffset = rangeStartOffset;
  scaleY.ticks = ticks;
  scaleY.links = links;
  return scaleY;
}

export interface HierarchyYAxis {
  (): this;
  scale(): ScaleY;
  withScale(fn: (s: ScaleY) => ScaleY): this;
}

export function hierarchyYAxis(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  eventMarker: EventMarker,
  entities: Entities,
  scrollBar: ScrollBar,
  color: (_: string) => string,
  nodeSize: number,
  supLineWidth: number,
): HierarchyYAxis {
  container.attr("class", "hierarchyYAxis");
  // 这个东西的主要目的是当背景，为了触发事件，因为svg g元素空白区域不触发事件
  const transparent = container
    .append("rect")
    .attr("width", 100)
    .attr("height", 200)
    .attr("fill", "transparent");
  let scaleY = hierarchyScaleY(entities, nodeSize);
  const ticks = container.append("g").attr("class", "ticks");
  const yAxisLinks = container
    .append("g")
    .attr("class", "yAxisLinks")
    .attr("fill", "none")
    .attr("stroke", "#999");

  function render() {
    const yTicks = scaleY.ticks();
    const contentLength = yTicks.length * nodeSize;
    // 设置滚动条内容高度
    scrollBar.contentLength(contentLength);
    transparent.attr("height", contentLength);
    const tickGroup = ticks
      .selectAll("g")
      .data(yTicks)
      .join("g")
      .attr("transform", (d) => `translate(0,${scaleY(d.data.id)})`);

    // 画圈圈
    tickGroup
      .selectAll("circle")
      .data((d) => [d])
      .join("circle")
      .attr("cx", (d) => d.depth * nodeSize)
      .attr("r", 4)
      .attr("fill", (d) => (d.children ? null : "#999"))
      .on("click", (_, d) => {
        console.log("collapse");
        d.data.collapse = !d.data.collapse;
        eventMarker();
      });
    // 文本
    tickGroup
      .selectAll("text")
      .data((d) => [d])
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
      .selectAll("line")
      .data((d) => [d])
      .join("line")
      .attr("x1", supLineWidth)
      .attr("x2", (_) => 3 * nodeSize + 60)
      .attr("stroke", (d) => color(d.data.id))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", "0.5");
    // 文本提示
    tickGroup
      .selectAll("title")
      .data((d) => [d])
      .join("line")
      .text((d) =>
        d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join("/"),
      );

    // 父子连线
    yAxisLinks
      .selectAll("path")
      .data(scaleY.links())
      .join("path")
      .attr(
        "d",
        (d) => `
        M${d.source.depth * nodeSize}, ${scaleY(d.source.data.id)}
        V${scaleY(d.target.data.id)}
        h${nodeSize}
      `,
      );
    return render;
  }
  render.scale = () => scaleY;
  render.withScale = (fn: (s: ScaleY) => ScaleY) => {
    scaleY = fn(scaleY);
    return render;
  };
  return render;
}

export interface XAxis {
  (): this;
  scale(): d3.ScaleTime<number, number>;
  setScale(s: d3.ScaleTime<number, number>): this;
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
    .range([150, width]);
  function render() {
    container.call(
      d3
        .axisTop(x)
        .ticks((width - padding.left - padding.right) / 80)
        .tickSizeOuter(0),
    );
    return render;
  }
  render.scale = () => x;
  render.setScale = (s: d3.ScaleTime<number, number>) => {
    x = s;
    return render;
  };
  return render;
}
