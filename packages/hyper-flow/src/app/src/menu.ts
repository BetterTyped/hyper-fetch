import { app, clipboard, Menu, shell } from "electron";

export const isMac = process.platform === "darwin";

export const createMenu = () => {
  const template: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem> = [
    {
      label: "HyperFlow",
      submenu: [
        {
          label: "Quit",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          role: "undo",
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo",
        },
        {
          type: "separator",
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut",
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy",
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste",
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectAll",
        },
      ],
    },
    {
      label: "View",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      submenu: [
        {
          label: "Take screenshot",
          accelerator: "CmdOrCtrl+Shift+I",
          click(_: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
            if (focusedWindow)
              focusedWindow.capturePage().then((image) => {
                clipboard.writeImage(image);
              });
          },
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click(_: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        process.env.NODE_ENV !== "production" && {
          label: "Toggle Developer Tools",
          accelerator: (() => {
            if (process.platform === "darwin") return "Alt+Command+I";
            return "Ctrl+Shift+I";
          })(),
          click(_: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
            if (focusedWindow) focusedWindow.webContents.openDevTools();
          },
        },
      ].filter(Boolean),
    },
    {
      label: "Window",
      role: "window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "CmdOrCtrl+M",
          role: "minimize",
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          role: "close",
        },
      ],
    },
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Hyper Fetch",
          click() {
            shell.openExternal("https://hyperfetch.bettertyped.com/");
          },
        },
        {
          label: "Documentation",
          click() {
            shell.openExternal("https://hyperfetch.bettertyped.com/docs/devtools");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
