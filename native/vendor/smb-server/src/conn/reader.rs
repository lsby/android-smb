//! Per-connection frame reader: pulls bytes off the socket, frames them,
//! hands each frame to the dispatcher.

use std::io;
use std::sync::Arc;
use std::time::Instant;

use crate::proto::framing::{FRAME_HEADER_LEN, decode_frame_header};
use tokio::io::{AsyncReadExt, ReadHalf};
use tokio::net::TcpStream;
use tokio::task::JoinSet;
use tracing::{debug, error};

use crate::conn::state::Connection;
use crate::server::ServerState;

/// Upper bound for concurrently-dispatched frames on one SMB connection.
///
/// SMB2 clients use the negotiated credit window to limit outstanding work.
/// This additional server-side cap prevents a single client from exhausting
/// the blocking filesystem pool while still allowing metadata-heavy clients
/// to overlap independent directory requests.
const MAX_IN_FLIGHT_REQUESTS: usize = 8;

/// Read one frame's payload (without the 4-byte length prefix).
///
/// Returns `Ok(None)` on a clean EOF, `Ok(Some(bytes))` on a complete frame,
/// `Err` on partial/garbled data.
pub async fn read_one_frame(reader: &mut ReadHalf<TcpStream>) -> io::Result<Option<Vec<u8>>> {
    let mut hdr = [0u8; FRAME_HEADER_LEN];
    match reader.read_exact(&mut hdr).await {
        Ok(_) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    }
    let len = match decode_frame_header(&hdr) {
        Ok(n) => n,
        Err(e) => {
            return Err(io::Error::new(io::ErrorKind::InvalidData, e.to_string()));
        }
    };
    let mut payload = vec![0u8; len as usize];
    reader.read_exact(&mut payload).await?;
    Ok(Some(payload))
}

async fn join_dispatch_task(tasks: &mut JoinSet<io::Result<()>>) -> io::Result<()> {
    match tasks.join_next().await {
        Some(Ok(result)) => result,
        Some(Err(error)) => Err(io::Error::other(format!("dispatch task failed: {error}"))),
        None => Ok(()),
    }
}

async fn drain_dispatch_tasks(tasks: &mut JoinSet<io::Result<()>>) -> io::Result<()> {
    while !tasks.is_empty() {
        join_dispatch_task(tasks).await?;
    }
    Ok(())
}

/// Continuously read frames and dispatch up to `MAX_IN_FLIGHT_REQUESTS`
/// concurrently. Responses still pass through the connection's single writer
/// task, so socket writes remain serialized while SMB message IDs allow
/// independent responses to complete out of order.
pub async fn reader_task(
    mut reader: ReadHalf<TcpStream>,
    server: Arc<ServerState>,
    conn: Arc<Connection>,
    tx: tokio::sync::mpsc::Sender<crate::conn::writer::FramePayload>,
) -> io::Result<()> {
    let mut dispatch_tasks = JoinSet::new();
    loop {
        while dispatch_tasks.len() >= MAX_IN_FLIGHT_REQUESTS {
            join_dispatch_task(&mut dispatch_tasks).await?;
        }
        while let Some(result) = dispatch_tasks.try_join_next() {
            result
                .map_err(|error| io::Error::other(format!("dispatch task failed: {error}")))??;
        }
        let frame = match read_one_frame(&mut reader).await {
            Ok(Some(b)) => b,
            Ok(None) => {
                debug!("client closed connection");
                drain_dispatch_tasks(&mut dispatch_tasks).await?;
                return Ok(());
            }
            Err(e) => {
                error!(error = %e, "frame read error");
                return Err(e);
            }
        };
        // Check shutdown after every frame.
        if server
            .shutting_down
            .load(std::sync::atomic::Ordering::Acquire)
        {
            debug!("server shutting down; dropping connection");
            drain_dispatch_tasks(&mut dispatch_tasks).await?;
            return Ok(());
        }
        let task_server = Arc::clone(&server);
        let task_conn = Arc::clone(&conn);
        let task_tx = tx.clone();
        let in_flight = dispatch_tasks.len() + 1;
        dispatch_tasks.spawn(async move {
            let started = Instant::now();
            let response = crate::dispatch::dispatch_frame(&task_server, &task_conn, &frame).await;
            debug!(
                elapsed_us = started.elapsed().as_micros(),
                in_flight, "dispatch complete"
            );
            if let Some(bytes) = response {
                task_tx.send(bytes).await.map_err(|_| {
                    io::Error::new(io::ErrorKind::BrokenPipe, "writer channel closed")
                })?;
            }
            Ok(())
        });
    }
}
