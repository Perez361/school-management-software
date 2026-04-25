use crate::db::get_conn;
use crate::models::*;
use crate::sync;
use rusqlite::params;
use tauri::command;

fn get_grade(total: f64) -> &'static str {
    if total >= 80.0 { "A" }
    else if total >= 70.0 { "B" }
    else if total >= 60.0 { "C" }
    else if total >= 50.0 { "D" }
    else if total >= 40.0 { "E" }
    else { "F" }
}

fn get_remark(total: f64) -> &'static str {
    if total >= 80.0 { "Excellent" }
    else if total >= 70.0 { "Very Good" }
    else if total >= 60.0 { "Good" }
    else if total >= 50.0 { "Average" }
    else if total >= 40.0 { "Below Average" }
    else { "Unsatisfactory" }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

/// Returns true when no user accounts exist yet (first-time setup).
#[command]
pub fn check_setup() -> Result<bool, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM User", [], |r| r.get(0))
        .unwrap_or(0);
    Ok(count == 0)
}

/// Creates the first admin account. Fails if any user already exists.
#[command]
pub fn setup_admin(input: CreateUserInput) -> Result<User, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM User", [], |r| r.get(0))
        .unwrap_or(0);
    if count > 0 {
        return Err("Setup already completed. Use the Users page to add accounts.".to_string());
    }
    let hashed = bcrypt::hash(&input.password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;
    let sync_id = format!("{}", uuid_simple());
    conn.execute(
        "INSERT INTO User (username, email, password, role, name, sync_id, updated_at) VALUES (?1,?2,?3,'admin',?4,?5,datetime('now'))",
        params![input.username, input.email, hashed, input.name, sync_id],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(User { id, username: input.username, email: input.email, role: "admin".to_string(), name: input.name })
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    format!("{:032x}", t)
}

#[command]
pub fn login(input: LoginInput) -> Result<User, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT id, username, email, role, name, password FROM User WHERE email = ?1",
        params![input.email],
        |row| Ok((
            User { id: row.get(0)?, username: row.get(1)?, email: row.get(2)?, role: row.get(3)?, name: row.get(4)? },
            row.get::<_, String>(5)?,
        )),
    );
    match result {
        Ok((user, hash)) => {
            if bcrypt::verify(&input.password, &hash).unwrap_or(false) {
                Ok(user)
            } else {
                Err("Invalid credentials".to_string())
            }
        }
        Err(_) => Err("Invalid credentials".to_string()),
    }
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────

#[command]
pub fn get_classes() -> Result<Vec<Class>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.level, c.section, COUNT(s.id) as student_count
         FROM Class c LEFT JOIN Student s ON s.classId = c.id
           AND s.deleted_at IS NULL AND (s.status IS NULL OR s.status = 'active')
         GROUP BY c.id ORDER BY c.name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| Ok(Class {
        id: row.get(0)?,
        name: row.get(1)?,
        level: row.get(2)?,
        section: row.get(3)?,
        student_count: row.get(4)?,
    })).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_class(input: CreateClassInput) -> Result<Class, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO Class (name, level, section, sync_id, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![input.name, input.level, input.section, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Class", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Class", &sync_id, payload);
    Ok(Class { id, name: input.name, level: input.level, section: input.section, student_count: Some(0) })
}

#[command]
pub fn delete_class(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    // Guard: refuse if any students are enrolled
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Student WHERE classId = ?1 AND deleted_at IS NULL AND (status IS NULL OR status = 'active')",
        params![id],
        |r| r.get(0),
    ).unwrap_or(0);
    if count > 0 {
        return Err(format!("Cannot remove class — {} student(s) still enrolled.", count));
    }
    let sync_id: String = conn.query_row(
        "SELECT sync_id FROM Class WHERE id = ?1",
        params![id],
        |r| r.get(0),
    ).unwrap_or_default();
    conn.execute("DELETE FROM Class WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    if !sync_id.is_empty() {
        sync::queue_delete(&conn, "Class", &sync_id);
    }
    Ok(())
}

// ─── PARENTS ─────────────────────────────────────────────────────────────────

#[command]
pub fn get_parents() -> Result<Vec<Parent>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.phone, p.email, p.address, p.photo, \
         COUNT(s.id) AS student_count \
         FROM Parent p \
         LEFT JOIN Student s ON s.parentId = p.id AND s.deleted_at IS NULL \
         WHERE p.deleted_at IS NULL \
         GROUP BY p.id ORDER BY p.name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| Ok(Parent {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        email: row.get(3)?,
        address: row.get(4)?,
        photo: row.get(5)?,
        student_count: row.get(6)?,
    })).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_parent(input: CreateParentInput) -> Result<Parent, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO Parent (name, phone, email, address, photo, sync_id, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![input.name, input.phone, input.email, input.address, input.photo, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Parent", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Parent", &sync_id, payload);
    Ok(Parent { id, name: input.name, phone: input.phone, email: input.email, address: input.address, photo: input.photo, student_count: 0 })
}

#[command]
pub fn update_parent(id: i64, input: UpdateParentInput) -> Result<Parent, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Parent SET name=?1, phone=?2, email=?3, address=?4, photo=?5, updated_at=?6 WHERE id=?7",
        params![input.name, input.phone, input.email, input.address, input.photo, updated_at, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM Parent WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        let payload = sync::build_payload(&conn, "Parent", &sync_id).unwrap_or_default();
        sync::queue_change(&conn, "Parent", &sync_id, payload);
    }
    let student_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Student WHERE parent_id=?1 AND deleted_at IS NULL", params![id], |r| r.get(0)
    ).unwrap_or(0);
    Ok(Parent { id, name: input.name, phone: input.phone, email: input.email, address: input.address, photo: input.photo, student_count })
}

// ─── STAFF ───────────────────────────────────────────────────────────────────

