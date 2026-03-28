"use client";

import Link from "next/link";

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">
          Staff Login
        </h1>

        <form className="flex flex-col gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="staff@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="********" />
          </div>

          <button type="submit" className="btn-primary mt-4">
            Login
          </button>
        </form>

        {/* Back button */}
        <div className="mt-6 text-center">
          <Link href="/" className="btn-secondary">
            ← Back to Welcome
          </Link>
        </div>
      </div>
    </div>
  );
}