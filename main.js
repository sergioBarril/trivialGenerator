const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  MenuItem,
  shell,
} = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

/**
 * Creates the main window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Trivial Generator",
    width: isDev ? 1000 : 500,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Open devtools if in dev env
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

function isYoutubeURL(url) {
  const re = /youtube\.com\/watch\?v=([^#&?]{11})|youtu\.be\/([^#&?]{11})/;

  const match = url.match(re);
  if (match) {
    const ytId = match[1] || match[2];
    return `https://youtu.be/${ytId}`;
  } else return false;
}

// App is ready
app.whenReady().then(() => {
  createMainWindow();

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on("context-menu", (_, props) => {
    const menu = new Menu();
    if (props.isEditable) {
      const ytURL = isYoutubeURL(props.selectionText);
      if (ytURL) {
        menu.append(
          new MenuItem({
            label: `Visitar ${ytURL}`,
            click: () => {
              shell.openExternal(ytURL);
            },
          })
        );
        menu.append(new MenuItem({ type: "separator" }));
      }

      if (props.editFlags.canCopy)
        menu.append(
          new MenuItem({
            label: "Copiar",
            role: "copy",
            accelerator: "Ctrl+C",
          })
        );

      if (props.editFlags.canPaste)
        menu.append(
          new MenuItem({
            label: "Pegar",
            role: "paste",
            accelerator: "Ctrl+V",
          })
        );
      menu.popup();
    }
  });
  // Remove mainWindow from memory on close
  mainWindow.on("close", () => (mainWindow = null));
});

// Menu template
const menu = [
  {
    label: "File",
    submenu: [
      { label: "Quit", click: () => app.quit(), accelerator: "Ctrl+W" },
    ],
  },
];

// Respond to ipcRenderer
ipcMain.on("trivial:generate", (e, options) => {
  console.log(options);
});

ipcMain.on("list:index", (e, options) => {
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"), {
    query: {
      filePath: options.filePath,
    },
  });
});
