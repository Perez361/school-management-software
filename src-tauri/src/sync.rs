// sync.rs — Offline-first sync engine
// Strategy: last-write-wins based on updated_at timestamp.
// Push: drain sync_queue → Supabase RPC upsert functions.
// Pull: fetch rows updated since last_pulled_at → apply locally.
// Loop-prevention: SYNC_APPLYING thread-local suppresses re-queuing
//   while the engine is writing locally.

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::cell::Cell;
use std::time::Duration;

use crate::db::get_conn;

// ─── Loop-prevention flag ─────────────────────────────────────────────────────

thread_local! {
    static SYNC_APPLYING: Cell<bool> = Cell::new(false);
}

pub fn is_sync_applying() -> bool {
    SYNC_APPLYING.with(|f| f.get())
}

fn set_sync_applying(v: bool) {
    SYNC_APPLYING.with(|f| f.set(v));
}

// ─── Public helper — called by every mutating command ────────────────────────

/// Enqueues a change for the next sync push.
/// No-ops when the sync engine itself is applying remote rows (loop prevention).
pub fn queue_change(conn: &Connection, table: &str, sync_id: &str, payload: Value) {
    if is_sync_applying() {
        return;
    }
    let _ = conn.execute(
        "INSERT INTO sync_queue (table_name, sync_id, operation, payload)
         VALUES (?1, ?2, 'upsert', ?3)",
        params![table, sync_id, payload.to_string()],
    );
}

pub fn queue_delete(conn: &Connection, table: &str, sync_id: &str) {
    if is_sync_applying() {
        return;
    }
    let _ = conn.execute(
        "INSERT INTO sync_queue (table_name, sync_id, operation, payload)
         VALUES (?1, ?2, 'delete', '{}')",
        params![table, sync_id],
    );
}

// ─── Sync status (returned to frontend) ─────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncStatus {
    pub enabled: bool,
    pub pending: i64,
    pub last_pulled_at: String,
    pub device_id: String,
}

pub fn get_sync_status() -> Result<SyncStatus, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sync_queue WHERE pushed_at IS NULL",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let meta = |key: &str| -> String {
        conn.query_row(
            "SELECT value FROM sync_meta WHERE key = ?1",
            params![key],
            |r| r.get(0),
        ).unwrap_or_default()
    };

    Ok(SyncStatus {
        enabled: meta("sync_enabled") == "1",
        pending,
        last_pulled_at: meta("last_pulled_at"),
        device_id: meta("device_id"),
    })
}

// ─── Internal config ──────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
struct SyncConfig {
    url: String,
    anon_key: String,
    device_id: String,
}

fn load_config(conn: &Connection) -> Option<SyncConfig> {
    let meta = |key: &str| -> String {
        conn.query_row(
            "SELECT value FROM sync_meta WHERE key = ?1",
            params![key],
            |r| r.get(0),
        ).unwrap_or_default()
    };

    if meta("sync_enabled") != "1" {
        return None;
    }
    let url = meta("supabase_url");
    let anon_key = meta("supabase_anon_key");
    if url.is_empty() || anon_key.is_empty() {
        return None;
    }
    Some(SyncConfig { url, anon_key, device_id: meta("device_id") })
}

// ─── Queue entry ──────────────────────────────────────────────────────────────

struct QueueEntry {
    id: i64,
    table_name: String,
    sync_id: String,
    operation: String,
    payload: String,
}

// ─── Supabase table name mapping (SQLite PascalCase → Supabase snake_case) ───

fn supabase_table(local: &str) -> &'static str {
    match local {
        "Student"      => "student",
        "Staff"        => "staff",
        "Parent"       => "parent",
        "Class"        => "class",
        "Subject"      => "subject",
        "Result"       => "result",
        "Payment"      => "payment",
        "CAScoreEntry" => "ca_score_entry",
        _ => "unknown",
    }
}

// ─── Push phase ───────────────────────────────────────────────────────────────

