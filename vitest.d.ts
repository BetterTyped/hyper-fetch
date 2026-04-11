import "vitest";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers<any> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ExpectStatic extends CustomMatchers<any> {}
}
