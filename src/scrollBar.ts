import * as d3 from "d3";

type ScrollState = { canScroll: boolean; thumbLength: number; offset: number };

export interface ScrollBar {
  (): ScrollState;
  containerLength(): number;
  containerLength(length: number): this;
  contentLength(): number;
  contentLength(length: number): this;
  scrollBy(delta: number): this;
}

export function scrollBar(
  containerLength: number,
  contentLength: number,
): ScrollBar {
  let _containerLength = containerLength;
  let _contentLength = contentLength;
  let _thumbOffset = 0;
  let _delta = 0;

  function fn(): ScrollState {
    const canScroll = _contentLength > _containerLength; // 判断是否可以滚动
    const thumbLength = canScroll
      ? (_containerLength / _contentLength) * _containerLength
      : _containerLength;
    if (canScroll) {
      _thumbOffset = Math.max(
        0,
        Math.min(_contentLength - _containerLength, _thumbOffset + _delta),
      );
    }
    return {
      thumbLength,
      offset: _thumbOffset,
      canScroll, // 是否可滚动的状态
    };
  }

  function containerLengthFn(): number;
  function containerLengthFn(length: number): ScrollBar;
  function containerLengthFn(length?: number): ScrollBar | number {
    if (length !== undefined) {
      _containerLength = length;
      return fn;
    }
    return _containerLength;
  }
  fn.containerLength = containerLengthFn;

  function contentLengthFn(): number;
  function contentLengthFn(h: number): ScrollBar;
  function contentLengthFn(h?: number): ScrollBar | number {
    if (h !== undefined) {
      _contentLength = h;
      return fn;
    }
    return _containerLength;
  }
  fn.contentLength = contentLengthFn;

  fn.scrollBy = (delta: number): ScrollBar => {
    _delta = delta;
    return fn;
  };

  return fn;
}

export interface ScrollBarMarker {
  (container: d3.Selection<SVGGElement, undefined, null, undefined>): this;

  scrollBar(s: ScrollBar): this;

  /**
   * 滚动条偏移
   * @param n X轴或者Y轴上的滚动条的offset,左右或者上下偏移
   */
  offset(n: number): this;

  scrollWidth(n: number): this;
}

export function scrollBarMarker(
  scrollBar: ScrollBar,
  scrollBarType: "scrollX" | "scrollY",
): ScrollBarMarker {
  let _scrollBar = scrollBar;
  let _offset = 0;
  let _scrollWidth = 5;

  function fn(
    container: d3.Selection<SVGGElement, undefined, null, undefined>,
  ): ScrollBarMarker {
    const state = _scrollBar();
    if (!state.canScroll) {
      container.select(".scroller").remove();
      return fn;
    }
    const rect = container
      .selectAll(".scroller")
      .data([state])
      .join("rect")
      .attr("class", "scroller")
      .attr("fill", "pink");
    if (scrollBarType === "scrollY") {
      rect
        .attr("width", _scrollWidth)
        .attr("height", (d) => d.thumbLength)
        .attr("transform", (d) => `translate(${_offset}, ${d.offset})`);
    } else {
      rect
        .attr("width", (d) => d.thumbLength)
        .attr("height", _scrollWidth)
        .attr("transform", (d) => `translate(${d.offset}, ${_offset})`);
    }
    return fn;
  }

  fn.scrollBar = (s: ScrollBar) => {
    _scrollBar = s;
    return fn;
  };

  fn.offset = (n: number) => {
    _offset = n;
    return fn;
  };

  fn.scrollWidth = (n: number) => {
    _scrollWidth = n;
    return fn;
  };

  return fn;
}

export function scrollXMarker(scrollBar: ScrollBar) {
  return scrollBarMarker(scrollBar, "scrollX");
}

export function scrollYMarker(scrollBar: ScrollBar) {
  return scrollBarMarker(scrollBar, "scrollY");
}
