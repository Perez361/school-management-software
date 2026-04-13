mod db;
mod models;
mod commands;
mod auth;
mod http_server;
pub(crate) mod sync;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = db::get_conn().expect("Failed to open database");
    db::run_migrations(&conn).expect("Failed to run migrations");
    drop(conn);

    // Start HTTP server for browser clients (school WiFi)
    http_server::start(http_server::HTTP_PORT);

    // Start background sync engine
    sync::start_sync_engine();

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
            check_setup,
            setup_admin,
            login,
            // Classes
            get_classes,
            create_class,
            delete_class,
            // Parents
            get_parents,
            create_parent,
            update_parent,
            delete_parent,
            // Staff
            get_staff,
            create_staff,
            update_staff,
            delete_staff,
            // Students
            get_students,
            get_student,
            create_student,
            update_student,
            delete_student,
            // Subjects
            get_subjects,
            create_subject,
            update_subject,
            delete_subject,
            // Results
            get_results,
            upsert_result,
            // Cumulative Assessments
            get_ca_scores,
            get_ca_entries,
            add_ca_entry,
            batch_add_ca_entries,
            delete_ca_entry,
            // Payments
            get_payments,
            create_payment,
            get_payment_summary,
            // Settings
            get_settings,
            upsert_settings,
            // Promotion
            promote_class,
            // Reports
            get_report_card,
            // Dashboard
            get_dashboard_stats,
            get_top_students,
            get_gender_stats,
            get_fee_by_class,
            get_enrolment_by_class,
            // User management
            get_users,
            create_user,
            update_user,
            delete_user,
            change_user_password,
            // Attendance
            record_attendance,
            get_attendance,
            get_attendance_summary,
            get_class_attendance_summary,
            // Notifications
            get_notifications,
            // Sync
            get_sync_status,
            trigger_sync,
            save_sync_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
