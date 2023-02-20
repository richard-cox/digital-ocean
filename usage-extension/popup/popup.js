import { doUrl, doGetDropletUsageTextSummary, doGetSshKeyInfoWithAge, doGetDropletsInfoWithAge } from '../scripts/do/do.js';
import { tableAddCell, tableAddCellButton, tableAddCellLink, tableEmpty } from '../scripts/utils/table.js';
import { pureShowElement, pureEnableElement } from '../scripts/utils/pure.js';
import { storageClear, outputStoreState, storageActivitiesName, storageDropletsName, storageGetActivities, storageGetDroplets, storageGetResult, storageResult } from '../scripts/do/store.js';
import { copyTextToClipboard } from '../scripts/utils/utils.js';
import { changeTabKeepContext } from '../scripts/utils/chrome-extension.js';
import { doDeleteSshKey } from '../scripts/do/do-requests.js';
import Table from '../scripts/utils/easy-table.js';

// TODO: RC better separation, everything is properly mixed up

// General

/*****************************
 * General Page Related
 *****************************/ 
const pageValid = document.getElementById('valid-page');
const pageInvalid = document.getElementById('invalid-page');

const buttonFetchResources = document.getElementById('fetchResources');
const buttonFetchResourcesIcon = document.getElementById('fetchResourcesIcon');
const buttonClearCache = document.getElementById('clearCache');

const menuDroplets = document.getElementById('menuDroplets');
const menusSshPage = document.getElementById('menusSshPage');

let storageHasDroplets, storageHasActivities, storageHasResult, generatingResults = null; // TODO: RC This isn't done well

async function displayAllResults() {
  generatingResults = true;

  pureEnableElement(buttonFetchResources, false);

  buttonFetchResourcesIcon.classList.add('bi-arrow-clockwise')
  buttonFetchResourcesIcon.classList.remove('bi-newspaper')

  const dropletsRoot = document.getElementById('droplets-root');
  const sshKeysRoot = document.getElementById('sshkeys-root');

  try {
    const droplets = await doGetDropletsInfoWithAge();
    await displayDroplets(droplets);

    const sshKeys = await doGetSshKeyInfoWithAge(droplets);
    await displaySshKeys(sshKeys);

  } catch (err) {
    console.error('Failed to get usage: ', err);
  }

  pureShowElement(dropletsRoot, true);
  pureShowElement(sshKeysRoot, true);

  generatingResults = false;

  buttonFetchResourcesIcon.classList.add('bi-newspaper')
  buttonFetchResourcesIcon.classList.remove('bi-arrow-clockwise')

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: setPageBackgroundColor,
  // });
}

async function displayDroplets(droplets) {
  tableEmpty(tableDroplets);
  tableEmpty(tableDropletSummary);

  const summary = {
    nice: 0,
    naughty: 0,
    other: 0,
    cost: 0,
    monthlyRate: 0
  }

  droplets.forEach(d => {
    const row = tableDroplets.getElementsByTagName('tbody')[0].insertRow(-1);

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
    tableAddCell(row, 3, `Monthly: $${d.monthlyRate}<br>Total: $${d.totalCost.toFixed(2)}`);
  });

  const summaryRow = tableDropletSummary.getElementsByTagName('tbody')[0].insertRow(-1);
  const dropletSummaryCell = summaryRow.insertCell(0);
  dropletSummaryCell.innerHTML = `<span class='nice'>${summary.nice}</span>/<span>${summary.other}</span>/<span class='naughty'>${summary.naughty}</span>`

  tableAddCell(summaryRow, 1, `$${summary.monthlyRate.toFixed(2)}`);
  tableAddCell(summaryRow, 2, `$${summary.cost.toFixed(2)}`);
}

async function displaySshKeys(sshKeys) {
  tableEmpty(tableSshKey);
  tableEmpty(tableSummarySshKey);

  const summary = {
    withOwner: 0,
    other: 0,
  }

  sshKeys.forEach(s => {
    const row = tableSshKey.getElementsByTagName('tbody')[0].insertRow(-1);

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
        await doDeleteSshKey(s.id);
      } catch (e) {
        console.error('Failed to delete ssh key', s.id, e);
      }

      i.classList.add('bi-trash');
      i.classList.remove('bi-arrow-clockwise');
    }, true)
  });

  const summaryRow = tableSummarySshKey.getElementsByTagName('tbody')[0].insertRow(-1);
  const dropletSummaryCell = summaryRow.insertCell(0);
  dropletSummaryCell.innerHTML = `<span class='nice'>${summary.withOwner}</span>/<span>${summary.other}</span>`
}

function updateButtonState() {
  pureEnableElement(buttonClearCache, storageHasDroplets || storageHasActivities)
  pureEnableElement(buttonSlackResults, storageHasResult);
  pureEnableElement(buttonSupDropletPage, storageHasResult);

  if (!generatingResults) {
    pureEnableElement(buttonFetchResources, !storageHasResult);
  }
}

