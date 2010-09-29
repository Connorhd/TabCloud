package uk.co.connorhd.android.tabcloud;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

public class TabCloud extends Activity {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("http://chrometabcloud.appspot.com/tabs.jsp")));
		this.finish();
    }
}