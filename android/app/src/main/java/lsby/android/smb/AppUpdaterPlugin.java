package lsby.android.smb;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdater")
public final class AppUpdaterPlugin extends Plugin {
    private final ExecutorService 下载线程 = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getCurrentVersion(PluginCall call) {
        try {
            PackageInfo 包信息 = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject 结果 = new JSObject();
            结果.put("versionName", 包信息.versionName == null ? "" : 包信息.versionName);
            结果.put(
                "versionCode",
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? 包信息.getLongVersionCode() : 包信息.versionCode
            );
            call.resolve(结果);
        } catch (PackageManager.NameNotFoundException 错误) {
            call.reject("无法读取当前应用版本", 错误);
        }
    }

    @PluginMethod
    public void canRequestInstall(PluginCall call) {
        JSObject 结果 = new JSObject();
        结果.put(
            "allowed",
            Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getContext().getPackageManager().canRequestPackageInstalls()
        );
        call.resolve(结果);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent 设置意图 = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivity(设置意图);
        }
        call.resolve();
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String 下载地址 = call.getString("url");
        String 预期摘要 = call.getString("sha256", "");
        if (下载地址 == null || !下载地址.startsWith("https://github.com/")) {
            call.reject("更新地址不是受信任的 GitHub 下载地址");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("请先允许此应用安装未知应用");
            return;
        }
        if (预期摘要 == null || (!预期摘要.isEmpty() && !预期摘要.matches("[0-9a-fA-F]{64}"))) {
            call.reject("更新文件摘要格式无效");
            return;
        }
        下载线程.execute(() -> 下载并安装(call, 下载地址, 预期摘要));
    }

    @Override
    protected void handleOnDestroy() {
        下载线程.shutdownNow();
        super.handleOnDestroy();
    }

    private void 下载并安装(PluginCall call, String 下载地址, String 预期摘要) {
        File 下载目录 = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (下载目录 == null) {
            call.reject("无法访问应用下载目录");
            return;
        }
        File 临时文件 = new File(下载目录, "android-smb-update.apk.part");
        File 更新文件 = new File(下载目录, "android-smb-update.apk");
        HttpURLConnection 连接 = null;
        try {
            if (!下载目录.exists() && !下载目录.mkdirs()) {
                throw new IOException("无法创建应用下载目录");
            }
            连接 = (HttpURLConnection) new URL(下载地址).openConnection();
            连接.setConnectTimeout(15000);
            连接.setReadTimeout(30000);
            连接.setRequestProperty("Accept", "application/octet-stream");
            连接.setRequestProperty("User-Agent", "android-smb-updater");
            连接.connect();
            int 响应状态 = 连接.getResponseCode();
            if (响应状态 < 200 || 响应状态 >= 300) {
                throw new IOException("下载请求失败，HTTP " + 响应状态);
            }
            long 总字节数 = 连接.getContentLengthLong();
            MessageDigest 摘要器 = MessageDigest.getInstance("SHA-256");
            long 已下载字节数 = 0;
            int 上次进度 = -1;
            try (
                BufferedInputStream 输入流 = new BufferedInputStream(连接.getInputStream());
                FileOutputStream 输出流 = new FileOutputStream(临时文件)
            ) {
                byte[] 缓冲区 = new byte[65536];
                int 本次字节数;
                while ((本次字节数 = 输入流.read(缓冲区)) != -1) {
                    if (Thread.currentThread().isInterrupted()) {
                        throw new IOException("更新下载已取消");
                    }
                    输出流.write(缓冲区, 0, 本次字节数);
                    摘要器.update(缓冲区, 0, 本次字节数);
                    已下载字节数 += 本次字节数;
                    int 当前进度 = 总字节数 > 0 ? (int) Math.min(100, 已下载字节数 * 100 / 总字节数) : -1;
                    if (当前进度 != 上次进度) {
                        通知下载进度(已下载字节数, 总字节数, 当前进度);
                        上次进度 = 当前进度;
                    }
                }
            }
            String 实际摘要 = 转换十六进制(摘要器.digest());
            if (!预期摘要.isEmpty() && !实际摘要.equalsIgnoreCase(预期摘要)) {
                throw new IOException("APK 完整性校验失败");
            }
            if (更新文件.exists() && !更新文件.delete()) {
                throw new IOException("无法替换旧的更新文件");
            }
            if (!临时文件.renameTo(更新文件)) {
                throw new IOException("无法准备更新文件");
            }
            File 最终更新文件 = 更新文件;
            getActivity().runOnUiThread(() -> 打开安装程序(call, 最终更新文件));
        } catch (IOException | NoSuchAlgorithmException 错误) {
            if (临时文件.exists()) {
                临时文件.delete();
            }
            call.reject(错误.getMessage(), 错误);
        } finally {
            if (连接 != null) {
                连接.disconnect();
            }
        }
    }

    private void 通知下载进度(long 已下载字节数, long 总字节数, int 百分比) {
        JSObject 进度 = new JSObject();
        进度.put("downloadedBytes", 已下载字节数);
        进度.put("totalBytes", 总字节数);
        进度.put("percent", 百分比);
        notifyListeners("downloadProgress", 进度);
    }

    private void 打开安装程序(PluginCall call, File 更新文件) {
        try {
            Uri 文件地址 = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                更新文件
            );
            Intent 安装意图 = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(文件地址, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(安装意图);
            call.resolve();
        } catch (IllegalArgumentException 错误) {
            call.reject("无法打开下载的 APK", 错误);
        }
    }

    private static String 转换十六进制(byte[] 数据) {
        StringBuilder 结果 = new StringBuilder(数据.length * 2);
        for (byte 值 : 数据) {
            结果.append(String.format(Locale.ROOT, "%02x", 值 & 0xff));
        }
        return 结果.toString();
    }
}
