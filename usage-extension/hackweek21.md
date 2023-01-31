# Chrome Extension - Digital Ocean Droplet Usage

Create a chrome extension (compatible with Brave) that makes API requests to the v1 endpoint using the same auth as the DO website.

This will be able to correlate DO droplets and their creator

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
- Project Id is hardcoded
- "matches": ["<all_urls>"], // TODO: RC