async function initialise() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.startsWith(doUrl)) {
    pureShowElement(pageInvalid, true)
    return;
  }

  if (!tab.url.startsWith(`${doUrl}/droplets?`)) {
    pureEnableElement(buttonSupDropletPage, false);
  }

  storageHasDroplets = await storageGetDroplets();
  storageHasActivities = await storageGetActivities();
  storageHasResult = await storageGetResult();

  updateButtonState();

  await outputStoreState();

  if (storageHasResult) {
    await displayAllResults();
  }

  pureShowElement(pageValid, true);

}

menuDroplets.addEventListener('click', async () => {
  pureShowElement(sectionDroplets, true);
  menuDroplets.classList.add('pure-menu-selected');

  pureShowElement(sectionSshKeysPage, false);
  menusSshPage.classList.remove('pure-menu-selected');
})

menusSshPage.addEventListener('click', async () => {
  pureShowElement(sectionSshKeysPage, true);
  menusSshPage.classList.add('pure-menu-selected');

  pureShowElement(sectionDroplets, false);
  menuDroplets.classList.remove('pure-menu-selected');
})

buttonFetchResources.addEventListener('click', async () => {
  await displayAllResults();
});

buttonClearCache.addEventListener('click', async () => {
  await storageClear();
  tableEmpty(tableDroplets);
  tableEmpty(tableDropletSummary);
  tableEmpty(tableSshKey);
  tableEmpty(tableSummarySshKey);

  pureShowElement(dropletsRoot, false);
  pureShowElement(sshKeysRoot, false);
});

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

/*****************************
 * Droplets
 *****************************/ 
const buttonSlackResults  = document.getElementById('slackResults');
const buttonSupDropletPage = document.getElementById('supDropletPage');
const buttonGoToDroplets = document.getElementById('goToDroplets');
const buttonSlackResultsIcon = document.getElementById('slackResultsIcon');

const sectionDroplets = document.getElementById('sectionDroplets');

const tableDroplets = document.getElementById('droplets-table');
const tableDropletSummary = document.getElementById('droplet-summary-table');

buttonSlackResults.addEventListener('click', async () => {
  buttonSlackResultsIcon.classList.add('bi-clipboard-check');
  buttonSlackResultsIcon.classList.remove('bi-clipboard');

  const { naughty: naughtyList, nice: niceList, team: teamList } = await doGetDropletUsageTextSummary()

  const naughtyMessage = naughtyList.length === 0 ? [
    `NONE! A pint of the landlord's finest to you all\n`
  ] : [
    ...naughtyList,
    '\nPlease make sure to delete or update them',
  ]

  const niceTable = new Table;
  niceList.forEach(function(e) {
    niceTable.cell('User', e.userName)
    niceTable.cell('Droplets', e.count)
    niceTable.cell('Monthly Cost (USD)', e.running)
    niceTable.cell('Total Cost (USD)', e.total)
    niceTable.newRow()
  })

  const niceMessage = niceList.length === 0 ? [
    `NONE! \n`
  ] : niceTable.toString()

  const teamTable = new Table;
  teamList.forEach(function(e) {
    teamTable.cell('User', e.userName)
    teamTable.cell('Droplets', e.count)
    teamTable.cell('Monthly Cost (USD)', e.running)
    teamTable.cell('Total Cost (USD)', e.total)
    teamTable.newRow()
  })
  
  const teamMessage = teamList.length === 0 ? [
    `NONE! \n`
  ] : teamTable.toString()

  console.warn(niceList, ...niceList.sort((a, b) => a.running > b.running));

  const blobArray = [
    '```',
    'This Weeks DO Droplet Summary',
    `\n--------------------------------------------------------------------\n`,
    'Stale Droplet\'s\n\n',
    ...naughtyMessage,
    `\n--------------------------------------------------------------------\n`,
    '\n\nDO_NOT_DELETE Droplets\n\n',
    ...niceMessage,
    `\n--------------------------------------------------------------------\n`,
    '\n\nTEAM Droplets\n\n',
    ...teamMessage,
    '```',
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

buttonSupDropletPage.addEventListener('click', async () => {
  const dResources = await doGetDropletsInfoWithAge();

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {data: dResources}, function(response) {
    console.debug('success', response);
  });
});

buttonGoToDroplets.addEventListener('click', () => {
  changeTabKeepContext(`${doUrl}/droplets`);
});

/*****************************
 * SSH Keys
 *****************************/ 
const buttonGoToSshKeys = document.getElementById('goToSshKeys');

const sectionSshKeysPage = document.getElementById('sectionSshKeysPage');

const tableSshKey = document.getElementById('sshkey-table');
const tableSummarySshKey = document.getElementById('sshkey-summary-table');


buttonGoToSshKeys.addEventListener('click', () => {
  changeTabKeepContext(`${doUrl}/account/security`);
});


/*****************************
 * Init
 *****************************/ 
await initialise();
