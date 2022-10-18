const listForm = document.querySelector("#list-form");
const listInput = document.querySelector("#list-input");

const hdnListFile = document.getElementById("hdn-list-file");

const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const numSongs = document.querySelector("#numSongs");

const mainContent = document.getElementById("main-content");

const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("filePath");

if (filePath && filePath.trim() !== "") {
  loadList(filePath);
}

let crSongs = [];
let allSongs = [];
let i = 0;
let done = false;

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

function selectList(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!checkListFormat(file)) {
    alertError("¡Formato de archivo inválido! Acepto solo archivos .txt");
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
  if (file.name.split(".").pop() !== "txt") return false;

  return true;
}

function generateTrivial(e) {
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

function selectFolder() {
  ipcRenderer.selectFolder();
}

function updateFolder(folder) {
  if (folder) {
    const fileWithoutExtension = path.filename(filename.innerHTML);
    outputPath.innerHTML = path.join(folder, `trivial_${fileWithoutExtension}`);
  }
}

// ALERTS

function alertMessage(type, message) {
  const backgroundColors = {
    ERROR: "red",
    SUCCESS: "green",
    WARNING: "yellow",
  };

  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: backgroundColors[type],
      color: "white",
      textAlign: "center",
    },
  });
}

function alertError(message) {
  alertMessage("ERROR", message);
}

function alertWarning(message) {
  alertMessage("WARNING", message);
}

function alertSuccess(message) {
  alertMessage("SUCCESS", message);
}

listInput.addEventListener("change", selectList);
listForm.addEventListener("submit", generateTrivial);

ipcRenderer.on("dialog:outputPath", (params) => {
  updateFolder(params.path);
});

function onEditListButton() {
  ipcRenderer.send("list:editList", { filePath: filename.innerHTML });
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

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

function onCopyError() {
  crSongs.push(allSongs[i]);
  console.log("Mala: " + allSongs[i]);
  i++;
  if (i < allSongs.length) player.loadVideoById(allSongs[i]);
  else if (!done) {
    player.stopVideo();
    done = true;
    downloadCr();
  }
}

//
//  YOUTUBE
//
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
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

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    console.log("Buena!" + allSongs[i]);
    i++;
    if (i < allSongs.length) player.loadVideoById(allSongs[i]);
    else if (!done) {
      player.stopVideo();
      done = true;
      downloadCr();
    }
  }
}

function downloadCr() {
  const cbRando = document.getElementById("randomize-cb");

  ipcRenderer.send("trivial:generate", {
    listPath: filename.innerHTML,
    copyrightSongs: crSongs,
    targetDir: outputPath.innerHTML,
    randomize: cbRando.checked,
  });
}
