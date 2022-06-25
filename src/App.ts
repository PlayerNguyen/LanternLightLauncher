import { app, ipcMain } from "electron";

import { bootstrap } from "./bootstrapper/Bootstrapper";

import { createWindow } from "./Window";

app.whenReady().then(async () => {
  /**
   * Load the bootstrapper script.
   *
   */
  await bootstrap();

  /**
   * Then load the window
   */
  await createWindow();
});
