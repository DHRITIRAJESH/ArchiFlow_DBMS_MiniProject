"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-6 bg-gray-900 text-white px-6 py-3">
      <span className="font-bold">ArchiFlow</span>
      <Link href="/dashboard" className="hover:underline">Dashboard</Link>
      <Link href="/clients" className="hover:underline">Clients</Link>
      <div className="ml-auto flex items-center gap-4 text-sm">
        {user && <span>{user.name} ({user.role})</span>}
        <button onClick={logout} className="bg-red-600 px-3 py-1 rounded">Logout</button>
      </div>
    </nav>
  );
}
