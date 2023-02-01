
# Attempt 1
Beef up initial work done over at https://github.com/rancher/dashboard-bot to include `docker blame` and slackbot integration

Info
- script uses DO CLI `doctl` to fetch droplets. The uses, roughly, an API token and their `v2` api
  - https://docs.digitalocean.com/reference/api/api-reference/
- PROBLEM 1
  - Cannot simply get the list of droplets, as the resource does not contain information on the user who created it
  - https://docs.digitalocean.com/reference/api/api-reference/#operation/droplets_list
- PROBLEM 2
  - Cannot check the droplets actions, as the droplet action does not contain information on the user who created it
  - https://docs.digitalocean.com/reference/api/api-reference/#operation/dropletActions_list
- PROBLEM 3
  - Droplet creator can be ascertained via the project's activity log. 
  - Neither CLI or v2 API provide project activity 
  - I created https://ideas.digitalocean.com/core-compute-platform/p/determine-creator-of-a-droplet
- PROBLEM 4
  - The DO website uses a different API (`api/v1`) served through the website's domain to fetch activity
  - This endpoint does not work with the normal v2 auth mechanism

# Attempt 2
Create a chrome extension (compatible with Brave) that makes API requests to the v1 endpoint using the same auth as the DO website.

See [usage-extension](usage-extension/hackweek21.md)
