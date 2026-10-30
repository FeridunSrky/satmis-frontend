/** Everything in local and session storage, so tests can assert that no token ended up there. */
export function readWebStorage(): string {
  return [window.localStorage, window.sessionStorage]
    .flatMap((storage) => Object.entries(storage))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');
}
