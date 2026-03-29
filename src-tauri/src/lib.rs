// src-tauri/src/lib.rs
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri::Listener;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // In production builds, start the bundled Node.js server
            #[cfg(not(debug_assertions))]
            start_nextjs_server(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(debug_assertions))]
fn start_nextjs_server(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use std::process::Command;

    let resource_dir = app
        .path()
        .resource_dir()
        .expect("could not get resource dir");

    // Path to the bundled Node binary (copied in via externalBin)
    let node_bin = resource_dir.join("binaries").join(if cfg!(target_os = "windows") {
        "node.exe"
    } else {
        "node"
    });

    // Path to the server entry script
    let server_script = resource_dir.join("server").join("index.js");

    log::info!("Starting Next.js server...");
    log::info!("  node: {}", node_bin.display());
    log::info!("  script: {}", server_script.display());

    // Set NODE_PATH so `require('next')` resolves from the bundled node_modules
    let node_modules = resource_dir.join("node_modules");

    let child = Command::new(&node_bin)
        .arg(&server_script)
        .env("NODE_PATH", &node_modules)
        .env("NODE_ENV", "production")
        // Tell Next.js / better-sqlite3 where to find the db
        .env(
            "DB_PATH",
            resource_dir.join("school.db").to_string_lossy().to_string(),
        )
        .spawn()?;

        std::thread::sleep(std::time::Duration::from_secs(3));

    let child_arc = Arc::new(Mutex::new(Some(child)));
    let child_clone = child_arc.clone();

    app.handle().listen("tauri://window-destroyed", move |_| {
        if let Ok(mut guard) = child_clone.lock() {
            if let Some(mut c) = guard.take() {
                let _ = c.kill();
                log::info!("Next.js server stopped.");
            }
        }
    });

    Ok(())
}