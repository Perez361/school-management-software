# Tauri Migration Guide — SchoolDesk SMS

## What Changed & Why

Your app used Next.js API routes + Prisma, which require a Node.js server at
runtime. Tauri desktop apps ship a static frontend — there is no server. All
database and backend logic must live in Rust (Tauri commands).

---

## Architecture After Migration

```
Before:                          After:
┌─────────────────────────┐      ┌──────────────────────────────┐
│  Next.js (server)        │      │  Next.js (static export)      │
│  ├─ pages/               │      │  ├─ app/ (client components)  │
│  ├─ app/api/routes       │ ───► │  └─ lib/tauri.ts (invoke)     │
│  └─ Prisma + SQLite      │      │                               │
└─────────────────────────┘      │  Tauri (Rust)                 │
                                  │  ├─ src/commands.rs           │
                                  │  ├─ src/db.rs (rusqlite)      │
                                  │  └─ src/models.rs             │
                                  └──────────────────────────────┘
```

---

## Step-by-Step Migration Checklist

### 1. Replace files in your project

Copy these files from the migration folder into your project root, overwriting
the originals:

| Migration file                        | Destination                        |
|--------------------------------------|------------------------------------|
| `src-tauri/src/lib.rs`               | `src-tauri/src/lib.rs`             |
| `src-tauri/src/commands.rs`          | `src-tauri/src/commands.rs` (NEW)  |
| `src-tauri/src/db.rs`                | `src-tauri/src/db.rs` (NEW)        |
| `src-tauri/src/models.rs`            | `src-tauri/src/models.rs` (NEW)    |
| `src-tauri/Cargo.toml`               | `src-tauri/Cargo.toml`             |
| `lib/tauri.ts`                       | `lib/tauri.ts` (NEW)               |
| `lib/auth-context.tsx`               | `lib/auth-context.tsx` (NEW)       |
| `next.config.ts`                     | `next.config.ts`                   |
| `app/layout.tsx`                     | `app/layout.tsx`                   |
| `app/(app)/layout.tsx`               | `app/(app)/layout.tsx`             |
| `app/login/admin/page.tsx`           | `app/login/admin/page.tsx`         |
| `components/layout/Sidebar.tsx`      | `components/layout/Sidebar.tsx`    |
| `app/(app)/billing/page.tsx`         | `app/(app)/billing/page.tsx`       |
| `app/(app)/billing/new/page.tsx`     | `app/(app)/billing/new/page.tsx`   |

### 2. Delete files that are no longer needed

```bash
# Delete all API routes — they won't work in static export
rm -rf app/api/

# Delete the middleware (cookie-based auth replaced by localStorage)
rm middleware.ts

# Delete Prisma (replaced by rusqlite in Rust)
rm -rf prisma/
rm lib/prisma.ts

# Remove Prisma/SQLite Node packages
npm uninstall @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3 jose
```

### 3. Install the Tauri JS API package

```bash
npm install @tauri-apps/api
```

### 4. Update tauri.conf.json

Your `src-tauri/tauri.conf.json` already has `"frontendDist": "../.next"` —
change it to `"frontendDist": "../out"` since static export goes to `/out`:

```json
"build": {
  "frontendDist": "../out",
  "devUrl": "http://localhost:3000",
  "beforeDevCommand": "npm run dev",
  "beforeBuildCommand": "npm run build"
}
```

### 5. Migrate remaining pages (pattern to follow)

Every page that was a **server component** calling `prisma` directly must
become a **client component** calling `api.*` from `lib/tauri.ts`.

**Pattern:**
```tsx
// BEFORE (server component)
import { prisma } from '@/lib/prisma'
export default async function StudentsPage() {
  const students = await prisma.student.findMany({ include: { class: true } })
  return <Table data={students} />
}

// AFTER (client component)
'use client'
import { useState, useEffect } from 'react'
import { api, Student } from '@/lib/tauri'
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  useEffect(() => { api.getStudents().then(setStudents) }, [])
  return <Table data={students} />
}
```

Pages that need migrating (apply same pattern):
- `app/(app)/students/page.tsx`         → use `api.getStudents()`
- `app/(app)/students/new/page.tsx`     → use `api.createStudent()`
- `app/(app)/students/[id]/page.tsx`    → use `api.getStudent(id)`
- `app/(app)/students/[id]/edit/page.tsx` → use `api.getStudent()` + `api.updateStudent()`
- `app/(app)/classes/page.tsx`          → use `api.getClasses()`
- `app/(app)/classes/new/page.tsx`      → use `api.createClass()`
- `app/(app)/parents/page.tsx`          → use `api.getParents()`
- `app/(app)/parents/new/page.tsx`      → use `api.createParent()`
- `app/(app)/staff/page.tsx`            → use `api.getStaff()`
- `app/(app)/staff/new/page.tsx`        → use `api.createStaff()`
- `app/(app)/results/page.tsx`          → use `api.getResults()`
- `app/(app)/results/enter/page.tsx`    → use `api.getResults()` + `api.upsertResult()`
- `app/(app)/dashboard/page.tsx`        → use `api.getDashboardStats()` + `api.getTopStudents()`
- `app/(app)/settings/page.tsx`         → use `api.getSettings()` + `api.upsertSettings()`
- `app/(app)/reports/ReportActions.tsx` → use `api.getStudents()` + `api.getReportCard()`

### 6. Fix `searchParams` in dynamic routes

Static export doesn't support server-side `searchParams`. Replace:
```tsx
// BEFORE
export default async function Page({ searchParams }: { searchParams: Promise<{...}> }) {
  const { classId } = await searchParams
```
With:
```tsx
// AFTER
'use client'
import { useSearchParams } from 'next/navigation'
export default function Page() {
  const searchParams = useSearchParams()
  const classId = searchParams.get('classId')
```

### 7. Fix dynamic route segments `[id]`

Add `generateStaticParams` **or** use `useParams()` client-side:
```tsx
'use client'
import { useParams } from 'next/navigation'
export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  // ...
}
```

### 8. Build and run

```bash
# Development (hot reload)
npm run tauri dev

# Production build
npm run tauri build
```

---

## Auth Changes

| Before                          | After                              |
|--------------------------------|------------------------------------|
| JWT in httpOnly cookie          | User object in localStorage        |
| `middleware.ts` guards routes   | `useAuth()` hook + redirect in layout |
| `fetch('/api/auth/login')`      | `api.login(email, password)`       |
| `fetch('/api/auth/logout')`     | `logout()` from `useAuth()`        |

---

## Database

The SQLite database is now managed entirely by Rust (`rusqlite` with bundled
SQLite). The database file is stored at:

- **macOS**: `~/Library/Application Support/com.adahigh.sms/school.db`
- **Windows**: `%APPDATA%\com.adahigh.sms\school.db`
- **Linux**: `~/.local/share/com.adahigh.sms/school.db`

To migrate existing data from your Prisma SQLite (`school.db`), simply copy
that file to the above path — the schema is identical.

---

## Seed Data

The Rust `db.rs` auto-creates the admin user (`admin@school.com` / `admin123`)
on first run. To seed classes, subjects etc., either use the app UI or add
extra seed logic to `run_migrations()` in `src-tauri/src/db.rs`.

---

## PDF Generation (Reports)

`ReportActions.tsx` still uses `jspdf` on the frontend — this works fine in
Tauri since it runs in a Chromium WebView. No changes needed there, just update
the data fetching from `fetch('/api/...')` to `api.getStudents()` etc.
