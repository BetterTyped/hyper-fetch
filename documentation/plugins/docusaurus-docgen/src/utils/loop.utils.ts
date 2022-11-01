/* eslint-disable no-restricted-syntax */
// Async forEach loop
export async function asyncForEach<T>(
  array: T[],
  callback: (element: T, index: number, array: T[]) => void | Promise<void>,
) {
  for await (const element of array) {
    await callback(element, array.indexOf(element), array);
  }
}
