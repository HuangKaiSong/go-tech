import { type ConfigKey, type PublicSnapshot } from './definitions';
import { parsePublicSnapshot } from './sse';
let snapshot: PublicSnapshot = { version: '', values: {} };
const listeners = new Set<() => void>();
export const subscribeRuntimeConfig = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getClientSnapshot = () => snapshot;
export const clientConfigValue = (key: ConfigKey) => snapshot.values[key] ?? '';
export function publishClientSnapshot(next: PublicSnapshot) {
  const parsed = parsePublicSnapshot(next);
  if (!parsed || parsed.version === snapshot.version) return;
  snapshot = parsed;
  listeners.forEach(listener => listener());
}
