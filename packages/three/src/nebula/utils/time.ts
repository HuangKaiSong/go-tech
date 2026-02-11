import EventEmitter from './event-emitter.js';

export default class Time extends EventEmitter {
  delta: number;
  elapsed: number;
  current: number;
  start: number;

  constructor() {
    super()

    // Setup
    this.start = Date.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 16

    window.requestAnimationFrame(() => {
      this.tick()
    })
  }

  tick() {
    const currentTime = Date.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.start

    this.trigger('tick')

    window.requestAnimationFrame(() => {
      this.tick()
    })
  }
}