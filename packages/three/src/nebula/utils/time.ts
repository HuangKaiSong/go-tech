import EventEmitter from './event-emitter.js';

export default class Time extends EventEmitter {
  delta: number;
  elapsed: number;
  current: number;
  start: number;
  private rafId: number = 0;
  private stopped = false;

  constructor() {
    super();

    // Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;

    this.rafId = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    if (this.stopped) return;

    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;

    this.trigger('tick');

    this.rafId = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  stop() {
    this.stopped = true;
    window.cancelAnimationFrame(this.rafId);
  }
}
