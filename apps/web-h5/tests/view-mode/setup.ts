import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;
  constructor(type: string, options: PointerEventInit = {}) {
    super(type, options);
    this.pointerId = options.pointerId ?? 1;
    this.pointerType = options.pointerType ?? 'touch';
    this.isPrimary = options.isPrimary ?? true;
  }
}

vi.stubGlobal('PointerEvent', TestPointerEvent);
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
);
vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.releasePointerCapture = () => {};
