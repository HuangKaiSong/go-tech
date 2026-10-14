import { expect } from 'vitest';
import type { MonitorReportStore } from '../src/storage/report-store';
import { fixture } from './fixtures';

export async function storageContract(store: MonitorReportStore) {
  const first = fixture();
  const second = fixture('performance');
  second.context.sessionId = first.context.sessionId;
  second.context.path = '/en/Monitor';
  expect(await store.save(first)).toEqual({ id: first.id, duplicate: false });
  const original = await store.getStored(first.id);
  expect(original?.report).toEqual(first);
  const changed = structuredClone(first);
  changed.context.release = 'changed';
  expect(await store.save(changed)).toEqual({ id: first.id, duplicate: true });
  expect(await store.getStored(first.id)).toEqual(original);
  await store.save(second);
  const page = await store.list({ limit: 1 });
  expect(page.items).toHaveLength(1);
  expect(page.nextCursor).toBeTruthy();
  const next = await store.list({ cursor: page.nextCursor ?? undefined, limit: 1 });
  expect(next.items).toHaveLength(1);
  expect(next.items[0].id).not.toEqual(page.items[0].id);
  expect((await store.list({ limit: 10, kind: 'error' })).items.map(item => item.id)).toEqual([first.id]);
  expect((await store.list({ limit: 10, path: first.context.path })).items.map(item => item.id)).toEqual([first.id]);
  expect((await store.list({ limit: 10, sessionId: first.context.sessionId })).items).toHaveLength(2);
  expect(await store.list({ limit: 10, cursor: fixture().id })).toEqual({ items: [], nextCursor: null });
  const list = JSON.stringify(await store.list({ limit: 10 }));
  expect(list).not.toContain('secret-test');
  expect(list).not.toContain('events');
  const server = fixture();
  if (server.kind !== 'error') throw new Error('Invalid fixture');
  server.error.kind = 'next-server';
  server.timeSource = 'server';
  server.replay = { events: [], unavailableReason: 'server-error' };
  await store.save(server);
  expect((await store.getStored(server.id))?.report).toEqual(server);
}
