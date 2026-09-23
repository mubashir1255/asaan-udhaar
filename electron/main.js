/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const http = require("http");
const serveHandler = require("serve-handler");

let server;
const PORT = 58291; // Fixed port ensures localStorage origin persists across app launches

function startLocalServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((request, response) => {
      return serveHandler(request, response, {
        public: path.join(__dirname, "../out"),
        cleanUrls: true,
        rewrites: [
          // If a direct HTML file isn't found, fallback to index.html for client-side routing
          { source: "**", destination: "/index.html" },
        ],
      });
    });

    server.listen(PORT, "127.0.0.1", () => {
      resolve(PORT);
    });

    server.on("error", (err) => {
      console.error("Local server error:", err);
      reject(err);
    });
  });
}

async function createWindow() {
  const port = await startLocalServer();

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Asaan Udhaar",
    icon: path.join(__dirname, "../public/logo.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load via the local server so all CSS, JS, and image routes resolve properly
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  // Open external links (e.g., WhatsApp web) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});