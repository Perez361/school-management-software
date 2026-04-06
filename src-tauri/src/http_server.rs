use axum::{
    extract::Request,
    http::{header, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use serde::Deserialize;
use tower_http::cors::{Any, CorsLayer};

use crate::auth::{create_token, validate_token};
use crate::commands::*;
use crate::models::*;

pub const HTTP_PORT: u16 = 7770;

// ─── Auth middleware ──────────────────────────────────────────────────────────

async fn require_auth(req: Request, next: Next) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    match token {
        Some(t) => match validate_token(t) {
            Ok(_) => Ok(next.run(req).await),
            Err(_) => Err(StatusCode::UNAUTHORIZED),
        },
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

// ─── Login endpoint ───────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct LoginBody {
    input: LoginInput,
}

#[derive(serde::Serialize)]
struct LoginResponse {
    user: User,
    token: String,
}

async fn handle_login(Json(body): Json<LoginBody>) -> Result<Json<LoginResponse>, (StatusCode, String)> {
    let user = login(body.input).map_err(|e| (StatusCode::UNAUTHORIZED, e))?;
    let token = create_token(user.id, &user.email, &user.role)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(LoginResponse { user, token }))
}

// ─── Setup endpoints (public — no auth required) ─────────────────────────────

async fn h_check_setup() -> Result<impl IntoResponse, (StatusCode, String)> {
    check_setup().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)]
struct SetupAdminBody { input: CreateUserInput }

async fn h_setup_admin(Json(body): Json<SetupAdminBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    setup_admin(body.input).map(|v| Json(v)).map_err(|e| (StatusCode::BAD_REQUEST, e))
}

// ─── Per-route handler functions ─────────────────────────────────────────────

// Classes
async fn h_get_classes() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_classes().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateClassBody { input: CreateClassInput }
async fn h_create_class(Json(b): Json<CreateClassBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_class(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)]
struct DeleteClassBody { id: i64 }

async fn h_delete_class(Json(b): Json<DeleteClassBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_class(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::BAD_REQUEST, e))
}

