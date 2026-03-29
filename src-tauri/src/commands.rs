use crate::db::get_conn;
use crate::models::*;
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

#[command]
pub fn login(input: LoginInput) -> Result<User, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT id, username, email, role, name FROM User WHERE email = ?1 AND password = ?2",
        params![input.email, input.password],
        |row| Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            email: row.get(2)?,
            role: row.get(3)?,
            name: row.get(4)?,
        }),
    );
    result.map_err(|_| "Invalid credentials".to_string())
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────

#[command]
pub fn get_classes() -> Result<Vec<Class>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.level, c.section, COUNT(s.id) as student_count
         FROM Class c LEFT JOIN Student s ON s.classId = c.id
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
    conn.execute(
        "INSERT INTO Class (name, level, section) VALUES (?1, ?2, ?3)",
        params![input.name, input.level, input.section],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Class { id, name: input.name, level: input.level, section: input.section, student_count: Some(0) })
}

// ─── PARENTS ─────────────────────────────────────────────────────────────────

#[command]
pub fn get_parents() -> Result<Vec<Parent>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, name, phone, email, address FROM Parent ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| Ok(Parent {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        email: row.get(3)?,
        address: row.get(4)?,
    })).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[command]
pub fn create_parent(input: CreateParentInput) -> Result<Parent, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO Parent (name, phone, email, address) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.phone, input.email, input.address],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(Parent { id, name: input.name, phone: input.phone, email: input.email, address: input.address })
}

#[command]
pub fn update_parent(id: i64, input: UpdateParentInput) -> Result<Parent, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE Parent SET name=?1, phone=?2, email=?3, address=?4 WHERE id=?5",
        params![input.name, input.phone, input.email, input.address, id],
    ).map_err(|e| e.to_string())?;
    Ok(Parent { id, name: input.name, phone: input.phone, email: input.email, address: input.address })
}

// ─── STAFF ───────────────────────────────────────────────────────────────────

