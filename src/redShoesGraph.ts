import * as d3 from "d3";
import { hierarchyYAxis, timeXAxis } from "./axis.ts";
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
  /*markers: {
    markLine: {
      time: number;
      text: string;
    }[];
  };
  heatmaps: {};*/
}

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
    yAxisScrollMarker(yEl); // 重新渲染Y轴滚动条
  });
  svg.call(globalZoomEvent).on("dblclick.zoom", null); //  绑定全局 zoom 事件

  /*const yAxisScrollEvent = d3
    .zoom<SVGGElement, any>()
    .scaleExtent([1, 1]) // 固定缩放比例为1，只允许平移
    .on("zoom", (e) => {
      console.log("zoom", e);
      const scrollBy = yAxisScrollBar.scrollBy(e.transform.y);
      yEl.call(yAxisScrollMarker.scrollBar(scrollBy));
      yAxis.scale().rangeOffset(-scrollBy.thumbOffset());
      heatMapOrLink();
    });
  yEl.call(yAxisScrollEvent);*/
  yEl.on("wheel", (e) => {
    e.stopPropagation();
    console.log("wheel");
    // 每次滚动的固定偏移量
    const dy = 30;
    const deltaY = e.deltaY < 0 ? -dy : dy;
    if (yAxisScrollBar.canScrollBy(deltaY)) {
      const scrollBy = yAxisScrollBar.scrollBy(deltaY);
      yEl.call(yAxisScrollMarker.scrollBar(scrollBy));
      yAxis.scale().rangeOffset(-scrollBy.thumbOffset());
      heatMapOrLink();
      //const newTransform = d3.zoomIdentity.translate(0, y);
      // 应用新的变换
      // yEl.call(yAxisScrollEvent.transform, newTransform);
    }
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
