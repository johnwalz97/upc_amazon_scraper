const {remote, ipcRenderer} = require('electron');

const isScraperActive = () => {return false}

const showStart = () => {
  document.querySelector("#progress").style.display = "none";
  document.querySelector("#start").style.display = "block";
}

const showProgress = () => {
  document.querySelector("#start").style.display = "none";
  document.querySelector("#progress").style.display = "block";
}

const validateFile = (filePath) => {
  console.log("File validated");
}

const processFile = (filePath) => {
  ipcRenderer.send('start-scraper', filePath);
  console.log("File is now processing.");
}

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
      validateFile(filePaths[0])
      processFile(filePaths[0])
      showProgress()
    }
  );
}

ipcRenderer.on('progressPing', (event, arg) => {
  let progressBar = new ldBar("#progressBar")
  progressBar.set(arg)
});

Array.from(
  document.getElementsByClassName('open_file'),
  c => c.addEventListener('click', openFile)
);

showStart()
