const { alertError } = alerts;

// Get Elements
const rowGroup = document.getElementById("table-row-group");

const btnAddRow = document.getElementById("btn-add-row");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");

const newFilePath = document.getElementById("target-path");

// URL Params
const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("filePath");

if (filePath && filePath.trim() != "") {
  newFilePath.innerHTML = filePath;
}

const lbNumSongs = document.getElementById("num-songs");

let songs = [];

/**
 * Returns the HTML of the new table row
 * @param {int} i Number of row
 * @returns HTML code of the new row in the table
 */
function newRow(i) {
  return `<div id="row-${i}" class="table-row">
          <div class="table-cell pl-2 text-slate-500">
            <img id="delete-${i}" name="delete" src="./images/x.png" width="10" class="cursor-pointer">
          </div>
          <div class="table-cellp-0 text-slate-500 ">
            <input id="anime-${i}" name="anime" class="pl-2 w-full bg-slate-100" type="text" placeholder="Nombre del anime...">
          </div>
          <div class="table-cell pl-2 text-slate-500 text-center">
            <span>
              <select id="op-ed-${i}" class="bg-slate-100 w-5/12">
                <option value="op">Opening</option>
                <option value="ed">Ending</option>              
              </select>
              <input id="op-ed-num-${i}" class="w-12 bg-slate-100" type="number" min="1" value="1">
            </span>
          </div>
          <div class="table-cell p-0 text-slate-500">
            <input id="band-${i}" name="band" type="text" class="bg-slate-100 pl-2 w-full" placeholder="Artista...">
          </div>
          <div class="table-cell p-0 text-slate-500">
            <input id="song-${i}" name="song" type="text" class="bg-slate-100 pl-2 w-full" placeholder="Nombre de la canción...">
          </div>
          <div class="table-cell pl-2 text-slate-500 text-center">
            <select id="difficulty-${i}" class="bg-slate-100" name="difficulty">
              <option value="hard">Hard</option>
              <option selected value="normal">Normal</option>
              <option value="easy">Easy</option>
            </select>
          </div>
          <div class="table-cell p-0">
            <input id="yt-link-${i}" name="yt-link" class="bg-slate-100 pl-2 pr-2 text-slate-500 w-full" placeholder="Enlace de youtube...">
          </div>
        </div>`;
}

function parseOldTxt() {
  return fs
    .readFileSync(filePath, "utf-8")
    .toString()
    .split("\n")
    .split("||")
    .map((x) => x.trim());
}

function parseJson() {
  return JSON.parse(fs.readFileSync(filePath, "utf-8").toString());
}

function parseSimpleTxt() {}

/**
 * Initialises the table with the loaded list
 */
function initTable() {
  if (filePath && filePath != "") {
    if (filePath.endsWith(".txt")) songs = parseOldTxt();
    else if (filePath.endsWith(".json")) songs = parseJson();
  }

  lbNumSongs.innerHTML = songs.length;

  songs.forEach((song, i) => {
    addNewRow();

    const { anime, oped, number, band, songName, difficulty, link } = song;

    const animeField = document.getElementById(`anime-${i}`);
    animeField.value = anime;

    const openingField = document.getElementById(`op-ed-${i}`);
    openingField.value = oped;

    const openingNumField = document.getElementById(`op-ed-num-${i}`);
    openingNumField.value = number;

    const bandField = document.getElementById(`band-${i}`);
    bandField.value = band;

    const songField = document.getElementById(`song-${i}`);
    songField.value = songName;

    const difficultyField = document.getElementById(`difficulty-${i}`);
    difficultyField.value = difficulty;

    const linkField = document.getElementById(`yt-link-${i}`);
    linkField.innerHTML = link;
  });
}

/**
 * Adds a new empty row
 */
function addNewRow() {
  const rows = rowGroup.getElementsByClassName("table-row");
  let newRowNumber = rows.length;
  if (rows.length > 0) {
    newRowNumber = parseInt(Array.from(rows).at(-1).id.split("-").at(-1)) + 1;
  }
  rowGroup.insertAdjacentHTML("beforeend", newRow(newRowNumber));

  lbNumSongs.innerHTML = rows.length;

  const x = document.getElementById(`delete-${newRowNumber}`);
  x.addEventListener("click", deleteRow);
}

function validate() {
  // File path is empty
  if (newFilePath.innerHTML == "") {
    alertError("No hay ningún fichero. Añade un fichero de destino.");
    return false;
  }

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

  fs.writeFileSync(newFilePath.innerHTML, text);
  ipcRenderer.send("list:index", { filePath: newFilePath.innerHTML });
}

function goBack() {
  ipcRenderer.send("list:index", { filePath: newFilePath.innerHTML });
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

ipcRenderer.on("dialog:listTargetPath", (params) => {
  newFilePath.innerHTML = params.path;
});
