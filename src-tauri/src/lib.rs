mod db;
mod models;
mod commands;
mod auth;
mod http_server;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = db::get_conn().expect("Failed to open database");
    db::run_migrations(&conn).expect("Failed to run migrations");
    drop(conn);

    // Start HTTP server for browser clients (school WiFi)
    http_server::start(http_server::HTTP_PORT);

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            login,
            // Classes
            get_classes,
            create_class,
            // Parents
            get_parents,
            create_parent,
            update_parent,
            // Staff
            get_staff,
            create_staff,
            update_staff,
            // Students
            get_students,
            get_student,
            create_student,
            update_student,
            delete_student,
            // Subjects
            get_subjects,
            create_subject,
            // Results
            get_results,
            upsert_result,
            // Payments
            get_payments,
            create_payment,
            get_payment_summary,
            // Settings
            get_settings,
            upsert_settings,
            // Reports
            get_report_card,
            // Dashboard
            get_dashboard_stats,
            get_top_students,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
