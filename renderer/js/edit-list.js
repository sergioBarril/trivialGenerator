const { alertError } = alerts;

// Get Elements

const typeSelect = document.getElementById("type-select");

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

let highlightedRowNumber = -1;

const lbNumSongs = document.getElementById("num-songs");

/**
 * Returns the HTML of the new table row for anime
 * @param {int} i Number of row
 * @returns HTML code of the new row in the table
 */
function newAnimeRow(i) {
  return `<tr id="anime-row-${i}" class="w-full">
          <td class="pl-2 text-slate-500">
            <img id="delete-anime-${i}" name="delete" src="./images/x.png" width="10" class="cursor-pointer">
          </td>
          <td class="p-0 text-slate-500 ">
            <input id="anime-${i}" name="anime" class="pl-2 w-full bg-slate-100" type="text" spellcheck="false" placeholder="Nombre del anime...">
          </td>
          <td class="pl-2 text-slate-500 text-center">
            <span>
              <select id="op-ed-${i}" class="bg-slate-100 w-5/12">
                <option value="op">Opening</option>
                <option value="ed">Ending</option>  
                <option value="ost">OST</option>            
              </select>
              <input id="op-ed-num-${i}" class="w-12 bg-slate-100" type="number" min="1" value="1">
            </span>
          </td>
          <td class="p-0 text-slate-500">
            <input id="band-${i}" name="band" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Artista...">
          </td>
          <td class="p-0 text-slate-500">
            <input id="song-${i}" name="song" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Nombre de la canción...">
          </td>
          <td class="pl-2 text-slate-500 text-center">
            <select id="difficulty-anime-${i}" class="bg-slate-100" name="difficulty">
              <option value="hard">Hard</option>
              <option selected value="normal">Normal</option>
              <option value="easy">Easy</option>
            </select>
          </td>
          <td class="p-0">
            <input id="yt-link-anime-${i}" name="yt-link" class="bg-slate-100 pl-2 pr-2 text-slate-500 w-full" spellcheck="false" placeholder="Enlace de youtube...">
          </td>
        </tr>`;
}

/**
 * Returns the HTML of the new table row
 * @param {int} i Number of row
 * @returns HTML code of the new row in the table
 */
function newGameRow(i) {
  return `<tr id="game-row-${i}">
          <td class="pl-2 text-slate-500">
            <img id="delete-game-${i}" name="delete" src="./images/x.png" width="10" class="cursor-pointer">
          </td>
          <td class="p-0 text-slate-500 ">
            <input id="saga-${i}" name="saga" class="pl-2 w-full bg-slate-100" type="text" spellcheck="false" placeholder="Saga...">
          </td>
          <td class="p-0 text-slate-500">
            <input id="game-${i}" name="band" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Juego...">
          </td>
          <td class="p-0 text-slate-500">
            <input id="description-${i}" name="description" type="text" class="bg-slate-100 pl-2 w-full" spellcheck="false" placeholder="Descripción de la situación, nombre...">
          </td>
          <td class="pl-2 text-slate-500 text-center">
            <select id="difficulty-game-${i}" class="bg-slate-100" name="difficulty">
              <option value="hard">Hard</option>
              <option selected value="normal">Normal</option>
              <option value="easy">Easy</option>
            </select>
          </td>
          <td class="p-0">
            <input id="yt-link-game-${i}" name="yt-link" class="yt-link bg-slate-100 pl-2 pr-2 text-slate-500 w-full" spellcheck="false" placeholder="Enlace de youtube...">
          </td>
        </tr>`;
}

function parseJson() {
  return JSON.parse(fs.readFileSync(filePath, "utf-8").toString());
}

function switchTable(type) {
  const animeHeader = document.getElementById("anime-table-header");
  const gameHeader = document.getElementById("game-table-header");

  const animeRowGroup = document.getElementById("anime-table-row-group");
  const gameRowGroup = document.getElementById("game-table-row-group");

  const rows = getRowGroup(type).getElementsByTagName("tr");
  lbNumSongs.innerHTML = rows.length;

  if (type === "Anime") {
    animeHeader.classList.remove("hidden");
    animeRowGroup.classList.remove("hidden");

    gameHeader.classList.add("hidden");
    gameRowGroup.classList.add("hidden");
  } else {
    animeHeader.classList.add("hidden");
    animeRowGroup.classList.add("hidden");

    gameHeader.classList.remove("hidden");
    gameRowGroup.classList.remove("hidden");
  }
}

