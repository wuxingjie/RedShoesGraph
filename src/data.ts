import { Event, Events } from "./redShoesGraph.ts";
import { ascending, bisector, group, sort } from "d3";

export interface EventData {
  /**
   * All event data
   * */
  (): Events;

  /**
   * Retrieves event data for a given entity ID
   * @param entityId The unique identifier of the entity
   */
  (entityId: string): Events;

  /**
   * Return events with the specified start and end times.
   * @param start The start time
   * @param end The end time
   */
  (start: Date, end: Date): Events;

  /**
   * Query the events within the specified time range by entity ID and the event's start and end times.
   * @param entityId
   * @param start The start time
   * @param end The end time
   */
  (entityId: string, start: Date, end: Date): Events;

  /**
   * Appending an event.
   * Note that events are appended in chronological order,
   * meaning the time of the new event must be greater than the time of the latest existing event.
   * @param event New event
   */
  append(event: Event): EventData;
}

export function eventData(events: Events): EventData {
  const sorted = sort(events, (a, b) => ascending(a.time.start, b.time.start));

  const grouped = group(events, (d) => d.id);
  // 对分组中的每组数据按 `time.start` 排序
  grouped.forEach((group) => {
    group.sort((a, b) => ascending(a.time.start, b.time.start));
  });
  // 创建 bisector
  const bisect = bisector<Event, Date>((d) => d.time.start).left;
  function fn(): Events;
  function fn(entityId: string): EventData;

  function fn(entityId: string, start: Date, end: Date): Events;
  function fn(
    startOrId?: string | Date,
    startOrEnd?: Date,
    end?: Date,
  ): EventData | Events {
    if (typeof startOrId === "string") {
      if (startOrEnd && end) {
        const entityEvents = grouped.get(startOrId) ?? [];
        // 查找开始和结束位置
        const startIndex = bisect(entityEvents, startOrEnd);
        const endIndex = bisect(entityEvents, end);
        // 获取区间内的所有日期
        return entityEvents.slice(startIndex, endIndex);
      } else {
        return grouped.get(startOrId) ?? [];
      }
    } else if (startOrId && startOrEnd) {
      // 查找开始和结束位置
      const startIndex = bisect(sorted, startOrId);
      const endIndex = bisect(sorted, startOrEnd);
      // 获取区间内的所有日期
      return sorted.slice(startIndex, endIndex);
    }
    return sorted;
  }

  function checkAndPushEvent(events: Events, event: Event) {
    const lastEvent = sorted[sorted.length - 1];
    if (event.time.start < (lastEvent?.time.start ?? 0)) {
      throw new Error(
        "The time of the new event must be greater than the time of the latest existing event.",
      );
    }
    events.push(event);
  }

  fn.append = (event: Event) => {
    checkAndPushEvent(sorted, event);
    const entityEvents = grouped.get(event.id) ?? [];
    checkAndPushEvent(entityEvents, event);
    grouped.set(event.id, entityEvents);
    return fn;
  };

  return fn;
}
