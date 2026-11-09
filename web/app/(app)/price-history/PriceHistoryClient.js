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

export default function PriceHistoryClient({
  initialSupplierId,
  initialMaterialId,
}) {
  const [history, setHistory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [materialId, setMaterialId] = useState(initialMaterialId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/price-history/options")
      .then((res) => res.json())
      .then((data) => {
        setSuppliers(data.suppliers || []);
        setMaterials(data.materials || []);
      })
      .catch(() => setError("Could not load filter options."));
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const params = new URLSearchParams();
        if (supplierId) params.set("supplier_id", supplierId);
        if (materialId) params.set("material_id", materialId);

        const res = await fetch(`/api/price-history?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load price history.");
        }

        setHistory(data.history);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supplierId, materialId]);

  // Show "Loading..." as soon as a filter changes (set in the event, not the effect)
  function changeFilter(setter, value) {
    setLoading(true);
    setter(value);
  }

  const increases = history.filter((row) => row.pct_change > 0).length;
  const decreases = history.filter((row) => row.pct_change < 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Price History</h1>
        <p className="text-gray-500 mt-1">
          Every supplier price change, logged automatically by the
          trg_price_change_log trigger.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={supplierId}
          onChange={(e) => changeFilter(setSupplierId, e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplier_id} value={s.supplier_id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={materialId}
          onChange={(e) => changeFilter(setMaterialId, e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All materials</option>
          {materials.map((m) => (
            <option key={m.material_id} value={m.material_id}>
              {m.category_name} — {m.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setLoading(true);
            setSupplierId("");
            setMaterialId("");
          }}
          disabled={!supplierId && !materialId}
          className="border px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>

      {!loading && !error && (
        <p className="text-sm text-gray-500">
          {history.length} change{history.length === 1 ? "" : "s"} ·{" "}
          <span className="text-red-600">▲ {increases} increase{increases === 1 ? "" : "s"}</span>{" "}
          ·{" "}
          <span className="text-green-700">▼ {decreases} decrease{decreases === 1 ? "" : "s"}</span>
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Supplier</th>
              <th className="p-3">Material</th>
              <th className="p-3 text-right">Old price</th>
              <th className="p-3 text-right">New price</th>
              <th className="p-3 text-right">Change</th>
              <th className="p-3">Changed at</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  Loading price history...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  No price changes found.
                </td>
              </tr>
            ) : (
              history.map((row) => {
                // Increases cost the firm more, so they are red; decreases green
                const up = row.pct_change > 0;
                const down = row.pct_change < 0;

                return (
                  <tr key={row.history_id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        href={`/suppliers/${row.supplier_id}`}
                        className="font-medium hover:underline"
                      >
                        {row.supplier_name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/materials/${row.material_id}`}
                        className="hover:underline"
                      >
                        {row.material_name}
                      </Link>
                    </td>
                    <td className="p-3 text-right">{money(row.old_price)}</td>
                    <td className="p-3 text-right">{money(row.new_price)}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-block rounded px-2 py-0.5 font-medium ${
                          up
                            ? "bg-red-50 text-red-700"
                            : down
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {up ? "▲ +" : down ? "▼ " : ""}
                        {row.pct_change.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3">{formatDateTime(row.changed_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
