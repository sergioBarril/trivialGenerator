let currentID = "";
let currentCR = null;
let player;
let interval;

const audio = document.getElementById("audio");
const audioSource = document.getElementById("audio-source");

const btnPlay = document.getElementById("btn-play");

function getPlayerNumber(element) {
  return element.id.split("-").at(-1);
}

function addPlayer() {
  const playersDiv = document.getElementById("players");

  const players = document.getElementsByName("player");
  let newPlayerNumber = 0;
  if (players.length > 0) {
    newPlayerNumber =
      parseInt(Array.from(players).at(-1).id.split("-").at(-1)) + 1;
  }

  const newPlayer = `<div id="player-${newPlayerNumber}" name="player" class="flex justify-start border gap-0 border-black rounded w-full bg-sky-300 p-2">
                          <div class="w-9/12" id="div-name-${newPlayerNumber}">
                          <input id="name-${newPlayerNumber}" type="text" placeholder="New player" class="bg-transparent w-full" onkeydown="enterName(event);">
                          </div>
                          <div>
                            <button onclick="confirmPlayer(this);" id="confirm-player-${newPlayerNumber}">✅</button>
                            <button onclick="deletePlayer(this);" id="delete-player-${newPlayerNumber}">❌</button>
                          </div>
                          <div id="score-player-${newPlayerNumber}" class="flex justify-end gap-0 w-24 box-border" style="display:none">
                            <button id="score-minus-${newPlayerNumber}" class="bg-red-600 w-5 h-6 rounded-tl rounded-bl" onclick="editScore(this, 'remove');"> - </button>
                            <span id="score-number-${newPlayerNumber}" class="text-center w-8 h-6 border border-black"> 0 </span>
                            <button id="score-plus-${newPlayerNumber}" class="bg-green-600 w-5 h-6 rounded-tr rounded-br" onclick="editScore(this, 'add');"> + </button>
                          </div>
                      </div>`;
  playersDiv.insertAdjacentHTML("beforeend", newPlayer);

  return document.getElementById(`player-${newPlayerNumber}`);
}

function enterName(event) {
  if (event.keyCode == 13) {
    const playerNumber = getPlayerNumber(event.target);
    const confirmButton = document.getElementById(
      `confirm-player-${playerNumber}`
    );
    confirmPlayer(confirmButton);

    if (event.ctrlKey) {
      const newPlayer = addPlayer();
      const newPlayerNumber = getPlayerNumber(newPlayer);
      const newPlayerName = document.getElementById(`name-${newPlayerNumber}`);
      newPlayerName.focus();
    }
  }
}

function confirmPlayer(button) {
  const playerNumber = getPlayerNumber(button);
  const playerName = document.getElementById(`name-${playerNumber}`);
  playerName.disabled = true;

  document.getElementById(`div-name-${playerNumber}`).style.width =
    "fit-content";

  button.remove();
  document.getElementById(`delete-player-${playerNumber}`).remove();

  const scoreDiv = document.getElementById(`score-player-${playerNumber}`);
  scoreDiv.style.display = "flex";
}

function deletePlayer(button) {
  const playerNumber = getPlayerNumber(button);
  const player = document.getElementById(`player-${playerNumber}`);
  player.remove();
}

function editScore(button, mode) {
  const playerNumber = getPlayerNumber(button);
  const scoreNumber = document.getElementById(`score-number-${playerNumber}`);

  const score = parseInt(scoreNumber.innerHTML);
  const newScore = mode == "add" ? score + 1 : score - 1;

  scoreNumber.innerHTML = newScore;
}

function toggleAudio(songID) {
  if (songID == currentID) {
    return togglePause();
  }
  if (currentID != "") removeFocus(document.getElementById(currentID));

  const songPanel = document.getElementById(songID);

  currentID = songID;
  currentCR = songPanel.dataset.cr == "true";

  setFocus(songPanel);
  if (!currentCR) {
    player.loadVideoById(songID);
    player.playVideo();
  } else {
    const audio = document.getElementById("audio");
    const audioSource = document.getElementById("audio-source");
    audioSource.src = "./offline/" + songID + ".mp3";
    audio.load();

    audio.addEventListener("loadedmetadata", () => audio.play());

    // audio.play();
  }
}

// 2. This code loads the IFrame Player API code asynchronously.

function setupYT() {
  var tag = document.createElement("script");

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    videoId: "QkksQoqMakQ", //"Ayi2CJU2xmQ", // 'M7lc1UVf-VE',
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

function onPlayerError(event) {}

function getDuration() {
  if (currentCR) return audio.duration;
  else return player.getDuration();
}

function getTime() {
  if (currentCR) return audio.currentTime;
  else return player.getCurrentTime();
}

function onPlay(event) {
  const songDuration = getDuration();

  interval = setInterval(() => {
    const time = getTime();
    const playerTimeDifference = (time / songDuration) * 100;
    progress(playerTimeDifference);
    const timeCurrent =
      Math.floor(time / 60) + ":" + ("0" + Math.floor(time % 60)).slice(-2);
    document.getElementById("current-time").innerHTML = timeCurrent;
  }, 600);
  const timeTotal =
    Math.floor(songDuration / 60) +
    ":" +
    ("0" + Math.floor(songDuration % 60)).slice(-2);
  document.getElementById("total-duration").innerHTML = timeTotal;

  btnPlay.textContent = "⏸";
}

function stop() {
  if (currentCR) {
    audio.pause();
    audio.currentTime = 0;
  } else player.stopVideo();

  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  progress(0);
  document.getElementById("current-time").innerHTML = "0:00";
  btnPlay.textContent = "▶";
}

function onPause() {
  btnPlay.textContent = "▶";

  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function onPlayerStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.ENDED:
      stop();
      break;
    case YT.PlayerState.PLAYING:
      onPlay(event);
      break;
    case YT.PlayerState.PAUSED:
      onPause();
      break;
    default:
      break;
  }
}

function progress(percent) {
  const progressBar = document.getElementById("progressBar");
  const progressBarWidth = Math.floor(
    (percent * progressBar.offsetWidth) / 100
  );
  document.getElementById("progressBarCurrent").style.width =
    progressBarWidth + "px";
}

function togglePause() {
  if (currentID == "") return;

  if (currentCR) {
    if (audio.paused) audio.play();
    else audio.pause();
    return;
  }

  if (player.getPlayerState() == YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function setFocus(div) {
  div.classList.remove("border-4");
  div.classList.remove("border-sky-900");

  div.classList.add("border-8");
  div.classList.add("border-red-900");
}

function removeFocus(div) {
  div.classList.add("border-4");
  div.classList.add("border-sky-900");

  div.classList.remove("border-8");
  div.classList.remove("border-red-900");

  stop();
  currentID = "";
}

function reveal() {
  if (currentID == "") return;

  var div = document.getElementById(currentID);
  var answer = document.getElementById(`anime-${currentID}`);

  answer.classList.remove("hidden");

  div.style.backgroundImage =
    "url('http://img.youtube.com/vi/" + currentID + "/0.jpg')";
  removeFocus(div);
}

function setVolume(percent) {
  player.setVolume(percent);
  audio.volume = percent / 100;
}

setupYT();
audio.addEventListener("play", onPlay);
audio.addEventListener("pause", onPause);
