const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Asaan Udhaar - آسان ادھار",
    icon: path.join(__dirname, "../public/icon-512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "../out/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
