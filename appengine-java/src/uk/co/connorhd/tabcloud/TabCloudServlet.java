package uk.co.connorhd.tabcloud;

import java.io.IOException;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class TabCloudServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
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
            resp.setContentType("text/plain");
            resp.getWriter().println("{\"status\": \"loggedin\", \"windows\": ["+windowString+"]}");
        } else {
        	resp.setContentType("text/json");
            resp.getWriter().println("{\"status\": \"loggedout\"}");
        }
	}
}
