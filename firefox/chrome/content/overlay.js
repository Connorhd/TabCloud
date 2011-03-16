var tabcloud = {
	xhr: undefined,
	editing: undefined,
	onLoad: function() {
		function firstRun(extensions) {
			extension = extensions.get('tabcloud@firefox.connorhd.co.uk');

			if (extension.firstRun) {
				try {
					var myId    = "tabcloud-toolbar-button"; // ID of button to add
					var afterId = "urlbar-container";    // ID of element to insert after
					var navBar  = document.getElementById("nav-bar");
					var curSet  = navBar.currentSet.split(",");
					if (curSet.indexOf(myId) == -1 && document.getElementById(myId) === null) {
						var pos = curSet.indexOf(afterId) + 1 || curSet.length;
						var set = curSet.slice(0, pos).concat(myId).concat(curSet.slice(pos));

						navBar.setAttribute("currentset", set.join(","));
						navBar.currentSet = set.join(",");
						document.persist(navBar.id, "currentset");
						try {
							BrowserToolboxCustomizeDone(true);
						}
						catch (e) {}
					}
				}
				catch(e) {}
			}
		}

		if (Application.extensions)
			firstRun(extensions);
		else
			Application.getExtensions(firstRun);
	},
  
	hideSaved: function () {
		while (document.getElementById('tabcloud-saved').hasChildNodes()) {
			document.getElementById('tabcloud-saved').removeChild(document.getElementById('tabcloud-saved').lastChild);
		}
	},

	displayInfo: function (text) {
		var xhtmlNS = 'http://www.w3.org/1999/xhtml';
		this.hideSaved();
		var domInfo = document.createElementNS(xhtmlNS, 'div');
		domInfo.className = 'tabcloud-info';
		domInfo.textContent = text;
		document.getElementById('tabcloud-saved').appendChild(domInfo);
	},

	onHide: function() {
		this.hideSaved();
		while (document.getElementById('tabcloud-current').hasChildNodes()) {
			document.getElementById('tabcloud-current').removeChild(document.getElementById('tabcloud-current').lastChild);
		}
		if (this.xhr) {
			try {
				this.xhr.abort();
			} catch (e) {}
		}
	},
	
	loadRemote: function () {
		var xhtmlNS = 'http://www.w3.org/1999/xhtml';
		var xulNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		
		tabcloud.displayInfo('Loading...');
		var url = "https://chrometabcloud.appspot.com/tabcloud";
		var req = tabcloud.xhr = new XMLHttpRequest();
		req.onreadystatechange = function (aEvt) {
			if (req.readyState == 4) {
				if(req.status == 200) {
					try {
						var data = JSON.parse(req.responseText);
						if (data.status == 'loggedout') {
							tabcloud.hideSaved();
							var domInfo = document.createElementNS(xhtmlNS, 'div');
							domInfo.className = 'tabcloud-info';
							domInfo.textContent = 'TabCloud requires you login to load your saved windows';
							
							var domInfoLink = document.createElementNS(xhtmlNS, 'a');
							domInfoLink.href = '#';
							domInfoLink.textContent = 'Click here to login';
							domInfoLink.style.display = 'block';
							domInfoLink.onclick = function () {
								gBrowser.selectedTab = gBrowser.addTab('https://chrometabcloud.appspot.com/login');
								document.getElementById('tabcloud-panel').hidePopup();
								return false;
							}
							domInfo.appendChild(domInfoLink);
							
							document.getElementById('tabcloud-saved').appendChild(domInfo);
						} else {
							tabcloud.hideSaved();
							var windowIdCounter = 0;
							data.windows.forEach(function (win) {
								var windowId = windowIdCounter++;
								// Create window box
								var domWindow = document.createElementNS(xhtmlNS, 'fieldset');
								domWindow.className = 'tabcloud-window';
								
								// Create window box title
								var domWindowLegend = document.createElementNS(xhtmlNS, 'legend');
								domWindowLegend.className = 'tabcloud-windowname';
								// TODO: Window name helper + escape
								domWindowLegend.textContent = win.name;
								domWindow.appendChild(domWindowLegend);
								domWindowLegend.editing = false;
								
								domWindowLegend.onclick = function () {
									if (!domWindowLegend.editing) {
										if (tabcloud.editing) {
											try {
												tabcloud.editing.legend.textContent = tabcloud.editing.title.value;
												
												var req = new XMLHttpRequest();
												req.open('POST', 'https://chrometabcloud.appspot.com/update', true);
												var params = 'window='+encodeURIComponent(JSON.stringify(tabcloud.editing.win))+'&windowId='+tabcloud.editing.windowId;
												req.setRequestHeader("content-length", params.length);
												req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
												req.send(params);
												
												delete tabcloud.editing.legend.editing;
												delete tabcloud.editing;
											} catch (e) {}
										}

										var domWindowTitle = document.createElementNS(xhtmlNS, 'input');
										domWindowTitle.type = 'text';
										domWindowTitle.value = domWindowLegend.textContent;
										domWindowLegend.textContent = '';
										domWindowLegend.appendChild(domWindowTitle);
										domWindowLegend.editing = true;
										tabcloud.editing = {
											legend: domWindowLegend,
											title: domWindowTitle,
											win: win,
											windowId: windowId
										}
										domWindowTitle.focus();
										
										domWindowTitle.onkeypress = function (e) {
											if (e.which === 13) {
												try {
													win.name = domWindowLegend.textContent = domWindowTitle.value;
													
													if (!win.name) {
														domWindowLegend.textContent = win.name = 'Window';
													}
													
													var req = new XMLHttpRequest();
													req.open('POST', 'https://chrometabcloud.appspot.com/update', true);
													var params = 'window='+encodeURIComponent(JSON.stringify(win))+'&windowId='+windowId;
													req.setRequestHeader("content-length", params.length);
													req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
													req.send(params);
													
													delete domWindowLegend.editing;
													delete tabcloud.editing;
												} catch (e) {}
											}
										}
									}
								};

								// Add buttons
								var domWindowButtons = document.createElementNS(xhtmlNS, 'span');
								domWindowButtons.className = 'tabcloud-right';
								domWindow.appendChild(domWindowButtons);
								
								// Delete button
								var domDeleteTooltip = document.createElement('box');
								domDeleteTooltip.setAttribute('tooltiptext', 'Delete window');
								domWindowButtons.appendChild(domDeleteTooltip);
								var domDelete = document.createElementNS(xhtmlNS, 'img');
								domDelete.src = 'chrome://tabcloud/content/images/delete.png';
								domDeleteTooltip.appendChild(domDelete);
								
								domDelete.onclick = function () {
									var req = new XMLHttpRequest();
									req.open('POST', 'https://chrometabcloud.appspot.com/remove', true);
									req.onreadystatechange = function (aEvt) {
										if (req.readyState == 4) {
											if (req.status == 200) {
												tabcloud.loadRemote();
											}
										}
									};
									var params = 'window='+windowId;
									req.setRequestHeader("content-length", params.length);
									req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
									req.send(params);
								}
								
								// Open button
								var domOpenTooltip = document.createElement('box');
								domOpenTooltip.setAttribute('tooltiptext', 'Open window');
								domWindowButtons.appendChild(domOpenTooltip);
								var domOpen = document.createElementNS(xhtmlNS, 'img');
								domOpen.src = 'chrome://tabcloud/content/images/add.png';
								domOpenTooltip.appendChild(domOpen);
								
								domOpen.onclick = function () {
									// Open saved window
									window.open();
									var newWindow = wm.getMostRecentWindow("navigator:browser");
									var pinned = []
									win.tabs.forEach(function (tab) {
										var newtab = newWindow.gBrowser.addTab(tab.url);
										if (tab.pinned) {
											pinned.push(newtab);
										}
									});
									newWindow.gBrowser.removeCurrentTab();
									pinned.forEach(function (newtab) {
										newWindow.gBrowser.pinTab(newtab);
									});
								}
								
								// Tabs
								var domTabs = document.createElementNS(xhtmlNS, 'div');
								domTabs.className = 'tabcloud-tabs';
								domWindow.appendChild(domTabs);
								
								win.tabs.forEach(function (tab) {
									// Favicon
									var domTab = document.createElementNS(xhtmlNS, 'img');
									if (tab.favicon.length > 3)
										domTab.src = tab.favicon;
									else
										domTab.src = 'chrome://tabcloud/content/images/page_white.png';
										
									domTab.className = 'tabcloud-tabimg';
									domTab.onerror = function () {
										domTab.src = 'chrome://tabcloud/content/images/page_white.png';
									};
									
									// Tooltip
									var domTabTooltip = document.createElement('deck');
									domTabTooltip.setAttribute('tooltiptext', tab.title);
									domTabTooltip.appendChild(domTab);
									
									
									// Click handler
									domTabTooltip.onclick = function (e) {
										if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
											gBrowser.addTab(tab.url);
										}
									}
									
									// Add to set
									domTabs.appendChild(domTabTooltip);
								});

								document.getElementById('tabcloud-saved').appendChild(domWindow);
							});
						}
					} catch (e) {
						alert(e);
						tabcloud.displayInfo('Server error, try again later.');
					}
				} else {
					tabcloud.displayInfo('Server error, try again later.');
				}
			}
		};
		req.open("GET", url, true);
		req.send(null);
	},
  
	onShow: function(e) {
		var tabcloud = this;
		var xhtmlNS = 'http://www.w3.org/1999/xhtml';
		var xulNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator('navigator:browser');
		var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
  
		var windowId = -1;
		while (enumerator.hasMoreElements()) {
			windowId++;
			var win = enumerator.getNext();
			var num = win.gBrowser.browsers.length;
			
			(function () {
			
				var data = {};
				
				if (win._tabcloudName) {
					data.name = win._tabcloudName;
				}

				// Create window box
				var domWindow = document.createElementNS(xhtmlNS, 'fieldset');
				domWindow.className = 'tabcloud-window';
				
				// Create window box title
				var domWindowLegend = document.createElementNS(xhtmlNS, 'legend');
				domWindowLegend.className = 'tabcloud-windowname';
				// TODO: Window name helper + escape
				if (data.name)
					domWindowLegend.textContent = data.name;
				else
					domWindowLegend.textContent = 'Click to name';
				domWindow.appendChild(domWindowLegend);
				domWindowLegend.editing = false;
				
				domWindowLegend.onclick = function () {
					if (!domWindowLegend.editing) {
						if (tabcloud.editing) {
							try {
								data.name = tabcloud.editing.win._tabcloudName = tabcloud.editing.legend.textContent = tabcloud.editing.title.value;
								delete tabcloud.editing.legend.editing;
								delete tabcloud.editing;
							} catch (e) {}
						}

						var domWindowTitle = document.createElementNS(xhtmlNS, 'input');
						domWindowTitle.type = 'text';
						if (win._tabcloudName)
							domWindowTitle.value = data.name;
						domWindowLegend.textContent = '';
						domWindowLegend.appendChild(domWindowTitle);
						domWindowLegend.editing = true;
						tabcloud.editing = {
							legend: domWindowLegend,
							title: domWindowTitle,
							win: win
						}
						domWindowTitle.focus();
						
						domWindowTitle.onkeypress = function (e) {
							if (e.which === 13) {
								try {
									data.name = win._tabcloudName = domWindowLegend.textContent = domWindowTitle.value;
									
									if (!data.name) {
										data.name = win._tabcloudName = domWindowLegend.textContent = 'Window';
									}

									delete domWindowLegend.editing;
									delete tabcloud.editing;
								} catch (e) {}
							}
						}
					}
				};

				// Add buttons
				var domWindowButtons = document.createElementNS(xhtmlNS, 'span');
				domWindowButtons.className = 'tabcloud-right';
				domWindow.appendChild(domWindowButtons);
				
				// Open button
				var domSaveTooltip = document.createElement('box');
				domSaveTooltip.setAttribute('tooltiptext', 'Save window');
				domWindowButtons.appendChild(domSaveTooltip);
				var domSave = document.createElementNS(xhtmlNS, 'img');
				domSave.src = 'chrome://tabcloud/content/images/disk.png';
				domSaveTooltip.appendChild(domSave);
				
				domSave.onclick = function () {
					// Save window
					if (!data.name) {
						var date = new Date();
						var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
						data.name = months[date.getMonth()]+' '+date.getDate()+', '+date.getFullYear()+' - '+date.toLocaleTimeString();
					}
					
					domSave.src = 'chrome://tabcloud/content/images/arrow_refresh.png';
				
					var req = new XMLHttpRequest();
					req.open('POST', 'https://chrometabcloud.appspot.com/add', true);
					req.onreadystatechange = function (aEvt) {
						if (req.readyState == 4) {
							if (req.status == 200) {
								domSave.src = 'chrome://tabcloud/content/images/accept.png';
								domSaveTooltip.setAttribute('tooltiptext', 'Window saved');
								tabcloud.loadRemote();
							}
						}
					};
					var params = 'window='+encodeURIComponent(JSON.stringify(data));
					req.setRequestHeader("content-length", params.length);
					req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
					req.send(params);
				}
				
				// Tabs
				var domTabs = document.createElementNS(xhtmlNS, 'div');
				domTabs.className = 'tabcloud-tabs';
				domWindow.appendChild(domTabs);
				
				data.tabs = [];
				
				for (var i = 0; i < num; i++) {
					var b = win.gBrowser.getBrowserAtIndex(i);
					
					try {
						var uri = ios.newURI(b.currentURI.spec, null, null);
						
						// Favicon
						var domTab = document.createElementNS(xhtmlNS, 'img');
						domTab.src = fis.getFaviconImageForPage(uri).spec;
						
						data.tabs.push({
							url: b.currentURI.spec,
							title: b.contentTitle,
							favicon: (fis.getFaviconImageForPage(uri).spec != '' && fis.getFaviconImageForPage(uri).spec !== undefined) ? fis.getFaviconImageForPage(uri).spec.substring(17) : ''
						});

						domTab.className = 'tabcloud-tabimg';
						domTab.onerror = function () {
							domTab.src = 'chrome://tabcloud/content/images/page_white.png';
						};
						
						// Tooltip
						var domTabTooltip = document.createElement('deck');
						domTabTooltip.setAttribute('tooltiptext', b.contentTitle);
						domTabTooltip.appendChild(domTab);
						
						
						// Click handler
						domTabTooltip.onclick = function (e) {
							if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
								gBrowser.addTab(b.currentURI.spec);
							}
						}
						
						// Add to set
						domTabs.appendChild(domTabTooltip);

					} catch(e) {}
				}
				
				document.getElementById('tabcloud-current').appendChild(domWindow);
			})()
		}
		tabcloud.loadRemote();
  }
};

window.addEventListener("load", function () { tabcloud.onLoad() }, false);