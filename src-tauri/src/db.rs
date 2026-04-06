use rusqlite::{Connection, Result};
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

        CREATE TABLE IF NOT EXISTS Attendance (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
            classId   INTEGER NOT NULL REFERENCES Class(id),
            date      TEXT NOT NULL,
            status    TEXT NOT NULL DEFAULT 'present',
            term      TEXT NOT NULL,
            year      TEXT NOT NULL,
            UNIQUE(studentId, date)
        );
    ")?;

    // ─── Additive ALTER TABLE migrations (idempotent) ────────────────────────
    let _ = conn.execute("ALTER TABLE Parent ADD COLUMN photo TEXT ", []);
    let _ = conn.execute("ALTER TABLE Student ADD COLUMN photo TEXT ", []);
    let _ = conn.execute("ALTER TABLE SchoolSettings ADD COLUMN nextTermName TEXT ", []);
    let _ = conn.execute("ALTER TABLE SchoolSettings ADD COLUMN nextTermFee REAL NOT NULL DEFAULT 0 ", []);
    // status: 'active' | 'graduated' | 'transferred'
    let _ = conn.execute("ALTER TABLE Student ADD COLUMN status TEXT NOT NULL DEFAULT 'active' ", []);

    // ─── Sync schema additions ────────────────────────────────────────────────
    // ADD COLUMN is idempotent: rusqlite returns an error if the column already
    // exists, which we silently ignore.
    let sync_tables = [
        "Student", "Staff", "Parent", "Class", "Subject",
        "Result", "Payment", "CAScoreEntry", "Attendance", "User",
    ];
    for table in &sync_tables {
        let _ = conn.execute(&format!("ALTER TABLE {} ADD COLUMN sync_id TEXT ", table), []);
        let _ = conn.execute(&format!("ALTER TABLE {} ADD COLUMN updated_at TEXT ", table), []);
        let _ = conn.execute(&format!("ALTER TABLE {} ADD COLUMN deleted_at TEXT ", table), []);
        // Back-fill sync_id for existing rows that don't have one yet
        let _ = conn.execute(
            &format!("UPDATE {} SET sync_id = lower(hex(randomblob(16))) WHERE sync_id IS NULL ", table),
            [],
        );
        // Back-fill updated_at
        let _ = conn.execute(
            &format!("UPDATE {} SET updated_at = datetime('now') WHERE updated_at IS NULL ", table),
            [],
        );
    }

    // Unique index on sync_id for each table (idempotent)
    for table in &sync_tables {
        let _ = conn.execute_batch(&format!(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_{}_sync_id ON {} (sync_id);",
            table.to_lowercase(), table
        ));
    }

    // Sync support tables
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS sync_queue (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name  TEXT NOT NULL,
            sync_id     TEXT NOT NULL,
            operation   TEXT NOT NULL DEFAULT 'upsert',
            payload     TEXT NOT NULL DEFAULT '{}',
            queued_at   TEXT NOT NULL DEFAULT (datetime('now')),
            pushed_at   TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT ''
        );
    ")?;

    // Seed sync_meta defaults (INSERT OR IGNORE keeps existing values)
    conn.execute_batch("
        INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('device_id', lower(hex(randomblob(16))));
        INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('last_pulled_at', '1970-01-01T00:00:00Z');
        INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('supabase_url', '');
        INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('supabase_anon_key', '');
        INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('sync_enabled', '0');
    ")?;
    // ─── Seed GES subjects (idempotent) ──────────────────────────────────────
    conn.execute_batch("
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('English Language',            'ENG');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Mathematics',                 'MATH');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Integrated Science',          'SCI');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Social Studies',              'SOC');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Religious & Moral Education', 'RME');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Creative Arts & Design',      'CAD');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Computing',                   'ICT');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('French',                      'FRE');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Ghanaian Language',           'GHL');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Physical Education',          'PE');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('History',                     'HIST');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Career Technology',           'CT');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Agricultural Science',        'AGRI');
        INSERT OR IGNORE INTO Subject (name, code) VALUES ('Pre-Technical Skills',        'PTS');
    ")?;
    // ─────────────────────────────────────────────────────────────────────────

    Ok(())
}
