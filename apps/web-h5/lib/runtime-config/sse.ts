import { type PublicSnapshot, definition, isConfigKey } from './definitions';
export function parsePublicSnapshot(value: unknown): PublicSnapshot | undefined {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    typeof value.version !== 'string' ||
    !('values' in value) ||
    !value.values ||
    typeof value.values !== 'object' ||
    Array.isArray(value.values)
  )
    return;
  const values: PublicSnapshot['values'] = {};
  for (const [key, entry] of Object.entries(value.values)) {
    if (!isConfigKey(key) || !definition(key).public || definition(key).secret || typeof entry !== 'string') return;
    values[key] = entry;
  }
  return { version: value.version, values };
}
/** Incremental UTF-8 decoder; handles frames, CRLF and Unicode split across network chunks. */
export class ConfigEventDecoder {
  private decoder = new TextDecoder();
  private pending = '';
  push(bytes: Uint8Array): PublicSnapshot[] {
    this.pending = (this.pending + this.decoder.decode(bytes, { stream: true })).replace(/\r\n/g, '\n');
    if (this.pending.length > 131072) throw new Error('Configuration event too large');
    const snapshots: PublicSnapshot[] = [];
    let end: number;
    while ((end = this.pending.indexOf('\n\n')) >= 0) {
      const event = this.pending.slice(0, end);
      this.pending = this.pending.slice(end + 2);
      const data = event
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart())
        .join('\n');
      if (data) {
        const snapshot = parsePublicSnapshot(JSON.parse(data));
        if (!snapshot) throw new Error('Invalid public configuration');
        snapshots.push(snapshot);
      }
    }
    return snapshots;
  }
}
