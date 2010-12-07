package uk.co.connorhd.tabcloud;

import java.io.IOException;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class UpdateServlet extends HttpServlet {
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
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
				tcUser.updateWindow(Integer.parseInt(req.getParameter("windowId")), req.getParameter("window"));
				try {
					pm.makePersistent(tcUser);
				} finally {
					pm.close();
				}
			} catch (Exception e) {
				pm.close();
			}
            resp.setContentType("text/plain; charset=utf-8");
            resp.getWriter().println("{\"status\": \"loggedin\"}");
        } else {
        	resp.setContentType("text/json; charset=utf-8");
            resp.getWriter().println("{\"status\": \"loggedout\"}");
        }
	}
}