#[command]
pub fn get_staff() -> Result<Vec<Staff>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.staffId, s.name, s.role, s.phone, s.email, s.subject, s.classId,
                c.id, c.name
         FROM Staff s LEFT JOIN Class c ON c.id = s.classId
         WHERE s.deleted_at IS NULL
         ORDER BY s.name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        let class_id: Option<i64> = row.get(7)?;
        let class_db_id: Option<i64> = row.get(8)?;
        let class_name: Option<String> = row.get(9)?;
        let class = class_db_id.map(|cid| ClassBasic { id: cid, name: class_name.unwrap_or_default() });
        Ok(Staff {
            id: row.get(0)?,
            staff_id: row.get(1)?,
            name: row.get(2)?,
            role: row.get(3)?,
            phone: row.get(4)?,
            email: row.get(5)?,
            subject: row.get(6)?,
            class_id,
            class,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_staff(input: CreateStaffInput) -> Result<Staff, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM Staff", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let staff_id = format!("STF-{:03}", count + 1);
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO Staff (staffId, name, role, phone, email, subject, classId, sync_id, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![staff_id, input.name, input.role, input.phone, input.email, input.subject, input.class_id, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Staff", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Staff", &sync_id, payload);
    Ok(Staff {
        id, staff_id,
        name: input.name, role: input.role, phone: input.phone,
        email: input.email, subject: input.subject,
        class_id: input.class_id, class: None,
    })
}

#[command]
pub fn update_staff(id: i64, input: UpdateStaffInput) -> Result<Staff, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    // Fetch current staff to merge optional fields
    let current = conn.query_row(
        "SELECT s.id, s.staffId, s.name, s.role, s.phone, s.email, s.subject, s.classId
         FROM Staff s WHERE s.id = ?1",
        params![id],
        |row| Ok(Staff {
            id: row.get(0)?,
            staff_id: row.get(1)?,
            name: row.get(2)?,
            role: row.get(3)?,
            phone: row.get(4)?,
            email: row.get(5)?,
            subject: row.get(6)?,
            class_id: row.get(7)?,
            class: None,
        }),
    ).map_err(|e| e.to_string())?;

    let name = input.name.unwrap_or(current.name.clone());
    let role = input.role.unwrap_or(current.role.clone());
    let phone = input.phone.or(current.phone.clone());
    let email = input.email.or(current.email.clone());
    let subject = input.subject.or(current.subject.clone());
    let class_id = input.class_id.or(current.class_id);

    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Staff SET name=?1, role=?2, phone=?3, email=?4, subject=?5, classId=?6, updated_at=?7 WHERE id=?8",
        params![name, role, phone, email, subject, class_id, updated_at, id],
    ).map_err(|e| e.to_string())?;

    let sync_id: String = conn.query_row("SELECT sync_id FROM Staff WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        let payload = sync::build_payload(&conn, "Staff", &sync_id).unwrap_or_default();
        sync::queue_change(&conn, "Staff", &sync_id, payload);
    }
    Ok(Staff {
        id,
        staff_id: current.staff_id,
        name,
        role,
        phone,
        email,
        subject,
        class_id,
        class: None,
    })
}

// ─── SOFT DELETES ────────────────────────────────────────────────────────────

#[command]
pub fn delete_staff(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let deleted_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Staff SET deleted_at=?1, updated_at=?1 WHERE id=?2",
        params![deleted_at, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM Staff WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        sync::queue_delete(&conn, "Staff", &sync_id);
    }
    Ok(())
}

#[command]
pub fn delete_parent(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let deleted_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Parent SET deleted_at=?1, updated_at=?1 WHERE id=?2",
        params![deleted_at, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM Parent WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        sync::queue_delete(&conn, "Parent", &sync_id);
    }
    Ok(())
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────

#[command]
pub fn get_students(class_id: Option<i64>, q: Option<String>) -> Result<Vec<Student>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT s.id, s.studentId, s.name, s.gender, s.dob, s.phone, s.address,
                s.classId, s.parentId, s.createdAt, s.photo,
                c.id, c.name,
                p.id, p.name, p.phone, p.email,
                COALESCE(s.status, 'active')
         FROM Student s
         JOIN Class c ON c.id = s.classId
         LEFT JOIN Parent p ON p.id = s.parentId
         WHERE s.deleted_at IS NULL AND (s.status IS NULL OR s.status = 'active')"
    );

    if class_id.is_some() { sql.push_str(" AND s.classId = ?"); }
    if q.is_some() { sql.push_str(" AND s.name LIKE ?"); }
    sql.push_str(" ORDER BY s.name");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let map_row = |row: &rusqlite::Row| {
        let parent_id_val: Option<i64> = row.get(8)?;
        let photo: Option<String> = row.get(10)?;
        let parent_db_id: Option<i64> = row.get(13)?;
        let parent_name: Option<String> = row.get(14)?;
        let parent_phone: Option<String> = row.get(15)?;
        let parent_email: Option<String> = row.get(16)?;
        let parent = parent_db_id.map(|pid| ParentBasic {
            id: pid, name: parent_name.unwrap_or_default(),
            phone: parent_phone.unwrap_or_default(), email: parent_email,
        });
        Ok(Student {
            id: row.get(0)?, student_id: row.get(1)?, name: row.get(2)?,
            gender: row.get(3)?, dob: row.get(4)?, phone: row.get(5)?,
            address: row.get(6)?, class_id: row.get(7)?,
            parent_id: parent_id_val, created_at: row.get(9)?, photo,
            status: row.get(17).unwrap_or_else(|_| "active".to_string()),
            class: Some(ClassBasic { id: row.get(11)?, name: row.get(12)? }),
            parent,
        })
    };

    let rows = match (class_id, q.as_deref()) {
        (Some(cid), Some(query)) => {
            let like = format!("%{}%", query);
            stmt.query_map(params![cid, like], map_row)
        }
        (Some(cid), None) => stmt.query_map(params![cid], map_row),
        (None, Some(query)) => {
            let like = format!("%{}%", query);
            stmt.query_map(params![like], map_row)
        }
        (None, None) => stmt.query_map([], map_row),
    }.map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn get_student(id: i64) -> Result<Student, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT s.id, s.studentId, s.name, s.gender, s.dob, s.phone, s.address,
                s.classId, s.parentId, s.createdAt, s.photo,
                c.id, c.name,
                p.id, p.name, p.phone, p.email,
                COALESCE(s.status, 'active')
         FROM Student s
         JOIN Class c ON c.id = s.classId
         LEFT JOIN Parent p ON p.id = s.parentId
         WHERE s.id = ?1",
        params![id],
        |row| {
            let parent_id_val: Option<i64> = row.get(8)?;
            let photo: Option<String> = row.get(10)?;
            let parent_db_id: Option<i64> = row.get(13)?;
            let parent_name: Option<String> = row.get(14)?;
            let parent_phone: Option<String> = row.get(15)?;
            let parent_email: Option<String> = row.get(16)?;
            let parent = parent_db_id.map(|pid| ParentBasic {
                id: pid, name: parent_name.unwrap_or_default(),
                phone: parent_phone.unwrap_or_default(), email: parent_email,
            });
            Ok(Student {
                id: row.get(0)?, student_id: row.get(1)?, name: row.get(2)?,
                gender: row.get(3)?, dob: row.get(4)?, phone: row.get(5)?,
                address: row.get(6)?, class_id: row.get(7)?,
                parent_id: parent_id_val, created_at: row.get(9)?, photo,
                status: row.get(17).unwrap_or_else(|_| "active".to_string()),
                class: Some(ClassBasic { id: row.get(11)?, name: row.get(12)? }),
                parent,
            })
        }
    ).map_err(|e| e.to_string())
}

#[command]
pub fn create_student(input: CreateStudentInput) -> Result<Student, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM Student", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let year = chrono::Local::now().format("%Y").to_string();
    let student_id = format!("ACC-{}-{:03}", year, count + 1);
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO Student (studentId, name, gender, dob, classId, parentId, phone, address, photo, sync_id, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        params![student_id, input.name, input.gender, input.dob,
                input.class_id, input.parent_id, input.phone, input.address, input.photo, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Student", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Student", &sync_id, payload);
    get_student(id)
}

