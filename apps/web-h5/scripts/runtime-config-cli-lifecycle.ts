/** The recovery CLI has no HTTP response lifecycle; its commands use explicit runtime scopes. */
export function after() {
  throw new Error('Request lifecycle is unavailable in the configuration CLI');
}
