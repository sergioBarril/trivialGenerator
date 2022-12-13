const { alertError, alertSuccess } = alerts;

// Get Elements
const listForm = document.getElementById("list-form");
const listInput = document.getElementById("list-input");

const hdnListFile = document.getElementById("hdn-list-file");

const outputPath = document.getElementById("output-path");
const filename = document.getElementById("filename");
const numSongs = document.getElementById("numSongs");

const mainContent = document.getElementById("main-content");

// URL params
const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("filePath");

if (filePath && filePath.trim() !== "") {
  loadList(filePath);
}

let crSongs = [];
let allSongs = [];
let i = 0;
let done = false;

/**
 * Load the list into the program
 * @param {string} filePath Filepath to the list
 */
function loadList(filePath) {
  const songs = fs.readFileSync(filePath, "utf-8").toString().split("\n");
  const editListText = document.getElementById("edit-list-text");

  editListText.innerHTML = "Edita tu lista";

  mainContent.classList.remove("hidden");
  listForm.style.display = "block";
  hdnListFile.value = filePath;
  filename.innerHTML = filePath;
  numSongs.innerHTML = songs.length;
  updateFolder(path.dirname(filePath));
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
listForm.addEventListener("submit", trivialChecks);

/**
 * Event handler to update the output path folder on dialog change
 */
ipcRenderer.on("dialog:outputPath", (params) => {
  updateFolder(params.path);
});

/** Call backend to change to the editList page */
function onEditListButton() {
  ipcRenderer.send("list:editList", { filePath: filename.innerHTML });
}

/**
 * Start checking for Copyright
 */
function checkCopyright() {
  alertSuccess("Verificando partidas con copyright...");

  const filePath = filename.innerHTML;
  const songs = fs.readFileSync(filePath, "utf-8").toString().split("\n");

  allSongs = songs.map((song) =>
    song.split("||").at(-1).trim().split("/").at(-1).trim()
  );
  crSongs = [];

  if (i < allSongs.length) {
    player.loadVideoById(allSongs[i]);
  }
}

/**
 * Call the backend to download songs and generate the HTML
 */
function generateTrivial() {
  const cbRando = document.getElementById("randomize-cb");

  ipcRenderer.send("trivial:generate", {
    listPath: filename.innerHTML,
    copyrightSongs: crSongs,
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
  crSongs.push(allSongs[i]);
  checkNextSong();
}

/**
 * Helper function. Loads the next song to the embed, or starts
 * the download if there are no more songs left.
 */
function checkNextSong() {
  i++;
  if (i < allSongs.length) player.loadVideoById(allSongs[i]);
  else if (!done) {
    player.stopVideo();
    done = true;

    alertSuccess(
      `Verificación de Copyright terminada. Canciones comprometidas: ${crSongs.length}. Generando trivial...`
    );

    generateTrivial();
  }
}
