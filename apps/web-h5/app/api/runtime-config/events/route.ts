import { withRuntimeScope } from '@/db';
import type { PublicSnapshot } from '@/lib/runtime-config/definitions';
import { subscribeConfig } from '@/lib/runtime-config/events';
import { publicSnapshot } from '@/lib/runtime-config/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noop = () => {};
export async function GET(request: Request) {
  let initial: PublicSnapshot;
  try {
    initial = await withRuntimeScope(publicSnapshot)();
  } catch {
    return new Response('Configuration unavailable', { status: 503 });
  }
  const encoder = new TextEncoder();
  let cleanup = noop;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      let unsubscribe = noop;
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {
          /* Already cancelled. */
        }
      };
      const send = (text: string) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            cleanup();
          }
        }
      };
      const publish = (snapshot: PublicSnapshot) =>
        send(`id: ${snapshot.version}\nevent: config\ndata: ${JSON.stringify(snapshot)}\n\n`);
      unsubscribe = subscribeConfig(publish);
      publish(initial);
      heartbeat = setInterval(() => send(': heartbeat\n\n'), 15000);
      request.signal.addEventListener('abort', cleanup, { once: true });
      if (request.signal.aborted) cleanup();
    },
    cancel() {
      cleanup();
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no'
    }
  });
}