// Parents
async fn h_get_parents() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_parents().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateParentBody { input: CreateParentInput }
async fn h_create_parent(Json(b): Json<CreateParentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_parent(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpdateParentBody { id: i64, input: UpdateParentInput }
async fn h_update_parent(Json(b): Json<UpdateParentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    update_parent(b.id, b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct DeleteParentBody { id: i64 }
async fn h_delete_parent(Json(b): Json<DeleteParentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_parent(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Staff
async fn h_get_staff() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_staff().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateStaffBody { input: CreateStaffInput }
async fn h_create_staff(Json(b): Json<CreateStaffBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_staff(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpdateStaffBody { id: i64, input: UpdateStaffInput }
async fn h_update_staff(Json(b): Json<UpdateStaffBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    update_staff(b.id, b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct DeleteStaffBody { id: i64 }
async fn h_delete_staff(Json(b): Json<DeleteStaffBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_staff(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Students
#[derive(Deserialize)] struct GetStudentsBody { #[serde(rename = "classId")] class_id: Option<i64>, q: Option<String> }
async fn h_get_students(Json(b): Json<GetStudentsBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_students(b.class_id, b.q).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct GetStudentBody { id: i64 }
async fn h_get_student(Json(b): Json<GetStudentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_student(b.id).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateStudentBody { input: CreateStudentInput }
async fn h_create_student(Json(b): Json<CreateStudentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_student(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpdateStudentBody { id: i64, input: UpdateStudentInput }
async fn h_update_student(Json(b): Json<UpdateStudentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    update_student(b.id, b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct DeleteStudentBody { id: i64 }
async fn h_delete_student(Json(b): Json<DeleteStudentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_student(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Subjects
async fn h_get_subjects() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_subjects().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateSubjectBody { input: CreateSubjectInput }
async fn h_create_subject(Json(b): Json<CreateSubjectBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_subject(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Results
#[derive(Deserialize)] struct GetResultsBody {
    #[serde(rename = "classId")] class_id: Option<i64>,
    term: Option<String>,
    year: Option<String>,
    #[serde(rename = "studentId")] student_id: Option<i64>,
}
async fn h_get_results(Json(b): Json<GetResultsBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_results(b.class_id, b.term, b.year, b.student_id).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpsertResultBody { input: CreateResultInput }
async fn h_upsert_result(Json(b): Json<UpsertResultBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    upsert_result(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Cumulative Assessments
#[derive(Deserialize)] struct GetCAScoresBody {
    #[serde(rename = "classId")]  class_id:   Option<i64>,
    #[serde(rename = "subjectId")] subject_id: Option<i64>,
    term: Option<String>,
    year: Option<String>,
}
async fn h_get_ca_scores(Json(b): Json<GetCAScoresBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_ca_scores(b.class_id, b.subject_id, b.term, b.year).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct GetCAEntriesBody {
    #[serde(rename = "classId")]   class_id:   Option<i64>,
    #[serde(rename = "subjectId")] subject_id: Option<i64>,
    term: Option<String>,
    year: Option<String>,
}
async fn h_get_ca_entries(Json(b): Json<GetCAEntriesBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_ca_entries(b.class_id, b.subject_id, b.term, b.year).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct AddCAEntryBody { input: AddCAEntryInput }
async fn h_add_ca_entry(Json(b): Json<AddCAEntryBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    add_ca_entry(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct BatchAddCABody { input: BatchAddCAInput }
async fn h_batch_add_ca_entries(Json(b): Json<BatchAddCABody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    batch_add_ca_entries(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct DeleteCAEntryBody { id: i64 }
async fn h_delete_ca_entry(Json(b): Json<DeleteCAEntryBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_ca_entry(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Payments
#[derive(Deserialize)] struct GetPaymentsBody {
    #[serde(rename = "classId")] class_id: Option<i64>,
    term: Option<String>,
    status: Option<String>,
}
async fn h_get_payments(Json(b): Json<GetPaymentsBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_payments(b.class_id, b.term, b.status).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreatePaymentBody { input: CreatePaymentInput }
async fn h_create_payment(Json(b): Json<CreatePaymentBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_payment(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct GetPaymentSummaryBody {
    #[serde(rename = "classId")] class_id: Option<i64>,
    term: Option<String>,
}
async fn h_get_payment_summary(Json(b): Json<GetPaymentSummaryBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_payment_summary(b.class_id, b.term).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Settings
async fn h_get_settings() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_settings().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpsertSettingsBody { input: UpsertSettingsInput }
async fn h_upsert_settings(Json(b): Json<UpsertSettingsBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    upsert_settings(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Promotion
#[derive(Deserialize)] struct PromoteClassBody { input: PromoteClassInput }
async fn h_promote_class(Json(b): Json<PromoteClassBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    promote_class(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Reports
#[derive(Deserialize)] struct GetReportCardBody {
    #[serde(rename = "studentId")] student_id: i64,
    term: String,
    year: String,
}
async fn h_get_report_card(Json(b): Json<GetReportCardBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_report_card(b.student_id, b.term, b.year).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Dashboard
async fn h_get_dashboard_stats() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_dashboard_stats().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

async fn h_get_top_students() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_top_students().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Sync
async fn h_get_sync_status() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_sync_status().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

async fn h_trigger_sync() -> Result<impl IntoResponse, (StatusCode, String)> {
    trigger_sync().map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct SaveSyncConfigBody { url: String, #[serde(rename = "anonKey")] anon_key: String, enabled: bool }
async fn h_save_sync_config(Json(b): Json<SaveSyncConfigBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    save_sync_config(b.url, b.anon_key, b.enabled).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// User management
async fn h_get_users() -> Result<impl IntoResponse, (StatusCode, String)> {
    get_users().map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct CreateUserBody { input: CreateUserInput }
async fn h_create_user(Json(b): Json<CreateUserBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    create_user(b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct UpdateUserBody { id: i64, input: UpdateUserInput }
async fn h_update_user(Json(b): Json<UpdateUserBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    update_user(b.id, b.input).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct DeleteUserBody { id: i64 }
async fn h_delete_user(Json(b): Json<DeleteUserBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    delete_user(b.id).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct ChangePasswordBody { input: ChangePasswordInput }
async fn h_change_user_password(Json(b): Json<ChangePasswordBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    change_user_password(b.input).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// Attendance
async fn h_record_attendance(Json(b): Json<RecordAttendanceInput>) -> Result<impl IntoResponse, (StatusCode, String)> {
    record_attendance(b).map(|_| Json(serde_json::Value::Null)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct GetAttendanceBody { #[serde(rename = "classId")] class_id: i64, date: String }
async fn h_get_attendance(Json(b): Json<GetAttendanceBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_attendance(b.class_id, b.date).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[derive(Deserialize)] struct GetAttendanceSummaryBody { #[serde(rename = "studentId")] student_id: i64, term: String, year: String }
async fn h_get_attendance_summary(Json(b): Json<GetAttendanceSummaryBody>) -> Result<impl IntoResponse, (StatusCode, String)> {
    get_attendance_summary(b.student_id, b.term, b.year).map(|v| Json(v)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

// ─── Router ───────────────────────────────────────────────────────────────────

pub fn build_router() -> Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any)
        .allow_origin(Any);

    // Protected routes (require JWT)
    let protected = Router::new()
        .route("/api/get_classes",        post(h_get_classes))
        .route("/api/create_class",       post(h_create_class))
        .route("/api/delete_class",       post(h_delete_class))
        .route("/api/get_parents",        post(h_get_parents))
        .route("/api/create_parent",      post(h_create_parent))
        .route("/api/update_parent",      post(h_update_parent))
        .route("/api/delete_parent",      post(h_delete_parent))
        .route("/api/get_staff",          post(h_get_staff))
        .route("/api/create_staff",       post(h_create_staff))
        .route("/api/update_staff",       post(h_update_staff))
        .route("/api/delete_staff",       post(h_delete_staff))
        .route("/api/get_students",       post(h_get_students))
        .route("/api/get_student",        post(h_get_student))
        .route("/api/create_student",     post(h_create_student))
        .route("/api/update_student",     post(h_update_student))
        .route("/api/delete_student",     post(h_delete_student))
        .route("/api/get_subjects",       post(h_get_subjects))
        .route("/api/create_subject",     post(h_create_subject))
        .route("/api/get_results",        post(h_get_results))
        .route("/api/upsert_result",      post(h_upsert_result))
        .route("/api/get_ca_scores",          post(h_get_ca_scores))
        .route("/api/get_ca_entries",         post(h_get_ca_entries))
        .route("/api/add_ca_entry",           post(h_add_ca_entry))
        .route("/api/batch_add_ca_entries",   post(h_batch_add_ca_entries))
        .route("/api/delete_ca_entry",        post(h_delete_ca_entry))
        .route("/api/get_payments",       post(h_get_payments))
        .route("/api/create_payment",     post(h_create_payment))
        .route("/api/get_payment_summary",post(h_get_payment_summary))
        .route("/api/get_settings",       post(h_get_settings))
        .route("/api/upsert_settings",    post(h_upsert_settings))
        .route("/api/promote_class",      post(h_promote_class))
        .route("/api/get_report_card",    post(h_get_report_card))
        .route("/api/get_dashboard_stats",post(h_get_dashboard_stats))
        .route("/api/get_top_students",   post(h_get_top_students))
        .route("/api/get_sync_status",    post(h_get_sync_status))
        .route("/api/trigger_sync",       post(h_trigger_sync))
        .route("/api/save_sync_config",   post(h_save_sync_config))
        .route("/api/get_users",             post(h_get_users))
        .route("/api/create_user",           post(h_create_user))
        .route("/api/update_user",           post(h_update_user))
        .route("/api/delete_user",           post(h_delete_user))
        .route("/api/change_user_password",  post(h_change_user_password))
        .route("/api/record_attendance",     post(h_record_attendance))
        .route("/api/get_attendance",        post(h_get_attendance))
        .route("/api/get_attendance_summary",post(h_get_attendance_summary))
        .layer(middleware::from_fn(require_auth));

    // Public routes (login)
    let public = Router::new()
        .route("/api/login",        post(handle_login))
        .route("/api/check_setup",  post(h_check_setup))
        .route("/api/setup_admin",  post(h_setup_admin));

    // Static file serving: in release embed the Next.js out/ dir; in debug serve from disk
    #[cfg(not(debug_assertions))]
    let static_service = {
        use include_dir::{include_dir, Dir};
        static FRONTEND: Dir = include_dir!("$CARGO_MANIFEST_DIR/../out");
        Router::new().fallback(move |req: Request| serve_embedded(req, &FRONTEND))
    };

    #[cfg(debug_assertions)]
    let static_service = {
        use tower_http::services::ServeDir;
        let out_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../out");
        Router::new().fallback_service(ServeDir::new(out_dir).append_index_html_on_directories(true))
    };

    Router::new()
        .merge(protected)
        .merge(public)
        .merge(static_service)
        .layer(cors)
}

#[cfg(not(debug_assertions))]
async fn serve_embedded(req: Request, dir: &'static include_dir::Dir<'static>) -> Response {
    use axum::http::header::CONTENT_TYPE;
    let path = req.uri().path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    // Try exact path, then path/index.html (trailingSlash:true output), then path.html, then root fallback
    let path_clean = path.trim_end_matches('/');
    let file = dir.get_file(path)
        .or_else(|| dir.get_file(&format!("{}/index.html", path_clean)))
        .or_else(|| dir.get_file(&format!("{}.html", path_clean)))
        .or_else(|| dir.get_file("index.html"));

    match file {
        Some(f) => {
            let mime = mime_guess::from_path(f.path()).first_or_octet_stream();
            ([(CONTENT_TYPE, mime.as_ref())], f.contents()).into_response()
        }
        None => (StatusCode::NOT_FOUND, "Not found").into_response(),
    }
}

pub fn start(port: u16) {
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
        rt.block_on(async move {
            let app = build_router();
            let addr = format!("0.0.0.0:{}", port);
            let listener = tokio::net::TcpListener::bind(&addr).await
                .unwrap_or_else(|e| panic!("Cannot bind to {}: {}", addr, e));
            log::info!("HTTP server listening on {}", addr);
            axum::serve(listener, app).await.expect("axum serve failed");
        });
    });
}
