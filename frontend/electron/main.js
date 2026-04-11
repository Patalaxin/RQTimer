const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const indexPath = path.join(__dirname, "../dist/rq-timer-fe/index.html");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 355,
    height: 500,

    // icon: path.join(__dirname, "../assets/img/icon.png"),

    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,

    resizable: true,

    backgroundColor: "#00000000",

    webPreferences: {
      contextIsolation: true,
    },
  });

  win.setOpacity(0.7);

  win.setAlwaysOnTop(true, "screen-saver");

  win.loadURL(pathToFileURL(indexPath).href);

  win.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toLowerCase();

    const isReload =
      key === "f5" ||
      (input.control && key === "r") ||
      (input.meta && key === "r");

    if (isReload) {
      event.preventDefault();
    }
  });

  const fixedWidth = 355;
  const maxHeight = 700;

  win.on("resize", () => {
    const [width, height] = win.getSize();

    if (width !== fixedWidth) {
      win.setSize(fixedWidth, height);
    }

    if (height > maxHeight) {
      win.setSize(fixedWidth, maxHeight);
    }
  });
}

app.whenReady().then(createWindow);
