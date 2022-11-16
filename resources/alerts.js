const Toastify = require("toastify-js");

const BACKGROUND_COLORS = {
  ERROR: "red",
  SUCCESS: "green",
  WARNING: "yellow",
};

function alertMessage(type, message) {
  Toastify({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: BACKGROUND_COLORS[type],
      color: "white",
      textAlign: "center",
    },
  }).showToast();
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

module.exports = {
  alertError,
  alertSuccess,
  alertWarning,
};
