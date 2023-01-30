import { doUrl, getUsageInfo } from '../scripts/do.js';
import { addCell, emptyTable } from '../scripts/table-helpers.js';

// Initialize button with users' preferred color
let displayResults = document.getElementById("displayResults");
let showCreator = document.getElementById("showCreator");

console.warn('popjs', 'loaded');

displayResults.addEventListener("click", async () => {
  console.warn('displayResults click', doUrl);

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.startsWith(doUrl)) {
    return;
  }

  const resultsRoot = document.getElementById('results-root');
  const resultsTable = document.getElementById('results-table');
  const resultsBody = document.getElementById('results-body');

  // TODO: RC add disabled to button

  try {
    const droplets = await getUsageInfo();

    emptyTable(resultsTable)

    droplets.forEach(d => {
      const row = resultsTable.getElementsByTagName('tbody')[0].insertRow(-1);

      addCell(row, 0, d.name);
      addCell(row, 1, d.supplemented.user);
      addCell(row, 2, d.created_at);
      addCell(row, 3, d.supplemented.hours_old);
    })

  } catch (err) {
    console.error('Failed to get usage: ', err);
  }

  resultsRoot.style.display = 'flex';

  // TODO: RC remove disabled to button

  // TODO: RC add export / download / copy


  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: setPageBackgroundColor,
  // });
});

showCreator.addEventListener("click", async () => {
  console.warn('showCreator click');

  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: setPageBackgroundColor,
  // });
});