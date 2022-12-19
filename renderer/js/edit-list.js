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
            <input id="anime-${i}" name="anime" class="pl-2 w-full bg-slate-100" type="text" spellcheck="false" placeholder="Nombre del anime...">
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
            <input id="band-${i}" name="band" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Artista...">
          </div>
          <div class="table-cell p-0 text-slate-500">
            <input id="song-${i}" name="song" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Nombre de la canción...">
          </div>
          <div class="table-cell pl-2 text-slate-500 text-center">
            <select id="difficulty-${i}" class="bg-slate-100" name="difficulty">
              <option value="hard">Hard</option>
              <option selected value="normal">Normal</option>
              <option value="easy">Easy</option>
            </select>
          </div>
          <div class="table-cell p-0">
            <input id="yt-link-${i}" name="yt-link" class="bg-slate-100 pl-2 pr-2 text-slate-500 w-full" spellcheck="false" placeholder="Enlace de youtube...">
          </div>
        </div>`;
}

function parseJson() {
  return JSON.parse(fs.readFileSync(filePath, "utf-8").toString());
}

/**
 * Initialises the table with the loaded list
 */
function initTable() {
  if (!filePath || filePath === "" || !filePath.endsWith(".json")) return;

  const { author, songs } = parseJson();

  lbNumSongs.innerHTML = songs.length;

  document.getElementById("list-author").value = author;

  songs.forEach((song, i) => {
    addNewRow();

    const { anime, oped, opedNumber, band, name, difficulty, link } = song;

    const animeField = document.getElementById(`anime-${i}`);
    animeField.value = anime;

    const openingField = document.getElementById(`op-ed-${i}`);
    openingField.value =
      oped === "Opening" ? "op" : oped === "Ending" ? "ed" : "";

    const openingNumField = document.getElementById(`op-ed-num-${i}`);
    openingNumField.value = opedNumber;

    const bandField = document.getElementById(`band-${i}`);
    bandField.value = band;

    const songField = document.getElementById(`song-${i}`);
    songField.value = name;

    const difficultyField = document.getElementById(`difficulty-${i}`);
    difficultyField.value = difficulty;

    const linkField = document.getElementById(`yt-link-${i}`);
    linkField.value = link;
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

/**
 * Click handler for deleting a row
 * @param {*} e
 */
function deleteRow(e) {
  const rowNumber = e.target.id.split("-").at(-1);
  const row = document.getElementById(`row-${rowNumber}`);

  const rows = rowGroup.getElementsByClassName("table-row");
  row.remove();
  lbNumSongs.innerHTML = rows.length;
}

/**
 * Validate the data
 * @returns True if data is valid, false and shows an alert if invalid
 */
function validate() {
  // File path is empty
  if (newFilePath.innerHTML == "") {
    alertError("No hay ningún fichero. Añade un fichero de destino.");
    return false;
  }

  // Anime is not empty
  const animes = Array.from(document.getElementsByName("anime"));
  if (animes.some((anime) => anime.value.trim() == "")) {
    alertError("El campo Anime es obligatorio.");
    return false;
  }

  // Youtube is not empty
  const links = Array.from(document.getElementsByName("yt-link"));
  if (links.some((link) => link.value.trim() == "")) {
    alertError("El campo Youtube es obligatorio.");
    return false;
  }

  // Youtube has good format
  const re = /youtube\.com\/watch\?v=([^#&?]{11})|youtu\.be\/([^#&?]{11})/;

  for (let link of links) {
    const match = link.value.match(re);
    if (match) {
      const ytId = match[1] || match[2];
      link.value = `https://youtu.be/${ytId}`;
    } else {
      alertError("El campo Youtube no tiene el formato adecuado.");
      return false;
    }
  }

  return true;
}

/**
 * Build a song from its row number
 * @param {int} rowNumber
 * @returns Song object
 */
function songConstructor(rowNumber) {
  const opedValue = document.getElementById(`op-ed-${rowNumber}`).value;
  let oped = "";
  if (opedValue === "op") oped = "Opening";
  else if (opedValue === "ed") oped = "Ending";

  return {
    anime: document.getElementById(`anime-${rowNumber}`).value.trim(),
    oped,
    opedNumber: document.getElementById(`op-ed-num-${rowNumber}`).value,
    band: document.getElementById(`band-${rowNumber}`).value.trim(),
    name: document.getElementById(`song-${rowNumber}`).value.trim(),
    difficulty: document.getElementById(`difficulty-${rowNumber}`).value,
    link: document.getElementById(`yt-link-${rowNumber}`).value.trim(),
  };
}

/**
 * Save a .json file with the edited list
 * and go back to the main menu
 */
function saveFile() {
  if (!validate()) return;
  const rows = rowGroup.getElementsByClassName("table-row");
  const songArray = Array.from(rows).map((row) => {
    const rowNumber = row.id.split("-").at(-1);
    return songConstructor(rowNumber);
  });

  const author = document.getElementById("list-author").value;

  const trivialList = {
    author,
    songs: songArray,
  };

  const jsonOutput = JSON.stringify(trivialList, null, "\t");

  fs.writeFileSync(newFilePath.innerHTML, jsonOutput);
  ipcRenderer.send("list:index", { filePath: newFilePath.innerHTML });
}

/**
 * Return to the main page
 */
function goBack() {
  ipcRenderer.send("list:index", { filePath: newFilePath.innerHTML });
}

initTable();
btnAddRow.addEventListener("click", addNewRow);
btnSave.addEventListener("click", saveFile);
btnCancel.addEventListener("click", goBack);

ipcRenderer.on("dialog:listTargetPath", (params) => {
  newFilePath.innerHTML = params.path;
});
