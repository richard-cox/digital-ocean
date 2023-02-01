import { clearCache, doUrl, getNeatSshUsageInfo, getNeatUsageInfo } from '../scripts/do.js';
import { tableAddCell, tableEmpty } from '../scripts/table-helpers.js';
import { pureShowElement, pureEnableElement } from '../scripts/pure-helper.js';
import { storageActivitiesName, storageDropletsName, storageGetActivities, storageGetDroplets, storageGetResult, storageResult } from '../scripts/store.js';
import { copyTextToClipboard } from '../scripts/helpers.js';

const buttonDisplayResults = document.getElementById("displayResults");
const buttonDownloadResults  = document.getElementById("downloadResults");
const buttonShowCreator = document.getElementById("showCreator");
const buttonClearCache = document.getElementById("clearCache");

const menuDroplets = document.getElementById("menuDroplets");
const menusSupplementPage = document.getElementById("menusSupplementPage");

const validatePage = document.getElementById("validate-page");
const invalidatePage = document.getElementById("invalidate-page");

const sectionReport = document.getElementById("sectionReport");
const sectionSshKeysPage = document.getElementById("sectionSshKeysPage");

const buttonDisplayResultsIcon = document.getElementById("displayResultsIcon");
const buttonDownloadResultsIcon = document.getElementById("downloadIcon");

const resultsTable = document.getElementById('results-table');
const summaryTable = document.getElementById('summary-table');
const sshKeyTable = document.getElementById('sshkey-table');

let storageHasDroplets, storageHasActivities, storageHasResult, generatingResults = null;

/*****************************
 * Functions
 *****************************/ 
async function displayResults() {
  generatingResults = true;

  pureEnableElement(buttonDisplayResults, false);

  buttonDisplayResultsIcon.classList.add('bi-arrow-clockwise')
  buttonDisplayResultsIcon.classList.remove('bi-newspaper')

  const resultsRoot = document.getElementById('results-root');

  try {
    const droplets = await getNeatUsageInfo();
    await displayDroplets(droplets);

    const sshKeys = await getNeatSshUsageInfo(droplets);
    await displaySshKeys(sshKeys)

  } catch (err) {
    console.error('Failed to get usage: ', err);
  }

  pureShowElement(resultsRoot, true);

  generatingResults = false;

  buttonDisplayResultsIcon.classList.add('bi-newspaper')
  buttonDisplayResultsIcon.classList.remove('bi-arrow-clockwise')

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: setPageBackgroundColor,
  // });
}

async function displayDroplets(droplets) {
  tableEmpty(resultsTable);
  tableEmpty(summaryTable);

  const summary = {
    nice: 0,
    naughty: 0,
    other: 0,
    cost: 0,
    monthlyRate: 0
  }

  droplets.forEach(d => {
    const row = resultsTable.getElementsByTagName('tbody')[0].insertRow(-1);

    if (d.isNaughty) {
      row.classList.add("pure-table-naughty");
      summary.naughty++;
    } else if (d.isNice) {
      row.classList.add("pure-table-nice");
      summary.nice++;
    } else  {
      summary.other++;
    }

    summary.cost += d.totalCost;
    summary.monthlyRate += d.monthlyRate;

    tableAddCell(row, 0, d.dropletName, `${doUrl}/droplets/${d.dropletId}`);
    tableAddCell(row, 1, d.userName);
    tableAddCell(row, 2, `Date: ${d.created}<br>Age: ${d.age}`);
    tableAddCell(row, 3, `$${d.totalCost.toFixed(2)}`);
  });

  const summaryRow = summaryTable.getElementsByTagName('tbody')[0].insertRow(-1);
  const dropletSummaryCell = summaryRow.insertCell(0);
  dropletSummaryCell.innerHTML = `<span class="nice">${summary.nice}</span>/<span>${summary.other}</span>/<span class="naughty">${summary.naughty}</span>`

  tableAddCell(summaryRow, 1, `$${summary.monthlyRate.toFixed(2)}`);
  tableAddCell(summaryRow, 2, `$${summary.cost.toFixed(2)}`);
}

async function displaySshKeys(sshKeys) {
  tableEmpty(sshKeyTable);

  sshKeys.forEach(s => {
    const row = sshKeyTable.getElementsByTagName('tbody')[0].insertRow(-1);

    // if (d.isNaughty) {
    //   row.classList.add("pure-table-naughty");
    //   summary.naughty++;
    // } else if (d.isNice) {
    //   row.classList.add("pure-table-nice");
    //   summary.nice++;
    // } else  {
    //   summary.other++;
    // }

    // summary.cost += d.totalCost;
    // summary.monthlyRate += d.monthlyRate;

    
    tableAddCell(row, 0, s.name);
    if (s.dropletId) {
      tableAddCell(row, 1, s.dropletName, `${doUrl}/droplets/${s.dropletId}`);
      tableAddCell(row, 2, s.dropletUserName);
    } else {
      tableAddCell(row, 1, '');
      tableAddCell(row, 2, '');
    }
    tableAddCell(row, 3, `Date: ${s.created}<br>Age: ${s.age}`);
  });
}