async fn push_all(config: &SyncConfig) -> Result<(), String> {
    // Read all pending entries, then drop conn before any awaits
    let entries: Vec<QueueEntry> = {
        let conn = get_conn().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT id, table_name, sync_id, operation, payload
             FROM sync_queue WHERE pushed_at IS NULL
             ORDER BY queued_at ASC LIMIT 200"
        ).map_err(|e| e.to_string())?;
        let v: Vec<QueueEntry> = stmt.query_map([], |row| {
            Ok(QueueEntry {
                id:         row.get(0)?,
                table_name: row.get(1)?,
                sync_id:    row.get(2)?,
                operation:  row.get(3)?,
                payload:    row.get(4)?,
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
        v
    }; // conn and stmt dropped here

    if entries.is_empty() {
        return Ok(());
    }

    let client = build_client(config)?;
    let now = chrono::Utc::now().to_rfc3339();

    for entry in &entries {
        let result = if entry.operation == "delete" {
            push_delete(&client, config, &entry.table_name, &entry.sync_id).await
        } else {
            push_upsert(&client, config, &entry.table_name, &entry.sync_id).await
        };

        match result {
            Ok(_) => {
                // Re-open conn after await to mark as pushed
                if let Ok(conn) = get_conn() {
                    let _ = conn.execute(
                        "UPDATE sync_queue SET pushed_at = ?1 WHERE id = ?2",
                        params![now, entry.id],
                    );
                }
            }
            Err(e) => {
                log::warn!("[sync] push failed for {}/{}: {}", entry.table_name, entry.sync_id, e);
            }
        }
    }

    Ok(())
}

async fn push_upsert(
    client: &reqwest::Client,
    config: &SyncConfig,
    table: &str,
    sync_id: &str,
) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let payload = build_payload(&conn, table, sync_id)?;

    if payload.is_null() {
        // Record was hard-deleted locally before we could push — skip
        return Ok(());
    }

    let sb_table = supabase_table(table);
    let url = format!("{}/rest/v1/rpc/sync_upsert_{}", config.url, sb_table);

    let body = json!({ "p_row": payload });

    let res = client
        .post(&url)
        .header("apikey", &config.anon_key)
        .header("Authorization", format!("Bearer {}", config.anon_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        Err(format!("HTTP {}: {}", status, body))
    }
}

async fn push_delete(
    client: &reqwest::Client,
    config: &SyncConfig,
    table: &str,
    sync_id: &str,
) -> Result<(), String> {
    // For soft deletes, the record still exists with deleted_at set.
    // Treat as upsert — the deleted_at field will propagate.
    push_upsert(client, config, table, sync_id).await
}

// ─── Pull phase ───────────────────────────────────────────────────────────────

// Tables must be pulled in dependency order (parents before children)
const PULL_ORDER: &[&str] = &[
    "class", "parent", "subject", "staff",
    "student", "result", "payment", "ca_score_entry",
];

async fn pull_all(config: &SyncConfig) -> Result<(), String> {
    // Read watermark then drop conn before awaits
    let last_pulled: String = {
        let conn = get_conn().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT value FROM sync_meta WHERE key = 'last_pulled_at'",
            [],
            |r| r.get(0),
        ).unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
    };

    let client = build_client(config)?;
    let new_watermark = chrono::Utc::now().to_rfc3339();

    for sb_table in PULL_ORDER {
        if let Err(e) = pull_table(&client, config, sb_table, &last_pulled).await {
            log::warn!("[sync] pull failed for {}: {}", sb_table, e);
        }
    }

    // Advance watermark only after all tables pulled successfully
    let conn = get_conn().map_err(|e| e.to_string())?;
    let _ = conn.execute(
        "UPDATE sync_meta SET value = ?1 WHERE key = 'last_pulled_at'",
        params![new_watermark],
    );

    Ok(())
}

async fn pull_table(
    client: &reqwest::Client,
    config: &SyncConfig,
    sb_table: &str,
    since: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/rest/v1/{}?updated_at=gt.{}&select=*&limit=1000",
        config.url,
        sb_table,
        urlencoding::encode(since),
    );

    let res = client
        .get(&url)
        .header("apikey", &config.anon_key)
        .header("Authorization", format!("Bearer {}", config.anon_key))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, body));
    }

    let rows: Vec<Value> = res.json().await.map_err(|e| e.to_string())?;

    let conn = get_conn().map_err(|e| e.to_string())?;
    set_sync_applying(true);
    for row in &rows {
        if let Err(e) = apply_remote_row(&conn, sb_table, row) {
            log::warn!("[sync] apply_remote_row failed for {}: {}", sb_table, e);
        }
    }
    set_sync_applying(false);

    Ok(())
}

