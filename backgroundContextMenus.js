function amazonSearchContextMenuOnClick(info, tab) {
  if (info.menuItemId !== "amzshortcutsAmazonSearchContextMenu") return;

  if (!info.selectionText) {
    alert("Select some text and try again");
    return;
  }

  const amazonSearchURL = `https://www.amazon.com/s?k=${info.selectionText}`;
  chrome.tabs.create({
    url: amazonSearchURL,
    active: true
  });
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "amzshortcutsAmazonSearchContextMenu",
    title: "Search on Amazon",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(amazonSearchContextMenuOnClick);
