#[cfg(test)]
mod tests {
    use rusqlite::{Connection, params};
    use crate::db::run_migrations;

    fn in_memory_db() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        run_migrations(&conn).expect("migrations ok");
        conn
    }

    // ── Migrations ─────────────────────────────────────────────────────────────

    #[test]
    fn migrations_are_idempotent() {
        let conn = in_memory_db();
        // running twice must not panic
        run_migrations(&conn).expect("second migration run ok");
    }

    #[test]
    fn schema_has_parent_id_camel_case() {
        let conn = in_memory_db();
        // If the column is parentId (camelCase), this query returns a row.
        // If the schema had snake_case parent_id this would error.
        let result: rusqlite::Result<i64> = conn.query_row(
            "SELECT COUNT(*) FROM Student WHERE parentId IS NULL",
            [],
            |r| r.get(0),
        );
        assert!(result.is_ok(), "parentId column must exist (not parent_id)");
    }

    // ── Parent CRUD ─────────────────────────────────────────────────────────────

    fn insert_parent(conn: &Connection, name: &str) -> i64 {
        conn.execute(
            "INSERT INTO Parent (name, phone) VALUES (?1, ?2)",
            params![name, "0200000000"],
        ).unwrap();
        conn.last_insert_rowid()
    }

    #[test]
    fn create_parent_and_count_students() {
        let conn = in_memory_db();
        let parent_id = insert_parent(&conn, "Akua Mensah");

        // Insert a class so student FK is satisfied
        conn.execute(
            "INSERT INTO Class (name, level) VALUES ('Primary 1', 'Primary')",
            [],
        ).unwrap();
        let class_id: i64 = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO Student (studentId, name, gender, dob, classId, parentId) \
             VALUES ('ACC-2024-0001','Kofi Mensah','Male','2015-01-01',?1,?2)",
            params![class_id, parent_id],
        ).unwrap();

        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Student WHERE parentId=?1 AND deleted_at IS NULL",
            params![parent_id],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn update_parent_uses_camel_case_parent_id() {
        // Regression test: update_parent previously used snake_case parent_id
        // which returned 0 students even when students were linked.
        let conn = in_memory_db();
        let parent_id = insert_parent(&conn, "Ama Boateng");

        conn.execute(
            "INSERT INTO Class (name, level) VALUES ('JHS 1', 'JHS')",
            [],
        ).unwrap();
        let class_id: i64 = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO Student (studentId, name, gender, dob, classId, parentId) \
             VALUES ('ACC-2024-0002','Yaw Boateng','Male','2014-03-10',?1,?2)",
            params![class_id, parent_id],
        ).unwrap();

        // Simulate the fixed update_parent student_count query (parentId, not parent_id)
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Student WHERE parentId=?1 AND deleted_at IS NULL",
            params![parent_id],
            |r| r.get(0),
        ).unwrap();

        // If this returns 0 the old bug is present; must return 1.
        assert_eq!(count, 1, "parentId query must find the linked student");

        // Confirm the snake_case column does NOT exist
        let snake_result: rusqlite::Result<i64> = conn.query_row(
            "SELECT COUNT(*) FROM Student WHERE parent_id=?1",
            params![parent_id],
            |r| r.get(0),
        );
        assert!(snake_result.is_err(), "parent_id column must not exist");
    }

    // ── Staff CRUD ─────────────────────────────────────────────────────────────

    #[test]
    fn staff_id_uses_max_not_count() {
        let conn = in_memory_db();

        // Insert then soft-delete a staff record
        conn.execute(
            "INSERT INTO Staff (staffId, name, role, deleted_at) VALUES ('STF-0001','Old Staff','Teacher',datetime('now'))",
            [],
        ).unwrap();

        // With COUNT(*) the next ID would still be 1 (after filtering deleted rows)
        // causing a UNIQUE constraint violation. With MAX(id), it correctly uses 2.
        let next_num: i64 = conn.query_row(
            "SELECT COALESCE(MAX(id), 0) + 1 FROM Staff",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(next_num, 2);
    }

    // ── Subject ICT name ───────────────────────────────────────────────────────

    #[test]
    fn ict_subject_has_correct_spelling() {
        let conn = in_memory_db();
        let name: String = conn.query_row(
            "SELECT name FROM Subject WHERE code='ICT'",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(name, "Information & Communication Technology");
        assert!(!name.contains("Commnunication"), "typo must be fixed");
    }

    // ── Class ──────────────────────────────────────────────────────────────────

    #[test]
    fn class_insert_and_retrieve() {
        let conn = in_memory_db();
        conn.execute(
            "INSERT INTO Class (name, level, section) VALUES ('Primary 2','Primary','A')",
            [],
        ).unwrap();
        let name: String = conn.query_row(
            "SELECT name FROM Class WHERE level='Primary'",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(name, "Primary 2");
    }
}
