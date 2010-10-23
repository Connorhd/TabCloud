<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>
<%@ page import="javax.jdo.PersistenceManager" %>
<%@ page import="com.google.appengine.api.datastore.Key" %>
<%@ page import="com.google.appengine.api.datastore.KeyFactory" %>
<%@ page import="com.google.appengine.api.datastore.Text" %>
<%@ page import="uk.co.connorhd.tabcloud.PMF" %>
<%@ page import="uk.co.connorhd.tabcloud.TCUser" %>

<html>
	<head>
		<link rel="icon" type="image/png" href="images/icon16.png">
		<meta http-equiv="content-type" content="text/html; charset=UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
		<title>TabCloud</title>
		<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
		<style>
			* {
				margin: 0;
				padding: 0;
			}
			p { 
				margin: 5px 0;
			}
			body {
				width: 300px;
				font-size: 0.9em;
				font-family: sans-serif;
				margin: 0 auto;
			}
			.window {
				border: 1px solid #ccc;
				border-radius: 5px;
				margin: 5px;
				padding: 8px;
				overflow: hidden;
				word-wrap: break-word;
				word-break: break-all;
			}
			.window legend {
				padding: 0 2px;
				background-color: white;
			}
			
			img {
				vertical-align: middle;
			}
			
			a:link, a:visited, a:hover, a:active {
				color: #041453
			}
		</style>
	</head>
	
	<body>
		<img style="float: left; padding: 0 50px;" src="images/tabcloud200.png" alt="TabCloud" />
		<div style="text-align: center; padding-bottom: 10px;">
<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user != null) {
		PersistenceManager pm = PMF.get().getPersistenceManager();
		TCUser tcUser;
		try {
			// Get user
			Key k = KeyFactory.createKey(TCUser.class.getSimpleName(), user.getEmail());
			tcUser = pm.getObjectById(TCUser.class, k);

		} catch (Exception e) {
			// New user
			tcUser = new TCUser(user);
			try {
				pm.makePersistent(tcUser);
			} finally {
				
			}
		}
		String windowString = "";
		for (Text text : tcUser.getWindows()) {
			windowString += text.getValue()+",";
		}
		if (windowString != "")
			windowString = windowString.substring(0, windowString.length()-1);
		pm.close();
%>
<script type="text/javascript">
	$(function () {
		var showTabs = function (windows) {
			var output = '';
			$.each(windows, function (i, curWindow) {
				output += '<fieldset class="window"><legend>'+curWindow.name+'</legend>';
				$.each(curWindow.tabs, function (i, curTab) {
					output += '<p><a href="'+curTab.url+'"><img src="'+((curTab.favicon != undefined && curTab.favicon != '') ? curTab.favicon : 'images/page_white.png')+'" title="'+curTab.title+'" style="height: 16px; width: 16px"></a> <a href="'+curTab.url+'">'+curTab.title+'</a></p>';
				});
				output += '</fieldset>';
			});
			if (output == '') {
				output += 'No saved tabs, do you have the <a href="https://chrome.google.com/extensions/detail/npecfdijgoblfcgagoijgmgejmcpnhof">Chrome extension</a>?';
			}
			$('#windows').html(output);
		};	
		showTabs(<%= "["+windowString+"]" %>)
	});
</script>
<p>Welcome, <%= user.getNickname() %>! (<a href="<%= userService.createLogoutURL(request.getRequestURI()) %>">Logout</a>)</p>
<%
    } else {
%>
<p>Welcome!
<a href="<%= userService.createLoginURL(request.getRequestURI()) %>">Login</a>
to view your saved tabs.</p>
<%
    }
%>
		</div>
		<div id="windows"></div>
	</body>

</html>
