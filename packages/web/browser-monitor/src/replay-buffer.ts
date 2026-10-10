import type { ReplayEvent } from '@go-tech/monitor-contract';

interface Segment {
  bytes: number;
  events: ReplayEvent[];
  timestamp: number;
}

/** Eviction always removes whole snapshot segments so incremental events retain their base. */
export class ReplayBuffer {
  lastEventAt = 0;
  lastSnapshotAt = 0;
  private segments: Segment[] = [];
  private meta: ReplayEvent | undefined;
  limited = false;

  constructor(
    private readonly durationMs = 60000,
    private readonly maxBytes = 1500000
  ) {}

  add(event: ReplayEvent) {
    this.lastEventAt = event.timestamp;
    if (event.type === 4) {
      this.meta = event;
      return;
    }
    if (event.type === 2) {
      this.lastSnapshotAt = event.timestamp;
      const events = this.meta ? [{ ...this.meta, timestamp: event.timestamp }, event] : [event];
      this.segments.push({
        events,
        timestamp: event.timestamp,
        bytes: new TextEncoder().encode(JSON.stringify(events)).length
      });
      this.limited = false;
    } else {
      const last = this.segments.at(-1);
      if (!last) return;
      last.events.push(event);
      last.bytes += new TextEncoder().encode(JSON.stringify(event)).length;
    }
    while (this.segments.length > 1 && this.segments[0].timestamp < event.timestamp - this.durationMs) {
      this.segments.shift();
    }
    while (
      this.segments.reduce((size, segment) => size + segment.bytes, 0) > this.maxBytes ||
      this.segments.reduce((size, segment) => size + segment.events.length, 0) > 28000
    ) {
      this.segments.shift();
      this.limited = true;
    }
  }

  snapshot() {
    return this.segments.flatMap(segment => segment.events);
  }
  clear() {
    this.segments = [];
    this.meta = undefined;
    this.lastEventAt = 0;
    this.lastSnapshotAt = 0;
  }
}
