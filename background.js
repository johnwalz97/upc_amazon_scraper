const path = require('path');
const url = require('url');
const { app, ipcMain, BrowserWindow } = require('electron');
const scraper = require('./scrape.js');

let mainWindow = null;

const sendProgress = progress => {
  mainWindow.webContents.send('progressPing', progress)
}

ipcMain.on('start-scraper', (e, filePath) => {
  scraper.run(filePath)
})

app.on("ready", () => {
  mainWindow = new BrowserWindow({width: 800, height: 600})
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );
});

app.on("window-all-closed", () => {
  app.quit();
});
