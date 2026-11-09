"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const units = ["sqft", "sqm", "piece", "kg", "litre", "rft", "bag"];
const maintenanceLevels = ["LOW", "MEDIUM", "HIGH"];

const emptyForm = {
  category_id: "",
  name: "",
  description: "",
  unit: "",
  durability_rating: "",
  maintenance_level: "",
};

// Shared add/edit form. Pass `id` to edit an existing material.
// The UI hides this form from non-admins; the API also rejects them (403).
export default function MaterialForm({ id }) {
  const router = useRouter();
  const editing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const requests = [
          fetch("/api/auth/me"),
          fetch("/api/materials/options"),
        ];
        if (editing) requests.push(fetch(`/api/materials/${id}`));

        const responses = await Promise.all(requests);
        const [meData, optionsData, materialData] = await Promise.all(
          responses.map((res) => res.json())
        );

        setIsAdmin(meData.user?.role === "ADMIN");

        if (!responses[1].ok) {
          throw new Error(optionsData.error || "Could not load categories.");
        }
        setCategories(optionsData.categories);

        if (editing) {
          if (!responses[2].ok) {
            throw new Error(materialData.error || "Could not load material.");
          }

          const material = materialData.material;
          setForm({
            category_id: String(material.category_id),
            name: material.name || "",
            description: material.description || "",
            unit: material.unit || "",
            durability_rating: String(material.durability_rating),
            maintenance_level: material.maintenance_level || "",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, editing]);

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
      const response = await fetch(
        editing ? `/api/materials/${id}` : "/api/materials",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save material.");
      }

      router.push(`/materials/${editing ? id : data.material_id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const backHref = editing ? `/materials/${id}` : "/materials";

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link href={backHref} className="text-sm text-gray-500 hover:underline">
          ← Back
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          Only admins can add or edit materials.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-gray-500 hover:underline">
          ← {editing ? "Back to material" : "Back to materials"}
        </Link>

        <h1 className="text-2xl font-bold mt-3">
          {editing ? "Edit material" : "Add material"}
        </h1>

        <p className="text-gray-500 mt-1">
          {editing
            ? "Update this material's details."
            : "Add a new material to the catalogue."}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Material name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Vitrified tile 600x600"
              maxLength={120}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            placeholder="Properties, finish, where it works well..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for keyword search and semantic search, so be descriptive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Durability rating (1–5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              step="1"
              value={form.durability_rating}
              onChange={(e) => update("durability_rating", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. 4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Maintenance level
            </label>
            <select
              value={form.maintenance_level}
              onChange={(e) => update("maintenance_level", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select level</option>
              {maintenanceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href={backHref} className="px-4 py-2 rounded-lg border">
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Add material"}
          </button>
        </div>
      </form>
    </div>
  );
}
