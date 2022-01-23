// Async forEach loop
export async function asyncForEach<T>(
  array: T[],
  callback: (element: T, index: number, array: T[]) => void | Promise<void>
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
