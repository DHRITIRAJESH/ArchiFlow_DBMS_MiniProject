"use client";
import { useEffect, useState } from "react";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

function barColor(pct) {
  if (pct >= 100) return "bg-red-600";
  if (pct >= 80) return "bg-amber-500";
  return "bg-green-600";
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setErr("Could not load dashboard data."));
  }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p>Loading...</p>;

  const { summary, projects } = data;
  const cards = [
    ["Projects", summary.total_projects],
    ["Total budget", money(summary.total_budget)],
    ["Total spent", money(summary.total_spent)],
    ["Projects at 80%+ of budget", summary.near_limit],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Budget dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-xl font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Project</th>
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Budget</th>
              <th className="p-3 text-right">Spent</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 w-48">Used</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.project_id} className="border-t">
                <td className="p-3 font-medium">{p.project_name}</td>
                <td className="p-3">{p.client_name}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 text-right">{money(p.budget)}</td>
                <td className="p-3 text-right">{money(p.spent)}</td>
                <td className="p-3 text-right">{money(p.remaining)}</td>
                <td className="p-3">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className={`h-2 rounded ${barColor(p.pct_used)}`}
                      style={{ width: `${Math.min(p.pct_used, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{p.pct_used}%</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
