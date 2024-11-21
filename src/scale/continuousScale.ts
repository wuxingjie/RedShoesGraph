import { Scale } from "./scale.ts";
import { identity } from "../utils/functional.ts";
import { InterpolatorFactory } from "../interpolate";
import bisectRight from "../utils/bisector.ts";
import { isFunction } from "../utils/typeCheck.ts";

export type NormalizeFactory<T> = (a: T, b: T) => (t: T) => number;

export default function continuousScale<Domain, Range>(
  domain: Domain[],
  range: Range[],
  normalizeFactory: NormalizeFactory<Domain>,
  interpolateFactory: InterpolatorFactory<Range, Range>,
  transform?: (d: Domain) => Domain,
  rangeNormalizeFactory?: NormalizeFactory<Range>,
  domainInterpolateFactory?: InterpolatorFactory<Domain, Domain>,
  unTransform?: (r: Domain) => Domain,
): Scale<Domain, Range> {
  transform = transform ?? identity;
  unTransform = unTransform ?? identity;
  let _clamp: (t: Domain) => Domain = identity;
  let _output: ((d: Domain) => Range) | undefined;
  let _input: ((d: Range) => Domain) | undefined;

  function _update(): Scale<Domain, Range> {
    _input = _output = undefined;
    return scale;
  }

  function scale(x: Domain): Range {
    if (_output === undefined) {
      _output = piecewise(
        domain.map(transform!),
        range,
        normalizeFactory,
        interpolateFactory,
      );
    }
    return _output(transform!(_clamp(x)));
  }

  function _domainFn(): Domain[];
  function _domainFn(d: Domain[]): Scale<Domain, Range>;
  function _domainFn(d?: Domain[]): Domain[] | Scale<Domain, Range> {
    if (d) {
      domain = d;
      return _update();
    }
    return domain;
  }

  scale.domain = _domainFn;

  function _rangeFn(): Range[];
  function _rangeFn(r: Range[]): Scale<Domain, Range>;
  function _rangeFn(r?: Range[]): Range[] | Scale<Domain, Range> {
    if (r) {
      range = r;
      return _update();
    }
    return range;
  }

  scale.range = _rangeFn;

  if (rangeNormalizeFactory && domainInterpolateFactory) {
    scale.invert = function (x: Range): Domain {
      if (_input === undefined) {
        _input = piecewise(
          range,
          domain.map(transform!),
          rangeNormalizeFactory,
          domainInterpolateFactory,
        );
      }
      return _clamp(unTransform(_input(x)));
    };
  }

  scale.clamp = function (
    clamp: boolean | ((x: Domain) => Domain),
  ): Scale<Domain, Range> {
    if (isFunction(clamp)) {
      _clamp = clamp;
    } else if (clamp) {
      _clamp = clamper(domain[0], domain[domain.length - 1]);
    } else {
      _clamp = identity;
    }
    return scale;
  };

  scale.copy = function (): Scale<Domain, Range> {
    return continuousScale(
      domain,
      range,
      normalizeFactory,
      interpolateFactory,
      transform,
      rangeNormalizeFactory,
      domainInterpolateFactory,
      unTransform,
    );
  };

  return scale;
}

function piecewise<Domain, Range>(
  domain: Domain[],
  range: Range[],
  normalizeFactory: NormalizeFactory<Domain>,
  interpolatorFactory: InterpolatorFactory<Range, Range>,
) {
  const len = Math.min(domain.length, range.length);
  if (len > 2) {
    const interpolatorLen = len - 1;
    if (domain[domain.length - 1] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    const domainInterpolator: ((t: Domain) => number)[] = [];
    const rangeInterpolator: ((t: number) => Range)[] = [];

    let j = -1;
    while (++j < interpolatorLen) {
      domainInterpolator[j] = normalizeFactory(domain[0], domain[1]);
      rangeInterpolator[j] = interpolatorFactory(range[0], range[1]);
    }
    return (t: Domain): Range => {
      const i = bisectRight(domain, t, 1) - 1;
      return rangeInterpolator[i](domainInterpolator[i](t));
    };
  } else {
    const d0 = domain[0],
      d1 = domain[1],
      r0 = range[0],
      r1 = range[1];
    let domainNormalizeFn: (x: Domain) => number;
    let rangeInterpolate: (x: number) => Range;
    if (d1 < d0) {
      domainNormalizeFn = normalizeFactory(d1, d0);
      rangeInterpolate = interpolatorFactory(r1, r0);
    } else {
      domainNormalizeFn = normalizeFactory(d0, d1);
      rangeInterpolate = interpolatorFactory(r0, r1);
    }

    return function (x: Domain): Range {
      return rangeInterpolate(domainNormalizeFn(x));
    };
  }
}

function clamper(a: any, b: any) {
  let t;
  if (a > b) {
    t = a;
    a = b;
    b = t;
  }
  return function (x: any): any {
    return Math.max(a, Math.min(b, x));
  };
}
