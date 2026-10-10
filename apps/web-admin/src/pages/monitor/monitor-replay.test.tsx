import type { ReplayEvent } from '@go-tech/monitor-contract';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonitorReplay } from './monitor-replay';

// jsdom does not implement iframe sandbox isolation. Exercise the clock contract
// here; actual rrweb reconstruction and cursor geometry are checked in Chrome.
vi.mock('@rrweb/replay', () => ({
  Replayer: class {
    wrapper = document.createElement('div');
    iframe = document.createElement('iframe');
    private baseline = 0;
    on = vi.fn(() => this);
    setConfig = vi.fn();
    constructor(
      private recording: ReplayEvent[],
      config: { root: HTMLElement }
    ) {
      this.wrapper.className = 'replayer-wrapper';
      this.wrapper.append(this.iframe);
      config.root.append(this.wrapper);
    }
    getMetaData() {
      const startTime = this.recording[0].timestamp;
      const endTime = this.recording[this.recording.length - 1].timestamp;
      return { startTime, endTime, totalTime: endTime - startTime };
    }
    getCurrentTime() {
      return this.baseline - this.recording[0].timestamp;
    }
    pause(offset = this.getCurrentTime()) {
      this.baseline = this.recording[0].timestamp + offset;
    }
    play(offset: number) {
      this.pause(offset);
    }
    destroy() {
      this.wrapper.remove();
    }
  }
}));

const start = 1791600000000;
const events: ReplayEvent[] = [
  { type: 4, timestamp: start, data: { href: 'http://localhost/', width: 375, height: 812 } },
  {
    type: 2,
    timestamp: start,
    data: {
      node: {
        type: 0,
        id: 1,
        childNodes: [
          {
            type: 2,
            id: 2,
            tagName: 'html',
            attributes: {},
            childNodes: [
              { type: 2, id: 3, tagName: 'head', attributes: {}, childNodes: [] },
              {
                type: 2,
                id: 4,
                tagName: 'body',
                attributes: {},
                childNodes: [{ type: 3, id: 5, textContent: '公開頁面文字' }]
              }
            ]
          }
        ]
      },
      initialOffset: { top: 0, left: 0 }
    }
  },
  { type: 5, timestamp: start + 5000, data: { tag: 'monitor-clip-end', payload: {} } }
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('monitor replay', () => {
  it('starts paused at zero with an epoch timestamp and seeks on the relative timeline', async () => {
    vi.useFakeTimers();
    render(<MonitorReplay errorTimestamp={start + 3000} events={events} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    const progress = screen.getByRole('slider', { name: '回放進度' });
    expect(progress).toHaveValue('0');
    expect(progress).toHaveAttribute('max', '5000');
    expect(screen.getByText('0:00 / 0:05')).toBeInTheDocument();
    const iframe = document.querySelector<HTMLIFrameElement>('.replayer-wrapper iframe');
    expect(iframe?.style.width).toBe('375px');
    expect(iframe?.style.maxWidth).toBe('none');
    fireEvent.click(screen.getByRole('button', { name: '跳至錯誤' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(progress).toHaveValue('3000');
    expect(screen.getByText('0:03 / 0:05')).toBeInTheDocument();
  });
});
