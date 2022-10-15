const { contextBridge, ipcRenderer, Menu, MenuItem } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");
const Toastify = require("toastify-js");

contextBridge.exposeInMainWorld("os", {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld("fs", {
  readFileSync: (filePath, encoding) => fs.readFileSync(filePath, encoding),
  writeFileSync: (filePath, text) => fs.writeFileSync(filePath, text),
});

contextBridge.exposeInMainWorld("path", {
  join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld("Toastify", {
  toast: (options) => Toastify(options).showToast(),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld("mymenu", {
  get: () => new Menu(),
});
