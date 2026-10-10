import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SwipeRow from '@/app/components/SwipeRow';

const display = vi.hoisted(() => ({ isMobile: true }));
vi.mock('@/contexts/view-mode-context', () => ({
  useViewMode: () => ({ isMobile: display.isMobile, frame: { scale: 4 / 3 } })
}));
afterEach(() => {
  display.isMobile = true;
});

function mount() {
  const click = vi.fn();
  const result = render(
    <SwipeRow>
      <a href="#plan" onClick={click}>
        普通版
      </a>
      <div>升級版</div>
      <div>豪華版</div>
    </SwipeRow>
  );
  const track = result.container.querySelector<HTMLElement>('[data-carousel-track]');
  if (!track) throw new Error('Missing carousel track');
  Object.defineProperties(track, { clientWidth: { value: 400 }, scrollWidth: { value: 1100 } });
  vi.spyOn(track, 'getBoundingClientRect').mockImplementation(() => ({ left: 100 }) as DOMRect);
  Array.from(track.children).forEach((child, index) => {
    Object.defineProperty(child, 'offsetWidth', { value: 340 });
    vi.spyOn(child, 'getBoundingClientRect').mockImplementation(
      () => ({ left: 100 + ((index * 372 - track.scrollLeft) * 4) / 3 }) as DOMRect
    );
  });
  track.scrollTo = vi.fn(options => {
    if (typeof options === 'object') track.scrollLeft = options.left ?? 0;
  });
  return { track, click };
}

describe('touch and pointer carousel', () => {
  it.each(['touch', 'mouse', 'pen'])(
    'swipes with %s in logical coordinates and suppresses accidental card navigation',
    pointerType => {
      const { click, track } = mount();
      const card = screen.getByText('普通版');
      fireEvent.pointerDown(card, { pointerId: 7, pointerType, clientX: 360, clientY: 200 });
      fireEvent.pointerMove(track, { pointerId: 7, pointerType, clientX: 160, clientY: 203 });
      expect(track.scrollLeft).toBeCloseTo(150);
      fireEvent.pointerUp(track, { pointerId: 7, pointerType });
      expect(track.scrollTo).toHaveBeenCalledWith({ left: 342, behavior: 'instant' });
      fireEvent.click(card);
      expect(click).not.toHaveBeenCalled();
    }
  );
  it('lets a vertical touch gesture scroll the page', () => {
    const { track } = mount();
    fireEvent.pointerDown(track, { pointerId: 8, clientX: 360, clientY: 200 });
    fireEvent.pointerMove(track, { pointerId: 8, clientX: 357, clientY: 270 });
    fireEvent.pointerUp(track, { pointerId: 8 });
    expect(track.scrollLeft).toBe(0);
    expect(track.scrollTo).not.toHaveBeenCalled();
  });
  it('restores snapping when a pointer gesture is cancelled', () => {
    const { track } = mount();
    fireEvent.pointerDown(track, { pointerId: 9, clientX: 360, clientY: 200 });
    fireEvent.pointerMove(track, { pointerId: 9, clientX: 160, clientY: 200 });
    fireEvent.pointerCancel(track, { pointerId: 9 });
    expect(track.style.scrollSnapType).toBe('');
    expect(track.scrollTo).toHaveBeenCalled();
  });
  it('supports keyboard-accessible pagination and real 32px gaps', () => {
    const { track } = mount();
    fireEvent.click(screen.getByRole('button', { name: '下一個' }));
    expect(track.scrollTo).toHaveBeenCalledWith({ left: 342, behavior: 'instant' });
  });
  it('keeps streamed SSR attributes stable when the parent display mode has already hydrated', () => {
    display.isMobile = false;
    const server = renderToString(
      <SwipeRow>
        <div>普通版</div>
        <div>升級版</div>
      </SwipeRow>
    );
    display.isMobile = true;
    expect(
      renderToString(
        <SwipeRow>
          <div>普通版</div>
          <div>升級版</div>
        </SwipeRow>
      )
    ).toBe(server);
  });
});
