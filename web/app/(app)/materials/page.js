"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

const maintenanceLevels = ["LOW", "MEDIUM", "HIGH"];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minDurability, setMinDurability] = useState("");
  const [maintenance, setMaintenance] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories for the dropdown + current user's role (to show admin buttons)
  useEffect(() => {
    fetch("/api/materials/options")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setError("Could not load categories."));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.user?.role === "ADMIN"));
  }, []);

  // Reload whenever a filter changes; debounce typing in the search box
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (keyword.trim()) params.set("q", keyword.trim());
        if (categoryId) params.set("category_id", categoryId);
        if (minDurability) params.set("min_durability", minDurability);
        if (maintenance) params.set("maintenance", maintenance);

        const res = await fetch(`/api/materials?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load materials.");
        }

        setMaterials(data.materials);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, categoryId, minDurability, maintenance]);

  function clearFilters() {
    setKeyword("");
    setCategoryId("");
    setMinDurability("");
    setMaintenance("");
  }

  const hasFilters = keyword || categoryId || minDurability || maintenance;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-gray-500 mt-1">
            Browse materials, their ratings and the cheapest current offer.
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/materials/new"
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Add material
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keyword search (e.g. durable high-traffic)..."
          className="border rounded-lg px-4 py-2 md:col-span-4"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={minDurability}
          onChange={(e) => setMinDurability(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Any durability</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Durability {n}+
            </option>
          ))}
        </select>

        <select
          value={maintenance}
          onChange={(e) => setMaintenance(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Any maintenance</option>
          {maintenanceLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <button
          onClick={clearFilters}
          disabled={!hasFilters}
          className="border px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>

      {keyword.trim() && (
        <p className="text-sm text-gray-500">
          Sorted by full-text relevance for &quot;{keyword.trim()}&quot;.
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
              <th className="p-3">Material</th>
              <th className="p-3">Category</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Durability</th>
              <th className="p-3">Maintenance</th>
              <th className="p-3 text-right">Cheapest price</th>
              <th className="p-3">Cheapest supplier</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Loading materials...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No materials found.
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr
                  key={material.material_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">
                    <Link
                      href={`/materials/${material.material_id}`}
                      className="font-medium hover:underline"
                    >
                      {material.name}
                    </Link>
                  </td>
                  <td className="p-3">{material.category_name}</td>
                  <td className="p-3">{material.unit}</td>
                  <td className="p-3">{material.durability_rating} / 5</td>
                  <td className="p-3">{material.maintenance_level}</td>
                  <td className="p-3 text-right">
                    {material.cheapest_price === null
                      ? "—"
                      : `${money(material.cheapest_price)}/${material.unit}`}
                  </td>
                  <td className="p-3">
                    {material.cheapest_supplier || "No offers yet"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
