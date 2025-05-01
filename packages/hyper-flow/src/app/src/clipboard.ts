import { Data, clipboard, ipcMain, nativeImage } from "electron";

export const copyToClipboard = () => {
  ipcMain.on("clipboard", async (_, val: Data & { img?: string }) => {
    if (val.img) {
      clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(val.img, "base64")));
    } else {
      clipboard.write(val);
    }
  });
};
