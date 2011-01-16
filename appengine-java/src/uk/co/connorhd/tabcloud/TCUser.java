package uk.co.connorhd.tabcloud;

import java.util.Vector;

import javax.jdo.annotations.Extension;
import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.users.User;

@PersistenceCapable
public class TCUser {
	@SuppressWarnings("unused")
	@PrimaryKey
    @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
    @Extension(vendorName="datanucleus", key="gae.encoded-pk", value="true")
    private String encodedKey;
	
	@Persistent
    private Vector<Text> window;
    
    public TCUser(User user) {
    	this.encodedKey = KeyFactory.keyToString(KeyFactory.createKey(TCUser.class.getSimpleName(), user.getEmail()));
    	this.window = new Vector<Text>();
    }
    
    public Vector<Text> getWindows() {
    	return this.window;
    }
    
    public void addWindow(String str) {
    	this.window.add(0, new Text(str));
    }
    
    public void updateWindow(int index, String str) {
    	this.window.remove(index);
    	this.window.add(index, new Text(str));
    }
    
    public void removeWindow(int index) {
    	this.window.remove(index);
    }
    
    public void moveWindow(int oldIndex, int newIndex) {
    	this.window.add(newIndex, this.window.remove(oldIndex));
    }
}
