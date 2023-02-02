import { clearCache, deleteSshKey, doUrl, getDropletUsageTextSummary, getNeatSshUsageInfo, getNeatUsageInfo } from '../scripts/do.js';
import { tableAddCell, tableAddCellButton, tableAddCellLink, tableEmpty } from '../scripts/table-helpers.js';
import { pureShowElement, pureEnableElement } from '../scripts/pure-helper.js';
import { outputStoreState, storageActivitiesName, storageDropletsName, storageGetActivities, storageGetDroplets, storageGetResult, storageResult } from '../scripts/store.js';
import { changeTabKeepContext, copyTextToClipboard } from '../scripts/helpers.js';

const buttonDisplayResults = document.getElementById('displayResults');
const buttonSlackResults  = document.getElementById('slackResults');
const buttonShowCreator = document.getElementById('showCreator');
const buttonClearCache = document.getElementById('clearCache');
const buttonGoToDroplets = document.getElementById('goToDroplets');
const buttonGoToSshKeys = document.getElementById('goToSshKeys');

const menuDroplets = document.getElementById('menuDroplets');
const menusSupplementPage = document.getElementById('menusSupplementPage');

const validatePage = document.getElementById('validate-page');
const invalidatePage = document.getElementById('invalidate-page');

const sectionReport = document.getElementById('sectionReport');
const sectionSshKeysPage = document.getElementById('sectionSshKeysPage');

const buttonDisplayResultsIcon = document.getElementById('displayResultsIcon');
const buttonSlackResultsIcon = document.getElementById('slackResultsIcon');

const resultsTable = document.getElementById('results-table');
const summaryTable = document.getElementById('summary-table');
const sshKeyTable = document.getElementById('sshkey-table');
const summarySshKeyTable = document.getElementById('sshkey-summary-table');

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
      row.classList.add('pure-table-naughty');
      summary.naughty++;
    } else if (d.isNice) {
      row.classList.add('pure-table-nice');
      summary.nice++;
    } else  {
      summary.other++;
    }

    summary.cost += d.totalCost;
    summary.monthlyRate += d.monthlyRate;

    tableAddCellLink(row, 0, d.dropletName, `${doUrl}/droplets/${d.dropletId}`);
    tableAddCell(row, 1, d.userName);
    tableAddCell(row, 2, `Date: ${d.created}<br>Age: ${d.age}`);
    tableAddCell(row, 3, `$${d.totalCost.toFixed(2)}`);
  });

  const summaryRow = summaryTable.getElementsByTagName('tbody')[0].insertRow(-1);
  const dropletSummaryCell = summaryRow.insertCell(0);
  dropletSummaryCell.innerHTML = `<span class='nice'>${summary.nice}</span>/<span>${summary.other}</span>/<span class='naughty'>${summary.naughty}</span>`

  tableAddCell(summaryRow, 1, `$${summary.monthlyRate.toFixed(2)}`);
  tableAddCell(summaryRow, 2, `$${summary.cost.toFixed(2)}`);
}

async function displaySshKeys(sshKeys) {
  tableEmpty(sshKeyTable);
  tableEmpty(summarySshKeyTable);

  const summary = {
    withOwner: 0,
    other: 0,
  }

  sshKeys.forEach(s => {
    const row = sshKeyTable.getElementsByTagName('tbody')[0].insertRow(-1);

    if (s.dropletId) {
      row.classList.add('pure-table-nice');
      summary.withOwner++;
    } else  {
      summary.other++;
    }

    tableAddCell(row, 0, s.name);
    if (s.dropletId) {
      const cell = tableAddCell(row, 1, s.dropletName, `${doUrl}/droplets/${s.dropletId}`);
      cell.appendChild(document.createTextNode(` (${s.dropletUserName})`));
    } else {
      tableAddCell(row, 1, '');
    }
    tableAddCell(row, 2, `Date: ${s.created}<br>Age: ${s.age}`);
    tableAddCellButton(row, 3, 'Delete', 'bi-trash', async (e) => {
      const button = e.target;
      const i = button.getElementsByTagName('i')[0];

      i.classList.add('bi-arrow-clockwise');
      i.classList.remove('bi-trash');

      try {
        await deleteSshKey(s.id);
      } catch (e) {
        console.error('Failed to delete ssh key', s.id, e);
      }

      i.classList.add('bi-trash');
      i.classList.remove('bi-arrow-clockwise');
    })
  });

  const summaryRow = summarySshKeyTable.getElementsByTagName('tbody')[0].insertRow(-1);
  const dropletSummaryCell = summaryRow.insertCell(0);
  dropletSummaryCell.innerHTML = `<span class='nice'>${summary.withOwner}</span>/<span>${summary.other}</span>`
}