function fillRow(i, song, type) {
  if (type === "Anime") fillAnimeRow(i, song);
  else fillGameRow(i, song);
}

function fillAnimeRow(i, song) {
  const { anime, oped, opedNumber, band, name, difficulty, link } = song;

  document.getElementById(`anime-${i}`).value = anime;
  document.getElementById(`op-ed-${i}`).value =
    oped === "Opening" ? "op" : oped === "Ending" ? "ed" : "ost";
  document.getElementById(`op-ed-num-${i}`).value = opedNumber;
  document.getElementById(`band-${i}`).value = band;
  document.getElementById(`song-${i}`).value = name;
  document.getElementById(`difficulty-anime-${i}`).value = difficulty;
  document.getElementById(`yt-link-anime-${i}`).value = link;
}

function fillGameRow(i, song) {
  const { saga, game, description, difficulty, link } = song;

  document.getElementById(`saga-${i}`).value = saga;
  document.getElementById(`game-${i}`).value = game;
  document.getElementById(`description-${i}`).value = description;
  document.getElementById(`difficulty-game-${i}`).value = difficulty;
  document.getElementById(`yt-link-game-${i}`).value = link;
}

/**
 * Initialises the table with the loaded list
 */
function initTable() {
  if (!filePath || filePath === "" || !filePath.endsWith(".json")) return;

  const { type, author, songs } = parseJson();

  lbNumSongs.innerHTML = songs.length;

  document.getElementById("list-author").value = author;

  typeSelect.value = type;

  switchTable(type);
  songs.forEach((song, i) => {
    addNewRow(type);
    fillRow(i, song, type);
  });
}

function getRowGroup(type) {
  return document.getElementById(`${type.toLowerCase()}-table-row-group`);
}

/**
 * Adds a new empty row
 */
function addNewRow(type) {
  type = type.toLowerCase();
  const rowGroup = getRowGroup(type);

  const rows = rowGroup.getElementsByTagName("tr");
  let newRowNumber = rows.length;
  if (rows.length > 0) {
    newRowNumber = parseInt(Array.from(rows).at(-1).id.split("-").at(-1)) + 1;
  }

  const newRowHtml =
    type === "anime" ? newAnimeRow(newRowNumber) : newGameRow(newRowNumber);

  rowGroup.insertAdjacentHTML("beforeend", newRowHtml);

  lbNumSongs.innerHTML = rows.length;

  const x = document.getElementById(`delete-${type}-${newRowNumber}`);
  x.addEventListener("click", deleteRow);

  const newRowElement = document.getElementById(`${type}-row-${newRowNumber}`);

  const inputs = newRowElement.querySelectorAll("input, select");
  inputs.forEach((input) => input.addEventListener("focus", focusRow));
}

/**
 * Click handler for deleting a row
 * @param {*} e
 */
