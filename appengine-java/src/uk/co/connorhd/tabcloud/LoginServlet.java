package uk.co.connorhd.tabcloud;

import java.io.IOException;
import javax.servlet.http.*;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class LoginServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		UserService userService = UserServiceFactory.getUserService();
        User user = userService.getCurrentUser();

        if (user != null) {
        	// This is a bit horrible, should probably just redirect to a JSP?
        	resp.setContentType("text/html; charset=utf-8");
            resp.getWriter().println("<html><head><link rel=\"icon\" type=\"image/png\" href=\"images/icon16.png\"><meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\"><title>TabCloud</title></head><body><div style=\"margin: 40px auto; width: 600px;\"><img style=\"float: left; padding-right: 20px;\" src=\"images/tabcloud200.png\" alt=\"TabCloud\" /><div style=\"font-family:sans-serif; font-size: 1.8em; text-align: center; padding-top: 50px;\"><strong>You are now logged in.</strong><br />Click the TabCloud menu icon to access TabCloud.</div></div></body></html>");
        } else {
        	resp.sendRedirect(userService.createLoginURL(req.getRequestURI()));
        }
	}
}
