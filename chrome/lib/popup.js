$(function () {setTimeout(function () {
	// Protect against XSRF attacks
	jQuery.ajaxSetup({
		'beforeSend': function(xhr) {
			xhr.setRequestHeader('X-XSRF-Protection', 'true');
		}
	})
	
	var getWindowName = function (name) {
		var names = JSON.parse(localStorage.tempWindowNames)
		return names[name];
	};
	var setWindowName = function (name, value) {
		if (value.length == 0) {
			value = 'Window';
		}
		var names = JSON.parse(localStorage.tempWindowNames)
		names[name] = value;
		localStorage.tempWindowNames = JSON.stringify(names);
	};
	var makeSortable = function () {
		$(".tabs").sortable({
			placeholder: 'tabplaceholder',
			forcePlaceholderSize: true,
			revert: 100,
			connectWith: '.tabs',
			scroll: false,
			update: function (e, ui) {
				var tab = $($(ui.item[0]).children()[0]).attr('id');
				var oldWindow = $($(ui.item[0]).children()[0]).attr('windowid');
				if ($(e.target).attr('id') === 'trash') {
					// Dragged to trash
					if (tab.substring(6,7) == 'l') {
						chrome.tabs.remove(parseInt(tab.substring(7),10));
					} else if (tab.substring(6,7) == 'r') {
						// Remove from remote
						// Remove from array
						var data = TCWindows[oldWindow.substring(4)];
						data.tabs.splice(tab.substring(7),1);
						data.name = getWindowName(oldWindow);
						// Send new array
						$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: oldWindow.substring(4)});
					}
					$(ui.item[0]).detach();
				} else {
					// Dragged between windows
					// Assume both local
					var newWindow = $(e.target).parent().attr('id');
					if (tab.substring(6,7) == 'l' && newWindow.substring(3,4) == 'l') {
						// Local to local
						
						// Move tab
						chrome.tabs.move(parseInt(tab.substring(7),10), {
							windowId: parseInt(newWindow.substring(4),10),
							index: $(ui.item[0]).index()
						});
						
						// Update image
						$($(ui.item[0]).children()[0]).attr('windowid', newWindow);
					} else if (tab.substring(6,7) == 'l' && newWindow.substring(3,4) == 'r') {
						// Local to remote
						
						// Add to remote
						// Add to array
						var data = TCWindows[newWindow.substring(4)];
						data.tabs.splice($(ui.item[0]).index(),0,{
							url: $($(ui.item[0]).children()[0]).attr('url'),
							title: $($(ui.item[0]).children()[0]).attr('title'),
							favicon: ($($(ui.item[0]).children()[0]).attr('src') != 'chrome://favicon/'+$($(ui.item[0]).children()[0]).attr('url')) ? $($(ui.item[0]).children()[0]).attr('src') : ''
						});
						data.name = getWindowName(newWindow);
						// Send new array
						$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: newWindow.substring(4)});
						
						// Remove from local
						chrome.tabs.remove(parseInt(tab.substring(7),10));
						
						// Update image
						$($(ui.item[0]).children()[0]).removeClass('tabimglocal').attr('id','tabimgr'+$(ui.item[0]).index()).attr('windowid', newWindow);
						$.each($(ui.item[0]).parent().children(), function (i, e) {
							$($(e).children()[0]).attr('id','tabimgr'+i);
						});
					
					} else if (tab.substring(6,7) == 'r' && newWindow.substring(3,4) == 'l') {
						// Remote to local
						
						// Add to local
						chrome.tabs.create({
							windowId: parseInt(newWindow.substring(4),10),
							url: $($(ui.item[0]).children()[0]).attr('url'),
							index: $(ui.item[0]).index(),
							selected: false
						}, function (newTab) {
							// Update image
							$($(ui.item[0]).children()[0]).addClass('tabimglocal').attr('id','tabimgl'+newTab.id);
						});
						
						// Remove from remote
						// Remove from array
						var data = TCWindows[oldWindow.substring(4)];
						data.tabs.splice(tab.substring(7),1);
						data.name = getWindowName(oldWindow);
						// Send new array
						$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: oldWindow.substring(4)});
						
						// Update image
						$($(ui.item[0]).children()[0]).attr('windowid', newWindow);
						
						// Update remote ids
						$.each($('#'+oldWindow).find('.tabs').children(), function (i, e) {
							$($(e).children()[0]).attr('id','tabimgr'+i);
						});
					} else if (tab.substring(6,7) == 'r' && newWindow.substring(3,4) == 'r') {
						// Remote to remote
						
						if (oldWindow === newWindow) {
							// Move within window
							// TODO
						} else {
							// Add to first window
							// Add to array
							var data = TCWindows[newWindow.substring(4)];
							data.tabs.splice($(ui.item[0]).index(),0,{
								url: $($(ui.item[0]).children()[0]).attr('url'),
								title: $($(ui.item[0]).children()[0]).attr('title'),
								favicon: ($($(ui.item[0]).children()[0]).attr('src') != 'chrome://favicon/'+$($(ui.item[0]).children()[0]).attr('url')) ? $($(ui.item[0]).children()[0]).attr('src') : ''
							});
							data.name = getWindowName(newWindow);
							// Send new array
							$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: newWindow.substring(4)});
							// Remove from 2nd
							// Remove from array
							var data = TCWindows[oldWindow.substring(4)];
							data.tabs.splice(tab.substring(7),1);
							data.name = getWindowName(oldWindow);
							// Send new array
							$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: oldWindow.substring(4)});
							// Update image
							$($(ui.item[0]).children()[0]).attr('windowid', newWindow);
							
							// Update image
							$($(ui.item[0]).children()[0]).attr('windowid', newWindow);
							$.each($('#'+oldWindow).find('.tabs').children(), function (i, e) {
								$($(e).children()[0]).attr('id','tabimgr'+i);
							});
							$.each($(ui.item[0]).parent().children(), function (i, e) {
								$($(e).children()[0]).attr('id','tabimgr'+i);
							});
						}
					}
					$('.tabslocal').each(function (e) {
						if ($(this).children().length === 0) {
							$(this).parent().detach();
						}
					});
				}
			}
		});
		$("#saved").sortable({
			revert: 100,
			axis: 'y',
			distance: 5,
			containment: 'parent',
			tolerance: 'pointer',
			update: function (e, ui) {
				$.post('https://chrometabcloud.appspot.com/move', { oldIndex: parseInt(ui.item[0].id.substring(4),10), newIndex: $('#saved > fieldset').index($(ui.item[0]))}, function () {
					updateTabs();
				});
			}
		});
	};
	chrome.windows.getAll({populate: true}, function (windows) {
		windows.forEach(function (curWindow) {
			if (getWindowName('winl'+curWindow.id) === undefined)
				setWindowName('winl'+curWindow.id,'Click to name');
			var winString = '<fieldset class="window" id="winl'+curWindow.id+'"><legend class="windowname">'+getWindowName('winl'+curWindow.id)+'</legend><span class="right"><img class="windowclose" src="images/delete.png" title="Close window"><img class="windowsave" src="images/disk.png" title="Save window" /></span><div class="tabs tabslocal">';
			curWindow.tabs.forEach(function (curTab) {
				if (curTab.pinned !== undefined) {
					localStorage.supportPinned = 1;
				}
				var favicon = (curTab.favIconUrl != '' && curTab.favIconUrl !== undefined && curTab.favIconUrl.indexOf("chrome://theme")) ? curTab.favIconUrl : 'chrome://favicon/'+curTab.url;
				winString += '<div style="float: left"><img id="tabimgl'+curTab.id+'" windowid="winl'+curWindow.id+'" class="tabimg tabimglocal" url="'+curTab.url+'" src="'+favicon+'" title="'+curTab.title.replace(/\"/g,"'")+'" /></div>';
			});
			winString += '</div></fieldset>';
			$('#current').append(winString);
		});
		makeSortable();
		updateScroll();
	});

	$('.tabimg').on('mouseup', function (e) {
		if (e.button === 1 || (e.button === 0 && e.ctrlKey === true)) {
			chrome.tabs.create({
				url: $(this).attr('url'),
				selected: false
			});
		}
	});
	
	// Local options
	
	$(document).on('click', '.tabimglocal', function (e) {
		if (e.button === 0 && e.ctrlKey === false) {
			var tabId = $(this).attr('id').substring(7);
			chrome.tabs.update(parseInt(tabId,10), {selected: true});
		}
	});
	
	$(document).on('click', '.windowname', function (e) {
		var windowId = $(this).parent().attr('id');
		$(this).html('<input type="text" class="windowinput" value="'+getWindowName(windowId)+'" />').removeClass('windowname');
		$(this).find('input').focus();
	});
	
	$(document).on('blur', '.windowinput', function (e) {
		var windowId = $(this).parent().parent().attr('id');
		setWindowName(windowId, $(this).val());
		$(this).parent().text(getWindowName(windowId)).addClass('windowname');
		// Remote windows
		if (windowId.substring(3,4) == 'r') {
			var data = TCWindows[windowId.substring(4)];
			data.name = getWindowName(windowId);
			$.post('https://chrometabcloud.appspot.com/update', {window: JSON.stringify(data), windowId: windowId.substring(4)});
		}
	});
	
	$(document).on('keypress', '.windowinput', function (e) {
		if (e.which === 13) {
			$(this).blur();
		} else {
			return true;
		}
		
	})
	
	$(document).on('click', '.windowsave', function (e) {
		var windowId = parseInt($(this).parent().parent().attr('id').substring(4),10);
		var img = this;
		var overwrite = false;
		$.get('https://chrometabcloud.appspot.com/tabcloud', function (data) {
			overwrite = data.windows.some(function(curWindow){return (getWindowName('winl'+windowId)==curWindow.name);});
			if(data.windows.length == 0||overwrite == false){
				saveWindow(img,windowId);	
			} else {
				$(img).parent().html('<span class="confirm">Overwrite: <img class="windowreallyoverwrite" title="Overwrite window" src="images/disk_overwrite.png" /></span>');
			}
		}, 'json');
	});
	
	
	$(document).on('click', '.windowopen', function (e) {
		var windowId = parseInt($(this).parent().parent().attr('id').substring(4),10);
		chrome.extension.sendRequest({tabs: TCWindows[windowId].tabs});
	});
	
	$(document).on('click', '.windowdelete', function (e) {
		if (localStorage.deleteconfirm === 'yes') {
			$(this).parent().html('<span class="confirm">Confirm: <img class="windowreallydelete" title="Delete window" src="images/delete.png" /></span>');
		} else {
			var windowId = parseInt($(this).parent().parent().attr('id').substring(4),10);
			$(this).attr('src','images/arrow_refresh.png');
			var self = this;
			$.post('https://chrometabcloud.appspot.com/remove', {window: windowId}, function () {
				updateTabs();
			});
		}
	});
	
	$(document).on('click', '.windowreallydelete', function (e) {
		var windowId = parseInt($(this).parent().parent().parent().attr('id').substring(4),10);
		$(this).attr('src','images/arrow_refresh.png');
		var self = this;
		$.post('https://chrometabcloud.appspot.com/remove', {window: windowId}, function () {
			updateTabs();
		});
	});

	$(document).on('click', '.windowreallyoverwrite', function (e) {
		var newWindowId = parseInt($(this).parent().parent().parent().attr('id').substring(4),10);
		var oldWindowId = -1;
		var img = this;
		$(img).attr('src','images/arrow_refresh.png');
		$.get('https://chrometabcloud.appspot.com/tabcloud', function (data) {
			var i = 0;
			data.windows.forEach(function(curWindow){
				if(getWindowName('winl'+newWindowId)==curWindow.name){
					oldWindowId = i;
				}
				i++
			});
			$.post('https://chrometabcloud.appspot.com/remove', {window: oldWindowId}, function () {
				$(img).parent().parent().html('<img class="windowclose" src="images/delete.png" title="Close window"><img class="windowsave" src="images/disk.png" title="Save window">');
				saveWindow(img,newWindowId);
			});	
		}, 'json');
	});


	$(document).on('click', '.windowclose', function (e) {
		if (localStorage.deleteconfirm === 'yes') {
			$(this).parent().html('<span class="confirm">Confirm: <img class="windowreallyclose" title="Close window" src="images/delete.png" /></span>');
		} else {
			var windowId = parseInt($(this).parent().parent().attr('id').substring(4),10);
			chrome.windows.remove(windowId);
			$(this).parent().parent().remove()
		}
	});
	
	$(document).on('click', '.windowreallyclose', function (e) {
		var windowId = parseInt($(this).parent().parent().parent().attr('id').substring(4),10);
		chrome.windows.remove(windowId);
		$(this).parent().parent().parent().remove()
	});
	
	var saveWindow = function(img, windowId){
		$(img).attr('src','images/arrow_refresh.png').removeClass('windowsave');
		chrome.tabs.getAllInWindow(windowId, function (tabs) {
			var data = {};
			if (getWindowName('winl'+windowId) == 'Click to name') {
				var date = new Date();
				var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				data.name = months[date.getMonth()]+' '+date.getDate()+', '+date.getFullYear()+' - '+date.toLocaleTimeString();
			} else {
				data.name = getWindowName('winl'+windowId);
			}
			data.tabs = [];
			tabs.forEach(function (tab) {
				data.tabs.push({
					url: tab.url,
					title: tab.title,
					favicon: (tab.favIconUrl != '' && tab.favIconUrl !== undefined) ? tab.favIconUrl : '',
					pinned: (tab.pinned) ? true : false
				});
			});
			$.post('https://chrometabcloud.appspot.com/add', {window: JSON.stringify(data)}, function () { 
				$(img).attr('src','images/accept.png');
				$(img).attr('title','Window saved');
				updateTabs();
				$(img).attr('src','images/disk.png').addClass('windowsave');
			});
		});
	}

	var setInfo = function (info) {
		$('#saved').html('<div class="infobox">'+info+'</div>');
		updateScroll();
	}
	
	var TCWindows = [];
	var updateTabs = function (triedAutoLogin) {
		setInfo('Loading...');
		$.get('https://chrometabcloud.appspot.com/tabcloud', function (data) {
			if (data.status !== undefined) {
				if (data.status == 'loggedin') {
					if (data.windows.length == 0) {
						setInfo('You haven\'t saved any windows yet!');	
					} else {
						$('#saved').html("");
						TCWindows = data.windows;
						var i = 0;
						data.windows.forEach(function (curWindow) {
							setWindowName('winr'+i,curWindow.name);
							var winString = '<fieldset class="window" id="winr'+i+'"><legend class="windowname">'+curWindow.name+'</legend><span class="right"><img class="windowdelete" src="images/delete.png" title="Delete window"><img class="windowopen" src="images/add.png" title="Open window"></span><div class="tabs">';
							var ti = 0;
							curWindow.tabs.forEach(function (curTab) {
								var favicon = (curTab.favicon != '' && curTab.favicon !== undefined && curTab.favicon.indexOf("chrome://theme")) ? curTab.favicon : 'chrome://favicon/'+curTab.url;
								winString += '<div style="float: left"><img id="tabimgr'+(ti++)+'" windowid="winr'+i+'" class="tabimg" src="'+favicon+'" url="'+curTab.url+'" title="'+curTab.title.replace(/\"/g,"'")+'" /></div>';
							});
							winString += '</div></fieldset>';
							$('#saved').append(winString);
							i++;
						});
						makeSortable();
						updateScroll();
					}
				} else {
					if (triedAutoLogin === true) {
						setInfo('Login to load your saved windows. <a target="_blank" href="https://chrometabcloud.appspot.com/login">Login</a>');
					} else {
						setInfo('Attempting automatic login...<iframe style="height: 1px; width: 1px; opacity: 0; position: absolute" src="https://chrometabcloud.appspot.com/login"></iframe>');
						setTimeout(function () {
							updateTabs(true);
						}, 1000);
					}
				}
			} else {
				setInfo('Server error, try again later.');
			}
		}, 'json');
	}
	setTimeout(updateTabs, 0);
	
	// Extra links
	
	$('#optionslink').click(function (e) {
		chrome.tabs.create({
			url: chrome.extension.getURL('options.html')
		});
	});				
	
	$('#logoutlink').click(function (e) {
		chrome.tabs.create({
			url: 'https://chrometabcloud.appspot.com/logout'
		});
	});		
	
	// Tips
	
	$('#tips').innerfade({
		speed: 'slow',
		timeout: 4000,
		type: 'random',
		containerheight: '1em'
	});
	
	var scroll = $('#scrollbar');
	scroll.tinyscrollbar({
		axis: 'y'
	});
	var updateScroll = function () {
		$('.viewport').height(Math.min($('.overview').height(), 350));
		scroll.update();
	}
	updateScroll();
	
	// Show body (hidden to make loading less horrible)
	$('body').css('visibility','visible');
},0)});