/** Ambient shim: core uses `baseUrl` `request` → `src/request`; gql test tsconfig resolves bare `request` to npm. */
declare module "request" {
  export type RequestInstance = object;

  export function getProgressValue(event: { loaded?: number; total?: number }): number;

  export function getRequestEta(
    startDate: Date,
    progressDate: Date,
    event: { total: number; loaded: number },
  ): { sizeLeft: number; timeLeft: number | null };
}
