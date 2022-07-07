import { app, BrowserWindow } from "electron";
import * as path from "path";
import { isDevelopment } from "./lantern/platforms/environment/common/Environment";

const PORT: string = process.env.PORT || String(1234);

function resolveRenderPath() {
  return isDevelopment()
    ? `http://localhost:${PORT}`
    : "file://" + path.resolve(__dirname, "../dist/src/render/Index.html");
}

export function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, "..", "dist", "src", "Preload.js")
        : path.join(__dirname, "Preload.ts"),
    },
    titleBarStyle: "hiddenInset",
  });
  console.log(__dirname);

  // and load the index.html of the app.
  console.log(`Loading path ${resolveRenderPath()}`);
  win.loadURL(resolveRenderPath());

  // Open the DevTools.
  if (isDevelopment()) win.webContents.openDevTools();

  return win;
}
