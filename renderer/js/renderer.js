const { alertError, alertSuccess, alertWarning } = alerts;

// Get Elements
const listForm = document.getElementById("list-form");
const listInput = document.getElementById("list-input");

const summaryInput = document.getElementById("summary-input");

const outputPath = document.getElementById("output-path");
const summaryPath = document.getElementById("summary-path");

const filename = document.getElementById("filename");
const numSongs = document.getElementById("numSongs");

const summaryDiv = document.getElementById("summary-div");
const mainContent = document.getElementById("main-content");

// URL params
const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("filePath");

if (filePath && filePath.trim() !== "") {
  loadList(filePath);
}

let copyrightIds = [];
let allSongs = [];
let i = 0;
let done = false;
let author = "";

/**
 * Load the list into the program
 * @param {string} filePath Filepath to the list
 */
function loadList(filePath) {
  const { author: listAuthor, songs } = JSON.parse(
    fs.readFileSync(filePath, "utf-8").toString()
  );
  const editListText = document.getElementById("edit-list-text");

  editListText.innerHTML = "Edita tu lista";

  mainContent.classList.remove("hidden");
  summaryDiv.classList.remove("hidden");
  listForm.style.display = "block";
  filename.innerHTML = filePath;
  numSongs.innerHTML = songs.length;

  const summarySongs = document.getElementById("summary-song-number");
  summarySongs.innerHTML = getSummarySongs();

  author = listAuthor;

  updateFolder(path.dirname(filePath));
}

/**
 * Load the summary into the program
 * @param {string} filePath Filepath to the summary
 * @param {Date} lastModified Date of last time the file was edited
 */
function loadSummary(filePath, lastModified) {
  const summaryPath = document.getElementById("summary-path");
  summaryPath.innerHTML = filePath;

  const summarySongs = document.getElementById("summary-song-number");
  summarySongs.innerHTML = getSummarySongs();

  const summaryLastModified = document.getElementById("summary-last-modified");
  summaryLastModified.innerHTML = lastModified.toLocaleDateString("es-ES");

  document.getElementById("summary-info-div").classList.remove("hidden");
}

/**
 * Returns a string with the number of songs that there are in a summary and,
 * if appropriate, the number of songs that are being added with the current list
 * @returns
 */
function getSummarySongs() {
  // Summary songs
  if (!summaryPath?.innerHTML || summaryPath?.innerHTML.trim() === "") return;
  const summary = JSON.parse(
    fs.readFileSync(summaryPath.innerHTML.trim(), "utf-8").toString()
  );

  let summarySongNumber = `${summary.songs.length}`;

  const hasList = filename?.innerHTML && filename?.innerHTML.trim() != "";

  // Compare with current list
  if (hasList) {
    const list = JSON.parse(
      fs.readFileSync(filename.innerHTML.trim(), "utf-8").toString()
    );
    const repeatedSongs = getRepeatedSongs(list.songs, summary.songs);

    if (repeatedSongs.length === list.songs.length) {
      alertWarning("Esta lista ya estaba dentro del recopilatorio.");
    } else if (repeatedSongs.length > 0) {
      alertWarning(
        `Hay ${repeatedSongs.length} canciones que ya estaban en el recopilatorio. ¡Asegúrate bien!`
      );
    }

    summarySongNumber += ` (+${list.songs.length - repeatedSongs.length})`;
  }

  return summarySongNumber;
}

function getRepeatedSongs(listSongs, summarySongs) {
  const listLinks = listSongs.map((song) => song.link);

  return summarySongs.filter((song) => listLinks.includes(song.link));
}

function getSongNumber(filePath) {
  if (!filePath || filePath.trim() == "") return null;

  const { songs } = JSON.parse(fs.readFileSync(filePath, "utf-8").toString());

  return songs.length;
}

/**
 * Select the file of the list
 * @param {event} e Event of the file picker
 * @returns
 */
function selectList(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!checkListFormat(file)) {
    alertError("¡Formato de archivo inválido! Acepto solo archivos .json");
    return;
  }
  loadList(file.path);
  alertSuccess("Success!");
}

function setSummary(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!checkListFormat(file)) {
    alertError("¡Formato de archivo inválido! Acepto solo archivos .json");
    return;
  }

  const lastModified = new Date(file.lastModified);
  loadSummary(file.path, lastModified);
  alertSuccess("Recopilatorio de listas cargado");
}

