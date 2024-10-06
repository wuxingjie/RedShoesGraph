import * as d3 from "d3";
import { hierarchyYAxis, ScaleY, timeXAxis } from "./axis.ts";
import { eventHeatmapMarker, eventLinksMarker, eventMarker } from "./event.ts";
import { scrollBar, scrollYMarker } from "./scrollBar.ts";

export type Entity = { id: string; name?: string; parentId?: string };

export type Entities = Entity[];

export type Event = {
  id: string;
  entityIds: string[];
  type: string;
  time: {
    start: number;
    end?: number;
  };
};

export type Events = Event[];

export interface DataConfig {
  entities: Entities;
  events: Events;
  /*markers: {
    markLine: {
      time: number;
      text: string;
    }[];
  };
  heatmaps: {};*/
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface RedShoesGraphConfig {
  container: HTMLElement;
  width: number;
  height: number;
  padding: Padding;
  data: DataConfig;
}

export type AdditionalEntity = Entity & {
  index: number; // tree index
  collapse: false; // 折叠
  show: true; // 当前X轴的时间区间是否显示
};

export interface RedShoesGraphMethods {}

export default function redShoesGraph(
  config: RedShoesGraphConfig,
): RedShoesGraphMethods {
  console.log(config);
  const {
    width,
    height,
    padding,
    data: { entities, events },
  } = config;
  const contentWidth = width - padding.right - padding.left;
  const contentHeight = height - padding.top - padding.bottom;
  //const groupById = d3.group(entities, (d) => String(d.id));
  //const getNameById = (id: string) => groupById.get(id)?.[0].name ?? id;
  const svg = createAndSetupSvg(width, height, padding);
  const content = svg
    .append("g")
    .attr("transform", `translate(${padding.left}, ${padding.top + 20})`);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const xEl = svg.append("g");
  const yEl = content.append("g");
  const heatmapEl = content.append("g");
  const eventLinkEl = content.append("g");
  const eventLink = eventLinksMarker(eventLinkEl, color);
  const eventHeatmap = eventHeatmapMarker(heatmapEl);
  const heatMapOrLink = eventMarker(events, eventLink, eventHeatmap, 2);
  const xAxis = timeXAxis(xEl, events, width, padding)();
  const yAxisScrollBar = scrollBar(contentHeight, contentHeight);
  const yAxis = hierarchyYAxis(
    yEl,
    heatMapOrLink,
    entities,
    yAxisScrollBar,
    color,
    30,
    contentWidth,
  );
  heatMapOrLink.xScale(xAxis.scale()).yAxis(yAxis)(); // 根据区间渲染事件和Y轴
  // 渲染Y轴滚动条
  const yAxisScrollMarker = scrollYMarker(yAxisScrollBar).offset(-10)(yEl);
  const originalXScale = xAxis.scale();
  const globalZoomEvent = d3.zoom<SVGSVGElement, any>().on("zoom", (e) => {
    // 重新计算比例尺
    const rx = e.transform.rescaleX(originalXScale);
    xAxis.setScale(rx)(); // 重新渲染X轴
    heatMapOrLink.xScale(rx)(); // 重新渲染事件连线或者热力图
  });
  svg.call(globalZoomEvent); //  绑定全局 zoom 事件

  const yAxisScrollEvent = d3
    .zoom<SVGGElement, any>()
    //.scaleExtent([1, 1]) // 固定缩放比例为1，只允许平移
    .wheelDelta((e) => {
      console.log("wheel", e);
      console.log("e.deltaY", e.deltaY);
      return e.deltaY;
    })
    .on("zoom", (e) => {
      console.log("滚动。。。");
      // 获取滚动增量（根据事件的 deltaY）
      const deltaY = e.transform.y;
      console.log(deltaY);
      const scrollBy = yAxisScrollBar.scrollBy(deltaY);
      yEl.call(yAxisScrollMarker.scrollBar(scrollBy));
      // yAxis.withScale((s) => s.ra);
      yAxis.scale().rangeStartOffset(-scrollBy().offset);
      heatMapOrLink();
    });
  yEl.call(yAxisScrollEvent);
  yEl.on("wheel", (e) => {
    e.stopPropagation();
  });

  config.container.appendChild(svg.node()!);

  // TODO
  return {};
}

function createAndSetupSvg(width: number, height: number, padding: Padding) {
  const svg = d3.create("svg");
  svg
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .append("defs")
    // append arrow marker
    .append("marker")
    .attr("id", "arrow")
    .attr("markerHeight", 10)
    .attr("markerWidth", 10)
    .attr("refX", 5)
    .attr("refY", 2.5)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", "context-stroke")
    .attr("d", "M0,0 v5 l6,-2.5 Z");
  // 设置剪切区域，避免节点和边超出轴线
  svg
    .append("clipPath")
    .attr("id", "clipView")
    .append("path")
    .attr(
      "d",
      `M${padding.left},0 h${width - padding.left - padding.right} v${height} h${-(width - padding.left - padding.right)} v${-height}z`,
    );
  return svg;
}

function zoomed(
  event: d3.D3ZoomEvent<any, any>,
  x: d3.ScaleTime<number, number>,
  y: ScaleY,
  width: number,
  height: number,
  padding: Padding,
) {
  // 重新计算比例尺
  const rx = event.transform.rescaleX(x);
  // 重新计算点位置
  d3.selectAll<SVGCircleElement, Event>(".nodes circle").attr("cx", (d) =>
    rx(d.time.start),
  );
  // 重新计算连线位置
  const linkGroup = d3.selectAll<SVGPathElement, Event>(".arrowLine");
  linkGroup.selectAll<SVGPathElement, Event>(".path1").attr("d", (d) => {
    const x1 = rx(d.time.start);
    let y1 = y(d.id) || 0;
    let y2 = y(d.entityIds[0]) || 0;
    return `M ${x1},${y1} v ${(y2 - y1) / 2}`;
  });
  linkGroup.selectAll<SVGPathElement, Event>(".path2").attr("d", (d) => {
    const x1 = rx(d.time.start);
    let y1 = y(d.id) || 0;
    let y2 = y(d.entityIds[0]) || 0;
    return `M ${x1},${(y2 - y1) / 2 + y1} V ${y2}`;
  });
  // 重新渲染x轴
  d3.select<SVGGElement, undefined>(".xAxis").call(
    renderXAxis,
    rx,
    width,
    height,
    padding,
  );
  return rx;
}

function drawHeatmap(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  xScale: d3.ScaleTime<number, number>,
  yScale: ScaleY,
  events: Events,
) {
  const ticks = xScale.ticks();
  const tickSize = xScale(ticks[1]) - xScale(ticks[0]);
  const idAndX = events.flatMap((e) => {
    return ticks
      .slice(0, ticks.length - 1)
      .map((tick, tickIndex) => {
        const count = events.filter(
          (ev) =>
            ev.id === e.id &&
            ev.time.start >= tick.getTime() &&
            ev.time.start < ticks[tickIndex + 1].getTime(),
        ).length;
        if (count > 0) {
          return {
            id: e.id,
            tickX: tick,
            count,
          };
        }
        return null;
      })
      .filter((d) => d !== null);
  });
  const count = d3.sum(idAndX, (d) => (d.count > 2 ? 1 : 0));
  const max = d3.max(idAndX, (d) => d.count) ?? 10;
  const color = d3.scaleLinear([0, max], ["white", "orange"]);
  const percentage = count / events.length;
  if (percentage > 0.5) {
    g.selectAll("rect")
      .data(idAndX)
      .join("rect")
      .attr("x", (d) => xScale(d.tickX))
      .attr("y", (d) => yScale(d.id) ?? 0)
      .attr("width", tickSize)
      .attr("height", 20)
      .attr("fill", (d) => `${color(d.count)}`)
      .attr("transform", "translate(0, -10)");
  } else {
    g.selectAll("rect").remove();
  }

  /* d3.select(".heatmap")
    .selectAll("rect")
    .data(dates)
    .join("rect")
    .attr("x", (d) => x(d))
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 10)
    .attr("fill", "lightgray");*/
}

function createScaleX(events: Events, width: number, padding: Padding) {
  let extent = d3.extent(events, (d) => d.time.start);
  return d3
    .scaleTime()
    .domain(extent as [number, number])
    .range([0, width]);
  //.range([padding.left, width - padding.right]);
}

function createScaleY(entities: Entities, height: number, padding: Padding) {
  return d3
    .scalePoint()
    .domain(entities.map((item) => item.id))
    .range([height - padding.bottom, padding.top]);
}

function renderXAxis(
  g: d3.Selection<SVGGElement, undefined, any, undefined>,
  x: d3.ScaleTime<number, number>,
  width: number,
  height: number,
  padding: Padding,
) {
  g.attr("class", "xAxis")
    .attr("transform", `translate(${padding.left}, ${padding.bottom})`)
    .call(
      d3
        .axisTop(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );
}

function renderHierarchyYAxis(
  node: d3.Selection<
    SVGGElement | null,
    d3.HierarchyNode<AdditionalEntity>,
    SVGGElement,
    undefined
  >,
  color: (_: string) => string,
  nodeSize: number,
  supLineWidth: number,
) {
  // 画圈圈
  node
    .append("circle")
    .attr("cx", (d) => d.depth * nodeSize)
    .attr("r", 2.5)
    .attr("fill", (d) => (d.children ? null : "#999"));
  // 文本
  node
    .append("text")
    .attr("dy", "0.32em")
    .attr("x", (d) => d.depth * nodeSize + 6)
    .text((d) => {
      const name = d.data.name ?? d.data.id;
      // TODO 根据缩放时的时间来显示对应区间的个数
      return `${name} (${d.count().value})`;
    });
  // 横线
  node
    .append("line")
    .attr("x1", supLineWidth)
    .attr("x2", (_) => 3 * nodeSize + 60)
    .attr("stroke", (d) => color(d.data.id))
    .attr("stroke-width", 2)
    .attr("stroke-opacity", "0.5");
  // 文本提示
  node.append("title").text((d) =>
    d
      .ancestors()
      .reverse()
      .map((d) => d.data.name)
      .join("/"),
  );
}

function renderHierarchyYAxisLinks(
  links: d3.Selection<
    null,
    d3.HierarchyLink<AdditionalEntity>,
    SVGGElement,
    undefined
  >,
  y: ScaleY,
  nodeSize: number,
) {
  links.join("path").attr(
    "d",
    (d) => `
        M${d.source.depth * nodeSize}, ${y(d.source.data.id)}
        V${y(d.target.data.id)}
        h${nodeSize}
      `,
  );
}

function renderYAxis(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  y: d3.ScalePoint<string>,
  width: number,
  padding: Padding,
  format: (domainValue: string, index: number) => string,
) {
  const supLineWidth = width - padding.right - padding.left;
  g.attr("class", "yAxis")
    .attr("transform", `translate(${padding.left}, 0)`)
    .call(d3.axisLeft(y).tickFormat(format))
    .call((g) =>
      g
        .selectAll(".tick line")
        .attr("x1", supLineWidth)
        .attr("x2", 0)
        .attr("stroke-opacity", "0.5"),
    );
}

function setYAxisStyle(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  supLineWidth: number,
) {
  const colors = ["#419388", "#4795eb", "#d83965"];
  // 去除y轴的竖线
  g.select(".domain").remove();

  g.selectAll(".tick").each(function (_, i) {
    const tick = d3.select(this);
    // 在各项开头增加圆形节点
    tick
      .append("circle")
      .attr("r", 8)
      .attr("fill", colors[i % 3]);
    // 设置文本颜色，和圆形颜色保持一致
    tick.select("text").attr("fill", colors[i % 3]);
    // 设置横线颜色
    tick
      .select("line")
      .attr("x1", supLineWidth)
      .attr("stroke", colors[i % 3])
      .attr("stroke-width", 2);
  });
}

function setYAxisEvent(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
) {
  g.selectAll(".tick").each(function (_) {
    const tick = d3.select(this);
    const left = Number(tick.select("line").attr("x2"));
    const right = Number(tick.select("line").attr("x1"));
    const r = Number(tick.select("circle").attr("r"));
    tick.select("text").on("click", function () {
      const rect = d3.select("rect");
      if (rect.empty()) {
        tick
          .insert("rect", ":first-child")
          .attr("x", left - 3)
          .attr("y", -r - 5)
          .attr("width", right - left + 3)
          .attr("height", r * 2 + 10)
          .attr("fill", "#AAA")
          .attr("fill-stroke", 0.2);
      } else {
        rect.remove();
      }
    });
  });
}

function drawNodes(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  data: Events,
  x: d3.ScaleTime<number, number>,
  y: ScaleY,
  color: (_: string) => string,
) {
  g.attr("class", "nodes")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.time.start))
    .attr("cy", (d) => y(d.id) || null)
    .attr("r", 5)
    .attr("fill", (d) => color(d.entityIds[0]));
}

