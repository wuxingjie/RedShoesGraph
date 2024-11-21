export class TimeInterval {
  protected readonly _floor: (date: Date) => void;
  protected readonly _offset: (date: Date, step: number) => void;

  constructor(
    floor: (date: Date) => void,
    offset: (date: Date, step: number) => void,
  ) {
    this._floor = floor;
    this._offset = offset;
  }

  floor(date: Date): Date {
    date = new Date(date);
    this._floor(date);
    return date;
  }

  ceil(date: Date): Date {
    date = new Date(date.getTime() - 1);
    this._floor(date);
    this._offset(date, 1);
    return date;
  }

  round(date: Date): Date {
    const floor = this.floor(date).getTime(),
      ceil = this.ceil(date).getTime(),
      time = date.getTime();
    return new Date(time - floor < ceil - time ? floor : ceil);
  }

  offset(date: Date, step: number) {
    date = new Date(date);
    this._offset(date, Math.floor(step));
    return date;
  }

  range(start: Date, stop: Date, step: number = 1): Date[] {
    const range: Date[] = [];
    start = this.ceil(start);
    step = Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range;
    let previous: Date;
    do {
      range.push((previous = new Date(start)));
      this._offset(start, step);
      this._floor(start);
    } while (previous < start && start < stop);
    return range;
  }

  filter(test: (date: Date) => boolean) {
    return new TimeInterval(
      (date) => {
        if (!isNaN(date.getTime())) {
          while ((this._floor(date), !test(date))) {
            date.setTime(date.getTime() - 1);
          }
        }
      },
      (date, step) => {
        if (!isNaN(date.getTime())) {
          if (step < 0)
            while (++step <= 0) {
              while ((this._offset(date, -1), !test(date))) {}
            }
          else
            while (--step >= 0) {
              while ((this._offset(date, +1), !test(date))) {}
            }
        }
      },
    );
  }
}

const epoch = new Date(0),
  t0 = new Date(),
  t1 = new Date();

export class CountableTimeInterval extends TimeInterval {
  private readonly _count: (start: Date, end: Date) => number;
  private readonly _field?: (date: Date) => number;

  constructor(
    floor: (date: Date) => void,
    offset: (date: Date, step: number) => void,
    count: (start: Date, end: Date) => number,
    field?: (date: Date) => number,
  ) {
    super(floor, offset);
    this._count = count;
    this._field = field;
  }

  count(start: Date, end: Date): number {
    t0.setTime(start.getTime());
    t1.setTime(end.getTime());
    this._floor(t0);
    this._floor(t1);
    return Math.floor(this._count(t0, t1));
  }

  every(step: number): TimeInterval | null {
    step = Math.floor(step);
    return !isFinite(step) || !(step > 0)
      ? null
      : !(step > 1)
        ? this
        : this.filter(
            this._field
              ? (d) => this._field!(d) % step === 0
              : (d) => this.count(epoch, d) % step === 0,
          );
  }
}

export function timeInterval(
  floor: (date: Date) => void,
  offset: (date: Date, step: number) => void,
): TimeInterval;
export function timeInterval(
  floor: (date: Date) => void,
  offset: (date: Date, step: number) => void,
  count: (start: Date, end: Date) => number,
  field?: (date: Date) => number,
): CountableTimeInterval;
export function timeInterval(
  floor: (date: Date) => void,
  offset: (date: Date, step: number) => void,
  count?: (start: Date, end: Date) => number,
  field?: (date: Date) => number,
): TimeInterval | CountableTimeInterval {
  return count
    ? new CountableTimeInterval(floor, offset, count, field)
    : new TimeInterval(floor, offset);
}
