import { timeInterval } from "./timeInterval.ts";

export const durationSecond = 1000;
export const durationMinute = durationSecond * 60;
export const durationHour = durationMinute * 60;
export const durationDay = durationHour * 24;
export const durationWeek = durationDay * 7;
export const durationMonth = durationDay * 30;
export const durationYear = durationDay * 365;

// year
export const timeYear = timeInterval(
  (date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  },
  (date, step) => date.setFullYear(date.getFullYear() + step),
  (start, end) => end.getFullYear() - start.getFullYear(),
  (date) => {
    return date.getFullYear();
  },
);

timeYear.every = (k) => {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : timeInterval(
        (date) => {
          date.setFullYear(Math.floor(date.getFullYear() / k) * k);
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
        },
        (date, step) => {
          date.setFullYear(date.getFullYear() + step * k);
        },
      );
};

export const timeYears = timeYear.range;

export const utcYear = timeInterval(
  (date) => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  },
  (start, end) => {
    return end.getUTCFullYear() - start.getUTCFullYear();
  },
  (date) => {
    return date.getUTCFullYear();
  },
);

utcYear.every = (k) => {
  return !isFinite((k = Math.floor(k))) || !(k > 0)
    ? null
    : timeInterval(
        (date) => {
          date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
          date.setUTCMonth(0, 1);
          date.setUTCHours(0, 0, 0, 0);
        },
        (date, step) => {
          date.setUTCFullYear(date.getUTCFullYear() + step * k);
        },
      );
};

export const utcYears = utcYear.range;

// month
export const timeMonth = timeInterval(
  (date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setMonth(date.getMonth() + step);
  },
  (start, end) => {
    return (
      end.getMonth() -
      start.getMonth() +
      (end.getFullYear() - start.getFullYear()) * 12
    );
  },
  (date) => {
    return date.getMonth();
  },
);

export const timeMonths = timeMonth.range;

export const utcMonth = timeInterval(
  (date) => {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCMonth(date.getUTCMonth() + step);
  },
  (start, end) => {
    return (
      end.getUTCMonth() -
      start.getUTCMonth() +
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    );
  },
  (date) => {
    return date.getUTCMonth();
  },
);

export const utcMonths = utcMonth.range;

// week
function timeWeekday(i: number) {
  return timeInterval(
    (date) => {
      date.setDate(date.getDate() - ((date.getDay() + 7 - i) % 7));
      date.setHours(0, 0, 0, 0);
    },
    (date, step) => {
      date.setDate(date.getDate() + step * 7);
    },
    (start, end) => {
      return (
        (end.getTime() -
          start.getTime() -
          (end.getTimezoneOffset() - start.getTimezoneOffset()) *
            durationMinute) /
        durationWeek
      );
    },
  );
}

export const timeSunday = timeWeekday(0);
export const timeMonday = timeWeekday(1);
export const timeTuesday = timeWeekday(2);
export const timeWednesday = timeWeekday(3);
export const timeThursday = timeWeekday(4);
export const timeFriday = timeWeekday(5);
export const timeSaturday = timeWeekday(6);

export const timeSundays = timeSunday.range;
export const timeMondays = timeMonday.range;
export const timeTuesdays = timeTuesday.range;
export const timeWednesdays = timeWednesday.range;
export const timeThursdays = timeThursday.range;
export const timeFridays = timeFriday.range;
export const timeSaturdays = timeSaturday.range;

function utcWeekday(i: number) {
  return timeInterval(
    (date) => {
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 7 - i) % 7));
      date.setUTCHours(0, 0, 0, 0);
    },
    (date, step) => {
      date.setUTCDate(date.getUTCDate() + step * 7);
    },
    (start, end) => {
      return (end.getTime() - start.getTime()) / durationWeek;
    },
  );
}

export const utcSunday = utcWeekday(0);
export const utcMonday = utcWeekday(1);
export const utcTuesday = utcWeekday(2);
export const utcWednesday = utcWeekday(3);
export const utcThursday = utcWeekday(4);
export const utcFriday = utcWeekday(5);
export const utcSaturday = utcWeekday(6);

export const utcSundays = utcSunday.range;
export const utcMondays = utcMonday.range;
export const utcTuesdays = utcTuesday.range;
export const utcWednesdays = utcWednesday.range;
export const utcThursdays = utcThursday.range;
export const utcFridays = utcFriday.range;
export const utcSaturdays = utcSaturday.range;

// day
export const timeDay = timeInterval(
  (date) => date.setHours(0, 0, 0, 0),
  (date, step) => date.setDate(date.getDate() + step),
  (start, end) =>
    (end.getTime() -
      start.getTime() -
      (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) /
    durationDay,
  (date) => date.getDate() - 1,
);

export const timeDays = timeDay.range;

export const utcDay = timeInterval(
  (date) => {
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationDay;
  },
  (date) => {
    return date.getUTCDate() - 1;
  },
);

export const utcDays = utcDay.range;

export const unixDay = timeInterval(
  (date) => {
    date.setUTCHours(0, 0, 0, 0);
  },
  (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationDay;
  },
  (date) => {
    return Math.floor(date.getTime() / durationDay);
  },
);

export const unixDays = unixDay.range;

// hour
export const timeHour = timeInterval(
  (date) => {
    date.setTime(
      date.getTime() -
        date.getMilliseconds() -
        date.getSeconds() * durationSecond -
        date.getMinutes() * durationMinute,
    );
  },
  (date, step) => {
    date.setTime(+date + step * durationHour);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationHour;
  },
  (date) => {
    return date.getHours();
  },
);

export const timeHours = timeHour.range;

export const utcHour = timeInterval(
  (date) => {
    date.setUTCMinutes(0, 0, 0);
  },
  (date, step) => {
    date.setTime(+date + step * durationHour);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationHour;
  },
  (date) => {
    return date.getUTCHours();
  },
);

export const utcHours = utcHour.range;

// minute
export const timeMinute = timeInterval(
  (date) => {
    date.setTime(
      date.getTime() -
        date.getMilliseconds() -
        date.getSeconds() * durationSecond,
    );
  },
  (date, step) => {
    date.setTime(+date + step * durationMinute);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationMinute;
  },
  (date) => {
    return date.getMinutes();
  },
);

export const timeMinutes = timeMinute.range;

export const utcMinute = timeInterval(
  (date) => {
    date.setUTCSeconds(0, 0);
  },
  (date, step) => {
    date.setTime(+date + step * durationMinute);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationMinute;
  },
  (date) => {
    return date.getUTCMinutes();
  },
);

export const utcMinutes = utcMinute.range;

// second
export const second = timeInterval(
  (date) => {
    date.setTime(date.getTime() - date.getMilliseconds());
  },
  (date, step) => {
    date.setTime(+date + step * durationSecond);
  },
  (start, end) => {
    return (end.getTime() - start.getTime()) / durationSecond;
  },
  (date) => {
    return date.getUTCSeconds();
  },
);

export const seconds = second.range;

// millisecond
export const millisecond = timeInterval(
  () => {
    // noop
  },
  (date, step) => {
    date.setTime(+date + step);
  },
  (start, end) => {
    return end.getTime() - start.getTime();
  },
);

millisecond.every = (k) => {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return timeInterval(
    (date) => {
      date.setTime(Math.floor(date.getTime() / k) * k);
    },
    (date, step) => {
      date.setTime(+date + step * k);
    },
    (start, end) => {
      return (end.getTime() - start.getTime()) / k;
    },
  );
};

export const milliseconds = millisecond.range;
