# Supabase Cloud Sync

This folder contains the Supabase PostgreSQL migrations for the offline-first sync system.

## Folder structure

```
supabase/
  migrations/
    20240101000000_create_sync_tables.sql   — 8 sync tables (class, parent, subject, staff,
                                              student, result, payment, ca_score_entry)
    20240101000001_sync_rpc_functions.sql   — sync_upsert_* RPC functions (last-write-wins)
    20240101000002_rls_policies.sql         — Row Level Security (anon full access)
```

## Applying migrations

### Option A — Supabase Dashboard (quickest)
1. Open your Supabase project → **SQL Editor**
2. Paste and run each `.sql` file in order (000000 → 000001 → 000002)

### Option B — Supabase CLI
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Adding a new column to an existing table

When you add a column to a table in `db.rs`, create a new migration file:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_<column>_to_<table>.sql

ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <column> <type>;
```

Then update the relevant `sync_upsert_<table>` function in a new migration to include the new column in the INSERT/UPDATE.

## Schema design notes

- `sync_id TEXT UNIQUE` is the stable cross-device identifier on every table
- Integer FK columns are replaced by `*_sync_id TEXT` to avoid ordering conflicts
- `updated_at TIMESTAMPTZ` drives last-write-wins conflict resolution
- `deleted_at TIMESTAMPTZ` implements soft deletes — rows are never hard-deleted
- Pull queries filter `?updated_at=gt.<watermark>` via PostgREST
- Push uses `POST /rest/v1/rpc/sync_upsert_<table>` with `{ "p_row": {...} }`
