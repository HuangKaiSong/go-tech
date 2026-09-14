import { describe, expect, it, vi } from 'vitest';

import { type WeightedOption, weightedRandom } from './weighted-random';

/** 固定返回值的随机源 */
const constRandom = (v: number) => () => v;

const opts = <T>(...pairs: Array<[T, number]>): WeightedOption<T>[] =>
  pairs.map(([option, weight]) => ({ option, weight }));

/* ------------------------------------------------------------------ */
/* 参数校验                                                            */
/* ------------------------------------------------------------------ */
describe('weightedRandom - 参数校验', () => {
  it('空数组抛错', () => {
    expect(() => weightedRandom([], constRandom(0))).toThrow('weightedRandom requires at least one option');
  });

  it('weight 为 NaN 抛 TypeError', () => {
    expect(() => weightedRandom(opts(['a', Number.NaN]), constRandom(0))).toThrow(TypeError);
  });

  it('weight 为 Infinity 抛 TypeError', () => {
    expect(() => weightedRandom(opts(['a', Infinity]), constRandom(0))).toThrow(TypeError);
  });

  it('weight 为 -Infinity 也走 finite 校验（TypeError），而非负数校验', () => {
    // Number.isFinite(-Infinity) === false，先于 weight < 0 判断
    expect(() => weightedRandom(opts(['a', -Infinity]), constRandom(0))).toThrow(TypeError);
  });

  it('weight 为负数抛错', () => {
    expect(() => weightedRandom(opts(['a', 1], ['b', -0.5]), constRandom(0))).toThrow(
      'weightedRandom requires non-negative weights'
    );
  });

  it('全部 weight 为 0 抛错', () => {
    expect(() => weightedRandom(opts(['a', 0], ['b', 0]), constRandom(0))).toThrow(
      'weightedRandom requires at least one positive weight'
    );
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['负数', -0.1],
    ['恰好等于 1', 1],
    ['大于 1', 1.5]
  ])('random 返回 %s 时抛错', (_label, value) => {
    expect(() => weightedRandom(opts(['a', 1]), constRandom(value))).toThrow(
      'weightedRandom random source must return [0, 1)'
    );
  });

  it('random 返回 0 是合法的（[0, 1) 左闭）', () => {
    expect(weightedRandom(opts(['a', 1]), constRandom(0))).toBe('a');
  });

  it('random 返回接近 1 的数是合法的（[0, 1) 右开）', () => {
    expect(() => weightedRandom(opts(['a', 1]), constRandom(0.9999999999))).not.toThrow();
  });
});

/* ------------------------------------------------------------------ */
/* 选择逻辑                                                            */
/* ------------------------------------------------------------------ */
describe('weightedRandom - 选择逻辑', () => {
  it('只有一个选项时总是返回它', () => {
    const options = opts(['only', 42]);
    for (const r of [0, 0.3, 0.999]) {
      expect(weightedRandom(options, constRandom(r))).toBe('only');
    }
  });

  it('random = 0 选第一个正权重选项', () => {
    expect(weightedRandom(opts(['a', 1], ['b', 1], ['c', 1]), constRandom(0))).toBe('a');
  });

  it('random 接近 1 选最后一个正权重选项', () => {
    expect(weightedRandom(opts(['a', 1], ['b', 1], ['c', 1]), constRandom(0.9999))).toBe('c');
  });

  it('等权重时按区间均分', () => {
    const options = opts(['a', 1], ['b', 1], ['c', 1]);
    // totalWeight = 3，区间 [0,1) [1,2) [2,3)，除以 3 归一化
    expect(weightedRandom(options, constRandom(0))).toBe('a');
    expect(weightedRandom(options, constRandom(0.34))).toBe('b');
    expect(weightedRandom(options, constRandom(0.67))).toBe('c');
  });

  it('不等权重时按比例划分', () => {
    // 权重 1 : 3，totalWeight = 4
    const options = opts(['light', 1], ['heavy', 3]);
    expect(weightedRandom(options, constRandom(0))).toBe('light');
    expect(weightedRandom(options, constRandom(0.24))).toBe('light'); // target 0.96 < 1
    expect(weightedRandom(options, constRandom(0.25))).toBe('heavy'); // target 1，不 < 1，落到 heavy
    expect(weightedRandom(options, constRandom(0.99))).toBe('heavy');
  });

  it('区间是左闭右开的：targetWeight 恰好落在累积边界上时选下一个', () => {
    // totalWeight = 2，random = 0.5 → targetWeight = 1
    // a 累积到 1，1 < 1 为 false，所以落到 b
    expect(weightedRandom(opts(['a', 1], ['b', 1]), constRandom(0.5))).toBe('b');
  });

  it('weight 为 0 的选项永远不会被选中', () => {
    const options = opts(['zero', 0], ['a', 1], ['b', 1]);
    const picked = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      picked.add(weightedRandom(options, constRandom(i / 100)));
    }
    expect(picked.has('zero')).toBe(false);
    expect(picked).toEqual(new Set(['a', 'b']));
  });

  it('首项 weight 为 0 时，random = 0 落到第一个正权重选项', () => {
    const options = opts(['zero', 0], ['first', 1], ['second', 1]);
    expect(weightedRandom(options, constRandom(0))).toBe('first');
  });

  it('中间项 weight 为 0 不影响区间划分', () => {
    const options = opts(['a', 1], ['skip', 0], ['c', 1]);
    expect(weightedRandom(options, constRandom(0))).toBe('a');
    expect(weightedRandom(options, constRandom(0.5))).toBe('c');
    expect(weightedRandom(options, constRandom(0.99))).toBe('c');
  });
});