#[command]
pub fn update_student(id: i64, input: UpdateStudentInput) -> Result<Student, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let current = get_student(id)?;

    let name = input.name.unwrap_or(current.name);
    let gender = input.gender.unwrap_or(current.gender);
    let dob = input.dob.unwrap_or(current.dob);
    let class_id = input.class_id.unwrap_or(current.class_id);
    let parent_id = input.parent_id.or(current.parent_id);

    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Student SET name=?1, gender=?2, dob=?3, classId=?4, parentId=?5, phone=?6, address=?7, photo=?8, updated_at=?9
         WHERE id=?10",
        params![name, gender, dob, class_id, parent_id,
                input.phone, input.address, input.photo, updated_at, id],
    ).map_err(|e| e.to_string())?;

    let sync_id: String = conn.query_row("SELECT sync_id FROM Student WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        let payload = sync::build_payload(&conn, "Student", &sync_id).unwrap_or_default();
        sync::queue_change(&conn, "Student", &sync_id, payload);
    }
    get_student(id)
}

#[command]
pub fn delete_student(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    // Soft delete: mark deleted_at, keep record for sync
    conn.execute(
        "UPDATE Student SET deleted_at=?1, updated_at=?1 WHERE id=?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM Student WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        sync::queue_delete(&conn, "Student", &sync_id);
    }
    Ok(())
}

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

#[command]
pub fn get_subjects() -> Result<Vec<Subject>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, code FROM Subject ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| Ok(Subject {
        id: row.get(0)?, name: row.get(1)?, code: row.get(2)?,
    })).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_subject(input: CreateSubjectInput) -> Result<Subject, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let code = input.code.to_uppercase();
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO Subject (name, code, sync_id, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, code, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Subject", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Subject", &sync_id, payload);
    Ok(Subject { id, name: input.name, code })
}

#[command]
pub fn update_subject(id: i64, input: CreateSubjectInput) -> Result<Subject, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let code = input.code.to_uppercase();
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE Subject SET name=?1, code=?2, updated_at=?3 WHERE id=?4",
        params![input.name, code, updated_at, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM Subject WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        let payload = sync::build_payload(&conn, "Subject", &sync_id).unwrap_or_default();
        sync::queue_change(&conn, "Subject", &sync_id, payload);
    }
    Ok(Subject { id, name: input.name, code })
}

#[command]
pub fn delete_subject(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    // Guard: refuse if any results reference this subject
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Result WHERE subjectId = ?1",
        params![id], |r| r.get(0),
    ).unwrap_or(0);
    if count > 0 {
        return Err(format!("Cannot delete — {} result record(s) reference this subject.", count));
    }
    conn.execute("DELETE FROM Subject WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────

#[command]
pub fn get_results(class_id: Option<i64>, term: Option<String>, year: Option<String>, student_id: Option<i64>) -> Result<Vec<ResultRow>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT r.id, r.studentId, r.subjectId, r.term, r.year, r.ca, r.exam, r.total, r.grade, r.remark,
                s.id, s.name, s.studentId,
                c.id, c.name,
                sub.id, sub.name, sub.code
         FROM Result r
         JOIN Student s ON s.id = r.studentId
         JOIN Class c ON c.id = s.classId
         JOIN Subject sub ON sub.id = r.subjectId
         WHERE 1=1"
    );

    if class_id.is_some() { sql.push_str(" AND s.classId = ?"); }
    if term.is_some() { sql.push_str(" AND r.term = ?"); }
    if year.is_some() { sql.push_str(" AND r.year = ?"); }
    if student_id.is_some() { sql.push_str(" AND r.studentId = ?"); }
    sql.push_str(" ORDER BY s.name, sub.name");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let map_fn = |row: &rusqlite::Row| Ok(ResultRow {
        id: row.get(0)?, student_id: row.get(1)?, subject_id: row.get(2)?,
        term: row.get(3)?, year: row.get(4)?,
        ca: row.get(5)?, exam: row.get(6)?, total: row.get(7)?,
        grade: row.get(8)?, remark: row.get(9)?,
        student: Some(StudentBasic {
            id: row.get(10)?, name: row.get(11)?, student_id: row.get(12)?,
            class: Some(ClassBasic { id: row.get(13)?, name: row.get(14)? }),
        }),
        subject: Some(SubjectBasic { id: row.get(15)?, name: row.get(16)?, code: row.get(17)? }),
    });

    let rows = match (class_id, term.as_deref(), year.as_deref(), student_id) {
        (Some(cid), Some(t), Some(y), Some(sid)) => stmt.query_map(params![cid, t, y, sid], map_fn),
        (Some(cid), Some(t), Some(y), None) => stmt.query_map(params![cid, t, y], map_fn),
        (Some(cid), Some(t), None, None) => stmt.query_map(params![cid, t], map_fn),
        (Some(cid), None, None, None) => stmt.query_map(params![cid], map_fn),
        (None, Some(t), Some(y), Some(sid)) => stmt.query_map(params![t, y, sid], map_fn),
        (None, Some(t), Some(y), None) => stmt.query_map(params![t, y], map_fn),
        (None, None, None, Some(sid)) => stmt.query_map(params![sid], map_fn),
        _ => stmt.query_map([], map_fn),
    }.map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn upsert_result(input: CreateResultInput) -> Result<ResultRow, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    // Exam stored at 100-point scale; contributes 50% (exam/2) to the total
    let total = input.ca + input.exam / 2.0;
    let grade = get_grade(total).to_string();
    let remark = get_remark(total).to_string();
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO Result (studentId, subjectId, term, year, ca, exam, total, grade, remark, sync_id, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)
         ON CONFLICT(studentId, subjectId, term, year)
         DO UPDATE SET ca=excluded.ca, exam=excluded.exam, total=excluded.total,
                       grade=excluded.grade, remark=excluded.remark,
                       sync_id=COALESCE(Result.sync_id, excluded.sync_id),
                       updated_at=excluded.updated_at",
        params![input.student_id, input.subject_id, input.term, input.year,
                input.ca, input.exam, total, grade, remark, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    // Fetch the actual sync_id (may differ if row already existed)
    let actual_sync_id: String = conn.query_row(
        "SELECT sync_id FROM Result WHERE studentId=?1 AND subjectId=?2 AND term=?3 AND year=?4",
        params![input.student_id, input.subject_id, input.term, input.year],
        |r| r.get(0),
    ).unwrap_or(sync_id);

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Result", &actual_sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Result", &actual_sync_id, payload);
    Ok(ResultRow {
        id, student_id: input.student_id, subject_id: input.subject_id,
        term: input.term, year: input.year,
        ca: input.ca, exam: input.exam, total, grade, remark: Some(remark),
        student: None, subject: None,
    })
}

