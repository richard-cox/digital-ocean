function supplement(dResources) {
  const dElements = document.querySelectorAll('[data-value]');

  dElements.forEach(dE => {
    const dropletName = dE.getAttribute('data-value');
    const d = dResources.find(dR => dR.dropletName === dropletName);
    if (d) {
      const imageNameElement = dE.getElementsByClassName('Resource-description')[0];
      
      const owner = d.userName;
      const cost = `Monthly: $${d.monthlyRate}, Total: $${d.totalCost.toFixed(2)}`
      imageNameElement.innerText = owner + ' / ' + cost + ' / ' + imageNameElement.innerText;

      let row = dE.parentElement; // This varies given content, so iterate up the chain
      while (row.localName !== 'tr') {
        row = row.parentElement
      }

      if (d.isNaughty) {
        row.style.backgroundColor = '#ffe5e5'
      } else if (d.isNice) {
        row.style.backgroundColor = '#e5ffe7'
      }
    }
  })
}

// TODO: RC Automatically apply droplet info... if we have the cache
// Requires module support (for imports). might be possible with dynamically loaded content_script 
// async function initialise() {
//   const storageHasResult = await storageGetResult();
//   if (storageHasResult) {
//     const dResources = await getNeatUsageInfo();
//     supplement(dResources);
//   }
// }

chrome.runtime.onMessage.addListener( function(request, sender, callback) {
  const dResources = request.data || [];

  supplement(dResources);

  callback({success: true});
});


// await initialise();