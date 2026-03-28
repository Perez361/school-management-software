"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-light p-8">
      {/* Card container */}
      <div className="text-center bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        {/* School logo */}
        <div className="mb-4">
          <Image
            src="/img/school-logo.png" // replace with your logo path
            alt="School Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
        </div>

        <h1 className="text-3xl font-bold mb-2">Ada Senior High School</h1>
        <p className="mb-8 text-gray-600">Please select your login type:</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/login/admin")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            Admin Login
          </button>

          <button
            onClick={() => router.push("/login/staff")}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}