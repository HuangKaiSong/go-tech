import { describe, expect, it } from 'vitest';
import { getCardScrollTarget, getClosestCard } from '@/lib/swipe-row';
import { getViewFrame, parseViewMode } from '@/lib/view-mode';

describe('logical viewport', () => {
  it.each([390, 430, 767, 768, 1023, 1024, 1760])('matches the reference mobile frame at %ipx', width => {
    const frame = getViewFrame('mobile', { width, height: 745 });
    expect(frame.width).toBe(width < 1024 ? Math.min(767, width) : 430);
    expect(frame.height * frame.scale).toBeCloseTo(745);
    expect(frame.width).toBeLessThan(768);
    expect(frame.width * frame.scale).toBeCloseTo(width < 1024 ? width : 430);
  });
  it('supports an explicit PC layout on a real phone without changing viewport meta', () => {
    const frame = getViewFrame('pc', { width: 390, height: 745 });
    expect(frame.width).toBe(1280);
    expect(frame.width * frame.scale).toBeCloseTo(390);
  });
  it('auto follows the device and rejects invalid stored values', () => {
    expect(getViewFrame('auto', { width: 390, height: 745 }).width).toBe(390);
    expect(parseViewMode('mobile')).toBe('mobile');
    expect(parseViewMode('desktop')).toBeUndefined();
  });
});

describe('carousel alignment', () => {
  it('centers cards with arbitrary gaps inside a scaled preview', () => {
    expect(
      getCardScrollTarget({
        cardLeft: 712,
        cardWidth: 340,
        viewportLeft: 216,
        viewportWidth: 400,
        scrollLeft: 0,
        maxScroll: 800,
        scale: 4 / 3
      })
    ).toBe(342);
    expect(getClosestCard([0, 342, 684], 350)).toBe(1);
  });
  it('clamps edge cards instead of counting a nonexistent slide', () => {
    expect(
      getCardScrollTarget({
        cardLeft: 0,
        cardWidth: 340,
        viewportLeft: 0,
        viewportWidth: 400,
        scrollLeft: 0,
        maxScroll: 680,
        scale: 1
      })
    ).toBe(0);
    expect(getClosestCard([0, 340, 680], 680)).toBe(2);
  });
});
