"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const emptyOffer = {
  material_id: "",
  unit_price: "",
  lead_time_days: "7",
};

export default function SupplierDetailClient({ id }) {
  const [data, setData] = useState(null);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [newOffer, setNewOffer] = useState(emptyOffer);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editForm, setEditForm] = useState({ unit_price: "", lead_time_days: "" });

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Saved in MySQL but Qdrant (semantic search) wasn't updated
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  // Bumped after every add / edit / remove to reload the page data
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const [supplierRes, optionsRes] = await Promise.all([
          fetch(`/api/suppliers/${id}`),
          fetch(`/api/suppliers/${id}/offers/options`),
        ]);

        const supplierData = await supplierRes.json();
        const optionsData = await optionsRes.json();

        if (!supplierRes.ok) {
          throw new Error(supplierData.error || "Could not load supplier.");
        }

        setData(supplierData);
        setAvailableMaterials(optionsRes.ok ? optionsData.materials : []);
      } catch (err) {
        setLoadError(err.message);
      }
    }

    loadData();
  }, [id, reloadKey]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.user?.role === "ADMIN"));
  }, []);

  // Sends a request, shows the API's message, then reloads the page data
  async function send(url, method, body, fallbackError) {
    setSaving(true);
    setError("");
    setMessage("");
    setWarning("");

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || fallbackError);
      }

      setMessage(result.message);
      setWarning(result.warning || "");
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOffer(event) {
    event.preventDefault();

    const ok = await send(
      `/api/suppliers/${id}/offers`,
      "POST",
      newOffer,
      "Could not add offer."
    );

    if (ok) setNewOffer(emptyOffer);
  }

  function startEdit(offer) {
    setEditingMaterialId(offer.material_id);
    setEditForm({
      unit_price: String(offer.unit_price),
      lead_time_days: String(offer.lead_time_days),
    });
    setError("");
    setMessage("");
  }

  async function handleSaveEdit(materialId) {
    const ok = await send(
      `/api/suppliers/${id}/offers/${materialId}`,
      "PUT",
      editForm,
      "Could not update offer."
    );

    if (ok) setEditingMaterialId(null);
  }

  async function handleRemove(offer) {
    const confirmed = window.confirm(
      `Remove "${offer.material_name}" from ${data.supplier.name}'s offers?\n\n` +
        "This also deletes the price history for this offer."
    );

    if (!confirmed) return;

    await send(
      `/api/suppliers/${id}/offers/${offer.material_id}`,
      "DELETE",
      null,
      "Could not remove offer."
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/suppliers" className="text-sm text-gray-500 hover:underline">
          ← Back to suppliers
        </Link>
        <p className="text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return <p>Loading supplier...</p>;
  }

  const { supplier, offers } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/suppliers"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to suppliers
          </Link>

          <h1 className="text-2xl font-bold mt-2">{supplier.name}</h1>

          <p className="text-gray-500 mt-1">
            {[supplier.city, supplier.phone, supplier.email]
              .filter(Boolean)
              .join(" · ") || "No contact details"}
          </p>
        </div>

        <Link
          href={`/price-history?supplier_id=${supplier.supplier_id}`}
          className="border px-4 py-2 rounded-lg"
        >
          Price history
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Rating</div>
          <div className="text-xl font-semibold mt-1">
            {supplier.rating === null ? "—" : `${supplier.rating.toFixed(1)} / 5`}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Materials offered</div>
          <div className="text-xl font-semibold mt-1">{offers.length}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          {warning}
        </div>
      )}

      {isAdmin && (
        <div className="border rounded-lg bg-white p-5">
          <h2 className="text-lg font-semibold mb-4">Add offer</h2>

          {availableMaterials.length === 0 ? (
            <p className="text-gray-500 text-sm">
              This supplier already offers every material.
            </p>
          ) : (
            <form
              onSubmit={handleAddOffer}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <select
                value={newOffer.material_id}
                onChange={(e) =>
                  setNewOffer({ ...newOffer, material_id: e.target.value })
                }
                className="border rounded-lg px-3 py-2 md:col-span-2"
                required
              >
                <option value="">Select material</option>
                {availableMaterials.map((m) => (
                  <option key={m.material_id} value={m.material_id}>
                    {m.category_name} — {m.name} ({m.unit})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newOffer.unit_price}
                onChange={(e) =>
                  setNewOffer({ ...newOffer, unit_price: e.target.value })
                }
                placeholder="Unit price (₹)"
                className="border rounded-lg px-3 py-2"
                required
              />

              <input
                type="number"
                min="0"
                step="1"
                value={newOffer.lead_time_days}
                onChange={(e) =>
                  setNewOffer({ ...newOffer, lead_time_days: e.target.value })
                }
                placeholder="Lead time (days)"
                className="border rounded-lg px-3 py-2"
                required
              />

              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add offer"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="border rounded-lg bg-white overflow-x-auto">
        <div className="p-5">
          <h2 className="text-lg font-semibold">Offers</h2>
          <p className="text-sm text-gray-500 mt-1">
            {offers.length} material{offers.length === 1 ? "" : "s"} offered by
            this supplier
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Material</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Unit price</th>
              <th className="p-3 text-right">Lead time</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Used</th>
              {isAdmin && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {offers.map((offer) => {
              const editing = editingMaterialId === offer.material_id;

              return (
                <tr key={offer.material_id} className="border-t">
                  <td className="p-3">
                    <Link
                      href={`/materials/${offer.material_id}`}
                      className="font-medium hover:underline"
                    >
                      {offer.material_name}
                    </Link>
                  </td>
                  <td className="p-3">{offer.category_name}</td>

                  <td className="p-3 text-right">
                    {editing ? (
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editForm.unit_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, unit_price: e.target.value })
                        }
                        className="w-28 border rounded-lg px-2 py-1 text-right"
                      />
                    ) : (
                      `${money(offer.unit_price)}/${offer.unit}`
                    )}
                  </td>

                  <td className="p-3 text-right">
                    {editing ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.lead_time_days}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            lead_time_days: e.target.value,
                          })
                        }
                        className="w-20 border rounded-lg px-2 py-1 text-right"
                      />
                    ) : (
                      `${offer.lead_time_days} days`
                    )}
                  </td>

                  <td className="p-3">{formatDateTime(offer.updated_at)}</td>

                  <td className="p-3 text-right">
                    {offer.usage_count === 0
                      ? "—"
                      : `${offer.usage_count}×`}
                  </td>

                  {isAdmin && (
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {editing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(offer.material_id)}
                              disabled={saving}
                              className="bg-black text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMaterialId(null)}
                              className="border px-3 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(offer)}
                              className="border px-3 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemove(offer)}
                              disabled={saving}
                              className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {offers.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  This supplier has no offers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