// ─── CUMULATIVE ASSESSMENTS ───────────────────────────────────────────────────
// Formula: CA = (Σscore / ΣmaxScore) × 50  — always 0–50 regardless of entry count

/// Returns per-student computed CA (aggregated from CAScoreEntry rows).
/// Still returns the CAScore type so the Results page works unchanged.
#[command]
pub fn get_ca_scores(
    class_id: Option<i64>,
    subject_id: Option<i64>,
    term: Option<String>,
    year: Option<String>,
) -> Result<Vec<CAScore>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT e.studentId, e.subjectId, e.term, e.year,
                s.id, s.name, s.studentId, c.id, c.name,
                ROUND(SUM(e.score) * 50.0 / SUM(e.maxScore), 2) AS computedCA
         FROM CAScoreEntry e
         JOIN Student s ON s.id = e.studentId
         JOIN Class c ON c.id = s.classId
         WHERE (?1 IS NULL OR s.classId = ?1)
           AND (?2 IS NULL OR e.subjectId = ?2)
           AND (?3 IS NULL OR e.term = ?3)
           AND (?4 IS NULL OR e.year = ?4)
         GROUP BY e.studentId, e.subjectId, e.term, e.year
         ORDER BY s.name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![class_id, subject_id, term, year], |row| {
        Ok(CAScore {
            id: row.get(0)?,
            student_id: row.get(0)?,
            subject_id: row.get(1)?,
            term: row.get(2)?,
            year: row.get(3)?,
            class_exercise: None,
            home_work: None,
            class_test: None,
            mid_term_exam: None,
            computed_ca: row.get(9)?,
            student: Some(StudentBasic {
                id: row.get(4)?, name: row.get(5)?, student_id: row.get(6)?,
                class: Some(ClassBasic { id: row.get(7)?, name: row.get(8)? }),
            }),
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// Returns all individual CA score entries for the given filters.
#[command]
pub fn get_ca_entries(
    class_id: Option<i64>,
    subject_id: Option<i64>,
    term: Option<String>,
    year: Option<String>,
) -> Result<Vec<CAScoreEntry>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT e.id, e.studentId, e.subjectId, e.term, e.year,
                e.assessmentType, e.score, e.maxScore,
                s.id, s.name, s.studentId, c.id, c.name
         FROM CAScoreEntry e
         JOIN Student s ON s.id = e.studentId
         JOIN Class c ON c.id = s.classId
         WHERE (?1 IS NULL OR s.classId = ?1)
           AND (?2 IS NULL OR e.subjectId = ?2)
           AND (?3 IS NULL OR e.term = ?3)
           AND (?4 IS NULL OR e.year = ?4)
         ORDER BY s.name, e.assessmentType, e.id"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![class_id, subject_id, term, year], |row| {
        Ok(CAScoreEntry {
            id: row.get(0)?, student_id: row.get(1)?, subject_id: row.get(2)?,
            term: row.get(3)?, year: row.get(4)?,
            assessment_type: row.get(5)?, score: row.get(6)?, max_score: row.get(7)?,
            student: Some(StudentBasic {
                id: row.get(8)?, name: row.get(9)?, student_id: row.get(10)?,
                class: Some(ClassBasic { id: row.get(11)?, name: row.get(12)? }),
            }),
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// Add a single CA score entry for one student.
#[command]
pub fn add_ca_entry(input: AddCAEntryInput) -> Result<CAScoreEntry, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO CAScoreEntry (studentId, subjectId, term, year, assessmentType, score, maxScore, sync_id, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![input.student_id, input.subject_id, input.term, input.year,
                input.assessment_type, input.score, input.max_score, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "CAScoreEntry", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "CAScoreEntry", &sync_id, payload);
    Ok(CAScoreEntry {
        id, student_id: input.student_id, subject_id: input.subject_id,
        term: input.term, year: input.year,
        assessment_type: input.assessment_type, score: input.score, max_score: input.max_score,
        student: None,
    })
}

/// Add CA entries for multiple students in one call (one assessment event).
#[command]
pub fn batch_add_ca_entries(input: BatchAddCAInput) -> Result<Vec<CAScoreEntry>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for entry in &input.entries {
        if entry.score < 0.0 { continue }
        let sync_id = uuid::Uuid::new_v4().to_string();
        let updated_at = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO CAScoreEntry (studentId, subjectId, term, year, assessmentType, score, maxScore, sync_id, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![entry.student_id, input.subject_id, input.term, input.year,
                    input.assessment_type, entry.score, input.max_score, sync_id, updated_at],
        ).map_err(|e| e.to_string())?;
        let id = conn.last_insert_rowid();
        let payload = sync::build_payload(&conn, "CAScoreEntry", &sync_id).unwrap_or_default();
        sync::queue_change(&conn, "CAScoreEntry", &sync_id, payload);
        result.push(CAScoreEntry {
            id,
            student_id: entry.student_id, subject_id: input.subject_id,
            term: input.term.clone(), year: input.year.clone(),
            assessment_type: input.assessment_type.clone(),
            score: entry.score, max_score: input.max_score,
            student: None,
        });
    }
    Ok(result)
}

/// Soft-delete a single CA score entry by id.
#[command]
pub fn delete_ca_entry(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE CAScoreEntry SET deleted_at=?1, updated_at=?1 WHERE id=?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;
    let sync_id: String = conn.query_row("SELECT sync_id FROM CAScoreEntry WHERE id=?1", params![id], |r| r.get(0))
        .unwrap_or_default();
    if !sync_id.is_empty() {
        sync::queue_delete(&conn, "CAScoreEntry", &sync_id);
    }
    Ok(())
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

#[command]
pub fn get_payments(class_id: Option<i64>, term: Option<String>, status: Option<String>) -> Result<Vec<Payment>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT p.id, p.studentId, p.term, p.year, p.feeType, p.amount, p.paid, p.balance,
                p.datePaid, p.createdAt,
                s.id, s.name, s.studentId,
                c.id, c.name
         FROM Payment p
         JOIN Student s ON s.id = p.studentId
         JOIN Class c ON c.id = s.classId
         WHERE 1=1"
    );

    if class_id.is_some() { sql.push_str(" AND s.classId = ?"); }
    if term.is_some() { sql.push_str(" AND p.term = ?"); }
    match status.as_deref() {
        Some("paid") => sql.push_str(" AND p.balance = 0"),
        Some("owing") => sql.push_str(" AND p.balance > 0"),
        _ => {}
    }
    sql.push_str(" ORDER BY p.createdAt DESC LIMIT 200");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let map_fn = |row: &rusqlite::Row| Ok(Payment {
        id: row.get(0)?, student_id: row.get(1)?, term: row.get(2)?,
        year: row.get(3)?, fee_type: row.get(4)?, amount: row.get(5)?,
        paid: row.get(6)?, balance: row.get(7)?,
        date_paid: row.get(8)?, created_at: row.get(9)?,
        student: Some(StudentWithClass {
            id: row.get(10)?, name: row.get(11)?, student_id: row.get(12)?,
            class: ClassBasic { id: row.get(13)?, name: row.get(14)? },
        }),
    });

    let rows = match (class_id, term.as_deref()) {
        (Some(cid), Some(t)) => stmt.query_map(params![cid, t], map_fn),
        (Some(cid), None) => stmt.query_map(params![cid], map_fn),
        (None, Some(t)) => stmt.query_map(params![t], map_fn),
        _ => stmt.query_map([], map_fn),
    }.map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_payment(input: CreatePaymentInput) -> Result<Payment, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let balance = input.amount - input.paid;
    let date_paid = if input.paid > 0.0 {
        Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string())
    } else { None };

    let year = chrono::Local::now().format("%Y").to_string();
    let sync_id = uuid::Uuid::new_v4().to_string();
    let updated_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO Payment (studentId, term, year, feeType, amount, paid, balance, datePaid, sync_id, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![input.student_id, input.term, year, input.fee_type,
                input.amount, input.paid, balance, date_paid, sync_id, updated_at],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let payload = sync::build_payload(&conn, "Payment", &sync_id).unwrap_or_default();
    sync::queue_change(&conn, "Payment", &sync_id, payload);
    Ok(Payment {
        id, student_id: input.student_id, term: input.term, year,
        fee_type: input.fee_type, amount: input.amount, paid: input.paid,
        balance, date_paid, created_at: chrono::Local::now().to_string(),
        student: None,
    })
}

#[command]
pub fn get_payment_summary(class_id: Option<i64>, term: Option<String>) -> Result<PaymentSummary, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut sql = String::from(
        "SELECT COALESCE(SUM(p.amount),0), COALESCE(SUM(p.paid),0), COALESCE(SUM(p.balance),0)
         FROM Payment p JOIN Student s ON s.id = p.studentId WHERE 1=1"
    );
    if class_id.is_some() { sql.push_str(" AND s.classId = ?"); }
    if term.is_some() { sql.push_str(" AND p.term = ?"); }

    let result = match (class_id, term.as_deref()) {
        (Some(cid), Some(t)) => conn.query_row(&sql, params![cid, t], |r| Ok(PaymentSummary { total: r.get(0)?, collected: r.get(1)?, outstanding: r.get(2)? })),
        (Some(cid), None) => conn.query_row(&sql, params![cid], |r| Ok(PaymentSummary { total: r.get(0)?, collected: r.get(1)?, outstanding: r.get(2)? })),
        (None, Some(t)) => conn.query_row(&sql, params![t], |r| Ok(PaymentSummary { total: r.get(0)?, collected: r.get(1)?, outstanding: r.get(2)? })),
        _ => conn.query_row(&sql, [], |r| Ok(PaymentSummary { total: r.get(0)?, collected: r.get(1)?, outstanding: r.get(2)? })),
    };
    result.map_err(|e| e.to_string())
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

#[command]
pub fn get_settings() -> Result<Option<SchoolSettings>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT id, schoolName, motto, address, phone, email, logo, currentTerm, currentYear, nextTermName, nextTermFee FROM SchoolSettings LIMIT 1",
        [],
        |row| Ok(SchoolSettings {
            id: row.get(0)?, school_name: row.get(1)?, motto: row.get(2)?,
            address: row.get(3)?, phone: row.get(4)?, email: row.get(5)?,
            logo: row.get(6)?, current_term: row.get(7)?, current_year: row.get(8)?,
            next_term_name: row.get(9)?, next_term_fee: row.get(10)?,
        }),
    );
    match result {
        Ok(s) => Ok(Some(s)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub fn upsert_settings(input: UpsertSettingsInput) -> Result<SchoolSettings, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let existing: Option<i64> = conn.query_row(
        "SELECT id FROM SchoolSettings LIMIT 1", [], |r| r.get(0)
    ).ok();

    if let Some(id) = existing {
        conn.execute(
            "UPDATE SchoolSettings SET schoolName=?1, motto=?2, address=?3, phone=?4, email=?5, currentTerm=?6, currentYear=?7, nextTermName=?8, nextTermFee=?9 WHERE id=?10",
            params![input.school_name, input.motto, input.address, input.phone, input.email, input.current_term, input.current_year, input.next_term_name, input.next_term_fee, id],
        ).map_err(|e| e.to_string())?;
        Ok(SchoolSettings { id, school_name: input.school_name, motto: input.motto, address: input.address, phone: input.phone, email: input.email, logo: None, current_term: input.current_term, current_year: input.current_year, next_term_name: input.next_term_name, next_term_fee: input.next_term_fee })
    } else {
        conn.execute(
            "INSERT INTO SchoolSettings (schoolName, motto, address, phone, email, currentTerm, currentYear, nextTermName, nextTermFee) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![input.school_name, input.motto, input.address, input.phone, input.email, input.current_term, input.current_year, input.next_term_name, input.next_term_fee],
        ).map_err(|e| e.to_string())?;
        let id = conn.last_insert_rowid();
        Ok(SchoolSettings { id, school_name: input.school_name, motto: input.motto, address: input.address, phone: input.phone, email: input.email, logo: None, current_term: input.current_term, current_year: input.current_year, next_term_name: input.next_term_name, next_term_fee: input.next_term_fee })
    }
}

// ─── PROMOTION ───────────────────────────────────────────────────────────────

#[command]
pub fn promote_class(input: PromoteClassInput) -> Result<PromoteResult, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    // Fetch all active students currently in this class
    let mut stmt = conn.prepare(
        "SELECT id FROM Student WHERE classId = ?1 AND deleted_at IS NULL AND (status IS NULL OR status = 'active')"
    ).map_err(|e| e.to_string())?;
    let all_ids: Vec<i64> = stmt
        .query_map(params![input.class_id], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let repeat_set: std::collections::HashSet<i64> =
        input.repeat_student_ids.iter().cloned().collect();

    let mut promoted = 0i64;
    let mut repeated = 0i64;
    let mut graduated = 0i64;

    for sid in &all_ids {
        if repeat_set.contains(sid) {
            // Student stays in same class — no classId change
            repeated += 1;
        } else if let Some(next_id) = input.next_class_id {
            // Promote to next class
            conn.execute(
                "UPDATE Student SET classId = ?1, updated_at = ?2 WHERE id = ?3",
                params![next_id, now, sid],
            ).map_err(|e| e.to_string())?;
            // Queue sync
            if let Ok(sync_id) = conn.query_row::<String, _, _>(
                "SELECT sync_id FROM Student WHERE id = ?1", params![sid], |r| r.get(0)
            ) {
                let payload = sync::build_payload(&conn, "Student", &sync_id).unwrap_or_default();
                sync::queue_change(&conn, "Student", &sync_id, payload);
            }
            promoted += 1;
        } else {
            // Graduate — mark status and keep classId for record reference
            conn.execute(
                "UPDATE Student SET status = 'graduated', updated_at = ?1 WHERE id = ?2",
                params![now, sid],
            ).map_err(|e| e.to_string())?;
            if let Ok(sync_id) = conn.query_row::<String, _, _>(
                "SELECT sync_id FROM Student WHERE id = ?1", params![sid], |r| r.get(0)
            ) {
                let payload = sync::build_payload(&conn, "Student", &sync_id).unwrap_or_default();
                sync::queue_change(&conn, "Student", &sync_id, payload);
            }
            graduated += 1;
        }
    }

    Ok(PromoteResult { promoted, repeated, graduated })
}

// ─── REPORT CARD ─────────────────────────────────────────────────────────────

#[command]
pub fn get_report_card(student_id: i64, term: String, year: String) -> Result<ReportCardData, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let student = conn.query_row(
        "SELECT s.name, s.studentId, s.gender, c.name, s.photo FROM Student s JOIN Class c ON c.id=s.classId WHERE s.id=?1",
        params![student_id],
        |row| Ok(StudentReportInfo { name: row.get(0)?, student_id: row.get(1)?, gender: row.get(2)?, class: row.get(3)?, photo: row.get(4)? }),
    ).map_err(|e| e.to_string())?;

    let class_id: i64 = conn.query_row("SELECT classId FROM Student WHERE id=?1", params![student_id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT sub.name, r.ca, r.exam, r.total FROM Result r JOIN Subject sub ON sub.id=r.subjectId WHERE r.studentId=?1 AND r.term=?2 AND r.year=?3"
    ).map_err(|e| e.to_string())?;

    let results: Vec<SubjectResult> = stmt.query_map(params![student_id, term, year], |row| {
        Ok(SubjectResult { subject: row.get(0)?, ca: row.get(1)?, exam: row.get(2)?, total: row.get(3)? })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut avg_stmt = conn.prepare(
        "SELECT r.studentId, AVG(r.total) as avg FROM Result r JOIN Student s ON s.id=r.studentId WHERE s.classId=?1 AND r.term=?2 AND r.year=?3 GROUP BY r.studentId ORDER BY avg DESC"
    ).map_err(|e| e.to_string())?;

    let rankings: Vec<(i64, f64)> = avg_stmt.query_map(params![class_id, term, year], |row| {
        Ok((row.get(0)?, row.get(1)?))
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let total_students = rankings.len() as i64;
    let position = rankings.iter().position(|(sid, _)| *sid == student_id)
        .map(|p| p as i64 + 1).unwrap_or(0);

    // Billing for this term
    let billing = conn.query_row(
        "SELECT feeType, amount, paid, balance FROM Payment WHERE studentId=?1 AND term=?2 AND year=?3 LIMIT 1",
        params![student_id, term, year],
        |row| Ok(TermBilling { fee_type: row.get(0)?, amount: row.get(1)?, paid: row.get(2)?, balance: row.get(3)? }),
    ).ok();

    // Attendance summary for this term
    let attendance = {
        let total_days: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3",
            params![student_id, term, year], |r| r.get(0),
        ).unwrap_or(0);
        let present: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='present'",
            params![student_id, term, year], |r| r.get(0),
        ).unwrap_or(0);
        let absent: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='absent'",
            params![student_id, term, year], |r| r.get(0),
        ).unwrap_or(0);
        let late: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='late'",
            params![student_id, term, year], |r| r.get(0),
        ).unwrap_or(0);
        AttendanceSummary { total_days, present, absent, late }
    };

    Ok(ReportCardData { student, term, year, position, total_students, results, billing, attendance })
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct DashboardStats {
    #[serde(rename = "totalStudents")]
    pub total_students: i64,
    #[serde(rename = "totalParents")]
    pub total_parents: i64,
    #[serde(rename = "totalStaff")]
    pub total_staff: i64,
    #[serde(rename = "totalClasses")]
    pub total_classes: i64,
    #[serde(rename = "totalCollected")]
    pub total_collected: f64,
    #[serde(rename = "totalOutstanding")]
    pub total_outstanding: f64,
}

#[command]
pub fn get_dashboard_stats() -> Result<DashboardStats, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let total_students: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Student WHERE deleted_at IS NULL AND (status IS NULL OR status='active')",
        [], |r| r.get(0)).unwrap_or(0);
    let total_parents: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Parent WHERE deleted_at IS NULL",
        [], |r| r.get(0)).unwrap_or(0);
    let total_staff: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Staff WHERE deleted_at IS NULL",
        [], |r| r.get(0)).unwrap_or(0);
    let total_classes: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Class WHERE deleted_at IS NULL",
        [], |r| r.get(0)).unwrap_or(0);
    let total_collected: f64 = conn.query_row("SELECT COALESCE(SUM(paid),0) FROM Payment", [], |r| r.get(0)).unwrap_or(0.0);
    let total_outstanding: f64 = conn.query_row("SELECT COALESCE(SUM(balance),0) FROM Payment", [], |r| r.get(0)).unwrap_or(0.0);
    Ok(DashboardStats { total_students, total_parents, total_staff, total_classes, total_collected, total_outstanding })
}

