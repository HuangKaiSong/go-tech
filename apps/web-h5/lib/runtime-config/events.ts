import { withRuntimeScope } from '../../db';
import { type PublicSnapshot } from './definitions';
import { publicSnapshot } from './service';
type Listener = (snapshot: PublicSnapshot) => void;
const state = globalThis as typeof globalThis & {
  h5ConfigEvents?: {
    latest?: PublicSnapshot;
    listeners: Set<Listener>;
    pending?: Promise<void>;
    timer?: ReturnType<typeof setInterval>;
  };
};
const hub = (state.h5ConfigEvents ??= { listeners: new Set<Listener>() });
export function refreshPublicConfig() {
  hub.pending ??= withRuntimeScope(async () => {
    const snapshot = await publicSnapshot();
    if (snapshot.version !== hub.latest?.version) {
      hub.latest = snapshot;
      for (const listener of hub.listeners) listener(snapshot);
    }
  })()
    .catch(() => {
      /* Preserve last good snapshot; configuration errors must not recursively report themselves. */
    })
    .finally(() => {
      hub.pending = undefined;
    });
  return hub.pending;
}
export function subscribeConfig(listener: Listener) {
  hub.listeners.add(listener);
  if (!hub.timer) {
    hub.timer = setInterval(() => {
      refreshPublicConfig();
    }, 1000);
    hub.timer.unref?.();
  }
  return () => {
    hub.listeners.delete(listener);
    if (!hub.listeners.size && hub.timer) {
      clearInterval(hub.timer);
      hub.timer = undefined;
    }
  };
}
