"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN");

export default function ProjectDetailClient({ id }) {

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not load project");
        }
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Could not load project."));
  }, [id]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p>Loading project...</p>;
  }

  const { project, usage, categorySpend } = data;

  const remaining = project.budget - project.spent;

  const percentUsed =
    project.budget > 0
      ? (project.spent / project.budget) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/projects"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to projects
          </Link>

          <h1 className="text-2xl font-bold mt-2">
            {project.name}
          </h1>

          <p className="text-gray-500 mt-1">
            {project.client_name} · {project.location}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/projects/${project.project_id}/edit`}
            className="border px-4 py-2 rounded-lg"
          >
            Edit project
          </Link>

          <Link
            href={`/projects/${project.project_id}/usage/new`}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Record usage
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Budget</div>
          <div className="text-xl font-semibold mt-1">
            {money(project.budget)}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Spent</div>
          <div className="text-xl font-semibold mt-1">
            {money(project.spent)}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="text-xl font-semibold mt-1">
            {money(remaining)}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Budget used</div>
          <div className="text-xl font-semibold mt-1">
            {percentUsed.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">
          Project details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium mt-1">
              {project.project_type}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Area</div>
            <div className="font-medium mt-1">
              {project.area_sqft?.toLocaleString("en-IN")} sqft
            </div>
          </div>

          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium mt-1">
              {project.status.replace("_", " ")}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Lead Architect</div>
            <div className="font-medium mt-1">
              {project.lead_architect_name}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Start Date</div>
            <div className="font-medium mt-1">
              {formatDate(project.start_date)}
            </div>
          </div>

          <div>
            <div className="text-gray-500">End Date</div>
            <div className="font-medium mt-1">
              {project.end_date ? formatDate(project.end_date) : "—"}
            </div>
          </div>
        </div>

        {project.description && (
          <div className="mt-5">
            <div className="text-gray-500 text-sm">Description</div>
            <p className="mt-1 text-sm">{project.description}</p>
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">
          Spend by category
        </h2>

        {categorySpend.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No material usage recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {categorySpend.map((category) => {
              const percentage =
                project.spent > 0
                  ? (category.spent / project.spent) * 100
                  : 0;

              return (
                <div key={category.category_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.category_name}</span>
                    <span className="font-medium">
                      {money(category.spent)}
                    </span>
                  </div>

                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-black rounded"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% of recorded spend
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-white overflow-x-auto">
        <div className="p-5">
          <h2 className="text-lg font-semibold">Material usage</h2>
          <p className="text-sm text-gray-500 mt-1">
            {usage.length} usage records
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Material</th>
              <th className="p-3">Category</th>
              <th className="p-3">Supplier</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3">Area</th>
              <th className="p-3">Used On</th>
            </tr>
          </thead>

          <tbody>
            {usage.map((row) => (
              <tr key={row.usage_id} className="border-t">
                <td className="p-3 font-medium">{row.material_name}</td>
                <td className="p-3">{row.category_name}</td>
                <td className="p-3">{row.supplier_name}</td>
                <td className="p-3 text-right">
                  {row.quantity.toLocaleString("en-IN")} {row.unit}
                </td>
                <td className="p-3 text-right">
                  {money(row.unit_price)}
                </td>
                <td className="p-3 text-right">
                  {money(row.line_total)}
                </td>
                <td className="p-3">{row.area_applied || "—"}</td>
                <td className="p-3">{formatDate(row.used_on)}</td>
              </tr>
            ))}

            {usage.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="p-6 text-center text-gray-500"
                >
                  No material usage recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