function updateButtonState() {
  pureEnableElement(buttonClearCache, storageHasDroplets || storageHasActivities)
  pureEnableElement(buttonSlackResults, storageHasResult);
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

  await outputStoreState();

  if (storageHasResult) {
    await displayResults();
  }

  pureShowElement(validatePage, true);

}


/*****************************
 * Menu
 *****************************/ 
menuDroplets.addEventListener('click', async () => {
  pureShowElement(sectionReport, true);
  sectionReport.classList.add('pure-menu-selected');

  pureShowElement(sectionSshKeysPage, false);
  sectionReport.classList.remove('pure-menu-selected');
})

menusSupplementPage.addEventListener('click', async () => {
  pureShowElement(sectionSshKeysPage, true);
  sectionReport.classList.add('pure-menu-selected');

  pureShowElement(sectionReport, false);
  sectionReport.classList.remove('pure-menu-selected');
})

/*****************************
 * Buttons
 *****************************/ 
buttonDisplayResults.addEventListener('click', async () => {
  await displayResults();
});

buttonSlackResults.addEventListener('click', async () => {
  buttonSlackResultsIcon.classList.add('bi-clipboard-check');
  buttonSlackResultsIcon.classList.remove('bi-clipboard');

  const naughtyList = await getDropletUsageTextSummary()

  const message = naughtyList.length === 0 ? [
    `NONE! A pint of the landlord's finest to you all\n`
  ] : [
    ...naughtyList,
    '\nPlease make sure to delete or update them',
  ]

  const blobArray = [
    'This weeks DO stale droplet\'s list...\n\n',
    ...message,
  ]

  const blob = new Blob(blobArray, {type: 'text/plain'});
  // const url = URL.createObjectURL(blob);
  // chrome.downloads.download({
  //   url: url, // The object URL can be used as download URL
  //   filename: 'rancher-do-usage',
  //   saveAs: true,
  // });

  await blob.text().then(text => copyTextToClipboard(text))

  setTimeout(() => {
    buttonSlackResultsIcon.classList.add('bi-clipboard');
    buttonSlackResultsIcon.classList.remove('bi-clipboard-check');
  }, 3000)

});

buttonClearCache.addEventListener('click', async () => {
  await clearCache();
  tableEmpty(resultsTable);
  tableEmpty(summaryTable);
});

buttonShowCreator.addEventListener('click', async () => {
  const dResources = await getNeatUsageInfo();

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {data: dResources}, function(response) {
    console.debug('success', response);
  });
});

buttonGoToDroplets.addEventListener('click', () => {
  changeTabKeepContext(`${doUrl}/droplets`);
});

buttonGoToSshKeys.addEventListener('click', () => {
  changeTabKeepContext(`${doUrl}/account/security`);
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

// TODO: RC Fetch the x-csrf-token to be used in DELETE requests (not sure this is possible....)
// 'permissions': ['activeTab', 'scripting', 'storage', 'downloads', 'webRequest']
// onBeforeSendHeaders
// onBeforeRequest
// onSendHeaders
// chrome.webRequest.onSendHeaders.addListener((details) => {
//   console.warn(details);
// }, {
//   // urls: ['https://cloud.digitalocean.com/*']
//   urls: ['<all_urls>']
// });
// // , filter, opt_extraInfoSpec
