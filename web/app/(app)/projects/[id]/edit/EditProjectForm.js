"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const types = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "HOSPITALITY",
  "INSTITUTIONAL",
  "INTERIOR",
];

const statuses = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
];

export default function EditProjectForm({ id }) {
  const router = useRouter();

  const [clients, setClients] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    lead_architect_id: "",
    name: "",
    description: "",
    project_type: "",
    location: "",
    area_sqft: "",
    status: "PLANNING",
    budget: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [projectResponse, optionsResponse] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch("/api/projects/options"),
        ]);

        const projectData = await projectResponse.json();
        const optionsData = await optionsResponse.json();

        if (!projectResponse.ok) {
          throw new Error(projectData.error || "Could not load project.");
        }

        if (!optionsResponse.ok) {
          throw new Error(
            optionsData.error || "Could not load project options."
          );
        }

        const project = projectData.project;

        setClients(optionsData.clients);
        setArchitects(optionsData.architects);

        setForm({
          client_id: String(project.client_id),
          lead_architect_id: String(project.lead_architect_id),
          name: project.name || "",
          description: project.description || "",
          project_type: project.project_type || "",
          location: project.location || "",
          area_sqft:
            project.area_sqft === null || project.area_sqft === undefined
              ? ""
              : String(project.area_sqft),
          status: project.status || "PLANNING",
          budget:
            project.budget === null || project.budget === undefined
              ? ""
              : String(project.budget),
          start_date: project.start_date
            ? String(project.start_date).slice(0, 10)
            : "",
          end_date: project.end_date
            ? String(project.end_date).slice(0, 10)
            : "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update project.");
      }

      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to project
        </Link>

        <h1 className="text-2xl font-bold mt-3">Edit project</h1>

        <p className="text-gray-500 mt-1">
          Update the project details.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border rounded-lg bg-white p-6 space-y-5"
      >
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Project name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Client
          </label>
          <select
            value={form.client_id}
            onChange={(e) => update("client_id", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Lead architect
          </label>
          <select
            value={form.lead_architect_id}
            onChange={(e) =>
              update("lead_architect_id", e.target.value)
            }
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select lead architect</option>
            {architects.map((architect) => (
              <option key={architect.user_id} value={architect.user_id}>
                {architect.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Project type
          </label>
          <select
            value={form.project_type}
            onChange={(e) =>
              update("project_type", e.target.value)
            }
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select type</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              update("description", e.target.value)
            }
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) =>
                update("location", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Area (sqft)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.area_sqft}
              onChange={(e) =>
                update("area_sqft", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Budget
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.budget}
              onChange={(e) =>
                update("budget", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                update("start_date", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              End date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) =>
                update("end_date", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/projects/${id}`}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
