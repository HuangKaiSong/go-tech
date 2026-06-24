import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

setCacheNameDetails({
  prefix: 'go-techs-admin',
  suffix: 'v1'
});

globalThis.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
// oxlint-disable-next-line eslint/no-underscore-dangle -- __WB_MANIFEST is injected by the Workbox build
precacheAndRoute(globalThis.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

registerRoute(({ url }) => /\/api\//.test(url.pathname), new NetworkFirst());

registerRoute(({ url }) => url.origin === 'https://cdnjs.cloudflare.com', new NetworkFirst());

globalThis.addEventListener('message', event => {
  const replyPort = event.ports[0];
  const message = event.data;
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      globalThis.skipWaiting().then(
        () => {
          replyPort.postMessage(
            {
              error: null
            },
            '*'
          );
        },
        error => {
          replyPort.postMessage(
            {
              error
            },
            '*'
          );
        }
      )
    );
  }
});
