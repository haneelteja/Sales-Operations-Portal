use tauri::Manager;

// ── Tauri commands exposed to the JS layer ────────────────────────────────────

/// Returns the current platform name: "windows" | "macos" | "linux"
#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

/// Returns the current app version from Cargo.toml / tauri.conf.json
#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

/// Show the main window once the frontend signals it's ready (avoids white flash).
#[tauri::command]
fn show_main_window(window: tauri::WebviewWindow) {
    window.show().unwrap();
    window.set_focus().unwrap();
}

// ── Application entry point ───────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Enforce single-instance: second launch focuses existing window instead of opening new one.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // The window starts hidden (`"visible": false` in tauri.conf.json).
            // The frontend calls `show_main_window` when it's ready to render,
            // preventing a blank white flash on startup.
            let _ = app; // suppress unused warning in debug
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform,
            get_app_version,
            show_main_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aamodha Operations Portal");
}
