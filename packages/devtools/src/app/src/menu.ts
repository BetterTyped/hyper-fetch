import { app, Menu } from "electron";

export const isMac = process.platform === "darwin";

export const createMenu = () => {
  const template: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem> = [
    {
      label: "DevTools",
      submenu: [
        {
          label: "Quit",
          click: () => app.quit(),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