/**
 * Check that the list is in a good format
 * @param {*} file
 * @returns
 */
function checkListFormat(file) {
  const ACCEPTED_FORMATS = ["json"];

  if (!ACCEPTED_FORMATS.includes(file.name.split(".").pop())) return false;

  return true;
}

function selectFolder() {
  ipcRenderer.selectFolder();
}

/**
 * Given a folder path, update the output folder field
 * @param {string} folder
 */
function updateFolder(folder) {
  if (folder) {
    const fileWithoutExtension = path.filename(filename.innerHTML);
    outputPath.innerHTML = path.join(folder, `trivial_${fileWithoutExtension}`);
  }
}

listInput.addEventListener("change", selectList);

document
  .getElementsByName("summary-input")
  .forEach((input) => input.addEventListener("change", setSummary));

listForm.addEventListener("submit", trivialChecks);

/**
 * Event handler to update the output path folder on dialog change
 */
ipcRenderer.on("dialog:outputPath", (params) => {
  updateFolder(params.path);
});

ipcRenderer.on("trivial:success", () => {
  alertSuccess("Trivial generado correctamente");
});

ipcRenderer.on("trivial:errors", (numErrors) => {
  alertError(
    `Ha habido ${numErrors} canciones que no se han podido descargar. Generando HTML...`
  );
});

/** Call backend to change to the editList page */
function onEditListButton() {
  ipcRenderer.send("list:editList", { filePath: filename.innerHTML });
}

/**
 * Start checking for Copyright
 */
function checkCopyright() {
  alertSuccess("Verificando canciones con copyright...");

  const filePath = filename.innerHTML;

  const trivialList = JSON.parse(fs.readFileSync(filePath, "utf-8").toString());

  allSongs = trivialList.songs;

  allSongs.forEach((song) => {
    song.id = song.link.split("/").at(-1);
  });

  copyrightIds = [];

  if (i < allSongs.length) {
    player.loadVideoById(allSongs[i].id);
  }
}

/**
 * Call the backend to download songs and generate the HTML
 */
function generateTrivial() {
  const cbRando = document.getElementById("randomize-cb");

  ipcRenderer.send("trivial:generate", {
    listPath: filename.innerHTML,
    summaryPath: summaryPath.innerHTML,
    author,
    songs: allSongs,
    copyrightIds,
    targetDir: outputPath.innerHTML,
    randomize: cbRando.checked,
  });
}
/**
 * Starts the generation of the trivial.
 * Checks that files are inserted, and starts copyright checks.
 * @param {*} e
 * @returns
 */
function trivialChecks(e) {
  e.preventDefault();

  if (filename.innerHTML == "") {
    alertError("¡No hay lista!");
    return;
  }

  if (outputPath.innerHTML == "") {
    alertError("¡No hay destino!");
  }

  checkCopyright();
}

// ****************
//      YOUTUBE
// *****************
var tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

/**
 * Setup the Youtube Embed
 */
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
    events: {
      onStateChange: onPlayerStateChange,
      onError: onCopyError,
    },
  });
}

/**
 * Event handler for the embedded player in the app if
 * the song has started playing (no copyright error).
 *
 * Then, check the next song, or start the downloads if all have been checked.
 * @param {*} event
 */
function onPlayerStateChange(event) {
  if (event.data != YT.PlayerState.PLAYING) return;
  checkNextSong();
}

/**
 * Event handler for the embedded player in the app if
 * the song can't be played (copyright error / or other type).
 *
 * Then, check the next song, or start the downloads if all have been checked.
 * @param {*} event
 */
function onCopyError() {
  copyrightIds.push(allSongs[i].id);
  checkNextSong();
}

/**
 * Helper function. Loads the next song to the embed, or starts
 * the download if there are no more songs left.
 */
function checkNextSong() {
  i++;
  if (i < allSongs.length) player.loadVideoById(allSongs[i].id);
  else if (!done) {
    player.stopVideo();
    done = true;

    alertSuccess(
      `Verificación de Copyright terminada. Canciones comprometidas: ${copyrightIds.length}. Generando trivial...`
    );

    generateTrivial();
  }
}
