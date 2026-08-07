import EventEmitter from './event-emitter.js';

export default class Time extends EventEmitter {
  delta: number;
  elapsed: number;
  current: number;
  start: number;
  private rafId: number = 0;
  private stopped = false;
  private readonly minFrameInterval: number;
  private nextFrameTime: number;

  constructor(targetFps: number | null = null) {
    super();

    // Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;
    this.minFrameInterval = targetFps ? 1000 / targetFps : 0;
    this.nextFrameTime = this.start + this.minFrameInterval;

    this.rafId = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    if (this.stopped) return;

    const currentTime = Date.now();
    if (this.minFrameInterval === 0 || currentTime >= this.nextFrameTime) {
      this.delta = currentTime - this.current;
      this.current = currentTime;
      this.elapsed = this.current - this.start;
      this.trigger('tick');

      if (this.minFrameInterval > 0) {
        while (this.nextFrameTime <= currentTime) {
          this.nextFrameTime += this.minFrameInterval;
        }
      }
    }

    this.rafId = window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  stop() {
    this.stopped = true;
    window.cancelAnimationFrame(this.rafId);
  }
}
