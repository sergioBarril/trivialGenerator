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

/**
 * Shuffle an array
 * @param {*} array
 */
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

function trivialGeneration(options) {
  const copyrightIds = options.copyrightIds;
  const targetFolder = options.targetDir;
  const songs = options.songs;
  const isRandom = options.randomize;

  // DOWNLOAD OFFLINE
  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  const offlineFolder = path.join(targetFolder, "offline");
  if (!fs.existsSync(offlineFolder)) fs.mkdirSync(offlineFolder);

  const songsToDownload = copyrightIds.filter((songID) => {
    const fullPath = path.join(offlineFolder, `${songID}.mp3`);
    return !fs.existsSync(fullPath);
  });

  Promise.allSettled(
    songsToDownload.map((songID) => {
      const fullPath = path.join(offlineFolder, `${songID}.mp3`);

      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(fullPath);
        const download = ytdl(`https://youtu.be/${songID}`, {
          filter: "audioonly",
        });

        download.pipe(writeStream);
        download.on("end", () => {
          console.log(songID + " descargada.");
          resolve();
        });
        download.on("error", () => {
          reject(songID);
        });
      });
    })
  ).then((results) => {
    const successful = results.filter(
      (result) => result.status == "fulfilled"
    ).length;

    const errorIds = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    console.log(
      `${successful} songs downloaded, ${errorIds.length} had errors.`
    );

    console.error(errorIds);

    if (errorIds.length > 0)
      // SEND ERROR SIGNAL
      mainWindow.webContents.send("trivial:errors", errorIds.length);

    generateHTML(targetFolder, songs, copyrightIds, errorIds, isRandom);

    // SEND SUCCESS SIGNAL
    mainWindow.webContents.send("trivial:success");
  });
}

/**
 * Generate the HTML for the trivial
 * @param {string} targetFolder Folder where the html will be in
 * @param {*} songs Song objects for the trivial
 * @param {*} copyrightIds IDs of the songs that were downloaded
 * @param {*} errorIds IDs of the songs that couldn't be downloaded
 * @param {boolean} isRandom True if the songs need to be shuffled
 */
function generateHTML(targetFolder, songs, copyrightIds, errorIds, isRandom) {
  const trivialTemplate = path.join(
    __dirname,
    "./trivial/trivialTemplate.html"
  );

  const fullPath = path.join(targetFolder, "trivial.html");

  fs.copyFileSync(trivialTemplate, fullPath);

  // GET SONG INFO
  if (isRandom) shuffle(songs);

  const infoObj = {};
  const divs = [];
  songs.forEach((song, i) => {
    const isOffline = copyrightIds.includes(song.id);
    const isKO = errorIds.includes(song.id);

    htmlDiv = generateSongPanel(song, i, isOffline, isKO);
    divs.push(htmlDiv);

    infoObj[song.id] = song;
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
}

// Respond to ipcRenderer
ipcMain.on("trivial:generate", (e, options) => {
  trivialGeneration(options);
});

const difficultyClasses = {
  easy: "border-green-900",
  normal: "border-sky-900",
  hard: "border-red-900",
};

/**
 * Returns the HTML snippet that corresponds to the i-th song
 * @param {Object} song Song object with its info
 * @param {int} i Song number
 * @param {boolean} isOffline True if the song could not be reproduced from the embed
 * @param {boolean} isKO True if the song couldn't be downloaded due to an error
 * @returns
 */
function generateSongPanel(song, i, isOffline, isKO) {
  const isError = isOffline && isKO;

  const htmlDiv = `<div id="${song.id}"
    data-cr="${isOffline ? "true" : "false"}"
    data-difficulty="${song.difficulty}"
    name="song-panel"
    class="border-4 ${
      difficultyClasses[song.difficulty]
    } xl:basis-56 lg:basis-52 bg-no-repeat bg-center bg-cover relative basis-60 flex-shrink-0 h-[10rem] pl-1
     ${isError ? "bg-black" : ""}"
    onclick="toggleAudio(this.id);"
  >
    <span class="font-bold">${i + 1}</span>
    <span
      id="anime-${song.id}"
      class="hidden font-mono absolute bottom-0 left-0 px-1 w-full bg-black text-white"
    >
      ${song.anime}
    </span>
  </div>`;

  return htmlDiv;
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
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [
      {
        name: "JSON (*.json)",
        extensions: ["json"],
      },
    ],
  });
  if (!canceled) {
    mainWindow.webContents.send("dialog:listTargetPath", { path: filePath });
  }
});
