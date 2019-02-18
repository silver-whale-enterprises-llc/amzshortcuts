function amazonOnDOMContentLoaded(e) {
  const hasASIN = new RegExp("(?:[/dp/]|$)([A-Z0-9]{10})");
  if (hasASIN.test(e.url)) {
    chrome.tabs.executeScript(e.tabId, { file: "contentScriptAmazonProduct.js" });
  }
}

chrome.webNavigation.onDOMContentLoaded.addListener(amazonOnDOMContentLoaded, { url: [{ hostSuffix: "amazon.com" }] });
