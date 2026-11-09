"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

const statuses = [
  "ALL",
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const url =
      status === "ALL"
        ? "/api/projects"
        : `/api/projects?status=${status}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not load projects");
        }
        return res.json();
      })
      .then((data) => setProjects(data.projects))
      .catch(() => setError("Could not load projects."))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 mt-1">
            Manage projects, budgets and material usage.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Add project
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`px-4 py-2 rounded-lg border text-sm ${
              status === item
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading && <p>Loading projects...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Client</th>
                <th className="p-3">Type</th>
                <th className="p-3">Location</th>
                <th className="p-3">Lead Architect</th>
                <th className="p-3 text-right">Budget</th>
                <th className="p-3 text-right">Spent</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.project_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">
                    <Link
                      href={`/projects/${project.project_id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>

                  <td className="p-3">{project.client_name}</td>

                  <td className="p-3">{project.project_type}</td>

                  <td className="p-3">{project.location}</td>

                  <td className="p-3">
                    {project.lead_architect_name}
                  </td>

                  <td className="p-3 text-right">
                    {money(project.budget)}
                  </td>

                  <td className="p-3 text-right">
                    {money(project.spent)}
                  </td>

                  <td className="p-3">
                    {project.status.replace("_", " ")}
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="p-6 text-center text-gray-500"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