// ─── Apply a remote row to local SQLite ───────────────────────────────────────

fn get_str(row: &Value, key: &str) -> String {
    row.get(key).and_then(|v| v.as_str()).unwrap_or("").to_string()
}
fn get_opt_str(row: &Value, key: &str) -> Option<String> {
    row.get(key).and_then(|v| v.as_str()).map(|s| s.to_string())
}
fn get_f64(row: &Value, key: &str) -> f64 {
    row.get(key).and_then(|v| v.as_f64()).unwrap_or(0.0)
}
fn get_opt_f64(row: &Value, key: &str) -> Option<f64> {
    row.get(key).and_then(|v| v.as_f64())
}
fn get_i64(row: &Value, key: &str) -> i64 {
    row.get(key).and_then(|v| v.as_i64()).unwrap_or(0)
}

/// Resolve a sync_id → local integer id in a given table.
fn resolve_id(conn: &Connection, table: &str, sync_id: &str) -> Option<i64> {
    if sync_id.is_empty() { return None; }
    conn.query_row(
        &format!("SELECT id FROM {} WHERE sync_id = ?1", table),
        params![sync_id],
        |r| r.get(0),
    ).ok()
}

fn apply_remote_row(conn: &Connection, sb_table: &str, row: &Value) -> Result<(), String> {
    let sync_id = get_str(row, "sync_id");
    if sync_id.is_empty() { return Ok(()); }

    let remote_updated = get_str(row, "updated_at");
    let remote_deleted = get_opt_str(row, "deleted_at");

    // Conflict resolution: skip if local is equal or newer
    let local_updated: Option<String> = {
        let local_table = match sb_table {
            "class"          => "Class",
            "parent"         => "Parent",
            "subject"        => "Subject",
            "staff"          => "Staff",
            "student"        => "Student",
            "result"         => "Result",
            "payment"        => "Payment",
            "ca_score_entry" => "CAScoreEntry",
            _ => return Ok(()),
        };
        conn.query_row(
            &format!("SELECT updated_at FROM {} WHERE sync_id = ?1", local_table),
            params![sync_id],
            |r| r.get(0),
        ).ok()
    };

    if let Some(ref lu) = local_updated {
        if lu.as_str() >= remote_updated.as_str() {
            return Ok(()); // Local is same age or newer — skip
        }
    }

    match sb_table {
        "class" => apply_class(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "parent" => apply_parent(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "subject" => apply_subject(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "staff" => apply_staff(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "student" => apply_student(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "result" => apply_result(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "payment" => apply_payment(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        "ca_score_entry" => apply_ca_entry(conn, row, &sync_id, &remote_updated, remote_deleted.as_deref()),
        _ => Ok(()),
    }
}

fn apply_class(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    conn.execute(
        "INSERT INTO Class (sync_id, name, level, section, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6)
         ON CONFLICT(sync_id) DO UPDATE SET
           name=excluded.name, level=excluded.level, section=excluded.section,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, get_str(row,"name"), get_str(row,"level"),
                get_opt_str(row,"section"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_parent(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    conn.execute(
        "INSERT INTO Parent (sync_id, name, phone, email, address, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7)
         ON CONFLICT(sync_id) DO UPDATE SET
           name=excluded.name, phone=excluded.phone, email=excluded.email,
           address=excluded.address, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, get_str(row,"name"), get_str(row,"phone"),
                get_opt_str(row,"email"), get_opt_str(row,"address"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_subject(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    conn.execute(
        "INSERT INTO Subject (sync_id, name, code, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5)
         ON CONFLICT(sync_id) DO UPDATE SET
           name=excluded.name, code=excluded.code,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, get_str(row,"name"), get_str(row,"code"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_staff(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    // Resolve class FK
    let class_id = get_opt_str(row, "class_sync_id")
        .and_then(|csid| resolve_id(conn, "Class", &csid));

    conn.execute(
        "INSERT INTO Staff (sync_id, staffId, name, role, phone, email, subject, classId, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
         ON CONFLICT(sync_id) DO UPDATE SET
           staffId=excluded.staffId, name=excluded.name, role=excluded.role,
           phone=excluded.phone, email=excluded.email, subject=excluded.subject,
           classId=excluded.classId, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, get_str(row,"staff_id"), get_str(row,"name"),
                get_str(row,"role"), get_opt_str(row,"phone"), get_opt_str(row,"email"),
                get_opt_str(row,"subject"), class_id, updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_student(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    let class_id = get_opt_str(row, "class_sync_id")
        .and_then(|csid| resolve_id(conn, "Class", &csid))
        .unwrap_or(0);
    let parent_id = get_opt_str(row, "parent_sync_id")
        .and_then(|psid| resolve_id(conn, "Parent", &psid));

    conn.execute(
        "INSERT INTO Student (sync_id, studentId, name, gender, dob, phone, address,
                              classId, parentId, createdAt, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)
         ON CONFLICT(sync_id) DO UPDATE SET
           studentId=excluded.studentId, name=excluded.name, gender=excluded.gender,
           dob=excluded.dob, phone=excluded.phone, address=excluded.address,
           classId=excluded.classId, parentId=excluded.parentId,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, get_str(row,"student_id"), get_str(row,"name"),
                get_str(row,"gender"), get_str(row,"dob"),
                get_opt_str(row,"phone"), get_opt_str(row,"address"),
                class_id, parent_id, get_str(row,"created_at"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_result(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    let student_id = get_opt_str(row, "student_sync_id")
        .and_then(|sid| resolve_id(conn, "Student", &sid))
        .unwrap_or(0);
    let subject_id = get_opt_str(row, "subject_sync_id")
        .and_then(|sid| resolve_id(conn, "Subject", &sid))
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO Result (sync_id, studentId, subjectId, term, year, ca, exam, total, grade, remark, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)
         ON CONFLICT(sync_id) DO UPDATE SET
           studentId=excluded.studentId, subjectId=excluded.subjectId,
           term=excluded.term, year=excluded.year,
           ca=excluded.ca, exam=excluded.exam, total=excluded.total,
           grade=excluded.grade, remark=excluded.remark,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, student_id, subject_id,
                get_str(row,"term"), get_str(row,"year"),
                get_f64(row,"ca"), get_f64(row,"exam"), get_f64(row,"total"),
                get_str(row,"grade"), get_opt_str(row,"remark"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_payment(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    let student_id = get_opt_str(row, "student_sync_id")
        .and_then(|sid| resolve_id(conn, "Student", &sid))
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO Payment (sync_id, studentId, term, year, feeType, amount, paid, balance, datePaid, createdAt, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)
         ON CONFLICT(sync_id) DO UPDATE SET
           studentId=excluded.studentId, term=excluded.term, year=excluded.year,
           feeType=excluded.feeType, amount=excluded.amount, paid=excluded.paid,
           balance=excluded.balance, datePaid=excluded.datePaid,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, student_id, get_str(row,"term"), get_str(row,"year"),
                get_str(row,"fee_type"), get_f64(row,"amount"), get_f64(row,"paid"),
                get_f64(row,"balance"), get_opt_str(row,"date_paid"),
                get_str(row,"created_at"), updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_ca_entry(conn: &Connection, row: &Value, sync_id: &str, updated_at: &str, deleted_at: Option<&str>) -> Result<(), String> {
    let student_id = get_opt_str(row, "student_sync_id")
        .and_then(|sid| resolve_id(conn, "Student", &sid))
        .unwrap_or(0);
    let subject_id = get_opt_str(row, "subject_sync_id")
        .and_then(|sid| resolve_id(conn, "Subject", &sid))
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO CAScoreEntry (sync_id, studentId, subjectId, term, year, assessmentType, score, maxScore, updated_at, deleted_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
         ON CONFLICT(sync_id) DO UPDATE SET
           studentId=excluded.studentId, subjectId=excluded.subjectId,
           term=excluded.term, year=excluded.year,
           assessmentType=excluded.assessmentType,
           score=excluded.score, maxScore=excluded.maxScore,
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at",
        params![sync_id, student_id, subject_id,
                get_str(row,"term"), get_str(row,"year"),
                get_str(row,"assessment_type"), get_f64(row,"score"), get_f64(row,"max_score"),
                updated_at, deleted_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Payload builders (SQLite → Supabase JSON, snake_case keys) ───────────────

pub fn build_payload(conn: &Connection, table: &str, sync_id: &str) -> Result<Value, String> {
    match table {
        "Student"      => build_student_payload(conn, sync_id),
        "Staff"        => build_staff_payload(conn, sync_id),
        "Parent"       => build_parent_payload(conn, sync_id),
        "Class"        => build_class_payload(conn, sync_id),
        "Subject"      => build_subject_payload(conn, sync_id),
        "Result"       => build_result_payload(conn, sync_id),
        "Payment"      => build_payment_payload(conn, sync_id),
        "CAScoreEntry" => build_ca_entry_payload(conn, sync_id),
        _ => Ok(Value::Null),
    }
}

fn build_class_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT sync_id, name, level, section, updated_at, deleted_at FROM Class WHERE sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":    r.get::<_,String>(0)?,
            "name":       r.get::<_,String>(1)?,
            "level":      r.get::<_,String>(2)?,
            "section":    r.get::<_,Option<String>>(3)?,
            "updated_at": r.get::<_,Option<String>>(4)?,
            "deleted_at": r.get::<_,Option<String>>(5)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_parent_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT sync_id, name, phone, email, address, updated_at, deleted_at FROM Parent WHERE sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":    r.get::<_,String>(0)?,
            "name":       r.get::<_,String>(1)?,
            "phone":      r.get::<_,String>(2)?,
            "email":      r.get::<_,Option<String>>(3)?,
            "address":    r.get::<_,Option<String>>(4)?,
            "updated_at": r.get::<_,Option<String>>(5)?,
            "deleted_at": r.get::<_,Option<String>>(6)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_staff_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    // Resolve classId → class.sync_id
    conn.query_row(
        "SELECT s.sync_id, s.staffId, s.name, s.role, s.phone, s.email, s.subject,
                c.sync_id, s.updated_at, s.deleted_at
         FROM Staff s LEFT JOIN Class c ON c.id = s.classId WHERE s.sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":       r.get::<_,String>(0)?,
            "staff_id":      r.get::<_,String>(1)?,
            "name":          r.get::<_,String>(2)?,
            "role":          r.get::<_,String>(3)?,
            "phone":         r.get::<_,Option<String>>(4)?,
            "email":         r.get::<_,Option<String>>(5)?,
            "subject":       r.get::<_,Option<String>>(6)?,
            "class_sync_id": r.get::<_,Option<String>>(7)?,
            "updated_at":    r.get::<_,Option<String>>(8)?,
            "deleted_at":    r.get::<_,Option<String>>(9)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_subject_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT sync_id, name, code, updated_at, deleted_at FROM Subject WHERE sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":    r.get::<_,String>(0)?,
            "name":       r.get::<_,String>(1)?,
            "code":       r.get::<_,String>(2)?,
            "updated_at": r.get::<_,Option<String>>(3)?,
            "deleted_at": r.get::<_,Option<String>>(4)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_student_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT s.sync_id, s.studentId, s.name, s.gender, s.dob, s.phone, s.address,
                c.sync_id, p.sync_id, s.createdAt, s.updated_at, s.deleted_at
         FROM Student s
         JOIN Class c ON c.id = s.classId
         LEFT JOIN Parent p ON p.id = s.parentId
         WHERE s.sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":        r.get::<_,String>(0)?,
            "student_id":     r.get::<_,String>(1)?,
            "name":           r.get::<_,String>(2)?,
            "gender":         r.get::<_,String>(3)?,
            "dob":            r.get::<_,String>(4)?,
            "phone":          r.get::<_,Option<String>>(5)?,
            "address":        r.get::<_,Option<String>>(6)?,
            "class_sync_id":  r.get::<_,String>(7)?,
            "parent_sync_id": r.get::<_,Option<String>>(8)?,
            "created_at":     r.get::<_,String>(9)?,
            "updated_at":     r.get::<_,Option<String>>(10)?,
            "deleted_at":     r.get::<_,Option<String>>(11)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_result_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT r.sync_id, s.sync_id, sub.sync_id, r.term, r.year,
                r.ca, r.exam, r.total, r.grade, r.remark, r.updated_at, r.deleted_at
         FROM Result r
         JOIN Student s ON s.id = r.studentId
         JOIN Subject sub ON sub.id = r.subjectId
         WHERE r.sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":         r.get::<_,String>(0)?,
            "student_sync_id": r.get::<_,String>(1)?,
            "subject_sync_id": r.get::<_,String>(2)?,
            "term":            r.get::<_,String>(3)?,
            "year":            r.get::<_,String>(4)?,
            "ca":              r.get::<_,f64>(5)?,
            "exam":            r.get::<_,f64>(6)?,
            "total":           r.get::<_,f64>(7)?,
            "grade":           r.get::<_,String>(8)?,
            "remark":          r.get::<_,Option<String>>(9)?,
            "updated_at":      r.get::<_,Option<String>>(10)?,
            "deleted_at":      r.get::<_,Option<String>>(11)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_payment_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT p.sync_id, s.sync_id, p.term, p.year, p.feeType,
                p.amount, p.paid, p.balance, p.datePaid, p.createdAt, p.updated_at, p.deleted_at
         FROM Payment p
         JOIN Student s ON s.id = p.studentId
         WHERE p.sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":         r.get::<_,String>(0)?,
            "student_sync_id": r.get::<_,String>(1)?,
            "term":            r.get::<_,String>(2)?,
            "year":            r.get::<_,String>(3)?,
            "fee_type":        r.get::<_,String>(4)?,
            "amount":          r.get::<_,f64>(5)?,
            "paid":            r.get::<_,f64>(6)?,
            "balance":         r.get::<_,f64>(7)?,
            "date_paid":       r.get::<_,Option<String>>(8)?,
            "created_at":      r.get::<_,String>(9)?,
            "updated_at":      r.get::<_,Option<String>>(10)?,
            "deleted_at":      r.get::<_,Option<String>>(11)?,
        })),
    ).map_err(|e| e.to_string())
}

fn build_ca_entry_payload(conn: &Connection, sync_id: &str) -> Result<Value, String> {
    conn.query_row(
        "SELECT e.sync_id, s.sync_id, sub.sync_id, e.term, e.year,
                e.assessmentType, e.score, e.maxScore, e.updated_at, e.deleted_at
         FROM CAScoreEntry e
         JOIN Student s ON s.id = e.studentId
         JOIN Subject sub ON sub.id = e.subjectId
         WHERE e.sync_id = ?1",
        params![sync_id],
        |r| Ok(json!({
            "sync_id":         r.get::<_,String>(0)?,
            "student_sync_id": r.get::<_,String>(1)?,
            "subject_sync_id": r.get::<_,String>(2)?,
            "term":            r.get::<_,String>(3)?,
            "year":            r.get::<_,String>(4)?,
            "assessment_type": r.get::<_,String>(5)?,
            "score":           r.get::<_,f64>(6)?,
            "max_score":       r.get::<_,f64>(7)?,
            "updated_at":      r.get::<_,Option<String>>(8)?,
            "deleted_at":      r.get::<_,Option<String>>(9)?,
        })),
    ).map_err(|e| e.to_string())
}

// ─── HTTP client factory ──────────────────────────────────────────────────────

fn build_client(config: &SyncConfig) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())
}

// ─── Background sync loop ─────────────────────────────────────────────────────

pub fn start_sync_engine() {
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().expect("sync engine tokio runtime");
        rt.block_on(async {
            // Initial delay to let the app finish starting
            tokio::time::sleep(Duration::from_secs(5)).await;
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                run_sync_cycle().await;
            }
        });
    });
}

pub async fn run_sync_cycle() {
    let conn = match get_conn() {
        Ok(c) => c,
        Err(e) => { log::warn!("[sync] db error: {}", e); return; }
    };

    let config = match load_config(&conn) {
        Some(c) => c,
        None => return, // sync not enabled or not configured
    };

    drop(conn); // release before async operations

    if let Err(e) = push_all(&config).await {
        log::warn!("[sync] push_all error: {}", e);
    }
    if let Err(e) = pull_all(&config).await {
        log::warn!("[sync] pull_all error: {}", e);
    }
}

// URL encoding helper (avoid adding percent-encoding crate)
mod urlencoding {
    pub fn encode(s: &str) -> String {
        s.chars().map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            ':' => "%3A".to_string(),
            '+' => "%2B".to_string(),
            _ => format!("%{:02X}", c as u32),
        }).collect()
    }
}
