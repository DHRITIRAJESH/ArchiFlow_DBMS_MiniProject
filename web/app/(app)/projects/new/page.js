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

export default function NewProjectPage() {
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
    async function loadOptions() {
      try {
        const response = await fetch("/api/projects/options");

        if (!response.ok) {
          throw new Error("Could not load project options.");
        }

        const data = await response.json();

        setClients(data.clients);
        setArchitects(data.architects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

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
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create project.");
      }

      router.push(`/projects/${data.project_id}`);
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
          href="/projects"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to projects
        </Link>

        <h1 className="text-2xl font-bold mt-3">
          Add project
        </h1>

        <p className="text-gray-500 mt-1">
          Create a new architecture project.
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
            placeholder="e.g. Riverside Villa"
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
            onChange={(e) => update("project_type", e.target.value)}
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
            onChange={(e) => update("description", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            placeholder="Describe the project..."
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
              onChange={(e) => update("location", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Bengaluru"
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
              onChange={(e) => update("area_sqft", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. 5000"
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
              onChange={(e) => update("budget", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. 5000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
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
              onChange={(e) => update("start_date", e.target.value)}
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
              onChange={(e) => update("end_date", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/projects"
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}
