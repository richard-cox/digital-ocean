import { monthDiff } from '../utils/utils.js';
import { doGetActivity, doGetDroplets, doGetSshKeys } from './do-requests.js';
import { storageGetDroplets, storageGetResult, storageGetSshKeys, storageSetDroplets, storageSetResult, storageSetSshKeys } from './store.js';


export const doUrl = 'https://cloud.digitalocean.com';

function getDisplayName(name) {
  // return obfuscateText(name);
  return name;
}

/*****************************
 * Droplets
 *****************************/ 

/**
 * Fetch droplet information, supplemented with user and current time related properties
 */
export const doGetDropletsInfoWithAge = async() => {
  const droplets = await getDropletsInfo();
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
    const isTeam = d.supplemented.team;

    return {
      dropletName: getDisplayName(d.name),
      dropletId: d.id,
      userName: getDisplayName(d.supplemented.user),
      created: `${then.toLocaleTimeString()} ${then.toLocaleDateString()}`,
      age: `${daysMinusHours} days, ${hoursMinusDays} hours`,
      isNaughty,
      isTeam, 
      isNice: !isNaughty && d.supplemented.doNotDelete,
      totalCost: cost,
      monthlyRate: Number.parseFloat(d.size_monthly_price)
    }
  })
}

/**
 * Fetch droplets and supplement them user creator info
 */
const getDropletsInfo = async() => {
  let droplets = await storageGetDroplets();

  if (!droplets) {
    droplets = await doGetDroplets(); //mockDroplets(); //
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

/**
 * Supplement droplet with user creator info
 */
const supplementDroplets = async (droplets) => {
  let activityRes;

  for (const d of droplets){

    d.supplemented = {
      doNotDelete: !!d.tags?.find(t => t.name === 'DO_NOT_DELETE'),
      team: !!d.tags?.find(t => t.name === 'TEAM'),
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

/**
 * Find an activity (containing user) related to the given droplet
 */
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
  const newPageResults = await doGetActivity(newPage);
  return await findActivity(droplet, {
    currentPage: newPageResults.activities,
    page: newPage,
    total_pages: newPageResults.meta.pagination.total_pages,
    currentPos: 0
  })

}

/**
 * Provide summary text for droplet usage
 */
export const doGetDropletUsageTextSummary = async () => {
  const droplets = await doGetDropletsInfoWithAge();

  const list = droplets.reduce((res, d) => {

    const { naughty, nice, team } = res;
    if (d.isNaughty) {
      if (!naughty[d.userName]) {
        naughty[d.userName] = [];
      }
  
      naughty[d.userName].push(`\`${d.dropletName}\` (${doUrl}/droplets/${d.dropletId})`)
  
      return res;

    }

    const type = d.isTeam ? team : nice;

    if (!type[d.userName]) {
      type[d.userName] = {
        count: 0,
        running: 0,
        total: 0
      };
    }

    type[d.userName].count += 1;
    type[d.userName].running += d.monthlyRate;
    type[d.userName].total += d.totalCost;

    return res;
  }, { naughty: [], nice: [], team: []});

  const naughty = Object.entries(list.naughty)
    .map(([userName, machines]) => `${userName}: ${machines.join(',')} \n`)

  const nice = Object.entries(list.nice)
    .sort(([,aCounts], [, bCounts]) => aCounts.running > bCounts.running ? -1 : aCounts.running < bCounts.running ? 1 : 0)
    .map(([userName, counts]) => ({
      userName,
      count: counts.count,
      running: counts.running.toFixed(2),
      total: counts.total.toFixed(2),
    }))

  const team = Object.entries(list.team)
    .sort(([,aCounts], [, bCounts]) => aCounts.running > bCounts.running ? -1 : aCounts.running < bCounts.running ? 1 : 0)
    .map(([userName, counts]) => ({
      userName,
      count: counts.count,
      running: counts.running.toFixed(2),
      total: counts.total.toFixed(2),
    }))

  return { naughty, nice, team  };
}


/*****************************
 * SSH Keys
 *****************************/ 

/**
 * Fetch ssh key information, supplemented with user and current time related properties
 */
export const doGetSshKeyInfoWithAge = async(supplementedDroplets) => {
  const sshKeys = await getSshKeyInfo();
  const now = new Date();

  return sshKeys.ssh_keys.map(s => {

    // Everything time/age based needs to be done on-demand rather than stuck in store
    const then = new Date(s.created_at);

    // General age things
    const hours_old = Math.floor((now - then) / 1000 / 3600);
    const daysMinusHours = Math.floor(hours_old / 24);
    const hoursMinusDays = hours_old % 24;

    // Find the user by linking the name of the key to the name of the droplet
    // This only works for rancher created keys
    const d = supplementedDroplets.find(droplet => droplet.dropletName === s.name);

    return {
      id: s.id,
      name: s.name,
      dropletName: d ? getDisplayName(d.dropletName) : '',
      dropletId: d?.dropletId,
      dropletUserName: d ? getDisplayName(d.userName) : '',
      created: `${then.toLocaleTimeString()} ${then.toLocaleDateString()}`,
      age: `${daysMinusHours} days, ${hoursMinusDays} hours`,
    }
  })
}

const getSshKeyInfo = async() => {
  let sshKeys = await storageGetSshKeys();
  if (!sshKeys) {
    sshKeys = await doGetSshKeys();
    storageSetSshKeys(sshKeys);
  }
  console.info('getSshUsageInfo', 'ssh keys', sshKeys);
  return sshKeys;
}

