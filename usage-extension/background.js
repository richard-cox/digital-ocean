chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "",
  });
});

const doUrl = 'https://cloud.digitalocean.com';
let running = false // TODO: RC

const containerEcosystemId = '7708d48d-9571-45a7-ab35-34da2d95fe99'; // This is gonna be static, no need to make a request to find



chrome.action.onClicked.addListener(async (tab) => {
  console.log('onClicked'); // chrome://inspect/#service-workers
  console.warn('onClicked');

  if (!tab.url.startsWith(doUrl)) {
    return;
  }

  // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });

  console.warn('state: ', prevState, running);

  if (prevState === 'RUNNING') {
    return;
  }

  running = true;

  // Set the action badge to the next state
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: 'RUNNING',
  });

  try {
    await getUsageInfo();
  } catch (err) {
    console.error('Failed to get usage: ', err);
  }
  

  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: '',
  });

  running = false;

  // /home/richard/dev/github/richard-cox/digitalocean/usage-extension
  

    // // Next state will always be the opposite
    // const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // // Set the action badge to the next state
    // await chrome.action.setBadgeText({
    //   tabId: tab.id,
    //   text: nextState,
    // });

    // if (nextState === "ON") {
    //   // Insert the CSS file when the user turns the extension on
    //   await chrome.scripting.insertCSS({
    //     files: ["focus-mode.css"],
    //     target: { tabId: tab.id },
    //   });
    // } else if (nextState === "OFF") {
    //   // Remove the CSS file when the user turns the extension off
    //   await chrome.scripting.removeCSS({
    //     files: ["focus-mode.css"],
    //     target: { tabId: tab.id },
    //   });
    // }



  // Yes! You can use scripting.executeScript() to inject JavaScript.
  // chrome.scripting.executeScript({
  //   target : {tabId : tab.id},
  //   func : injectedFunction,
  // });
});

const getUsageInfo = async() => {
  const droplets = mockDroplets(); // await getDroplets();
  console.warn('getUsageInfo', 'droplets', droplets);

  const supplementedDroplets = await supplementDroplets(droplets.droplets);
  console.warn('getUsageInfo', 'supplementedDroplets', supplementedDroplets);



  // return await getDo('https://cloud.digitalocean.com/api/v1/fleets/7708d48d-9571-45a7-ab35-34da2d95fe99/activity_history?preserveScrollPosition=true&sort=date&sort_direction=desc&page=1');
}


const getDroplets = async(page = 1) => {
  // return await getDo('https://api.digitalocean.com/v2/droplets?page=1&per_page=200');

  const resJson = await getDo(`${doUrl}/api/v1/droplets?page=${page}&sort=created_at&sort_direction=desc&include_failed=true`);
  // const resJson = await res.json();
  console.warn('getDroplets: ', 'req 1', resJson)
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
  // const activityPageNo = 1;
  // const activityPageIndex = 0;
  // let activityPage = await getActivity(activityPageNo);
  let activityRes;

  for (const d of droplets ){

    const then = new Date(d.created_at);

    const supplemented = {
      
    }
    supplemented.hours_old = Math.floor((now - then) / 1000 / 3600);
    supplemented.days_old = Math.floor(supplemented.hours_old / 24);


    await findActivity(d, activityRes)
      .then(res => {
        activityRes = res.activityRes
        supplemented.user = res.activity.user.name;
      })
      .catch(e => console.error('skipping'));
    
    // let activity = null;
    // for (let pos = activityRes.currentPos; pos < activityPage.length; pos++) {
    //   activityRes = await findActivity(d, activityRes);
    //   supplemented.user = activityRes.user.name;
    // }



    d.supplemented = supplemented;

    
    
    // TODO: RC there's no `size` obj, but there is a size_id (and size_monthly_price);
  };

  const activity = await getDo(`${doUrl}/api/v1/fleets/${containerEcosystemId}/activity_history?sort=date&sort_direction=asc&page=1&per_page=2000`);
  console.warn('supplementDroplets', 'activity', activity);

  // droplets.forEach(d)
  return droplets; // TODO: RC naughty
}

const getActivity = async (page = 1) => {
  // return await getDo(`${doUrl}/api/v1/fleets/${containerEcosystemId}/activity_history?sort=date&sort_direction=asc&page=${page}&per_page=2000`);
  return mockActivity();

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

  console.log('findActivity', 'not found', droplet)

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
