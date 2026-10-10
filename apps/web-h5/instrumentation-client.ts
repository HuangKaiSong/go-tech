import { initializeBrowserMonitor, recordBrowserNavigation } from '@/lib/browser-monitor/client';

initializeBrowserMonitor();

export function onRouterTransitionStart(url: string) {
  recordBrowserNavigation(url);
}
