import { storageGetDroplets, storageGetResult, storageSetActivities, storageSetDroplets, storageSetResult } from './store.js';


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
  return droplets.map(d => {
     const hoursOld = d.supplemented.hours_old;
     const daysMinusHours = Math.floor(hoursOld / 24);
     const hoursMinusDays = hoursOld % 24;

     return {
      dropletName: getDisplayName(d.name),
      dropletId: d.id,
      userName: getDisplayName(d.supplemented.user),
      created: new Date(d.created_at).toLocaleString(),
      age: `${daysMinusHours}:${hoursMinusDays}`,
      isNaughty: d.supplemented.isNaughty,
      isNice: !d.supplemented.isNaughty && d.supplemented.doNotDelete
     }
  })
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
  const now = new Date();
  let activityRes;

  for (const d of droplets){

    const then = new Date(d.created_at);

    const hours_old = Math.floor((now - then) / 1000 / 3600);
    const days_old = Math.floor(hours_old / 24);

    d.supplemented = {
      hours_old,
      days_old,
      too_old: hours_old >= 1 * 24 * 12,
      doNotDelete: !!d.tags?.find(t => t.name === 'DO_NOT_DELETE'),
      user: undefined,
    }

    d.supplemented.isNaughty = d.supplemented.too_old && !d.supplemented.doNotDelete;

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

  const activity = await getDo(`${doUrl}/api/v1/fleets/${containerEcosystemId}/activity_history?sort=date&sort_direction=asc&page=1&per_page=2000`);

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

const getDo = async(url) => {
  const res = await fetch(url, {
    "headers": {
      "accept": "application/json",
    },
  });
  return await res.json();
}
