import * as d3 from "d3";
import { ScaleY } from "./axis.ts";
import { Events } from "./redShoesGraph.ts";
import type { Event } from "./redShoesGraph.ts";

export interface EventLink {
  (x: d3.ScaleTime<number, number>, y: ScaleY, events: Events): void;
  remove(): void;
}
export function eventLinks(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  color: (_: string) => string,
): EventLink {
  const links = container
    .attr("class", "events")
    .attr("clip-path", "url(#clipView)")
    .append("g")
    .attr("class", "links");

  const linkPoints = container.append("g").attr("class", "points");

  function render(x: d3.ScaleTime<number, number>, y: ScaleY, events: Events) {
    // 画线
    const linkGroups = links
      .selectAll("g")
      .data(events)
      .join("g")
      .attr("class", "arrowLine");
    linkGroups
      .append("path")
      .attr("class", "path1")
      .attr("stroke-width", "2")
      .attr("d", (d) => {
        const x1 = x(d.time.start);
        const y1 = y(d.id) || 0;
        const y2 = y(d.entityIds[0]) || 0;
        return `M ${x1},${y1} v ${(y2 - y1) / 2}`;
      })
      .attr("stroke", (d) => `${color(d.entityIds[0])}`);
    linkGroups
      .append("path")
      .attr("class", "path2")
      .attr("stroke-width", "2")
      .attr("d", (d) => {
        const x1 = x(d.time.start);
        const y1 = y(d.id) || 0;
        const y2 = y(d.entityIds[0]) || 0;
        return `M ${x1},${(y2 - y1) / 2 + y1} V ${y2}`;
      })
      .attr("fill", "none")
      .attr("stroke", (d) => `${color(d.id)}`)
      .attr("marker-end", "url(#arrow)");
    // 画点
    linkPoints
      .selectAll("circle")
      .data(events)
      .join("circle")
      .attr("cx", (d) => x(d.time.start))
      .attr("cy", (d) => y(d.id) || null)
      .attr("r", 5)
      .attr("fill", (d) => color(d.entityIds[0]));
  }

  render.remove = () => {
    container.remove();
  };
  return render;
}

export interface Heatmap {
  (xScale: d3.ScaleTime<number, number>, yScale: ScaleY): void;
}

/**
 *
 * @param container
 * @param events
 * @param eventLink
 * @param thresholdSize 单个格子的数量限制,超过就画热力图
 */
export function heatmapOrLink(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  events: Events,
  eventLink: EventLink,
  thresholdSize: number,
): Heatmap {
  container.attr("class", "heatmap");
  const rangeEvents = rangeEvent(events);
  const allEventById = d3.group(events, (d) => d.id);

  function render(xScale: d3.ScaleTime<number, number>, yScale: ScaleY) {
    const ticks = xScale.ticks();
    const numTicks = ticks.map((d) => d.getTime());
    const { 0: start, 1: end } = xScale.domain();
    const xDomain: [number, number] = [start.getTime(), end.getTime()];
    // TODO 后面可以优化成:先获取id对应的数据,然后再过滤
    const filteredEvents = rangeEvents(start, end);
    // 过滤出的事件比总的小, 就是过滤出来的,不然直接用全部的
    const eventById =
      filteredEvents.length < events.length
        ? d3.group(filteredEvents, (d) => d.id)
        : allEventById;
    // TODO 父节点收缩起来考虑使用Rollup
    const idAndBins = d3.map(eventById.keys(), (id) => {
      const events = eventById.get(id) as Event[];
      const bisect = d3
        .bin<Event, number>()
        .value((d) => d.time.start)
        .domain(xDomain)
        .thresholds(numTicks);
      const bins = bisect(events).map((b) => ({
        x0: b.x0,
        x1: b.x1,
        count: b.length,
      }));
      return { id, bins };
    });
    // 通过操作阈值的数量
    const count = d3.sum(idAndBins, (d) =>
      d3.sum(d.bins, (d) => (d.count > thresholdSize ? 1 : 0)),
    );
    const maxCount =
      d3.max(idAndBins, (d) => d3.max(d.bins, (d) => d.count)) ?? 10;
    const color = d3.scaleLinear([0, maxCount], ["white", "orange"]);
    const percentage = count / events.length;
    // 如果大于50%的都超过了阈值
    if (percentage > 0.5) {
      container
        .selectAll("g")
        .data(idAndBins)
        .join("g")
        .call((g) => {
          g.selectAll("rect")
            .data((d) => d.bins)
            .join("rect")
            .attr("x", (d) => xScale(d.x0!))
            .attr("y", yScale(g.datum().id) ?? 0)
            .attr("width", (d) => xScale(d.x1!) - xScale(d.x0!))
            .attr("height", 20)
            .attr("fill", (d) => `${color(d.count)}`)
            .attr("transform", "translate(0, -10)");
        });
      // 移除事件节点连线
      eventLink.remove();
    } else {
      // 移除热力图
      container.selectAll("g").remove();
      // 画事件节点连线
      eventLink(xScale, yScale, filteredEvents);
    }
  }
  return render;
}

/**
 * 获取时间区间内事件
 * @param events
 */
function rangeEvent(events: Events): (start: Date, end: Date) => Events {
  const sorted = d3.sort(events, (a, b) =>
    d3.ascending(a.time.start, b.time.start),
  );
  // 创建 bisector
  const bisect = d3.bisector<Event, Date>((d) => d.time.start).left;
  return (start: Date, end: Date) => {
    // 查找开始和结束位置
    const startIndex = bisect(sorted, start);
    const endIndex = bisect(sorted, end);
    // 获取区间内的所有日期
    return sorted.slice(startIndex, endIndex);
  };
}

function eventNodeTooltip(
  el: d3.Selection<SVGCircleElement, Event, null, undefined>,
  events: Events,
  getNameById: (id: string) => string,
) {
  const tooltip = el
    .append("g")
    .attr("class", "tooltip")
    .style("pointer-events", "none");

  const entered = (event: any, data: Event) => {
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

  el.selectAll<SVGCircleElement, Event>(".nodes circle")
    .on("pointerenter", entered)
    .on("pointerleave", leaved);
}
