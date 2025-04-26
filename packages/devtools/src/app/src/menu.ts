import { app, Menu, shell } from "electron";

export const isMac = process.platform === "darwin";

export const createMenu = () => {
  const template: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem> = [
    {
      label: "Hyper Flow",
      submenu: [
        {
          label: "Quit",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "View",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        process.env.NODE_ENV !== "production" && {
          label: "Toggle Developer Tools",
          accelerator: (() => {
            if (process.platform === "darwin") return "Alt+Command+I";
            return "Ctrl+Shift+I";
          })(),
          click(item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (focusedWindow) focusedWindow.toggleDevTools();
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
