import { monthDiff } from './helpers.js';
import { storageGetDroplets, storageGetResult, storageGetSshKeys, storageSetActivities, storageSetDroplets, storageSetResult, storageSetSshKeys } from './store.js';


const containerEcosystemId = '7708d48d-9571-45a7-ab35-34da2d95fe99'; // This is gonna be static, no need to make a request to find
export const doUrl = 'https://cloud.digitalocean.com';

export const clearCache  = async() => {
  await storageSetDroplets(null);
  await storageSetActivities(null);
  await storageSetResult(null);
}

function getDisplayName(name) {
  // return obfuscateText(name);
  return name;
}

export const getNeatUsageInfo = async() => {
  const droplets = await getUsageInfo();
  const now = new Date();

  return droplets.map(d => {

    // Everything time/age based needs to be done on-demand rather than stuck in store
    const then = new Date(d.created_at);

    // General age things
    const hours_old = Math.floor((now - then) / 1000 / 3600);
    const too_old = hours_old >= 1 * 24 * 12;
    const daysMinusHours = Math.floor(hours_old / 24);
    const hoursMinusDays = hours_old % 24;

     // Cost
    const monthsFraction = monthDiff(new Date(d.created_at), new Date());
    const cost = monthsFraction * d.size_monthly_price

    // Is Naughty
    const isNaughty = too_old && !d.supplemented.doNotDelete;

    return {
      dropletName: getDisplayName(d.name),
      dropletId: d.id,
      userName: getDisplayName(d.supplemented.user),
      created: `${then.toLocaleTimeString()} ${then.toLocaleDateString()}`,
      age: `${daysMinusHours} days, ${hoursMinusDays} hours`,
      isNaughty,
      isNice: !isNaughty && d.supplemented.doNotDelete,
      totalCost: cost,
      monthlyRate: Number.parseFloat(d.size_monthly_price)
    }
  })
}

export const getNeatSshUsageInfo = async(supplementedDroplets) => {
  const sshKeys = await getSshUsageInfo();
  const now = new Date();

  return sshKeys.ssh_keys.map(s => {

    // Everything time/age based needs to be done on-demand rather than stuck in store
    const then = new Date(s.created_at);

    // General age things
    const hours_old = Math.floor((now - then) / 1000 / 3600);
    const too_old = hours_old >= 1 * 24 * 12;
    const daysMinusHours = Math.floor(hours_old / 24);
    const hoursMinusDays = hours_old % 24;

     // Cost
    // const monthsFraction = monthDiff(new Date(d.created_at), new Date());
    // const cost = monthsFraction * d.size_monthly_price

    // Is Naughty
    // const isNaughty = too_old && !d.supplemented.doNotDelete;

    const d = supplementedDroplets.find(droplet => droplet.dropletName === s.name);

    return {
      name: s.name,
      dropletName: d ? getDisplayName(d.dropletName) : '',
      dropletId: d?.dropletId,
      dropletUserName: d ? getDisplayName(d.userName) : '',
      created: `${then.toLocaleTimeString()} ${then.toLocaleDateString()}`,
      age: `${daysMinusHours} days, ${hoursMinusDays} hours`,
      // isNaughty,
      // isNice: !isNaughty && d.supplemented.doNotDelete,
      // totalCost: cost,
      // monthlyRate: Number.parseFloat(d.size_monthly_price)
    }
  })
}


export const getSshUsageInfo = async(droplets) => {
  let sshKeys = await storageGetSshKeys();
  if (!sshKeys) {
    sshKeys = await getSshKeys(); //mockDroplets(); //
    storageSetSshKeys(sshKeys);
  }
  console.info('getSshUsageInfo', 'ssh keys', sshKeys);
  return sshKeys;
}

export const getUsageInfo = async() => {
  let droplets = await storageGetDroplets();

  if (!droplets) {
    droplets = await getDroplets(); //mockDroplets(); //
    storageSetDroplets(droplets);
  }
  console.info('getUsageInfo', 'droplets', droplets);

  let supplementedDroplets = await storageGetResult();
  if (!supplementedDroplets) {
    supplementedDroplets =  await supplementDroplets(droplets.droplets);
    storageSetResult(supplementedDroplets);
  }
  console.info('getUsageInfo', 'supplementedDroplets', supplementedDroplets);

  return supplementedDroplets;
}

export const getDroplets = async(page = 1) => {
  const resJson = await getDo(`${doUrl}/api/v1/droplets?page=${page}&sort=created_at&sort_direction=desc&include_failed=true`);
  if (resJson.meta.pagination.next_page) {
    const nextPageRes = await getDroplets(++page);
    resJson.droplets = [
      ...resJson.droplets,
      ...nextPageRes.droplets
    ]
  }
  return resJson;
}

const supplementDroplets = async (droplets) => {
  let activityRes;

  for (const d of droplets){

    d.supplemented = {
      doNotDelete: !!d.tags?.find(t => t.name === 'DO_NOT_DELETE'),
      user: undefined,
    }

    await findActivity(d, activityRes)
      .then(res => {
        activityRes = res.activityRes
        d.supplemented.user = res.activity.user.name;
      })
      .catch(e => {
        d.supplemented.user = 'UNKNOWN';
        console.error('Failed to find activity --> user for: ', d.name, e)
      });
  };

  return droplets; // mutating state naughtyness
}

const getActivity = async (page = 1) => {
  return await getDo(`${doUrl}/api/v1/fleets/${containerEcosystemId}/activity_history?sort=date&sort_direction=asc&page=${page}&per_page=2000`);
  // return mockActivity();
}

const findActivity = async (droplet, activityRes = null) => {
  if (!activityRes) {
    activityRes = {
      currentPage: [],
      page: 0,
      total_pages: undefined,
      currentPos: 0
    }
  }

  const { currentPage, page, total_pages, currentPos} = activityRes
  for (let pos = currentPos; pos < currentPage.length; pos++) {
    const currentActivity = currentPage[pos];
    if (currentActivity.resource_type === 'Droplet' && droplet.id === currentActivity.resource_id) {
      console.log('findActivity', 'found', droplet.name, currentActivity.user.name)
      return {
        activity: currentActivity,
        activityRes: {
          currentPage,
          page,
          total_pages,
          currentPos: pos,
        }
      }
    }
  }

  if (page === total_pages) {
    throw new Error(`Can't find droplet`, droplet);
  }

  let newPage = page+1;
  const newPageResults = await getActivity(newPage);
  return await findActivity(droplet, {
    currentPage: newPageResults.activities,
    page: newPage,
    total_pages: newPageResults.meta.pagination.total_pages,
    currentPos: 0
  })

}

export const getSshKeys = async(page = 1) => {
  const resJson = await getDo(`${doUrl}/api/v1/ssh_keys?page=${page}&sort=created_at&sort_direction=desc&per_page=2000`);
  if (resJson.meta.pagination.next_page) {
    const nextPageRes = await getSshKeys(++page);
    resJson.ssh_keys = [
      ...resJson.ssh_keys,
      ...nextPageRes.ssh_keys
    ]
  }
  return resJson;
}

const getDo = async(url) => {
  const res = await fetch(url, {
    "headers": {
      "accept": "application/json",
    },
  });
  return await res.json();
}
