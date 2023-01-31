chrome.runtime.onMessage.addListener( function(request, sender, callback) {
  const dResources = request.data || [];
  const dElements = document.querySelectorAll("[data-value]");

  dElements.forEach(dE => {
    const dropletName = dE.getAttribute('data-value');
    const d = dResources.find(dR => dR.dropletName === dropletName);
    if (d) {
      const imageNameElement = dE.getElementsByClassName('Resource-description')[0];
      
      imageNameElement.innerText = d.userName + ' / ' + imageNameElement.innerText;
    }
  })

  callback({success: true});
});