#[derive(serde::Serialize)]
pub struct TopStudent {
    #[serde(rename = "studentId")]
    pub student_id: i64,
    pub name: String,
    pub class: String,
    pub avg: f64,
}

#[command]
pub fn get_top_students() -> Result<Vec<TopStudent>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.name, c.name, AVG(r.total) as avg FROM Result r
         JOIN Student s ON s.id = r.studentId JOIN Class c ON c.id = s.classId
         GROUP BY r.studentId ORDER BY avg DESC LIMIT 5"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| Ok(TopStudent {
        student_id: row.get(0)?, name: row.get(1)?, class: row.get(2)?, avg: row.get(3)?
    })).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── CHART DATA ──────────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct GenderStats {
    pub male: i64,
    pub female: i64,
}

#[command]
pub fn get_gender_stats() -> Result<GenderStats, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let male: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Student WHERE deleted_at IS NULL AND (status IS NULL OR status='active') AND LOWER(gender)='male'",
        [], |r| r.get(0),
    ).unwrap_or(0);
    let female: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Student WHERE deleted_at IS NULL AND (status IS NULL OR status='active') AND LOWER(gender)='female'",
        [], |r| r.get(0),
    ).unwrap_or(0);
    Ok(GenderStats { male, female })
}

#[derive(serde::Serialize)]
pub struct ClassFeeStats {
    pub class: String,
    pub collected: f64,
    pub outstanding: f64,
}

