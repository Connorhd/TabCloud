if (localStorage.openin === undefined)
	localStorage.openin = 'window';
if (localStorage.deleteconfirm === undefined)
	localStorage.deleteconfirm = 'yes';
if (localStorage.encryption === undefined)
	localStorage.encryption = 'no';
	
localStorage.tempWindowNames = "{}";
	
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (localStorage.openin === 'window') {
		chrome.windows.create({}, function (window) {
			chrome.tabs.getAllInWindow(window.id, function (tabs) {
				chrome.tabs.remove(tabs[0].id);
			});
			request.tabs.forEach(function (tab) {
				curTab = {
					windowId: window.id,
					url: tab.url,
					selected: false
				};
				if (localStorage.supportPinned == 1 && tab.pinned) {
					curTab.pinned = true;
				}
				chrome.tabs.create(curTab);
			});
		});
	} else if (localStorage.openin === 'tab') {
		request.tabs.forEach(function (tab) {
			chrome.tabs.create({
				url: tab.url
			});
		});
	}
});