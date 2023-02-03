# Determine Usage of Digital Ocean Droplets

Display droplet usage info on a per user basis, determine stale droplets. Automate the process and integrate with Slack.

This will help us keep our DO bill down to enable continued use.

> When creating DO resources add identifiable info (name, initials, first pets name, etc) to name
> 1. DO Website - Droplet name
> 2. Rancher - RKE2 Cluster name
> 3. Rancher - RKE1 node pool name (rke1 droplets are prefixed with this and not cluster name)


## Approach 1
Beef up initial work done over at https://github.com/rancher/dashboard-bot to include `DO blame` and slackbot integration

Info
- script uses DO CLI `doctl` to fetch droplets. This uses, roughly, an API token and their `v2` api
  - https://docs.digitalocean.com/reference/api/api-reference/
- PROBLEM 1
  - Cannot simply use the list of droplets, as the resource does not contain information on the user who created it
  - https://docs.digitalocean.com/reference/api/api-reference/#operation/droplets_list
- PROBLEM 2
  - Cannot check the droplets actions, as the droplet action does not contain information on the user who created it
  - https://docs.digitalocean.com/reference/api/api-reference/#operation/dropletActions_list
- PROBLEM 3
  - Droplet creator can be ascertained via the project's activity log, linking user and droplet.
  - Neither CLI or v2 API can fetch project activity resource
  - I created https://ideas.digitalocean.com/core-compute-platform/p/determine-creator-of-a-droplet
- PROBLEM 4
  - Project activity is available in the DO website and the API it uses
  - The API they use (`api/v1`) is different from CLI 
  - API is served through the website's domain, does not work with the normal v2 auth mechanism

## Approach 2
Create a chrome extension (compatible with Brave) that makes API requests to the v1 endpoint using the same auth as the DO website.

See [usage-extension](usage-extension/hackweek21.md)
