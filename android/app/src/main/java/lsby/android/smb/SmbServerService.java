package lsby.android.smb;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class SmbServerService extends Service {
    public static final String ACTION_START = "lsby.android.smb.START";
    public static final String ACTION_STOP = "lsby.android.smb.STOP";
    public static final String EXTRA_CONFIG = "config";
    public static final String EXTRA_ROOT_MODE = "rootMode";
    public static final String EXTRA_PORT = "port";
    private static final String CHANNEL_ID = "smb-server";
    private static final int NOTIFICATION_ID = 445;
    private static final String TAG = "AndroidSmb";
    private static volatile String 状态 = "stopped";
    private static volatile String 状态消息 = "服务器未运行";
    private static volatile boolean 根模式 = false;
    private static volatile int 端口 = 4450;
    private final Object 进程锁 = new Object();
    private final ExecutorService 管理线程 = Executors.newSingleThreadExecutor();
    private volatile Process 服务进程;
    private BufferedWriter 控制管道;

    public static String getState() {
        return 状态;
    }

    public static String getMessage() {
        return 状态消息;
    }

    public static boolean isRootMode() {
        return 根模式;
    }

    public static int getPort() {
        return 端口;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        创建通知频道();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String 动作 = intent == null ? ACTION_STOP : intent.getAction();
        if (动作 == null) {
            动作 = ACTION_STOP;
        }
        switch (动作) {
            case ACTION_START -> {
                String 配置 = intent.getStringExtra(EXTRA_CONFIG);
                boolean 使用根模式 = intent.getBooleanExtra(EXTRA_ROOT_MODE, false);
                int 监听端口 = intent.getIntExtra(EXTRA_PORT, 使用根模式 ? 445 : 4450);
                startForeground(NOTIFICATION_ID, 创建通知("正在启动"));
                管理线程.execute(() -> 启动服务进程(配置, 使用根模式, 监听端口));
            }
            case ACTION_STOP -> {
                状态 = "stopping";
                状态消息 = "正在停止服务器";
                管理线程.execute(() -> {
                    停止服务进程();
                    stopForeground(STOP_FOREGROUND_REMOVE);
                    stopSelf();
                });
            }
            default -> {
                状态 = "error";
                状态消息 = "未知服务动作";
                stopSelf();
            }
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        停止服务进程();
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        停止服务进程();
        管理线程.shutdownNow();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void 创建通知频道() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel 频道 = new NotificationChannel(CHANNEL_ID, "SMB 文件服务器", NotificationManager.IMPORTANCE_LOW);
            频道.setDescription("显示 SMB 文件服务器的运行状态");
            getSystemService(NotificationManager.class).createNotificationChannel(频道);
        }
    }

    private Notification 创建通知(String 内容) {
        Intent 打开应用 = new Intent(this, MainActivity.class);
        PendingIntent 打开应用操作 = PendingIntent.getActivity(this, 0, 打开应用, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Intent 停止服务 = new Intent(this, SmbServerService.class).setAction(ACTION_STOP);
        PendingIntent 停止服务操作 = PendingIntent.getService(this, 1, 停止服务, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Android SMB")
            .setContentText(内容)
            .setContentIntent(打开应用操作)
            .setOngoing(true)
            .addAction(0, "停止", 停止服务操作)
            .build();
    }

    private void 更新通知(String 内容) {
        getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, 创建通知(内容));
    }

    private void 启动服务进程(String 配置, boolean 使用根模式, int 监听端口) {
        synchronized (进程锁) {
            停止服务进程();
            if (配置 == null || 配置.isBlank()) {
                设置错误("缺少服务器配置");
                return;
            }
            try {
                String 二进制路径 = getApplicationInfo().nativeLibraryDir + File.separator + "libandroid_smb_server.so";
                ProcessBuilder 进程构建器;
                if (使用根模式) {
                    进程构建器 = new ProcessBuilder(Arrays.asList("su", "-c", "exec " + shellQuote(二进制路径)));
                } else {
                    进程构建器 = new ProcessBuilder(二进制路径);
                }
                进程构建器.redirectErrorStream(true);
                Process 新进程 = 进程构建器.start();
                BufferedWriter 新控制管道 = new BufferedWriter(new OutputStreamWriter(新进程.getOutputStream(), StandardCharsets.UTF_8));
                新控制管道.write(配置);
                新控制管道.newLine();
                新控制管道.flush();
                服务进程 = 新进程;
                控制管道 = 新控制管道;
                根模式 = 使用根模式;
                端口 = 监听端口;
                状态 = "starting";
                状态消息 = "服务进程已启动，等待监听端口";
                启动日志监视(新进程);
            } catch (IOException 错误) {
                设置错误("启动失败: " + 错误.getMessage());
            }
        }
    }

    private void 启动日志监视(Process 被监视进程) {
        Thread 日志线程 = new Thread(() -> {
            try (BufferedReader 读取器 = new BufferedReader(new InputStreamReader(被监视进程.getInputStream(), StandardCharsets.UTF_8))) {
                String 行;
                while ((行 = 读取器.readLine()) != null) {
                    Log.i(TAG, 行);
                    if (行.contains("SMB server ready")) {
                        状态 = "running";
                        状态消息 = "服务器正在运行";
                        更新通知((根模式 ? "Root" : "非 Root") + " 模式，端口 " + 端口);
                    }
                }
                int 退出代码 = 被监视进程.waitFor();
                synchronized (进程锁) {
                    if (服务进程 == 被监视进程) {
                        服务进程 = null;
                        关闭控制管道();
                        if (状态.equals("stopping")) {
                            状态 = "stopped";
                            状态消息 = "服务器已停止";
                        } else {
                            设置错误("服务进程退出，代码 " + 退出代码);
                        }
                    }
                }
            } catch (IOException 错误) {
                if (服务进程 == 被监视进程) {
                    设置错误("读取服务日志失败: " + 错误.getMessage());
                }
            } catch (InterruptedException 错误) {
                Thread.currentThread().interrupt();
            }
        }, "android-smb-log");
        日志线程.setDaemon(true);
        日志线程.start();
    }

    private void 停止服务进程() {
        synchronized (进程锁) {
            Process 当前进程 = 服务进程;
            关闭控制管道();
            if (当前进程 != null) {
                当前进程.destroy();
                服务进程 = null;
            }
            状态 = "stopped";
            状态消息 = "服务器已停止";
        }
    }

    private void 关闭控制管道() {
        BufferedWriter 当前管道 = 控制管道;
        控制管道 = null;
        if (当前管道 != null) {
            try {
                当前管道.close();
            } catch (IOException 错误) {
                Log.w(TAG, "关闭控制管道失败", 错误);
            }
        }
    }

    private void 设置错误(String 消息) {
        状态 = "error";
        状态消息 = 消息;
        Log.e(TAG, 消息);
        更新通知(消息);
    }

    private static String shellQuote(String 值) {
        return "'" + 值.replace("'", "'\"'\"'") + "'";
    }
}
