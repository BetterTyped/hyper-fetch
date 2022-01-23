import * as path from "path";
import * as fs from "fs";
import { info } from "./log.utils";
import fsExtra from "fs-extra";

// export const writeFileAsync = async (filePath: string, arrayData: any[]) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const _WritableStream = fs.createWriteStream(filePath, {
//         flags: 'r+',
//         start: fs.statSync(filePath).size - 2,
//       });
//       _WritableStream.write(
//         JSON.stringify(arrayData, null, 2).replace(/\[/, ','),
//         () => {
//           return reject('[Stream write error] Cannot save file');
//         }
//       );
//       return resolve('Success');
//     } catch (streamError) {
//       return reject('Cannot save file');
//     }
//   });
// };

export function prepareApiDirectory(filePath: string) {
  const dirname = path.dirname(filePath);
  const exists = fs.existsSync(dirname);
  if (exists) {
    // empty
    info("Empty directory: ");
    console.log(dirname);
    fsExtra.emptyDirSync(dirname);
  } else {
    // create
    info("Creating directory: ");
    console.log(dirname);
    fs.mkdirSync(dirname, { recursive: true });
  }
}
