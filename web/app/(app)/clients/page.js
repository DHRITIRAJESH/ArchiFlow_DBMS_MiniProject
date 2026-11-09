"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadClients(searchText = search) {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (searchText.trim()) {
        params.set("search", searchText.trim());
      }

      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load clients.");
      }

      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(client) {
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      city: client.city || "",
    });

    setEditingId(client.client_id);
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
        ? `/api/clients/${editingId}`
        : "/api/clients";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save client.");
      }

      setMessage(
        editingId
          ? "Client updated successfully."
          : "Client added successfully."
      );

      closeForm();
      await loadClients(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    const confirmed = window.confirm(
      `Delete client "${client.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/clients/${client.client_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete client.");
      }

      setMessage("Client deleted successfully.");
      await loadClients(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-gray-500 mt-1">
            Manage project clients and their contact details.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Add client
        </button>
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
          placeholder="Search by name, email, phone or city..."
          className="w-full max-w-md border rounded-lg px-4 py-2"
        />
      </div>

      {showForm && (
        <div className="mb-6 border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit client" : "Add client"}
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
                    : "Add client"}
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

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Projects</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.client_id}
                  className="border-t"
                >
                  <td className="px-4 py-3 font-medium">
                    {client.name}
                  </td>

                  <td className="px-4 py-3">
                    {client.email || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {client.phone || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {client.city || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {client.project_count}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(client)}
                        className="border px-3 py-1.5 rounded-lg"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(client)}
                        className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
