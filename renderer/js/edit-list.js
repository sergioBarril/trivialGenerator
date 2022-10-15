const rowGroup = document.getElementById("table-row-group");

const btnAddRow = document.getElementById("btn-add-row");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");

const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("list-file");

const lbNumSongs = document.getElementById("num-songs");

const songs = fs.readFileSync(filePath, "utf-8").toString().split("\n");
lbNumSongs.innerHTML = songs.length;

function newRow(i) {
  return `<div id="row-${i}" class="table-row">
          <div class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400">
            <img id="delete-${i}" name="delete" src="./images/x.png" width="10" class="cursor-pointer">
          </div>
          <div id="anime-${i}" name="anime" contenteditable class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400"></div>
          <div class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400 text-center">
            <select id="op-ed-${i}" class="bg-slate-100">
              <option value="op">Opening</option>
              <option value="ed">Ending</option>              
            </select>
          </div>          
          <div id="band-${i}" name="band" contenteditable class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400"></div>          
          <div id="song-${i}" name="song" contenteditable class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400"></div>          
          <div class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400 text-center">
            <select id="difficulty-${i}" class="bg-slate-100" name="difficulty">
              <option value="hard">Hard</option>
              <option selected value="normal">Normal</option>
              <option value="easy">Easy</option>
            </select>
          </div>
          <div id="yt-link-${i}" name="yt-link" contenteditable
            class="table-cell border-b border-slate-100 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400 pr-2">
          </div>
        </div>`;
}

function initTable() {
  songs.forEach((song, i) => {
    const songElements = song.split("||").map((x) => x.trim());
    addNewRow();

    const [
      animeValue,
      openingValue,
      bandValue,
      songValue,
      difficultyValue,
      linkValue,
    ] = songElements;

    const animeField = document.getElementById(`anime-${i}`);
    animeField.innerHTML = animeValue;

    const openingField = document.getElementById(`op-ed-${i}`);
    openingField.value = openingValue.toLowerCase();

    const bandField = document.getElementById(`band-${i}`);
    bandField.innerHTML = bandValue;

    const songField = document.getElementById(`song-${i}`);
    songField.innerHTML = songValue;

    const difficultyField = document.getElementById(`difficulty-${i}`);
    difficultyField.value = difficultyValue.toLowerCase();

    const linkField = document.getElementById(`yt-link-${i}`);
    linkField.innerHTML = linkValue;
  });
}

function addNewRow() {
  const rows = rowGroup.getElementsByClassName("table-row");
  let newRowNumber = rows.length;
  if (rows.length > 0) {
    newRowNumber = parseInt(Array.from(rows).at(-1).id.split("-").at(-1)) + 1;
  }
  rowGroup.insertAdjacentHTML("beforeend", newRow(newRowNumber));

  lbNumSongs.innerHTML = rows.length;

  const animeField = document.getElementById(`anime-${newRowNumber}`);
  animeField.spellcheck = false;

  const bandField = document.getElementById(`band-${newRowNumber}`);
  bandField.spellcheck = false;

  const songField = document.getElementById(`song-${newRowNumber}`);
  songField.spellcheck = false;

  const linkField = document.getElementById(`yt-link-${newRowNumber}`);
  linkField.spellcheck = false;

  const x = document.getElementById(`delete-${newRowNumber}`);
  x.addEventListener("click", deleteRow);
}

function validate() {
  // Anime is not empty
  const animes = Array.from(document.getElementsByName("anime"));
  if (animes.some((anime) => anime.innerHTML.trim() == "")) {
    alertError("El campo Anime es obligatorio.");
    return false;
  }

  // Youtube is not empty
  const links = Array.from(document.getElementsByName("yt-link"));
  if (links.some((link) => link.innerHTML.trim() == "")) {
    alertError("El campo Youtube es obligatorio.");
    return false;
  }

  // Youtube has good format
  const re = /youtube\.com\/watch\?v=([^#&?]{11})|youtu\.be\/([^#&?]{11})/;

  for (let link of links) {
    const match = link.innerHTML.match(re);
    if (match) {
      const ytId = match[1] || match[2];
      link.innerHTML = `https://youtu.be/${ytId}`;
    } else {
      alertError("El campo Youtube no tiene el formato adecuado.");
      return false;
    }
  }

  return true;
}

function saveFile() {
  if (!validate()) return;
  const rows = rowGroup.getElementsByClassName("table-row");
  const text = Array.from(rows)
    .map((row) => {
      let result = "";
      const rowNumber = row.id.split("-").at(-1);
      result +=
        document.getElementById(`anime-${rowNumber}`).innerHTML.trim() + " || ";
      result += document.getElementById(`op-ed-${rowNumber}`).value + " || ";
      result +=
        document.getElementById(`band-${rowNumber}`).innerHTML.trim() + " || ";
      result +=
        document.getElementById(`song-${rowNumber}`).innerHTML.trim() + " || ";
      result +=
        document.getElementById(`difficulty-${rowNumber}`).value + " || ";
      result += document
        .getElementById(`yt-link-${rowNumber}`)
        .innerHTML.trim();

      return result;
    })
    .join("\n");

  fs.writeFileSync(filePath, text);
  ipcRenderer.send("list:index", { filePath });
}

function goBack() {
  ipcRenderer.send("list:index", { filePath });
}

function deleteRow(e) {
  const rowNumber = e.target.id.split("-").at(-1);
  const row = document.getElementById(`row-${rowNumber}`);

  const rows = rowGroup.getElementsByClassName("table-row");
  row.remove();
  lbNumSongs.innerHTML = rows.length;
}

initTable();
btnAddRow.addEventListener("click", addNewRow);
btnSave.addEventListener("click", saveFile);
btnCancel.addEventListener("click", goBack);

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