/* ------------------------------------------------------------------ */
/* 引用语义 & 副作用                                                   */
/* ------------------------------------------------------------------ */
describe('weightedRandom - 引用与副作用', () => {
  it('返回的是原始 option 引用，不是拷贝', () => {
    const a = { id: 'a' };
    const b = { id: 'b' };
    const options: WeightedOption<typeof a>[] = [
      { option: a, weight: 1 },
      { option: b, weight: 1 }
    ];

    expect(weightedRandom(options, constRandom(0.1))).toBe(a);
    expect(weightedRandom(options, constRandom(0.9))).toBe(b);
  });

  it('不修改传入的数组和选项对象', () => {
    const options = opts(['a', 1], ['b', 2]);
    const snapshot = JSON.parse(JSON.stringify(options));

    weightedRandom(options, constRandom(0.5));

    expect(options).toEqual(snapshot);
  });

  it('random 只被调用一次', () => {
    const random = vi.fn(() => 0.5);
    weightedRandom(opts(['a', 1], ['b', 1]), random);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('random 抛错时原样向上传播', () => {
    const boom = new Error('random exploded');
    const random = () => {
      throw boom;
    };
    expect(() => weightedRandom(opts(['a', 1]), random)).toThrow(boom);
  });

  it('random 抛错时，参数校验已经先跑完（非法 weight 优先抛错）', () => {
    const random = vi.fn(() => 0.5);
    expect(() => weightedRandom(opts(['a', -1]), random)).toThrow('weightedRandom requires non-negative weights');
    // 校验失败时不应该调用 random
    expect(random).not.toHaveBeenCalled();
  });

  it('默认参数用 Math.random（不传 random 也能工作）', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const result = weightedRandom(opts(['a', 1], ['b', 1]));
      expect(result).toBe('b'); // 0.5 * 2 = 1，落在 b
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });
});

/* ------------------------------------------------------------------ */
/* 分布（统计，容差放宽，可选）                                        */
/* ------------------------------------------------------------------ */
describe('weightedRandom - 分布（统计）', () => {
  it('10000 次采样频率接近权重比例', () => {
    // 显式指定字面量联合类型，让 weightedRandom 返回 'a' | 'b'，从而能安全索引 counts
    const options = opts<'a' | 'b'>(['a', 1], ['b', 3]);
    const N = 10_000;
    const counts = { a: 0, b: 0 };

    for (let i = 0; i < N; i += 1) {
      counts[weightedRandom(options)] += 1;
    }

    expect(counts.a / N).toBeCloseTo(0.25, 1); // 容差 ~5%
    expect(counts.b / N).toBeCloseTo(0.75, 1);
  });
});
