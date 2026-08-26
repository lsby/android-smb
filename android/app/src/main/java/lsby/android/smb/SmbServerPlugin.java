package lsby.android.smb;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "SmbServer")
public final class SmbServerPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        boolean 根模式 = Boolean.TRUE.equals(call.getBoolean("rootMode", false));
        String 用户名 = call.getString("username", "android-smb");
        String 密码 = call.getString("password", "android-smb");
        if (用户名 == null || 用户名.isBlank() || 密码 == null || 密码.isBlank()) {
            call.reject("用户名和密码不能为空");
            return;
        }
        if (!根模式 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            call.reject("非 Root 模式需要所有文件访问权限");
            return;
        }
        int 端口 = call.getInt("port", 根模式 ? 445 : 4450);
        if (端口 < 1 || 端口 > 65535) {
            call.reject("端口必须在 1–65535 之间");
            return;
        }
        if (!根模式 && 端口 < 1024) {
            call.reject("1–1023 端口需要先启用 Root 模式");
            return;
        }
        try {
            JSONArray 共享列表 = call.getArray("shares", 默认共享列表());
            验证共享列表(共享列表, 根模式);
            JSONObject 配置 = new JSONObject();
            配置.put("port", 端口);
            配置.put("username", 用户名);
            配置.put("password", 密码);
            配置.put("shares", 共享列表);
            Intent 服务意图 = new Intent(getContext(), SmbServerService.class)
                .setAction(SmbServerService.ACTION_START)
                .putExtra(SmbServerService.EXTRA_CONFIG, 配置.toString())
                .putExtra(SmbServerService.EXTRA_ROOT_MODE, 根模式)
                .putExtra(SmbServerService.EXTRA_PORT, 端口);
            ContextCompat.startForegroundService(getContext(), 服务意图);
            JSObject 结果 = 获取状态结果();
            结果.put("state", "starting");
            结果.put("message", "启动请求已提交");
            结果.put("rootMode", 根模式);
            结果.put("port", 端口);
            call.resolve(结果);
        } catch (JSONException 错误) {
            call.reject("共享配置无效", 错误);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent 服务意图 = new Intent(getContext(), SmbServerService.class).setAction(SmbServerService.ACTION_STOP);
        getContext().startService(服务意图);
        JSObject 结果 = 获取状态结果();
        结果.put("state", "stopping");
        结果.put("message", "停止请求已提交");
        call.resolve(结果);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(获取状态结果());
    }

    @PluginMethod
    public void openAllFilesAccessSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Intent 设置意图 = new Intent(
                Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivity(设置意图);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 445);
        }
        call.resolve();
    }

    @PluginMethod
    public void getStorageRoots(PluginCall call) {
        JSArray 根目录列表 = new JSArray();
        String 主存储 = Environment.getExternalStorageDirectory().getAbsolutePath();
        根目录列表.put(创建存储项("internal", "内部存储根", 主存储, "readWrite", false, false));
        Set<String> 已添加路径 = new HashSet<>();
        已添加路径.add(主存储);
        File[] 应用目录列表 = getContext().getExternalFilesDirs(null);
        for (File 应用目录 : 应用目录列表) {
            File 存储根目录 = 获得存储根目录(应用目录);
            if (存储根目录 == null || !已添加路径.add(存储根目录.getAbsolutePath())) {
                continue;
            }
            根目录列表.put(创建存储项("sd-" + 根目录列表.length(), "SD 卡根", 存储根目录.getAbsolutePath(), "readWrite", true, false));
        }
        根目录列表.put(创建存储项("system", "系统根", File.separator, "read", false, true));
        JSObject 结果 = new JSObject();
        结果.put("roots", 根目录列表);
        call.resolve(结果);
    }

    private JSObject 获取状态结果() {
        JSObject 结果 = new JSObject();
        结果.put("state", SmbServerService.getState());
        结果.put("message", SmbServerService.getMessage());
        结果.put("rootMode", SmbServerService.isRootMode());
        结果.put("port", SmbServerService.getPort());
        结果.put("ipAddress", 查找局域网地址());
        结果.put("allFilesAccess", Build.VERSION.SDK_INT < Build.VERSION_CODES.R || Environment.isExternalStorageManager());
        return 结果;
    }

    private static JSArray 默认共享列表() throws JSONException {
        JSArray 共享列表 = new JSArray();
        String 主存储 = Environment.getExternalStorageDirectory().getAbsolutePath();
        共享列表.put(创建共享项("internal", 主存储, "readWrite"));
        return 共享列表;
    }

    private static JSONObject 创建共享项(String 名称, String 路径, String 权限) throws JSONException {
        JSONObject 共享 = new JSONObject();
        共享.put("name", 名称);
        共享.put("path", 路径);
        共享.put("access", 权限);
        return 共享;
    }

    private static JSObject 创建存储项(String 名称, String 标签, String 路径, String 权限, boolean 可移除, boolean 需要Root) {
        JSObject 存储项 = new JSObject();
        存储项.put("name", 名称);
        存储项.put("label", 标签);
        存储项.put("path", 路径);
        存储项.put("access", 权限);
        存储项.put("removable", 可移除);
        存储项.put("requiresRoot", 需要Root);
        return 存储项;
    }

    private static void 验证共享列表(JSONArray 共享列表, boolean 根模式) throws JSONException {
        if (共享列表.length() == 0) {
            throw new JSONException("至少需要一个共享目录");
        }
        String 主存储路径 = Environment.getExternalStorageDirectory().getAbsolutePath();
        Set<String> 名称列表 = new HashSet<>();
        for (int 索引 = 0; 索引 < 共享列表.length(); 索引 += 1) {
            JSONObject 共享 = 共享列表.getJSONObject(索引);
            String 名称 = 共享.getString("name");
            String 路径 = 共享.getString("path");
            String 权限 = 共享.getString("access");
            if (名称.isBlank() || !名称列表.add(名称.toLowerCase())) {
                throw new JSONException("共享名称为空或重复");
            }
            if (!new File(路径).isAbsolute()) {
                throw new JSONException("共享路径必须是绝对路径");
            }
            if (路径.equals(主存储路径) && !权限.equals("readWrite")) {
                throw new JSONException("内部存储根必须使用读写权限");
            }
            if (路径.equals(File.separator) && !权限.equals("read")) {
                throw new JSONException("系统根只允许只读共享");
            }
            if (路径.equals(File.separator) && !根模式) {
                throw new JSONException("系统根需要先启用 Root 模式");
            }
            switch (权限) {
                case "read", "readWrite" -> {}
                default -> throw new JSONException("共享权限无效");
            }
        }
    }

    private static File 获得存储根目录(File 应用目录) {
        File 当前目录 = 应用目录;
        for (int 层级 = 0; 层级 < 4 && 当前目录 != null; 层级 += 1) {
            当前目录 = 当前目录.getParentFile();
        }
        return 当前目录;
    }

    private static String 查找局域网地址() {
        try {
            for (NetworkInterface 网络接口 : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!网络接口.isUp() || 网络接口.isLoopback()) {
                    continue;
                }
                for (InetAddress 地址 : Collections.list(网络接口.getInetAddresses())) {
                    if (地址 instanceof Inet4Address && 地址.isSiteLocalAddress()) {
                        return 地址.getHostAddress();
                    }
                }
            }
        } catch (SocketException ignored) {}
        return "";
    }
}
