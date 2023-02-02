export function openTabKeepContext(url) {
  chrome.tabs.create({
    url,
    active: false,
   });
}

export function changeTabKeepContext(url) {
  chrome.tabs.update(undefined, { url });
}