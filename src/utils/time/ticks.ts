import {
  durationDay,
  durationHour,
  durationMinute,
  durationMonth,
  durationSecond,
  durationWeek,
  durationYear,
  millisecond,
  second,
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSunday,
  timeYear,
  unixDay,
  utcHour,
  utcMinute,
  utcMonth,
  utcSunday,
  utcYear,
} from "./intervals.ts";
import { bisector } from "../bisector.ts";
import { CountableTimeInterval, TimeInterval } from "./timeInterval.ts";
import { isNumeric } from "../typeCheck.ts";
import { tickStep } from "../ticks.ts";

function ticker(
  year: CountableTimeInterval,
  month: CountableTimeInterval,
  week: CountableTimeInterval,
  day: CountableTimeInterval,
  hour: CountableTimeInterval,
  minute: CountableTimeInterval,
) {
  const tickIntervals: [CountableTimeInterval, number, number][] = [
    [second, 1, durationSecond],
    [second, 5, 5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute, 1, durationMinute],
    [minute, 5, 5 * durationMinute],
    [minute, 15, 15 * durationMinute],
    [minute, 30, 30 * durationMinute],
    [hour, 1, durationHour],
    [hour, 3, 3 * durationHour],
    [hour, 6, 6 * durationHour],
    [hour, 12, 12 * durationHour],
    [day, 1, durationDay],
    [day, 2, 2 * durationDay],
    [week, 1, durationWeek],
    [month, 1, durationMonth],
    [month, 3, 3 * durationMonth],
    [year, 1, durationYear],
  ];

  function ticks(
    start: Date,
    stop: Date,
    count: number | TimeInterval,
  ): Date[] {
    const reverse = stop < start;
    if (reverse) [start, stop] = [stop, start];
    const interval = isNumeric(count)
      ? tickInterval(start, stop, count)
      : count;
    const ticks = interval
      ? interval.range(start, new Date(stop.getTime() + 1))
      : [];
    return reverse ? ticks.reverse() : ticks;
  }

  function tickInterval(start: Date, stop: Date, count: number) {
    const target = Math.abs(stop.getTime() - start.getTime()) / count;
    const i = bisector(([, , step]) => step).right(tickIntervals, target);
    if (i === tickIntervals.length)
      return year.every(
        tickStep(
          start.getTime() / durationYear,
          stop.getTime() / durationYear,
          count,
        ),
      );
    if (i === 0)
      return millisecond.every(
        Math.max(tickStep(start.getTime(), stop.getTime(), count), 1),
      );
    const [t, step] =
      tickIntervals[
        target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target
          ? i - 1
          : i
      ];
    return t.every(step);
  }

  return [ticks, tickInterval] as const;
}

const [utcTicks, utcTickInterval] = ticker(
  utcYear,
  utcMonth,
  utcSunday,
  unixDay,
  utcHour,
  utcMinute,
);
const [timeTicks, timeTickInterval] = ticker(
  timeYear,
  timeMonth,
  timeSunday,
  timeDay,
  timeHour,
  timeMinute,
);

export { utcTicks, utcTickInterval, timeTicks, timeTickInterval };
