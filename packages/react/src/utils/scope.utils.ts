/**
 * Core emits request and cache events by the logical (unscoped) keys, while dispatcher queues and cache storage
 * use the scoped keys. Listeners subscribe by the logical key and use this check to skip events of other scopes.
 * @internal
 */
export const isSameScope = (scope: string | null | undefined, otherScope: string | null | undefined): boolean => {
  return (scope ?? null) === (otherScope ?? null);
};