function drawLinks(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  data: Events,
  x: d3.ScaleTime<number, number>,
  y: ScaleY,
  color: (_: string) => string,
) {
  const lineGroup = g
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("class", "arrowLine");
  lineGroup
    .append("path")
    .attr("class", "path1")
    .attr("stroke-width", "2")
    .attr("d", (d) => {
      const x1 = x(d.time.start);
      let y1 = y(d.id) || 0;
      let y2 = y(d.entityIds[0]) || 0;
      return `M ${x1},${y1} v ${(y2 - y1) / 2}`;
    })
    .attr("stroke", (d) => `${color(d.entityIds[0])}`);
  lineGroup
    .append("path")
    .attr("class", "path2")
    .attr("stroke-width", "2")
    .attr("d", (d) => {
      const x1 = x(d.time.start);
      let y1 = y(d.id) || 0;
      let y2 = y(d.entityIds[0]) || 0;
      return `M ${x1},${(y2 - y1) / 2 + y1} V ${y2}`;
    })
    .attr("fill", "none")
    .attr("stroke", (d) => `${color(d.id)}`)
    .attr("marker-end", "url(#arrow)");
}

function getLinkData(
  event: Event,
  x: d3.ScaleTime<number, number>,
  y: ScaleY,
): string {
  const x1 = x(event.time.start);
  let y1 = y(event.id) || 0;
  let y2 = y(event.entityIds[0]) || 0;
  return `M ${x1},${y1} L ${x1},${y2}`;
}

