import { clientsClaim, setCacheNameDetails } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

setCacheNameDetails({
  prefix: "go-techs-admin",
  suffix: "v1",
});

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

registerRoute(({ url }) => /\/api\//.test(url.pathname), new NetworkFirst());

registerRoute(
  ({ url }) => url.origin === "https://cdnjs.cloudflare.com",
  new NetworkFirst(),
);

self.addEventListener("message", (event) => {
  const replyPort = event.ports[0];
  const message = event.data;
  if (replyPort && message && message.type === "skip-waiting") {
    event.waitUntil(
      self.skipWaiting().then(
        () => {
          replyPort.postMessage({
            error: null,
          });
        },
        (error) => {
          replyPort.postMessage({
            error,
          });
        },
      ),
    );
  }
});