#[command]
pub fn get_fee_by_class(term: Option<String>) -> Result<Vec<ClassFeeStats>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let sql = if term.is_some() {
        "SELECT c.name, COALESCE(SUM(p.paid),0), COALESCE(SUM(p.balance),0)
         FROM Class c
         LEFT JOIN Student s ON s.classId = c.id AND s.deleted_at IS NULL
         LEFT JOIN Payment p ON p.studentId = s.id AND p.term = ?1
         GROUP BY c.id, c.name ORDER BY c.name"
    } else {
        "SELECT c.name, COALESCE(SUM(p.paid),0), COALESCE(SUM(p.balance),0)
         FROM Class c
         LEFT JOIN Student s ON s.classId = c.id AND s.deleted_at IS NULL
         LEFT JOIN Payment p ON p.studentId = s.id
         GROUP BY c.id, c.name ORDER BY c.name"
    };

    let map_row = |row: &rusqlite::Row| Ok(ClassFeeStats {
        class: row.get(0)?, collected: row.get(1)?, outstanding: row.get(2)?,
    });
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows: Vec<ClassFeeStats> = if let Some(t) = term {
        stmt.query_map(rusqlite::params![t], map_row)
    } else {
        stmt.query_map([], map_row)
    }.map_err(|e: rusqlite::Error| e.to_string())?
    .filter_map(|r: Result<ClassFeeStats, rusqlite::Error>| r.ok())
    .filter(|r| r.collected > 0.0 || r.outstanding > 0.0)
    .collect();
    Ok(rows)
}

