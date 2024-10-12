import * as d3 from "d3";
import { HierarchyYAxis, ScaleY } from "./axis.ts";
import { Events } from "./redShoesGraph.ts";
import type { Event } from "./redShoesGraph.ts";
import { EventData } from "./data.ts";

export interface EventLinkMarker {
  (x: d3.ScaleTime<number, number>, y: ScaleY, events: Events): this;
  remove(): this;
}
export function eventLinksMarker(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  color: (_: string) => string,
): EventLinkMarker {
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
      .data(
        events.filter(
          (d) => y(d.id) !== undefined && y(d.entityIds[0]) !== undefined,
        ),
      )
      .join("g")
      .attr("class", "arrowLine");
    // 第一节线段
    linkGroups
      .selectAll("path.path1")
      .data((d) => [d])
      .join("path")
      .attr("class", "path1")
      .attr("stroke-width", "2")
      .attr("d", (d) => {
        const x1 = x(d.time.start);
        const y1 = y(d.id) || 0;
        const y2 = y(d.entityIds[0]) || 0;
        return `M ${x1},${y1} v ${(y2 - y1) / 2}`;
      })
      .attr("stroke", (d) => `${color(d.entityIds[0])}`);
    // 第二节线段
    linkGroups
      .selectAll("path.path2")
      .data((d) => [d])
      .join("path")
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
      .data(events.filter((d) => y(d.id) !== undefined))
      .join("circle")
      .attr("cx", (d) => x(d.time.start))
      .attr("cy", (d) => y(d.id) || null)
      .attr("r", 5)
      .attr("fill", (d) => color(d.entityIds[0]));
    return render;
  }

  render.remove = () => {
    links.selectAll("g").remove();
    linkPoints.selectAll("circle").remove();
    return render;
  };
  return render;
}

type IdAndBins = {
  id: string;
  bins: {
    id: string;
    x0: number | undefined;
    x1: number | undefined;
    count: number;
  }[];
}[];

export interface EventHeatmapMaker {
  (
    xScale: d3.ScaleTime<number, number>,
    yScale: ScaleY,
    idAndBins: IdAndBins,
  ): this;

  remove(): this;
}

export function eventHeatmapMarker(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
): EventHeatmapMaker {
  container.attr("class", "heatmap");

  function render(
    xScale: d3.ScaleTime<number, number>,
    yScale: ScaleY,
    idAndBins: IdAndBins,
  ): EventHeatmapMaker {
    const maxCount =
      d3.max(idAndBins, (d) => d3.max(d.bins, (d) => d.count)) ?? 10;
    const color = d3.scaleLinear([0, maxCount], ["white", "orange"]);
    container
      .selectAll("g")
      .data(idAndBins)
      .join("g")
      .selectAll("rect")
      .data((d) => d.bins)
      .join("rect")
      .attr("x", (d) => xScale(d.x0!))
      .attr("y", (d) => yScale(d.id) ?? 0)
      .attr("width", (d) => xScale(d.x1!) - xScale(d.x0!))
      .attr("height", 20)
      .attr("fill", (d) => `${color(d.count)}`)
      .attr("transform", "translate(0, -10)");
    return render;
  }
  render.remove = () => {
    // 移除热力图
    container.selectAll("g").remove();
    return render;
  };
  return render;
}

export interface EventMarker {
  xScale(xScale: d3.ScaleTime<number, number>): this;
  yAxis(yAxis: HierarchyYAxis): this;
  (): this;
}

/**
 *
 * @param events
 * @param eventLink
 * @param eventHeatmap
 * @param thresholdSize 单个格子的数量限制,超过就画热力图
 */
export function eventMarker(
  events: EventData,
  eventLink: EventLinkMarker,
  eventHeatmap: EventHeatmapMaker,
  thresholdSize: number,
): EventMarker {
  let _xScale: d3.ScaleTime<number, number> | undefined = undefined;
  let _yAxis: HierarchyYAxis | undefined = undefined;

  function render() {
    const xScale =
      _xScale ??
      (() => {
        throw new Error("xScale is null or undefined");
      })();
    const yAxis =
      _yAxis ??
      (() => {
        throw new Error("yAxis is null or undefined");
      })();
    const yScale = yAxis.scale();
    const ticks = xScale.ticks();
    const numTicks = ticks.map((d) => d.getTime());
    const { 0: start, 1: end } = xScale.domain();
    const xDomain: [number, number] = [start.getTime(), end.getTime()];
    // TODO 后面可以优化成:先获取id对应的数据,然后再过滤
    const filteredEvents = events(start, end);
    /*// 过滤出的事件比总的小, 就是过滤出来的,不然直接用全部的
    const eventById =
      filteredEvents.length < events.length
        ? d3.group(filteredEvents, (d) => d.id)
        : allEventById;*/

    // 设置只显示指定维度节点,并且重新渲染X坐标轴，只显示对应区间的维度
    yAxis.withScale((s) =>
      s.domain([
        ...new Set(filteredEvents.flatMap((e) => [e.id, ...e.entityIds])),
      ]),
    )();
    const bisect = d3
      .bin<Event, number>()
      .value((d) => d.time.start)
      .domain(xDomain)
      .thresholds(numTicks);
    // TODO 父节点收缩起来考虑使用Rollup
    const idAndBins = d3.map(
      yScale.ticks().map((t) => t.data.id), // 只显示Y轴对应的热力图
      (id) => {
        const bins = bisect(events(id))
          .filter((d) => d.length > 0) // 过滤掉空数组,空的没必要显示
          .map((b) => ({
            id,
            x0: b.x0,
            x1: b.x1,
            count: b.length,
          }));
        return { id, bins };
      },
    );
    // 通过操作阈值的数量
    const thresholdCount = d3.sum(idAndBins, (d) =>
      d3.sum(d.bins, (d) => (d.count > thresholdSize ? 1 : 0)),
    );
    const count = d3.sum(idAndBins, (d) => d.bins.length);
    const percentage = thresholdCount / count;

    // 如果阈值显示热力图
    if (percentage > 0.1) {
      eventHeatmap(xScale, yScale, idAndBins);
      eventLink.remove();
    } else {
      eventLink(xScale, yScale, filteredEvents);
      eventHeatmap.remove();
    }

    return render;
  }

  render.xScale = (xScale: d3.ScaleTime<number, number>) => {
    _xScale = xScale;
    return render;
  };

  render.yAxis = (yAxis: HierarchyYAxis) => {
    _yAxis = yAxis;
    return render;
  };

  return render;
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