function deleteRow(e) {
  const rowNumber = e.target.id.split("-").at(-1);
  const type = typeSelect.value.toLowerCase();
  const row = document.getElementById(`${type}-row-${rowNumber}`);

  const rows = getRowGroup(type).getElementsByTagName("tr");
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

  const type = typeSelect.value;

  if (type == "Anime") {
    if (!validateAnime()) return false;
  }

  // Youtube is not empty

  const rowGroup = getRowGroup(type);
  const links = Array.from(rowGroup.getElementsByClassName("yt-link"));
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

function validateAnime() {
  // Anime is not empty
  const animes = Array.from(document.getElementsByName("anime"));
  if (animes.some((anime) => anime.value.trim() == "")) {
    alertError("El campo Anime es obligatorio.");
    return false;
  }
}

function songConstructor(rowNumber) {
  const type = typeSelect.value;
  if (type == "Anime") return animeSongConstructor(rowNumber);
  else return gameSongConstructor(rowNumber);
}

/**
 * Build a song from its row number
 * @param {int} rowNumber
 * @returns Song object
 */
function animeSongConstructor(rowNumber) {
  const opedValue = document.getElementById(`op-ed-${rowNumber}`).value;
  let oped = "";
  if (opedValue === "op") oped = "Opening";
  else if (opedValue === "ed") oped = "Ending";
  else if (opedValue === "ost") oped = "OST";

  return {
    anime: document.getElementById(`anime-${rowNumber}`).value.trim(),
    oped,
    opedNumber: document.getElementById(`op-ed-num-${rowNumber}`).value,
    band: document.getElementById(`band-${rowNumber}`).value.trim(),
    name: document.getElementById(`song-${rowNumber}`).value.trim(),
    difficulty: document.getElementById(`difficulty-anime-${rowNumber}`).value,
    link: document.getElementById(`yt-link-anime-${rowNumber}`).value.trim(),
  };
}

function gameSongConstructor(rowNumber) {
  return {
    saga: document.getElementById(`saga-${rowNumber}`).value.trim(),
    game: document.getElementById(`game-${rowNumber}`).value.trim(),
    description: document
      .getElementById(`description-${rowNumber}`)
      .value.trim(),
    difficulty: document.getElementById(`difficulty-game-${rowNumber}`).value,
    link: document.getElementById(`yt-link-game-${rowNumber}`).value.trim(),
  };
}

/**
 * Save a .json file with the edited list
 * and go back to the main menu
 */
function saveFile() {
  if (!validate()) return;
  const type = typeSelect.value;
  const rows = getRowGroup(type).getElementsByTagName("tr");
  const songArray = Array.from(rows).map((row) => {
    const rowNumber = row.id.split("-").at(-1);
    return songConstructor(rowNumber);
  });

  const author = document.getElementById("list-author").value.trim();

  const trivialList = {
    type,
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
switchTable(typeSelect.value);
btnAddRow.addEventListener("click", (e) => addNewRow(typeSelect.value));
btnSave.addEventListener("click", saveFile);
btnCancel.addEventListener("click", goBack);

ipcRenderer.on("dialog:listTargetPath", (params) => {
  newFilePath.innerHTML = params.path;
});

/**
 * Given an row number, make its row darker
 * @param {*} rowNumber Number of the row to highlight
 */
function highlightRow(rowNumber) {
  const type = typeSelect.value;
  const row = document.getElementById(`${type.toLowerCase()}-row-${rowNumber}`);

  row.classList.remove("bg-slate-100");
  row.classList.add("bg-slate-400");
  row.classList.add("text-slate-800");

  row.querySelectorAll("input, select").forEach((input) => {
    input.classList.remove("bg-slate-100");
    input.classList.add("bg-slate-400");

    input.classList.add("text-slate-800");
    input.classList.add("placeholder-white");
  });
}

/**
 * Lowlights the row highlighted
 */
function lowlightRow(type = null) {
  type = type ?? typeSelect.value;
  const row = document.getElementById(
    `${type.toLowerCase()}-row-${highlightedRowNumber}`
  );
  row.classList.remove("bg-slate-400");
  row.classList.remove("text-slate-800");
  row.classList.add("bg-slate-100");

  row.querySelectorAll("input, select").forEach((input) => {
    input.classList.add("bg-slate-100");
    input.classList.remove("bg-slate-400");
    input.classList.remove("text-slate-800");
    input.classList.remove("placeholder-white");
  });
}

function focusRow(e) {
  const rowNumber = parseInt(e.target.id.split("-").at(-1));
  highlightRow(rowNumber);
  if (highlightedRowNumber >= 0 && rowNumber != highlightedRowNumber)
    lowlightRow();

  highlightedRowNumber = rowNumber;
}

typeSelect.addEventListener("change", (e) => {
  const newType = e.target.value;
  const oldType = newType == "Anime" ? "Game" : "Anime";

  if (highlightedRowNumber >= 0) {
    lowlightRow(oldType);
    highlightedRowNumber = -1;
  }
  switchTable(newType);
});
