// import cliProgress from "cli-progress";

// Async forEach loop
export async function asyncForEach<T>(
  array: T[],
  _progress: boolean,
  callback: (element: T, index: number, array: T[]) => void | Promise<void>
) {
  // if (progress) {
  //   // Progress bar
  //   let bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  //   bar.start(array.length, 0);
  //   for (let index = 0; index < array.length; index++) {
  //     await callback(array[index], index, array);
  //     bar.update(index);
  //   }
  //   bar.update(array.length);
  //   bar.stop();
  // } else {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
  // }
}
