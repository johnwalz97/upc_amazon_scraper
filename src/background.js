import path from "path";
import url from "url";
import {app, ipcMain, BrowserWindow} from "electron";

let mainWindow = null;

ipcMain.on('startScraper', (e, filePath) => {
  let scrapeWindow = new BrowserWindow({show: false})
  scrapeWindow.csvPath = filePath
  scrapeWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "scrape.html"),
      protocol: "file:",
      slashes: true
    })
  );
})

ipcMain.on('progressPing', (e, msg) => mainWindow.webContents.send('progressPing', msg))
ipcMain.on('done', (e) =>  mainWindow.webContents.send('done'))

app.on("ready", () => {
  mainWindow = new BrowserWindow()
  // mainWindow.setMenu(null)
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
