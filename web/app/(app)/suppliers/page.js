"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  rating: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Bumped after add / edit to reload the list
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.user?.role === "ADMIN"));
  }, []);

  // Debounced like the clients page; reruns on search text or reloadKey
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const res = await fetch(`/api/suppliers?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load suppliers.");
        }

        setSuppliers(data.suppliers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, reloadKey]);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(supplier) {
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      city: supplier.city || "",
      rating: supplier.rating === null ? "" : String(supplier.rating),
    });

    setEditingId(supplier.supplier_id);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `/api/suppliers/${editingId}`
        : "/api/suppliers";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save supplier.");
      }

      setMessage(
        editingId
          ? "Supplier updated successfully."
          : "Supplier added successfully."
      );

      closeForm();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Suppliers</h1>
          <p className="text-gray-500 mt-1">
            Suppliers, their ratings and how many materials they offer.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddForm}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Add supplier
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      <div className="mb-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or city..."
          className="w-full max-w-md border rounded-lg px-4 py-2"
        />
      </div>

      {showForm && isAdmin && (
        <div className="mb-6 border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit supplier" : "Add supplier"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              maxLength={120}
              required
              className="border rounded-lg px-4 py-2"
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border rounded-lg px-4 py-2"
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="border rounded-lg px-4 py-2"
            />

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="border rounded-lg px-4 py-2"
            />

            <input
              name="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={handleChange}
              placeholder="Rating (0–5, optional)"
              className="border rounded-lg px-4 py-2"
            />

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add supplier"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="border px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Rating</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Materials</th>
              {isAdmin && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  Loading suppliers...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.supplier_id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/suppliers/${supplier.supplier_id}`}
                      className="hover:underline"
                    >
                      {supplier.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{supplier.city || "—"}</td>
                  <td className="px-4 py-3">
                    {supplier.rating === null
                      ? "—"
                      : `${supplier.rating.toFixed(1)} / 5`}
                  </td>
                  <td className="px-4 py-3">{supplier.phone || "—"}</td>
                  <td className="px-4 py-3">{supplier.email || "—"}</td>
                  <td className="px-4 py-3">{supplier.material_count}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(supplier)}
                          className="border px-3 py-1.5 rounded-lg"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
