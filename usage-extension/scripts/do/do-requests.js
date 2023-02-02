import { doUrl } from './do.js';

const containerEcosystemId = '7708d48d-9571-45a7-ab35-34da2d95fe99'; // TODO: Allow user to supply (and cache project/fleet name)


export const doGetActivity = async (page = 1) => {
  return await getDo(`${doUrl}/api/v1/fleets/${containerEcosystemId}/activity_history?sort=date&sort_direction=asc&page=${page}&per_page=2000`);
}


export const doGetDroplets = async(page = 1) => {
  const resJson = await getDo(`${doUrl}/api/v1/droplets?page=${page}&sort=created_at&sort_direction=desc&include_failed=true`);
  if (resJson.meta.pagination.next_page) {
    const nextPageRes = await doGetDroplets(++page);
    resJson.droplets = [
      ...resJson.droplets,
      ...nextPageRes.droplets
    ]
  }
  return resJson;
}

export const doGetSshKeys = async(page = 1) => {
  const resJson = await getDo(`${doUrl}/api/v1/ssh_keys?page=${page}&sort=created_at&sort_direction=desc&per_page=2000`);
  if (resJson.meta.pagination.next_page) {
    const nextPageRes = await doGetSshKeys(++page);
    resJson.ssh_keys = [
      ...resJson.ssh_keys,
      ...nextPageRes.ssh_keys
    ]
  }
  return resJson;
}

export const doDeleteSshKey = async(keyId) => {
  await deleteDo(`${doUrl}/api/v1/ssh_keys/${keyId}`);
}

const getDo = async(url) => {
  const res = await fetch(url, {
    'headers': {
      'accept': 'application/json',
    },
  });
  return await res.json();
}

// TODO: RC This fails with CRSF error. Need to scrap from existing content requests? Are they only added to mutation methods?
const deleteDo = async(url) => {
  return await fetch(url, {
    'method': 'DELETE'
  });
}