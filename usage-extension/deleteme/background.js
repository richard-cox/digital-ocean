import { doUrl, getUsageInfo } from '../scripts/do.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "",
  });
});

let running = false // TODO: RC

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.startsWith(doUrl)) {
    return;
  }

  // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });

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

