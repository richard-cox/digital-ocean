export const storageDropletsName = 'droplets';
export const storageActivitiesName = 'activities';
export const storageSshKeysName = 'activities';
export const storageResult = 'result';

export async function storageGetDroplets() {
  return chrome.storage.local.get([storageDropletsName]).then(res => {
    const val = res[storageDropletsName];
    return val ? JSON.parse(val) : val;
  });
}

export async function storageSetDroplets(droplets) {
  const serialised = droplets ? JSON.stringify(droplets) : droplets;
  return chrome.storage.local.set({[storageDropletsName]: serialised});
}

export async function storageGetActivities() {
  return chrome.storage.local.get([storageActivitiesName]).then(res => {
    const val = res[storageActivitiesName];
    return val ? JSON.parse(val) : val;
  });
}

export async function storageSetActivities(activities) {
  const serialised = activities ? JSON.stringify(activities) : activities;
  return chrome.storage.local.set({[storageActivitiesName]: serialised});
}

export async function storageGetSshKeys() {
  return chrome.storage.local.get([storageSshKeysName]).then(res => {
    const val = res[storageSshKeysName];
    return val ? JSON.parse(val) : val;
  });
}

export async function storageSetSshKeys(keys) {
  const serialised = keys ? JSON.stringify(keys) : keys;
  return chrome.storage.local.set({[storageSshKeysName]: serialised});
}

export async function storageGetResult() {
  return chrome.storage.local.get([storageResult]).then(res => {
    const val = res[storageResult];
    return val;
  });
}

export async function storageSetResult(result) {
  return chrome.storage.local.set({[storageResult]: result});
}

export async function outputStoreState() {
  const stamp = 'Cache Info ' + new Date().getTime();
  console.groupCollapsed(stamp);
  console.info('Droplets', await storageGetDroplets());
  console.info('Droplet Results', await storageGetResult());
  console.info('Activities', await storageGetActivities());
  console.info('SSH Keys', await storageGetSshKeys());
  console.groupEnd(stamp);

  // await storageSetSshKeys(null);
}