function drawTooltip(
  g: d3.Selection<SVGSVGElement, undefined, null, undefined>,
  events: Events,
  getNameById: (id: string) => string,
) {
  const tooltip = g
    .append("g")
    .attr("class", "tooltip")
    .style("pointer-events", "none");

  const entered = (event: any, data: Event) => {
    console.log(event);
    const position = d3.pointer(event);
    const curLink = events.filter(
      (item) =>
        (item.id === data.id || item.entityIds[0] === data.id) &&
        data.time.start === item.time.start,
    );
    const textData = [`节点名称: ${getNameById(data.id)}`];
    if (curLink.length !== 0) {
      curLink.forEach((item) => {
        textData.push(`起始节点: ${item.id}`);
        textData.push(`目标节点: ${getNameById(item.entityIds[0])}`);
      });
    }
    tooltip.style("dispaly", null);
    tooltip.attr("transform", `translate(${position[0]}, ${position[1]})`);
    const path = tooltip
      .selectAll("path")
      .data([,])
      .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");
    const text = tooltip
      .selectAll<SVGGraphicsElement, any>("text")
      .data([,])
      .join("text")
      .call((text) =>
        text
          .selectAll("tspan")
          .data(textData)
          .join("tspan")
          .attr("x", 0)
          .attr("y", (_, i) => `${(i - textData.length) * 1.2}em`)
          .attr("fill", "black")
          .text((d) => d),
      );
    const textNode = text.node();
    const { width: w, height: h } = textNode!.getBBox();
    text.attr("transform", `translate(${-w / 2},0)`);
    path.attr(
      "d",
      `M${-w / 2 - 10},-12 v${-h - 10}h${w + 20}v${h + 10}h${-(w / 2) - 7}l-3,5l-3,-5h${-(w / 2) - 7}`,
    );
    tooltip.style("display", "");
  };

  const leaved = () => {
    tooltip.style("display", "none");
  };

  g.selectAll<SVGCircleElement, Event>(".nodes circle")
    .on("pointerenter", entered)
    .on("pointerleave", leaved);
}
