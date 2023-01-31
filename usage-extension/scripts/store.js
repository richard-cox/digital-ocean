export const storageDropletsName = 'droplets';
export const storageActivitiesName = 'activities';
export const storageResult = 'result';

export let storageHasDroplets = false;
export let storageHasActivities = false;

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

export async function storageGetResult() {
  return chrome.storage.local.get([storageResult]).then(res => {
    const val = res[storageResult];
    return val;
  });
}

export async function storageSetResult(result) {
  return chrome.storage.local.set({[storageResult]: result});
}
