#!/usr/bin/env bash
# migrate.sh — Run from your project root to apply the Tauri migration
# Usage: bash migrate.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     SchoolDesk SMS — Tauri Migration Script          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Safety check ──────────────────────────────────────────────────────────
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "❌  Run this script from the project root (where package.json lives)."
  exit 1
fi

echo "▶  Step 1: Removing server-only files..."
rm -rf "$PROJECT_ROOT/app/api"
rm -f  "$PROJECT_ROOT/middleware.ts"
rm -f  "$PROJECT_ROOT/lib/prisma.ts"
rm -rf "$PROJECT_ROOT/prisma"
echo "   ✅  Removed: app/api/, middleware.ts, lib/prisma.ts, prisma/"

# ── 2. npm packages ───────────────────────────────────────────────────────────
echo ""
echo "▶  Step 2: Updating npm packages..."
npm uninstall @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3 jose 2>/dev/null || true
npm install @tauri-apps/api
echo "   ✅  Installed @tauri-apps/api, removed Prisma/jose"

# ── 3. Copy migrated source files ─────────────────────────────────────────────
MIGRATION_DIR="$PROJECT_ROOT/migration"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo ""
  echo "❌  migration/ folder not found next to this script."
  echo "    Place the migration/ directory in: $PROJECT_ROOT"
  exit 1
fi

echo ""
echo "▶  Step 3: Copying migrated source files..."

# Helper: copy a file, creating parent dirs as needed
copy_file() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "   → $dst"
}

# Rust backend
copy_file "$MIGRATION_DIR/src-tauri/Cargo.toml"           "$PROJECT_ROOT/src-tauri/Cargo.toml"
copy_file "$MIGRATION_DIR/src-tauri/src/lib.rs"           "$PROJECT_ROOT/src-tauri/src/lib.rs"
copy_file "$MIGRATION_DIR/src-tauri/src/commands.rs"      "$PROJECT_ROOT/src-tauri/src/commands.rs"
copy_file "$MIGRATION_DIR/src-tauri/src/db.rs"            "$PROJECT_ROOT/src-tauri/src/db.rs"
copy_file "$MIGRATION_DIR/src-tauri/src/models.rs"        "$PROJECT_ROOT/src-tauri/src/models.rs"
copy_file "$MIGRATION_DIR/src-tauri/tauri.conf.json"      "$PROJECT_ROOT/src-tauri/tauri.conf.json"

# Next.js config + layouts
copy_file "$MIGRATION_DIR/next.config.ts"                  "$PROJECT_ROOT/next.config.ts"
copy_file "$MIGRATION_DIR/app/layout.tsx"                  "$PROJECT_ROOT/app/layout.tsx"
copy_file "$MIGRATION_DIR/app/(app)/layout.tsx"            "$PROJECT_ROOT/app/(app)/layout.tsx"

# Lib
copy_file "$MIGRATION_DIR/lib/tauri.ts"                    "$PROJECT_ROOT/lib/tauri.ts"
copy_file "$MIGRATION_DIR/lib/auth-context.tsx"            "$PROJECT_ROOT/lib/auth-context.tsx"

# Components
copy_file "$MIGRATION_DIR/components/layout/Sidebar.tsx"   "$PROJECT_ROOT/components/layout/Sidebar.tsx"

# Auth
copy_file "$MIGRATION_DIR/app/login/admin/page.tsx"        "$PROJECT_ROOT/app/login/admin/page.tsx"

# App pages
copy_file "$MIGRATION_DIR/app/(app)/billing/page.tsx"              "$PROJECT_ROOT/app/(app)/billing/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/billing/new/page.tsx"          "$PROJECT_ROOT/app/(app)/billing/new/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/classes/page.tsx"              "$PROJECT_ROOT/app/(app)/classes/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/classes/ClassCard.tsx"         "$PROJECT_ROOT/app/(app)/classes/ClassCard.tsx"
copy_file "$MIGRATION_DIR/app/(app)/classes/new/page.tsx"          "$PROJECT_ROOT/app/(app)/classes/new/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/dashboard/page.tsx"            "$PROJECT_ROOT/app/(app)/dashboard/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/parents/page.tsx"              "$PROJECT_ROOT/app/(app)/parents/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/parents/new/page.tsx"          "$PROJECT_ROOT/app/(app)/parents/new/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/reports/page.tsx"              "$PROJECT_ROOT/app/(app)/reports/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/reports/ReportActions.tsx"     "$PROJECT_ROOT/app/(app)/reports/ReportActions.tsx"
copy_file "$MIGRATION_DIR/app/(app)/results/page.tsx"              "$PROJECT_ROOT/app/(app)/results/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/results/enter/page.tsx"        "$PROJECT_ROOT/app/(app)/results/enter/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/settings/page.tsx"             "$PROJECT_ROOT/app/(app)/settings/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/staff/page.tsx"                "$PROJECT_ROOT/app/(app)/staff/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/staff/new/page.tsx"            "$PROJECT_ROOT/app/(app)/staff/new/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/students/page.tsx"             "$PROJECT_ROOT/app/(app)/students/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/students/new/page.tsx"         "$PROJECT_ROOT/app/(app)/students/new/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/students/[id]/page.tsx"        "$PROJECT_ROOT/app/(app)/students/[id]/page.tsx"
copy_file "$MIGRATION_DIR/app/(app)/students/[id]/edit/page.tsx"   "$PROJECT_ROOT/app/(app)/students/[id]/edit/page.tsx"

echo "   ✅  All source files copied"

# ── 4. Remove old API-route files that should no longer be called ─────────────
echo ""
echo "▶  Step 4: Removing leftover server-side settings files..."
rm -f "$PROJECT_ROOT/app/(app)/settings/SettingsForm.tsx"
echo "   ✅  Removed standalone SettingsForm.tsx (merged into settings/page.tsx)"

# ── 5. Migrate existing SQLite data (optional) ────────────────────────────────
echo ""
echo "▶  Step 5: Checking for existing Prisma database to migrate..."
OLD_DB="$PROJECT_ROOT/school.db"
if [ -f "$OLD_DB" ]; then
  # Detect platform data directory
  case "$(uname)" in
    Darwin)  DATA_DIR="$HOME/Library/Application Support/com.adahigh.sms" ;;
    Linux)   DATA_DIR="$HOME/.local/share/com.adahigh.sms" ;;
    MINGW*|MSYS*|CYGWIN*)  DATA_DIR="$APPDATA/com.adahigh.sms" ;;
    *)       DATA_DIR="$HOME/.sms" ;;
  esac
  mkdir -p "$DATA_DIR"
  cp "$OLD_DB" "$DATA_DIR/school.db"
  echo "   ✅  Copied existing school.db → $DATA_DIR/school.db"
  echo "   ℹ   Your existing data (students, results, payments) is preserved!"
else
  echo "   ℹ   No existing school.db found — a fresh database will be created on first run."
fi

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  Migration complete!                             ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Development:   npm run tauri dev                   ║"
echo "║  Production:    npm run tauri build                  ║"
echo "║                                                      ║"
echo "║  Login:  admin@school.com / admin123                 ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
