use std::error::Error;
use std::io::{self, BufRead, Read};
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::path::Path;

use serde::Deserialize;
use smb_server::{Access, LocalFsBackend, Share, SmbServer};
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

type 应用结果<T> = Result<T, Box<dyn Error>>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct 服务配置 {
    port: u16,
    username: String,
    password: String,
    shares: Vec<共享配置>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct 共享配置 {
    name: String,
    path: String,
    access: 共享权限,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
enum 共享权限 {
    Read,
    ReadWrite,
}

fn 读取配置() -> 应用结果<服务配置> {
    let mut 配置文本 = String::new();
    if io::stdin().lock().read_line(&mut 配置文本)? == 0 {
        return Err("stdin closed before configuration was received".into());
    }
    Ok(serde_json::from_str::<服务配置>(&配置文本)?)
}

fn 等待标准输入关闭() -> io::Result<()> {
    let mut 缓冲区 = [0_u8; 64];
    while io::stdin().lock().read(&mut 缓冲区)? > 0 {}
    Ok(())
}

fn 转换权限(权限: 共享权限) -> Access {
    match 权限 {
        共享权限::Read => Access::Read,
        共享权限::ReadWrite => Access::ReadWrite,
    }
}

#[tokio::main]
async fn main() -> 应用结果<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .with_target(false)
        .init();

    let 配置 = 读取配置()?;
    if 配置.shares.is_empty() {
        return Err("at least one share is required".into());
    }
    let 监听地址 = SocketAddr::new(IpAddr::V4(Ipv4Addr::UNSPECIFIED), 配置.port);
    let mut 构建器 = SmbServer::builder()
        .listen(监听地址)
        .netbios_name("ANDROID-SMB")
        .user(&配置.username, &配置.password);
    for 共享 in 配置.shares {
        if Path::new(&共享.path).is_dir() {
            let 权限 = 转换权限(共享.access);
            构建器 = 构建器.share(
                Share::new(&共享.name, LocalFsBackend::new(Path::new(&共享.path))?)
                    .user(&配置.username, 权限),
            );
        } else {
            warn!(share = %共享.name, path = %共享.path, "share path does not exist");
        }
    }

    let 服务器 = 构建器.build()?;
    let 停止句柄 = 服务器.shutdown_handle();
    let 实际地址 = 服务器.bind().await?;
    info!(listen = %实际地址, user = %配置.username, "SMB server ready");

    let mut 服务任务 = tokio::spawn(服务器.serve());
    let 标准输入监视任务 = tokio::task::spawn_blocking(等待标准输入关闭);
    tokio::select! {
        信号结果 = tokio::signal::ctrl_c() => {
            信号结果?;
            info!("shutdown signal received");
        }
        监视结果 = 标准输入监视任务 => {
            监视结果??;
            info!("controller pipe closed");
        }
        服务结果 = &mut 服务任务 => {
            服务结果??;
            return Ok(());
        }
    }
    停止句柄.shutdown();
    服务任务.await??;
    Ok(())
}