function updateButtonState() {
  pureEnableElement(buttonClearCache, storageHasDroplets || storageHasActivities)
  pureEnableElement(buttonDownloadResults, storageHasResult);
  pureEnableElement(buttonShowCreator, storageHasResult);

  if (!generatingResults) {
    pureEnableElement(buttonDisplayResults, !storageHasResult);
  }
}

async function initialise() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.startsWith(doUrl)) {
    pureShowElement(invalidatePage, true)
    return;
  }

  if (!tab.url.startsWith(`${doUrl}/droplets?`)) {
    pureEnableElement(buttonShowCreator, false);
  }

  storageHasDroplets = await storageGetDroplets();
  storageHasActivities = await storageGetActivities();
  storageHasResult = await storageGetResult();

  updateButtonState();

  console.info('Cache Info')
  console.info('droplets', storageHasDroplets)
  console.info('activities', storageHasActivities)
  console.info('result', storageHasResult)

  if (storageHasResult) {
    await displayResults();
  }

  pureShowElement(validatePage, true);

}


/*****************************
 * Menu
 *****************************/ 
menuDroplets.addEventListener("click", async () => {
  pureShowElement(sectionReport, true);
  sectionReport.classList.add("pure-menu-selected");

  pureShowElement(sectionSshKeysPage, false);
  sectionReport.classList.remove("pure-menu-selected");
})

menusSupplementPage.addEventListener("click", async () => {
  pureShowElement(sectionSshKeysPage, true);
  sectionReport.classList.add("pure-menu-selected");

  pureShowElement(sectionReport, false);
  sectionReport.classList.remove("pure-menu-selected");
})

/*****************************
 * Buttons
 *****************************/ 
buttonDisplayResults.addEventListener("click", async () => {
  await displayResults();
});

buttonDownloadResults.addEventListener("click", async () => {
  const droplets = await getNeatUsageInfo();
  const sshKeys = await getNeatSshUsageInfo(droplets);

  const naughtyList = droplets.reduce((res, d) => {
    if (!d.isNaughty) {
      return res;
    }

    if (!res[d.userName]) {
      res[d.userName] = 0;
    }

    res[d.userName]++

    return res;
  }, {})


  const message = Object.keys(naughtyList) === 0 ? [
    `NONE! A pint of the landlord's finest to you all\n`
  ] : [
    ...Object.entries(naughtyList).map(([userName, count]) => `${userName}: ${count}\n`)
  ]

  const blobArray = [
    `\`\`\`\n`,
    'This weeks DO droplet\'s naughty list...\n',
    ...message,
    `\`\`\`\n`,
  ]

  const blob = new Blob(blobArray, {type: "text/plain"});
  // const url = URL.createObjectURL(blob);
  // chrome.downloads.download({
  //   url: url, // The object URL can be used as download URL
  //   filename: 'rancher-do-usage',
  //   saveAs: true,
  // });

  await blob.text().then(text => copyTextToClipboard(text))
  
  buttonDownloadResultsIcon.classList.add("bi-clipboard-check");
  buttonDownloadResultsIcon.classList.remove("bi-clipboard");

  setTimeout(() => {
    buttonDownloadResultsIcon.classList.add("bi-clipboard");
    buttonDownloadResultsIcon.classList.remove("bi-clipboard-check");
  }, 3000)

});

buttonClearCache.addEventListener("click", async () => {
  await clearCache();
  tableEmpty(resultsTable);
  tableEmpty(summaryTable);
});

buttonShowCreator.addEventListener("click", async () => {
  const dResources = await getNeatUsageInfo();

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {data: dResources}, function(response) {
    console.debug('success', response);
  });
});

/*****************************
 * Storage
 *****************************/ 
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (changes[storageDropletsName]) {
    storageHasDroplets = !!changes[storageDropletsName].newValue
  }
  if (changes[storageActivitiesName]) {
    storageHasActivities = !!changes[storageActivitiesName].newValue
  }
  if (changes[storageResult]) {
    storageHasResult = !!changes[storageResult].newValue
  }
  updateButtonState();
})

/*****************************
 * Init
 *****************************/ 
await initialise();
