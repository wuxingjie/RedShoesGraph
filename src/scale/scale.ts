import { CountableTimeInterval } from "../utils/time/timeInterval.ts";

export interface Scale<Domain, Range> {
  (x: Domain): Range;

  domain(): Domain[];
  domain(domain: Domain[]): this;

  range(): Range[];
  range(range: Range[]): this;

  ticks?(count?: number): Domain[];

  invert?(x: Range): Domain;

  clamp(clamp: boolean | ((x: Domain) => Domain)): this;

  copy(): Scale<Domain, Range>;
}

export interface NumericScale<Range> extends Scale<number, Range> {
  nice(count?: number): this;
}

export interface TimeScale<Range> extends Scale<Date, Range> {
  nice(count?: number): this;
  nice(interval: CountableTimeInterval): this;
}

export interface PowerScale<Domain, Range> extends Scale<Domain, Range> {
  exponent(exponent: number): this;
}
