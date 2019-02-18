chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "amzshortcutsContextMenu",
    title: "Search on Amazon",
    contexts: ["selection"]
  });
});
