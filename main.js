const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  MenuItem,
  shell,
  dialog,
} = require("electron");
const path = require("path");

const fs = require("fs");
const ytdl = require("ytdl-core");

let mainWindow;

/**
 * Creates the main window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Trivial Generator",
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "renderer/images/icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

    [array[i], array[j]] = [array[j], array[i]];
  }
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
  const crSongs = options.copyrightSongs;
  const targetFolder = options.targetDir;
  const isShuffle = options.randomize;

  // DOWNLOAD OFFLINE
  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  const offlineFolder = path.join(targetFolder, "offline");
  if (!fs.existsSync(offlineFolder)) fs.mkdirSync(offlineFolder);

  for (let songID of crSongs) {
    const fullPath = path.join(offlineFolder, `${songID}.mp3`);
    if (fs.existsSync(fullPath)) {
      console.log("La cancion ya estaba descargada");
      continue;
    }

    const writeStream = fs.createWriteStream(fullPath);
    const download = ytdl(`https://youtu.be/${songID}`, {
      filter: "audioonly",
    });
    download.pipe(writeStream);
    console.log(songID + " descargada.");
  }

  // GENERATE HTML
  const trivialTemplate = path.join(
    __dirname,
    "./trivial/trivialTemplate.html"
  );

  const fullPath = path.join(targetFolder, "trivial.html");

  fs.copyFileSync(trivialTemplate, fullPath);

  // GET SONG INFO
  const songs = fs
    .readFileSync(options.listPath, "utf-8")
    .toString()
    .split("\n");

  if (isShuffle) shuffle(songs);
  const infoObj = {};
  const divs = [];
  songs.forEach((song, i) => {
    const { htmlDiv, infoObject } = generateSongPanel(song, i, crSongs);
    divs.push(htmlDiv);
    infoObj[infoObject.ytID] = infoObject;
  });

  // REPLACE IN NEW HTML
  fs.readFile(fullPath, "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(
      "const animeInfo = {};",
      "const animeInfo  = " + JSON.stringify(infoObj) + ";"
    );

    result = result.replace(
      `<div id="song-panel-div" class="flex justify-start w-full flex-wrap gap-5">`,
      `<div id="song-panel-div" class="flex justify-start w-full flex-wrap gap-5">` +
        divs.join("\n")
    );

    fs.writeFile(fullPath, result, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});

const difficultyClasses = {
  easy: "border-green-900",
  normal: "border-sky-900",
  hard: "border-red-900",
};

function generateSongPanel(songInfo, i, crSongs) {
  const [anime, opEd, band, song, difficulty, ytURL] = songInfo
    .split("||")
    .map((x) => x.trim());
  const ytID = ytURL.split("/").at(-1).trim();

  const isOffline = crSongs.includes(ytID);

  const htmlDiv = `<div id="${ytID}"
    data-cr="${isOffline ? "true" : "false"}"
    data-difficulty="${difficulty}"
    name="song-panel"
    class="border-4 ${
      difficultyClasses[difficulty]
    } xl:basis-56 lg:basis-52 bg-no-repeat bg-center bg-cover relative basis-60 flex-shrink-0 h-[10rem] pl-1"
    onclick="toggleAudio(this.id);"
  >
    <span class="font-bold">${i + 1}</span>
    <span
      id="anime-${ytID}"
      class="hidden font-mono absolute bottom-0 left-0 px-1 w-full bg-black text-white"
    >
      ${anime}
    </span>
  </div>`;

  const infoObject = {
    anime,
    oped: opEd == "op" ? "Opening" : "Ending",
    band,
    song,
    ytID,
  };

  return { htmlDiv, infoObject };
}

ipcMain.on("list:index", (e, options) => {
  mainWindow.unmaximize();
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"), {
    query: {
      filePath: options.filePath,
    },
  });
});

ipcMain.on("list:editList", (e, options) => {
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "./renderer/edit-list.html"), {
    query: {
      filePath: options.filePath,
    },
  });
});

ipcMain.on("dialog:openDirectory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (!canceled) {
    mainWindow.webContents.send("dialog:outputPath", { path: filePaths[0] });
  }
});

ipcMain.on("dialog:saveAs", async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow);
  if (!canceled) {
    mainWindow.webContents.send("dialog:listTargetPath", { path: filePath });
  }
});
