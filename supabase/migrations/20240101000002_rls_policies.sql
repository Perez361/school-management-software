-- ============================================================
-- Migration: 20240101000002_rls_policies.sql
--
-- Row Level Security for the sync tables.
-- The sync engine authenticates using the anon key, so we
-- grant full access to the anon role via RLS policies.
-- Tighten these if you add Supabase Auth in the future.
-- ============================================================

-- Enable RLS on all sync tables
ALTER TABLE class          ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE student        ENABLE ROW LEVEL SECURITY;
ALTER TABLE result         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_score_entry ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write on all tables (sync engine uses anon key)
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'class','parent','subject','staff',
        'student','result','payment','ca_score_entry'
    ] LOOP
        EXECUTE format(
            'CREATE POLICY "anon_all_%s" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)',
            t, t
        );
    END LOOP;
END;
$$;

-- Allow anon to execute the sync RPC functions
GRANT EXECUTE ON FUNCTION sync_upsert_class         TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_parent        TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_subject       TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_staff         TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_student       TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_result        TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_payment       TO anon;
GRANT EXECUTE ON FUNCTION sync_upsert_ca_score_entry TO anon;