#[derive(serde::Serialize)]
pub struct ClassEnrolmentStats {
    pub class: String,
    pub count: i64,
}

#[command]
pub fn get_enrolment_by_class() -> Result<Vec<ClassEnrolmentStats>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT c.name, COUNT(s.id)
         FROM Class c
         LEFT JOIN Student s ON s.classId = c.id AND s.deleted_at IS NULL
           AND (s.status IS NULL OR s.status = 'active')
         GROUP BY c.id, c.name ORDER BY c.name"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok(ClassEnrolmentStats {
        class: row.get(0)?, count: row.get(1)?,
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

#[command]
pub fn get_notifications() -> Result<Vec<AppNotification>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut notifs: Vec<AppNotification> = Vec::new();

    // 1. Absent students — any absence recorded in the last 7 days
    {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.name, COUNT(*) as absent_days, MAX(a.date) as last_date \
             FROM Attendance a \
             JOIN Student s ON s.id = a.student_id AND s.deleted_at IS NULL \
             WHERE a.status = 'absent' AND a.date >= date('now', '-7 days') \
             GROUP BY s.id \
             ORDER BY absent_days DESC, last_date DESC \
             LIMIT 25"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?,
                row.get::<_,i64>(2)?, row.get::<_,String>(3)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (sid, sname, days, last) = row.map_err(|e| e.to_string())?;
            let severity = if days >= 3 { "error" } else { "warning" };
            let plural = if days == 1 { "day" } else { "days" };
            notifs.push(AppNotification {
                id:           format!("absent_{}_{}", sid, last.replace('-', "")),
                kind:         "absent".into(),
                title:        format!("Absent {} {}", days, plural),
                body:         format!("{} was absent {} {} this week (last: {})", sname, days, plural, last),
                severity:     severity.into(),
                student_id:   sid,
                student_name: sname,
            });
        }
    }

    // 2. Outstanding fees — any student with a positive balance
    {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.name, SUM(p.balance) as total_balance \
             FROM Payment p \
             JOIN Student s ON s.id = p.student_id AND s.deleted_at IS NULL \
             WHERE p.balance > 0 \
             GROUP BY s.id \
             ORDER BY total_balance DESC \
             LIMIT 25"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?, row.get::<_,f64>(2)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (sid, sname, bal) = row.map_err(|e| e.to_string())?;
            notifs.push(AppNotification {
                id:           format!("fee_{}_{}", sid, bal as i64),
                kind:         "fee_owed".into(),
                title:        "Outstanding fees".into(),
                body:         format!("{} owes GHS {:.2} in unpaid fees", sname, bal),
                severity:     "warning".into(),
                student_id:   sid,
                student_name: sname,
            });
        }
    }

    // 3. Poor performance — avg < 50 in the student's most recent recorded term
    {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.name, r.term, r.year, ROUND(AVG(r.total), 1) as avg_score \
             FROM Result r \
             JOIN Student s ON s.id = r.student_id AND s.deleted_at IS NULL \
             WHERE (r.year || '|' || r.term) = ( \
               SELECT r2.year || '|' || r2.term FROM Result r2 \
               WHERE r2.student_id = r.student_id \
               ORDER BY r2.year DESC, r2.term DESC LIMIT 1 \
             ) \
             GROUP BY s.id, r.term, r.year \
             HAVING AVG(r.total) < 50.0 \
             ORDER BY avg_score ASC \
             LIMIT 25"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?,
                row.get::<_,String>(2)?, row.get::<_,String>(3)?, row.get::<_,f64>(4)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (sid, sname, term, year, avg) = row.map_err(|e| e.to_string())?;
            let severity = if avg < 40.0 { "error" } else { "warning" };
            notifs.push(AppNotification {
                id:           format!("perf_{}_{}_{}", sid, term.replace(' ', ""), year.replace('/', "")),
                kind:         "poor_performance".into(),
                title:        "Low academic performance".into(),
                body:         format!("{} averaged {:.1}% in {} {}", sname, avg, term, year),
                severity:     severity.into(),
                student_id:   sid,
                student_name: sname,
            });
        }
    }

    // 4. Teachers with no class assigned (optional / info-level)
    {
        let mut stmt = conn.prepare(
            "SELECT id, name FROM Staff \
             WHERE class_id IS NULL AND deleted_at IS NULL AND role = 'teacher' \
             ORDER BY name LIMIT 10"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (sid, sname) = row.map_err(|e| e.to_string())?;
            notifs.push(AppNotification {
                id:           format!("unassigned_staff_{}", sid),
                kind:         "unassigned_staff".into(),
                title:        "Teacher has no class".into(),
                body:         format!("{} is a teacher but has not been assigned to any class", sname),
                severity:     "info".into(),
                student_id:   sid,
                student_name: sname,
            });
        }
    }

    // 5. Classes with no active students enrolled
    {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.name FROM Class c \
             WHERE c.deleted_at IS NULL \
               AND NOT EXISTS ( \
                 SELECT 1 FROM Student s \
                 WHERE s.class_id = c.id AND s.deleted_at IS NULL AND s.status = 'active' \
               ) \
             ORDER BY c.name LIMIT 10"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (cid, cname) = row.map_err(|e| e.to_string())?;
            notifs.push(AppNotification {
                id:           format!("empty_class_{}", cid),
                kind:         "empty_class".into(),
                title:        "Empty class".into(),
                body:         format!("{} has no students enrolled", cname),
                severity:     "info".into(),
                student_id:   cid,
                student_name: cname,
            });
        }
    }

    // 6. Active students with no parent / guardian linked
    {
        let mut stmt = conn.prepare(
            "SELECT s.id, s.name FROM Student s \
             WHERE s.deleted_at IS NULL AND s.status = 'active' AND s.parent_id IS NULL \
             ORDER BY s.name LIMIT 20"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_,i64>(0)?, row.get::<_,String>(1)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (sid, sname) = row.map_err(|e| e.to_string())?;
            notifs.push(AppNotification {
                id:           format!("no_parent_{}", sid),
                kind:         "no_parent".into(),
                title:        "No parent linked".into(),
                body:         format!("{} has no parent or guardian assigned", sname),
                severity:     "info".into(),
                student_id:   sid,
                student_name: sname,
            });
        }
    }

    Ok(notifs)
}

