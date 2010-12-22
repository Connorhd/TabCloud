package uk.co.connorhd.tabcloud;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import com.google.appengine.api.channel.ChannelFailureException;
import com.google.appengine.api.channel.ChannelMessage;
import com.google.appengine.api.channel.ChannelService;
import com.google.appengine.api.channel.ChannelServiceFactory;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Set;

import net.sf.jsr107cache.Cache;
import net.sf.jsr107cache.CacheException;
import net.sf.jsr107cache.CacheManager;

@SuppressWarnings("serial")
public class TestServlet extends HttpServlet {
	@SuppressWarnings("unchecked")
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		
		Cache cache;
		
		try {
		    cache = CacheManager.getInstance().getCacheFactory().createCache(Collections.emptyMap());
		    
			UserService userService = UserServiceFactory.getUserService();
	        User user = userService.getCurrentUser();
	        
	        if (user != null) {
				String key = user.getUserId()+"test";
				HashMap<String, Long> channels = (HashMap<String, Long>) cache.get(key);
				
				if (channels == null) {
					channels = new HashMap<String, Long>();
				}
				
				// Create starting timestamp
				Long currentTime = new Date().getTime();

				// Create a channel
				ChannelService channelService = ChannelServiceFactory.getChannelService();
				String channelKey = key+String.valueOf(currentTime);
				String token = channelService.createChannel(channelKey);
				
				// Save channel
				channels.put(channelKey, currentTime);
				Set<String> channelKeys = ((HashMap<String, Long>) channels.clone()).keySet();

				// Remove expired channels
				for (String curChannel : channelKeys) {
					if ((currentTime - channels.get(curChannel)) > new Long(7200000)) { 
						channels.remove(curChannel);
					} else if (!channelKey.equals(curChannel)) {
						try {
							ChannelMessage msg = new ChannelMessage(curChannel, "Hello"+key+String.valueOf(currentTime));
							channelService.sendMessage(msg);
						} catch (ChannelFailureException e) {
							// Delete dead channel
							channels.remove(curChannel);
						}
					}
				}
				
				// Save current users channels
				cache.put(key, channels);
				
				resp.setContentType("text/html; charset=utf-8");
				resp.getWriter().println("<html><head><script src='/_ah/channel/jsapi'></script></head><body><script>channel = new goog.appengine.Channel('"+token+"'); socket = channel.open(); socket.onopen = function () { console.log('open'); }; socket.onclose = function () { console.log('close'); }; socket.onerror = function (error) { console.log(error); }; socket.onmessage = function (data) { console.log(data) };</script></body></html>");				
	        } else {
	        	resp.setContentType("text/json; charset=utf-8");
	            resp.getWriter().println("{\"status\": \"loggedout\"}");
	        }
		} catch (CacheException e) {
		}
		

	}
}
