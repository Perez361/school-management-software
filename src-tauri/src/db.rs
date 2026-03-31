use rusqlite::{Connection, Result, params};
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    let app_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.adahigh.sms");
    std::fs::create_dir_all(&app_dir).unwrap();
    app_dir.join("school.db")
}

pub fn get_conn() -> Result<Connection> {
    let path = get_db_path();
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS Class (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            level TEXT NOT NULL,
            section TEXT
        );

        CREATE TABLE IF NOT EXISTS Parent (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT
        );

        CREATE TABLE IF NOT EXISTS Staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staffId TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            email TEXT UNIQUE,
            subject TEXT,
            classId INTEGER REFERENCES Class(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS Student (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            dob TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            photo TEXT,
            classId INTEGER NOT NULL REFERENCES Class(id),
            parentId INTEGER REFERENCES Parent(id) ON DELETE SET NULL,
            createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS Subject (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS ClassSubject (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            classId INTEGER NOT NULL REFERENCES Class(id),
            subjectId INTEGER NOT NULL REFERENCES Subject(id),
            UNIQUE(classId, subjectId)
        );

        CREATE TABLE IF NOT EXISTS Result (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL REFERENCES Student(id),
            subjectId INTEGER NOT NULL REFERENCES Subject(id),
            term TEXT NOT NULL,
            year TEXT NOT NULL,
            ca REAL NOT NULL,
            exam REAL NOT NULL,
            total REAL NOT NULL,
            grade TEXT NOT NULL,
            remark TEXT,
            UNIQUE(studentId, subjectId, term, year)
        );

        CREATE TABLE IF NOT EXISTS Payment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL REFERENCES Student(id),
            term TEXT NOT NULL,
            year TEXT NOT NULL,
            feeType TEXT NOT NULL,
            amount REAL NOT NULL,
            paid REAL NOT NULL,
            balance REAL NOT NULL,
            datePaid TEXT,
            createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS SchoolSettings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schoolName TEXT NOT NULL,
            motto TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo TEXT,
            currentTerm TEXT NOT NULL DEFAULT 'Term 1',
            currentYear TEXT NOT NULL DEFAULT '2024'
        );

        CREATE TABLE IF NOT EXISTS CAScore (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
            subjectId INTEGER NOT NULL REFERENCES Subject(id) ON DELETE CASCADE,
            term TEXT NOT NULL,
            year TEXT NOT NULL,
            classExercise REAL,
            homeWork REAL,
            classTest REAL,
            midTermExam REAL,
            computedCA REAL,
            UNIQUE(studentId, subjectId, term, year)
        );

        CREATE TABLE IF NOT EXISTS CAScoreEntry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
            subjectId INTEGER NOT NULL REFERENCES Subject(id) ON DELETE CASCADE,
            term TEXT NOT NULL,
            year TEXT NOT NULL,
            assessmentType TEXT NOT NULL,
            score REAL NOT NULL,
            maxScore REAL NOT NULL
        );
    ")?;

    // Seed default admin if not exists
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM User WHERE email = 'admin@school.com'",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    if count == 0 {
        let hashed = bcrypt::hash("admin123", bcrypt::DEFAULT_COST)
            .expect("bcrypt hash failed");
        conn.execute(
            "INSERT INTO User (username, email, password, role, name) VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["admin", "admin@school.com", hashed, "admin", "Administrator"],
        )?;
    }

    // Migrate any remaining plaintext passwords (password < 60 chars = not a bcrypt hash)
    migrate_passwords(conn);

    Ok(())
}

/// Hash any passwords that are still stored as plaintext (bcrypt hashes are always 60 chars).
pub fn migrate_passwords(conn: &Connection) {
    let users: Vec<(i64, String)> = {
        let mut stmt = match conn.prepare("SELECT id, password FROM User WHERE LENGTH(password) < 60") {
            Ok(s) => s,
            Err(_) => return,
        };
        stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .unwrap_or_else(|_| unreachable!())
            .filter_map(|r| r.ok())
            .collect()
    };

    for (id, plaintext) in users {
        if let Ok(hashed) = bcrypt::hash(&plaintext, bcrypt::DEFAULT_COST) {
            let _ = conn.execute("UPDATE User SET password=?1 WHERE id=?2", params![hashed, id]);
        }
    }
}