// ─── SYNC ─────────────────────────────────────────────────────────────────────

#[command]
pub fn get_sync_status() -> Result<sync::SyncStatus, String> {
    sync::get_sync_status()
}

#[command]
pub fn trigger_sync() -> Result<(), String> {
    // Fire-and-forget: spawn a thread with its own runtime for the sync cycle
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().expect("tokio runtime");
        rt.block_on(async { let _ = sync::run_sync_cycle().await; });
    });
    Ok(())
}

#[command]
pub fn save_sync_config(url: String, anon_key: String, enabled: bool) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    conn.execute("INSERT OR REPLACE INTO sync_meta (key,value) VALUES ('supabase_url',?1)", params![url])
        .map_err(|e| e.to_string())?;
    conn.execute("INSERT OR REPLACE INTO sync_meta (key,value) VALUES ('supabase_anon_key',?1)", params![anon_key])
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO sync_meta (key,value) VALUES ('sync_enabled',?1)",
        params![if enabled { "1" } else { "0" }],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

#[command]
pub fn get_users() -> Result<Vec<User>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, username, email, role, name FROM User ORDER BY name"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok(User {
        id: row.get(0)?, username: row.get(1)?, email: row.get(2)?,
        role: row.get(3)?, name: row.get(4)?,
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_user(input: CreateUserInput) -> Result<User, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    // Validate role
    if !["admin","teacher","accountant"].contains(&input.role.as_str()) {
        return Err("Invalid role. Must be admin, teacher, or accountant.".to_string());
    }
    let hashed = bcrypt::hash(&input.password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO User (username, email, password, role, name) VALUES (?1,?2,?3,?4,?5)",
        params![input.username, input.email, hashed, input.role, input.name],
    ).map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "Email or username already exists.".to_string()
        } else { e.to_string() }
    })?;
    let id = conn.last_insert_rowid();
    Ok(User { id, username: input.username, email: input.email, role: input.role, name: input.name })
}

#[command]
pub fn update_user(id: i64, input: UpdateUserInput) -> Result<User, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let current = conn.query_row(
        "SELECT id, username, email, role, name FROM User WHERE id=?1",
        params![id],
        |row| Ok(User { id: row.get(0)?, username: row.get(1)?, email: row.get(2)?, role: row.get(3)?, name: row.get(4)? }),
    ).map_err(|e| e.to_string())?;
    let username = input.username.unwrap_or(current.username);
    let email    = input.email.unwrap_or(current.email);
    let role     = input.role.unwrap_or(current.role);
    let name     = input.name.unwrap_or(current.name);
    if !["admin","teacher","accountant"].contains(&role.as_str()) {
        return Err("Invalid role.".to_string());
    }
    conn.execute(
        "UPDATE User SET username=?1, email=?2, role=?3, name=?4 WHERE id=?5",
        params![username, email, role, name, id],
    ).map_err(|e| e.to_string())?;
    Ok(User { id, username, email, role, name })
}

#[command]
pub fn delete_user(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    // Prevent deleting the last admin
    let admin_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM User WHERE role='admin'", [], |r| r.get(0)
    ).unwrap_or(0);
    let user_role: String = conn.query_row(
        "SELECT role FROM User WHERE id=?1", params![id], |r| r.get(0)
    ).unwrap_or_default();
    if user_role == "admin" && admin_count <= 1 {
        return Err("Cannot delete the only admin account.".to_string());
    }
    conn.execute("DELETE FROM User WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn change_user_password(input: ChangePasswordInput) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    if input.new_password.len() < 6 {
        return Err("Password must be at least 6 characters.".to_string());
    }
    let hashed = bcrypt::hash(&input.new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE User SET password=?1 WHERE id=?2",
        params![hashed, input.user_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

#[command]
pub fn record_attendance(input: RecordAttendanceInput) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    for rec in &input.records {
        let sync_id = uuid::Uuid::new_v4().to_string();
        let updated_at = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO Attendance (studentId, classId, date, status, term, year, sync_id, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(studentId, date) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at",
            params![rec.student_id, input.class_id, input.date, rec.status,
                    input.term, input.year, sync_id, updated_at],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
pub fn get_attendance(class_id: i64, date: String) -> Result<Vec<AttendanceEntry>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT a.id, a.studentId, s.name, a.status, a.date
         FROM Attendance a JOIN Student s ON s.id=a.studentId
         WHERE a.classId=?1 AND a.date=?2 ORDER BY s.name"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![class_id, date], |row| Ok(AttendanceEntry {
        id: row.get(0)?, student_id: row.get(1)?, name: row.get(2)?,
        status: row.get(3)?, date: row.get(4)?,
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn get_class_attendance_summary(class_id: i64, term: String, year: String) -> Result<Vec<StudentAttendanceSummary>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.name, s.studentId,
                COUNT(a.id) as total_days,
                SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.status='absent'  THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN a.status='late'    THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN a.status='excused' THEN 1 ELSE 0 END) as excused
         FROM Student s
         LEFT JOIN Attendance a ON a.studentId = s.id AND a.term = ?2 AND a.year = ?3
         WHERE s.classId = ?1 AND s.deleted_at IS NULL AND (s.status IS NULL OR s.status = 'active')
         GROUP BY s.id
         ORDER BY s.name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![class_id, term, year], |row| {
        Ok(StudentAttendanceSummary {
            student_id:   row.get(0)?,
            student_name: row.get(1)?,
            student_code: row.get(2)?,
            total_days:   row.get(3)?,
            present:      row.get(4)?,
            absent:       row.get(5)?,
            late:         row.get(6)?,
            excused:      row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn get_attendance_summary(student_id: i64, term: String, year: String) -> Result<AttendanceSummary, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let total_days: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3",
        params![student_id, term, year], |r| r.get(0),
    ).unwrap_or(0);
    let present: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='present'",
        params![student_id, term, year], |r| r.get(0),
    ).unwrap_or(0);
    let absent: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='absent'",
        params![student_id, term, year], |r| r.get(0),
    ).unwrap_or(0);
    let late: i64 = conn.query_row(
        "SELECT COUNT(*) FROM Attendance WHERE studentId=?1 AND term=?2 AND year=?3 AND status='late'",
        params![student_id, term, year], |r| r.get(0),
    ).unwrap_or(0);
    Ok(AttendanceSummary { total_days, present, absent, late })
}