#[command]
pub fn get_staff() -> Result<Vec<Staff>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.staffId, s.name, s.role, s.phone, s.email, s.subject, s.classId,
                c.id, c.name
         FROM Staff s LEFT JOIN Class c ON c.id = s.classId
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

    conn.execute(
        "INSERT INTO Staff (staffId, name, role, phone, email, subject, classId) VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![staff_id, input.name, input.role, input.phone, input.email, input.subject, input.class_id],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
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

    conn.execute(
        "UPDATE Staff SET name=?1, role=?2, phone=?3, email=?4, subject=?5, classId=?6 WHERE id=?7",
        params![name, role, phone, email, subject, class_id, id],
    ).map_err(|e| e.to_string())?;

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

// ─── STUDENTS ────────────────────────────────────────────────────────────────

#[command]
pub fn get_students(class_id: Option<i64>, q: Option<String>) -> Result<Vec<Student>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT s.id, s.studentId, s.name, s.gender, s.dob, s.phone, s.address,
                s.classId, s.parentId, s.createdAt,
                c.id, c.name,
                p.id, p.name, p.phone, p.email
         FROM Student s
         JOIN Class c ON c.id = s.classId
         LEFT JOIN Parent p ON p.id = s.parentId
         WHERE 1=1"
    );

    if class_id.is_some() { sql.push_str(" AND s.classId = ?"); }
    if q.is_some() { sql.push_str(" AND s.name LIKE ?"); }
    sql.push_str(" ORDER BY s.name");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let map_row = |row: &rusqlite::Row| {
        let parent_id_val: Option<i64> = row.get(8)?;
        let parent_db_id: Option<i64> = row.get(12)?;
        let parent_name: Option<String> = row.get(13)?;
        let parent_phone: Option<String> = row.get(14)?;
        let parent_email: Option<String> = row.get(15)?;
        let parent = parent_db_id.map(|pid| ParentBasic {
            id: pid, name: parent_name.unwrap_or_default(),
            phone: parent_phone.unwrap_or_default(), email: parent_email,
        });
        Ok(Student {
            id: row.get(0)?, student_id: row.get(1)?, name: row.get(2)?,
            gender: row.get(3)?, dob: row.get(4)?, phone: row.get(5)?,
            address: row.get(6)?, class_id: row.get(7)?,
            parent_id: parent_id_val, created_at: row.get(9)?,
            class: Some(ClassBasic { id: row.get(10)?, name: row.get(11)? }),
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
                s.classId, s.parentId, s.createdAt,
                c.id, c.name,
                p.id, p.name, p.phone, p.email
         FROM Student s
         JOIN Class c ON c.id = s.classId
         LEFT JOIN Parent p ON p.id = s.parentId
         WHERE s.id = ?1",
        params![id],
        |row| {
            let parent_id_val: Option<i64> = row.get(8)?;
            let parent_db_id: Option<i64> = row.get(12)?;
            let parent_name: Option<String> = row.get(13)?;
            let parent_phone: Option<String> = row.get(14)?;
            let parent_email: Option<String> = row.get(15)?;
            let parent = parent_db_id.map(|pid| ParentBasic {
                id: pid, name: parent_name.unwrap_or_default(),
                phone: parent_phone.unwrap_or_default(), email: parent_email,
            });
            Ok(Student {
                id: row.get(0)?, student_id: row.get(1)?, name: row.get(2)?,
                gender: row.get(3)?, dob: row.get(4)?, phone: row.get(5)?,
                address: row.get(6)?, class_id: row.get(7)?,
                parent_id: parent_id_val, created_at: row.get(9)?,
                class: Some(ClassBasic { id: row.get(10)?, name: row.get(11)? }),
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

    conn.execute(
        "INSERT INTO Student (studentId, name, gender, dob, classId, parentId, phone, address)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![student_id, input.name, input.gender, input.dob,
                input.class_id, input.parent_id, input.phone, input.address],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
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

    conn.execute(
        "UPDATE Student SET name=?1, gender=?2, dob=?3, classId=?4, parentId=?5, phone=?6, address=?7
         WHERE id=?8",
        params![name, gender, dob, class_id, parent_id,
                input.phone, input.address, id],
    ).map_err(|e| e.to_string())?;

    get_student(id)
}

#[command]
pub fn delete_student(id: i64) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM Result WHERE studentId = ?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM Payment WHERE studentId = ?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM Student WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
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
    conn.execute("INSERT INTO Subject (name, code) VALUES (?1, ?2)", params![input.name, code])
        .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(Subject { id, name: input.name, code })
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
    let total = input.ca + input.exam;
    let grade = get_grade(total).to_string();
    let remark = get_remark(total).to_string();

    conn.execute(
        "INSERT INTO Result (studentId, subjectId, term, year, ca, exam, total, grade, remark)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)
         ON CONFLICT(studentId, subjectId, term, year)
         DO UPDATE SET ca=excluded.ca, exam=excluded.exam, total=excluded.total,
                       grade=excluded.grade, remark=excluded.remark",
        params![input.student_id, input.subject_id, input.term, input.year,
                input.ca, input.exam, total, grade, remark],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(ResultRow {
        id, student_id: input.student_id, subject_id: input.subject_id,
        term: input.term, year: input.year,
        ca: input.ca, exam: input.exam, total, grade, remark: Some(remark),
        student: None, subject: None,
    })
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

    conn.execute(
        "INSERT INTO Payment (studentId, term, year, feeType, amount, paid, balance, datePaid)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![input.student_id, input.term, year, input.fee_type,
                input.amount, input.paid, balance, date_paid],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
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
        "SELECT id, schoolName, motto, address, phone, email, logo, currentTerm, currentYear FROM SchoolSettings LIMIT 1",
        [],
        |row| Ok(SchoolSettings {
            id: row.get(0)?, school_name: row.get(1)?, motto: row.get(2)?,
            address: row.get(3)?, phone: row.get(4)?, email: row.get(5)?,
            logo: row.get(6)?, current_term: row.get(7)?, current_year: row.get(8)?,
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
            "UPDATE SchoolSettings SET schoolName=?1, motto=?2, address=?3, phone=?4, email=?5, currentTerm=?6, currentYear=?7 WHERE id=?8",
            params![input.school_name, input.motto, input.address, input.phone, input.email, input.current_term, input.current_year, id],
        ).map_err(|e| e.to_string())?;
        Ok(SchoolSettings { id, school_name: input.school_name, motto: input.motto, address: input.address, phone: input.phone, email: input.email, logo: None, current_term: input.current_term, current_year: input.current_year })
    } else {
        conn.execute(
            "INSERT INTO SchoolSettings (schoolName, motto, address, phone, email, currentTerm, currentYear) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![input.school_name, input.motto, input.address, input.phone, input.email, input.current_term, input.current_year],
        ).map_err(|e| e.to_string())?;
        let id = conn.last_insert_rowid();
        Ok(SchoolSettings { id, school_name: input.school_name, motto: input.motto, address: input.address, phone: input.phone, email: input.email, logo: None, current_term: input.current_term, current_year: input.current_year })
    }
}

// ─── REPORT CARD ─────────────────────────────────────────────────────────────

#[command]
pub fn get_report_card(student_id: i64, term: String, year: String) -> Result<ReportCardData, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let student = conn.query_row(
        "SELECT s.name, s.studentId, s.gender, c.name FROM Student s JOIN Class c ON c.id=s.classId WHERE s.id=?1",
        params![student_id],
        |row| Ok(StudentReportInfo { name: row.get(0)?, student_id: row.get(1)?, gender: row.get(2)?, class: row.get(3)? }),
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

    Ok(ReportCardData { student, term, year, position, total_students, results })
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
    let total_students: i64 = conn.query_row("SELECT COUNT(*) FROM Student", [], |r| r.get(0)).unwrap_or(0);
    let total_parents: i64 = conn.query_row("SELECT COUNT(*) FROM Parent", [], |r| r.get(0)).unwrap_or(0);
    let total_staff: i64 = conn.query_row("SELECT COUNT(*) FROM Staff", [], |r| r.get(0)).unwrap_or(0);
    let total_classes: i64 = conn.query_row("SELECT COUNT(*) FROM Class", [], |r| r.get(0)).unwrap_or(0);
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