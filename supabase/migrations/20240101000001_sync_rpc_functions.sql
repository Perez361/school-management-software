-- ============================================================
-- Migration: 20240101000001_sync_rpc_functions.sql
--
-- One RPC function per sync table: sync_upsert_<table>.
-- Each function implements last-write-wins conflict resolution:
--   only update when the incoming updated_at is strictly newer
--   than what's already stored.
--
-- Called by the Rust sync engine as:
--   POST /rest/v1/rpc/sync_upsert_class
--   { "p_row": { ...json payload... } }
-- ============================================================

-- ─── class ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_class(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO class (sync_id, name, level, section, updated_at, deleted_at)
    VALUES (
        p_row->>'sync_id',
        p_row->>'name',
        p_row->>'level',
        p_row->>'section',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        name       = EXCLUDED.name,
        level      = EXCLUDED.level,
        section    = EXCLUDED.section,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > class.updated_at
       OR class.updated_at IS NULL;
END;
$$;

-- ─── parent ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_parent(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO parent (sync_id, name, phone, email, address, updated_at, deleted_at)
    VALUES (
        p_row->>'sync_id',
        p_row->>'name',
        p_row->>'phone',
        p_row->>'email',
        p_row->>'address',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        name       = EXCLUDED.name,
        phone      = EXCLUDED.phone,
        email      = EXCLUDED.email,
        address    = EXCLUDED.address,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > parent.updated_at
       OR parent.updated_at IS NULL;
END;
$$;

-- ─── subject ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_subject(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO subject (sync_id, name, code, updated_at, deleted_at)
    VALUES (
        p_row->>'sync_id',
        p_row->>'name',
        p_row->>'code',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        name       = EXCLUDED.name,
        code       = EXCLUDED.code,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > subject.updated_at
       OR subject.updated_at IS NULL;
END;
$$;

-- ─── staff ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_staff(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO staff (
        sync_id, staff_id, name, role, phone, email,
        subject, class_sync_id, updated_at, deleted_at
    )
    VALUES (
        p_row->>'sync_id',
        p_row->>'staff_id',
        p_row->>'name',
        p_row->>'role',
        p_row->>'phone',
        p_row->>'email',
        p_row->>'subject',
        p_row->>'class_sync_id',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        staff_id      = EXCLUDED.staff_id,
        name          = EXCLUDED.name,
        role          = EXCLUDED.role,
        phone         = EXCLUDED.phone,
        email         = EXCLUDED.email,
        subject       = EXCLUDED.subject,
        class_sync_id = EXCLUDED.class_sync_id,
        updated_at    = EXCLUDED.updated_at,
        deleted_at    = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > staff.updated_at
       OR staff.updated_at IS NULL;
END;
$$;

-- ─── student ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_student(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO student (
        sync_id, student_id, name, gender, dob, phone, address,
        class_sync_id, parent_sync_id, created_at, updated_at, deleted_at
    )
    VALUES (
        p_row->>'sync_id',
        p_row->>'student_id',
        p_row->>'name',
        p_row->>'gender',
        p_row->>'dob',
        p_row->>'phone',
        p_row->>'address',
        p_row->>'class_sync_id',
        p_row->>'parent_sync_id',
        p_row->>'created_at',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        student_id     = EXCLUDED.student_id,
        name           = EXCLUDED.name,
        gender         = EXCLUDED.gender,
        dob            = EXCLUDED.dob,
        phone          = EXCLUDED.phone,
        address        = EXCLUDED.address,
        class_sync_id  = EXCLUDED.class_sync_id,
        parent_sync_id = EXCLUDED.parent_sync_id,
        updated_at     = EXCLUDED.updated_at,
        deleted_at     = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > student.updated_at
       OR student.updated_at IS NULL;
END;
$$;

-- ─── result ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_result(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO result (
        sync_id, student_sync_id, subject_sync_id,
        term, year, ca, exam, total, grade, remark,
        updated_at, deleted_at
    )
    VALUES (
        p_row->>'sync_id',
        p_row->>'student_sync_id',
        p_row->>'subject_sync_id',
        p_row->>'term',
        p_row->>'year',
        (p_row->>'ca')::numeric,
        (p_row->>'exam')::numeric,
        (p_row->>'total')::numeric,
        p_row->>'grade',
        p_row->>'remark',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        student_sync_id = EXCLUDED.student_sync_id,
        subject_sync_id = EXCLUDED.subject_sync_id,
        term            = EXCLUDED.term,
        year            = EXCLUDED.year,
        ca              = EXCLUDED.ca,
        exam            = EXCLUDED.exam,
        total           = EXCLUDED.total,
        grade           = EXCLUDED.grade,
        remark          = EXCLUDED.remark,
        updated_at      = EXCLUDED.updated_at,
        deleted_at      = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > result.updated_at
       OR result.updated_at IS NULL;
END;
$$;

-- ─── payment ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_payment(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO payment (
        sync_id, student_sync_id, term, year, fee_type,
        amount, paid, balance, date_paid, created_at,
        updated_at, deleted_at
    )
    VALUES (
        p_row->>'sync_id',
        p_row->>'student_sync_id',
        p_row->>'term',
        p_row->>'year',
        p_row->>'fee_type',
        (p_row->>'amount')::numeric,
        (p_row->>'paid')::numeric,
        (p_row->>'balance')::numeric,
        p_row->>'date_paid',
        p_row->>'created_at',
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        student_sync_id = EXCLUDED.student_sync_id,
        term            = EXCLUDED.term,
        year            = EXCLUDED.year,
        fee_type        = EXCLUDED.fee_type,
        amount          = EXCLUDED.amount,
        paid            = EXCLUDED.paid,
        balance         = EXCLUDED.balance,
        date_paid       = EXCLUDED.date_paid,
        updated_at      = EXCLUDED.updated_at,
        deleted_at      = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > payment.updated_at
       OR payment.updated_at IS NULL;
END;
$$;

-- ─── ca_score_entry ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_upsert_ca_score_entry(p_row jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO ca_score_entry (
        sync_id, student_sync_id, subject_sync_id,
        term, year, assessment_type, score, max_score,
        updated_at, deleted_at
    )
    VALUES (
        p_row->>'sync_id',
        p_row->>'student_sync_id',
        p_row->>'subject_sync_id',
        p_row->>'term',
        p_row->>'year',
        p_row->>'assessment_type',
        (p_row->>'score')::numeric,
        (p_row->>'max_score')::numeric,
        (p_row->>'updated_at')::timestamptz,
        (p_row->>'deleted_at')::timestamptz
    )
    ON CONFLICT (sync_id) DO UPDATE SET
        student_sync_id = EXCLUDED.student_sync_id,
        subject_sync_id = EXCLUDED.subject_sync_id,
        term            = EXCLUDED.term,
        year            = EXCLUDED.year,
        assessment_type = EXCLUDED.assessment_type,
        score           = EXCLUDED.score,
        max_score       = EXCLUDED.max_score,
        updated_at      = EXCLUDED.updated_at,
        deleted_at      = EXCLUDED.deleted_at
    WHERE EXCLUDED.updated_at > ca_score_entry.updated_at
       OR ca_score_entry.updated_at IS NULL;
END;
$$;
