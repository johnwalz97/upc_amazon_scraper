import "./stylesheets/main.css"
import {remote, ipcRenderer} from "electron"

ipcRenderer.on('progressPing', (event, msg) => {
  document.getElementById('progress').innerHTML += msg
});

ipcRenderer.on('done', () => {
  console.log('done')
  document.getElementById('loader').style.display = 'none'
  document.getElementById('start').style.display = 'block'
})

const openFile = () => {
  const dialogOptions = {
    title: "Choose UPC file",
    filters: [
      {name: "CSV", extensions: ["csv"]}
    ],
    properties: ["openFile"]
  };
  remote.dialog.showOpenDialog(dialogOptions, filePaths => {
      if (filePaths === undefined) {return};
      document.getElementById('start').style.display = 'none'
      document.getElementById('loader').style.display = 'block'
      ipcRenderer.send('startScraper', filePaths[0]);
    }
  );
}

document.getElementById('start').addEventListener('click', openFile)
