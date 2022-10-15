const listForm = document.querySelector("#list-form");
const listInput = document.querySelector("#list-input");

const hdnListFile = document.getElementById("hdn-list-file");

const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const numSongs = document.querySelector("#numSongs");

const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("filePath");

function loadList(filePath) {
  const songs = fs.readFileSync(filePath, "utf-8").toString().split("\n");

  listForm.style.display = "block";
  hdnListFile.value = filePath;
  filename.innerHTML = filePath;
  numSongs.innerHTML = songs.length;
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

  if (!listInput.files[0]) {
    alertError("No hay el bicho!");
    return;
  }

  alertSuccess("Ok");
  // Send to main using ipcRenderer
  ipcRenderer.send("trivial:generate", { test: 3 });
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

if (filePath && filePath.trim() !== "") {
  loadList(filePath);
}
