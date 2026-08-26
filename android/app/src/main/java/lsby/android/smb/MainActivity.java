package lsby.android.smb;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public final class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmbServerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
