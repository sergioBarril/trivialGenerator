const { contextBridge, ipcRenderer, Menu } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");
const alerts = require("./resources/alerts");

contextBridge.exposeInMainWorld("os", {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld("fs", {
  readFileSync: (filePath, encoding) => fs.readFileSync(filePath, encoding),
  writeFileSync: (filePath, text) => fs.writeFileSync(filePath, text),
});

contextBridge.exposeInMainWorld("path", {
  join: (...args) => path.join(...args),
  dirname: (filePath) => path.dirname(filePath),
  filename: (filePath) => path.parse(filePath).name,
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  selectFolder: () => ipcRenderer.send("dialog:openDirectory"),
});

contextBridge.exposeInMainWorld("mymenu", {
  get: () => new Menu(),
});

contextBridge.exposeInMainWorld("alerts", alerts);
