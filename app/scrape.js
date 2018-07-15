/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/runScraper.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/runScraper.js":
/*!***************************!*\
  !*** ./src/runScraper.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _electron = __webpack_require__(/*! electron */ "electron");

const puppeteer = __webpack_require__(/*! puppeteer */ "puppeteer");

const scrape = __webpack_require__(/*! ./scrape.js */ "./src/scrape.js");

const csv = __webpack_require__(/*! fast-csv */ "fast-csv");

const fs = __webpack_require__(/*! fs */ "fs");

const csvOutStream = csv.createWriteStream({
  headers: true
});
const writableStream = fs.createWriteStream('results.csv');
csvOutStream.pipe(writableStream);
const queue = [];
const browserPool = [];
const poolMax = 4;

const queueProcess = process => {
  if (browserPool.length > 0) {
    log("Processing " + process.upc + "...");
    const browser = browserPool.shift();
    scrape(browser, process).then(data => {
      csvOutStream.write(data);
      log("Finished getting data for " + data.upc);
      browserPool.push(browser);
      if (queue.length > 0) queueProcess(queue.shift());else if (browserPool.length == poolMax) quit();
    });
  } else {
    queue.push(process);
  }
};

const log = msg => _electron.ipcRenderer.send('progressPing', '- ' + msg + '\n');

const quit = () => {
  log("Saving results to file...");
  csvOutStream.end();
  log("Ending background jobs...");
  browserPool.forEach(browser => browser.close());
  log("Done");

  _electron.ipcRenderer.send('done');

  _electron.remote.getCurrentWindow().close();
};

(async () => {
  log("Starting background scraper jobs...");

  for (let i = 0; i < poolMax; i++) {
    browserPool[i] = await puppeteer.launch({
      args: ['--no-sandbox']
    });
    await browserPool[i].newPage();
  }

  log("Parsing UPCs from " + _electron.remote.getCurrentWindow().csvPath + "...");
  csv.fromPath(_electron.remote.getCurrentWindow().csvPath, {
    headers: true
  }).on('data', row => queueProcess({
    upc: row.upc
  }));
})();

/***/ }),

/***/ "./src/scrape.js":
/*!***********************!*\
  !*** ./src/scrape.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = async (browser, data) => {
  const page = (await browser.pages())[0];
  await page.goto('https://www.amazon.com/');
  await page.click('#twotabsearchtextbox');
  await page.keyboard.type(data.upc);
  await Promise.all([page.click('#nav-search > form > div.nav-right > div > input'), page.waitForNavigation({
    waitUntil: 'networkidle0'
  })]);
  data.asin = await page.evaluate(() => {
    return document.getElementById('result_0').getAttribute('data-asin');
  });
  data.link = 'https://www.amazon.com/dp/' + data.asin + '/';
  await page.goto(data.link);
  data = await page.evaluate(data => {
    data.category = document.getElementById('wayfinding-breadcrumbs_feature_div').textContent.replace(/\s\s/g, '').trim();
    data.title = document.getElementById('title').textContent.replace(/\s\s/g, '').trim();
    data.price = document.getElementById('buybox').textContent.replace(/\s/g, '').match(/(\d+\.\d{1,2})/)[0];
    deets = document.getElementById('productDetailsTable');
    if (!deets) deets = document.getElementById('detailBullets');
    if (!deets) deets = document.getElementById('productDetails_detailBullets_sections1');
    if (deets) data.prodDetails = deets.textContent.replace(/\s\s/g, '');
    data.noOfReviews = document.getElementById('acrCustomerReviewText').textContent.match(/\d+/)[0];
    data.reviewsAverage = document.getElementById('acrPopover').getAttribute('title').substring(0, 3);
    return data;
  }, data);
  return data;
};

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),

/***/ "fast-csv":
/*!***************************!*\
  !*** external "fast-csv" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fast-csv");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "puppeteer":
/*!****************************!*\
  !*** external "puppeteer" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("puppeteer");

/***/ })

/******/ });
//# sourceMappingURL=scrape.js.map