import * as d3 from "d3";
import { Entities, Entity, Events, Padding } from "./redShoesGraph.ts";
import { EventMarker } from "./event.ts";
import { ScrollBar, ScrollBarMarker } from "./scrollBar.ts";

export interface ScaleY {
  (id: string): number | undefined;
  domain(): string[];
  domain(ids: string[]): this;
  range(): [number, number];
  range(r: [number, number]): this;
  scrollBar(s: ScrollBar): this;
  ticks(): d3.HierarchyNode<AdditionalEntity>[];
  links(): d3.HierarchyLink<AdditionalEntity>[];
}

export type AdditionalEntity = Entity & {
  order: number;
  index: number; // tree index
  leafIndex: number;
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
        ((i, leafIndex) => (d) => {
          d.data.index = d.data.order = i++;
          if (!d.children || d.children.length === 0) {
            d.data.leafIndex = leafIndex++;
          }
          d.data.show = true;
          d.data.collapse = d.data.collapse ?? false;
        })(0, 0),
      );
  }

  let _domain: string[] = entities.map((e) => e.id);
  let _ticks: d3.HierarchyNode<AdditionalEntity>[] = [];
  let _scrollBar: ScrollBar | undefined = undefined;
  const _root = createRootNode(entities);
  const _allNodes = _root.descendants();
  const _nodesById = d3.index(_allNodes, (n) => n.data.id);
  let _viewNodes = _nodesById;
  const _scale = d3.scaleLinear(
    [0, _allNodes.length],
    [0, _allNodes.length * nodeSize],
  );

  function scaleY(id: string): number | undefined {
    const index = _viewNodes.get(id)?.data.index;
    if (index === undefined) {
      return undefined;
    }
    const scale = _scale(index);
    if (_scrollBar) {
      return scale < _scrollBar.containerLength() ? scale : undefined;
    }
    return scale;
  }

  function domain(): string[];
  function domain(ids: string[]): ScaleY;
  function domain(ids?: string[]): ScaleY | string[] {
    if (ids) {
      _domain = ids;
      return scaleY;
    } else {
      return _domain;
    }
  }

  function range(): [number, number];
  function range(r: [number, number]): ScaleY;
  function range(r?: [number, number]): ScaleY | [number, number] {
    if (r) {
      _scale.range(r);
      return scaleY;
    } else {
      return _scale.range() as [number, number];
    }
  }

  function scrollBar(s: ScrollBar) {
    _scrollBar = s;
    return scaleY;
  }

  function ticks(): d3.HierarchyNode<AdditionalEntity>[] {
    const filtered = new Map<string, d3.HierarchyNode<AdditionalEntity>>();
    _domain.forEach((id) => {
      const n = _nodesById.get(id)!;
      for (const ancestor of n.ancestors().reverse()) {
        if (!filtered.has(ancestor.data.id)) {
          filtered.set(ancestor.data.id, ancestor);
        }
        // 如果节点collapse,break掉,子节点就不会加入进来
        if (ancestor.data.collapse) break;
      }
    });
    if (filtered.size === 0) {
      return (_ticks = []);
    }
    _scrollBar?.contentLength(filtered.size * nodeSize);
    const scrollNum = (_scrollBar?.scrollOffset() ?? 0) / nodeSize;
    _ticks = Array.from(filtered.values())
      .sort((a, b) => a.data.order - b.data.order)
      // 处理滚动,和 reset index
      .filter(
        ((nodeIndex, leafIndex) => (n) => {
          // leaf
          if (!n.children || n.children.length === 0) {
            if (leafIndex++ < scrollNum) {
              return false;
            }
          }
          if (_scrollBar && _scale(nodeIndex) >= _scrollBar.containerLength()) {
            return false;
          }
          // reset index
          n.data.index = nodeIndex++;
          return true;
        })(0, 0),
      );

    _viewNodes = d3.index(_ticks, (n) => n.data.id);
    return _ticks;
    /* root = createRootNode(
      Array.from(filtered.values()).sort((a, b) => a.index - b.index),
    );
    return root.descendants();*/
  }

  function links(): d3.HierarchyLink<AdditionalEntity>[] {
    return _ticks
      .filter((n) => n.parent)
      .map((n) => ({ source: n.parent!, target: n }));
    //return root.links();
  }

  scaleY.domain = domain;
  scaleY.range = range;
  scaleY.scrollBar = scrollBar;
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
  scrollBarMarker: ScrollBarMarker,
  color: (_: string) => string,
  nodeSize: number,
  contentWidth: number,
  contentHeight: number,
): HierarchyYAxis {
  container.attr("class", "hierarchyYAxis");
  // 这个东西的主要目的是当背景，为了触发事件，因为svg g元素空白区域不触发事件
  const transparent = container
    .append("rect")
    .attr("width", 100)
    .attr("height", contentHeight)
    .attr("fill", "transparent");
  let scaleY = hierarchyScaleY(entities, nodeSize).scrollBar(
    scrollBarMarker.scrollBar(),
  );
  const yAxisLinks = container
    .append("g")
    .attr("class", "yAxisLinks")
    .attr("fill", "none")
    .attr("stroke", "#999");
  const ticks = container.append("g").attr("class", "ticks");

  function render() {
    const yTicks = scaleY.ticks();
    const contentLength = yTicks.length * nodeSize;
    transparent.attr("height", contentLength);
    // 渲染滚动条
    scrollBarMarker(container);
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
      .attr("x1", contentWidth)
      .attr("x2", (_) => 3 * nodeSize + 60)
      .attr("stroke", (d) => color(d.data.id))
      .attr("stroke-width", 2);
    // 文本提示
    tickGroup
      .selectAll("title")
      .data((d) => [d])
      .join("title")
      .text((d) =>
        d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join("/"),
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
    .attr("transform", `translate(${padding.left}, 20)`);
  const extent = d3.extent(events, (d) => d.time.start);
  let x = d3
    .scaleTime()
    .domain(extent as [number, number])
    .range([120, width]);
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
