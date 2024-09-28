import * as d3 from "d3";
import { ScaleY } from "./axis.ts";
import { Events } from "./redShoesGraph.ts";

export interface EventLink {
  (x: d3.ScaleTime<number, number>, y: ScaleY, events: Events): void;
  remove(): void;
}
export function eventLinks(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
): EventLink {
  const links = container
    .attr("class", "eventLinks")
    .append("g")
    .attr("class", "links");
  const linkPoint = container.append("g").attr("class", "points");

  function render(x: d3.ScaleTime<number, number>, y: ScaleY, events: Events) {
    links.attr("class", "eventLinks").attr("clip-path", "url(#clipView)");
  }

  return render;
}
