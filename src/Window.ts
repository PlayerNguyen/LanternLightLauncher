import { BrowserWindow } from "electron";
import * as path from "path";
import { isDevelopment } from "./lantern/platforms/environment/common/Environment";

const PORT: string = process.env.PORT || String(1234);

function resolveRenderPath() {
  return isDevelopment()
    ? `http://localhost:${PORT}`
    : "file://" + path.join(__dirname, "render", "Index.html");
}

export function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "Preload.js"),
    },
    titleBarStyle: "hiddenInset",
  });

  // and load the index.html of the app.
  win.loadURL(resolveRenderPath());

  // Open the DevTools.
  if (isDevelopment()) win.webContents.openDevTools();

  return win;
}
