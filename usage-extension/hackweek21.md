# Chrome Extension - Digital Ocean Droplet Usage

Create a chrome extension (compatible with Brave) that makes API requests to the v1 endpoint using the same auth as the DO website.

## Features

- Results can take a while to fetch, so are cached in local storage. To fetch new results results can be cleared with the button in the popup

correlating droplet and user done via project acitibity. created idea to get straight from droplet. // TODO: RC

This will be able to correlate DO droplets and their creator

### TODO / FIX List
- Delete SSH Key does not currently work
  - DO block mutating HTTP requests lacking CSRF token. Need to somehow scrape this from other calls?
- Linking the SSH key to an owner only possible for Rancher created keys
  - Rancher created keys are named the same as the droplet it creates 
- Flag stale DO_NOT_DELETE droplets
  - Only droplets without DO_NO_DELETE tag over 12 days old are flagged  
  - Need to get activity of DO_NOT_DELETE tagged droplets and warn on those that are unused
- Automatically apply droplet info to DO droplets page if we have them in the cache. 
  - Need to dynamically load content script to make use of module related syntax
- Convert to modern framework (instead of vanilla JS/HTML/CSS)
  - This would also resolve structuring issues (see popup.js, general module use, etc)
- DARK MODE!!  


## Loading the plugin

1. --> `brave://extensions/`
1. Enable `Developer mode`
1. --> `Load unpacked` and point do the root of this directory
1. --> DO website and log in
1. Click the Rancher extension icon

## Developing plugin
1. After making a change simply hit the refresh icon on `brave://extensions/`
2. To inspect logs, DOM, etc right click on pop-up and view element to bring up dev-tools specific to popup

> If the service worker needs debugging it's worth going to `chrome://serviceworker-internals/?devtools` and enabling the first checkbox (`Open DevTools window and pause JavaSCript execution...`)

### Deps
- https://purecss.io/
- https://icons.getbootstrap.com/#icons

## Known Gaps / Issues
- Copy Slack Message should be replaced with button to send slack DM to specific users 
- The cost information per hour is not provided in the type of droplet the website gets. Other API requests would be needed (we do get a `size_id`) OR we do something more fun with the `size_monthly_price` (need to convert total days into calendar months)
- Largest size a popup can be is 800x600
- Project Id is hardcoded (we could go out and fetch it via /api/v1/fleets)
- Cost only includes droplet compute cost (size of vm), rather than floating ip, backup, etc
- "matches

