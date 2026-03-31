-- ============================================================
-- Migration: 20240101000000_create_sync_tables.sql
--
-- Creates the 8 cloud-sync tables that mirror the local SQLite
-- schema.  The key difference from SQLite:
--   • sync_id TEXT is the stable cross-device identifier and
--     acts as the conflict-resolution key (UNIQUE).
--   • Integer FK columns are replaced by *_sync_id TEXT columns
--     so references survive across different devices.
--   • updated_at / deleted_at are TIMESTAMPTZ for proper ordering.
--   • Soft-deletes only — rows are never hard-deleted here.
-- ============================================================

-- ─── class ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class (
    id         bigserial    PRIMARY KEY,
    sync_id    text         NOT NULL UNIQUE,
    name       text         NOT NULL,
    level      text         NOT NULL,
    section    text,
    updated_at timestamptz,
    deleted_at timestamptz
);

-- ─── parent ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent (
    id         bigserial    PRIMARY KEY,
    sync_id    text         NOT NULL UNIQUE,
    name       text         NOT NULL,
    phone      text         NOT NULL,
    email      text,
    address    text,
    updated_at timestamptz,
    deleted_at timestamptz
);

-- ─── subject ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject (
    id         bigserial    PRIMARY KEY,
    sync_id    text         NOT NULL UNIQUE,
    name       text         NOT NULL,
    code       text         NOT NULL,
    updated_at timestamptz,
    deleted_at timestamptz
);

-- ─── staff ───────────────────────────────────────────────────
-- class_sync_id references class(sync_id) logically;
-- no hard FK to keep inserts order-independent across devices.
CREATE TABLE IF NOT EXISTS staff (
    id             bigserial  PRIMARY KEY,
    sync_id        text       NOT NULL UNIQUE,
    staff_id       text,
    name           text       NOT NULL,
    role           text       NOT NULL,
    phone          text,
    email          text,
    subject        text,
    class_sync_id  text,
    updated_at     timestamptz,
    deleted_at     timestamptz
);

-- ─── student ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student (
    id              bigserial  PRIMARY KEY,
    sync_id         text       NOT NULL UNIQUE,
    student_id      text,
    name            text       NOT NULL,
    gender          text,
    dob             text,
    phone           text,
    address         text,
    class_sync_id   text,
    parent_sync_id  text,
    created_at      text,
    updated_at      timestamptz,
    deleted_at      timestamptz
);

-- ─── result ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS result (
    id               bigserial  PRIMARY KEY,
    sync_id          text       NOT NULL UNIQUE,
    student_sync_id  text,
    subject_sync_id  text,
    term             text,
    year             text,
    ca               numeric,
    exam             numeric,
    total            numeric,
    grade            text,
    remark           text,
    updated_at       timestamptz,
    deleted_at       timestamptz
);

-- ─── payment ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment (
    id               bigserial  PRIMARY KEY,
    sync_id          text       NOT NULL UNIQUE,
    student_sync_id  text,
    term             text,
    year             text,
    fee_type         text,
    amount           numeric,
    paid             numeric,
    balance          numeric,
    date_paid        text,
    created_at       text,
    updated_at       timestamptz,
    deleted_at       timestamptz
);

-- ─── ca_score_entry ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ca_score_entry (
    id               bigserial  PRIMARY KEY,
    sync_id          text       NOT NULL UNIQUE,
    student_sync_id  text,
    subject_sync_id  text,
    term             text,
    year             text,
    assessment_type  text,
    score            numeric,
    max_score        numeric,
    updated_at       timestamptz,
    deleted_at       timestamptz
);

-- ─── Indexes for pull queries (filter by updated_at) ─────────
CREATE INDEX IF NOT EXISTS idx_class_updated_at          ON class          (updated_at);
CREATE INDEX IF NOT EXISTS idx_parent_updated_at         ON parent         (updated_at);
CREATE INDEX IF NOT EXISTS idx_subject_updated_at        ON subject        (updated_at);
CREATE INDEX IF NOT EXISTS idx_staff_updated_at          ON staff          (updated_at);
CREATE INDEX IF NOT EXISTS idx_student_updated_at        ON student        (updated_at);
CREATE INDEX IF NOT EXISTS idx_result_updated_at         ON result         (updated_at);
CREATE INDEX IF NOT EXISTS idx_payment_updated_at        ON payment        (updated_at);
CREATE INDEX IF NOT EXISTS idx_ca_score_entry_updated_at ON ca_score_entry (updated_at);
