"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function MaterialDetailClient({ id }) {
  const [data, setData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/materials/${id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error || "Could not load material.");
        }
        return body;
      })
      .then(setData)
      .catch((err) => setError(err.message));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => setIsAdmin(d.user?.role === "ADMIN"));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/materials" className="text-sm text-gray-500 hover:underline">
          ← Back to materials
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <p>Loading material...</p>;
  }

  const { material, cheapestOffers } = data;
  const cheapest = cheapestOffers[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/materials"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to materials
          </Link>

          <h1 className="text-2xl font-bold mt-2">{material.name}</h1>

          <p className="text-gray-500 mt-1">{material.category_name}</p>
        </div>

        {isAdmin && (
          <Link
            href={`/materials/${material.material_id}/edit`}
            className="border px-4 py-2 rounded-lg"
          >
            Edit material
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Durability</div>
          <div className="text-xl font-semibold mt-1">
            {material.durability_rating} / 5
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Maintenance</div>
          <div className="text-xl font-semibold mt-1">
            {material.maintenance_level}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Cheapest price</div>
          <div className="text-xl font-semibold mt-1">
            {cheapest
              ? `${money(cheapest.unit_price)}/${material.unit}`
              : "—"}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-sm text-gray-500">Used in projects</div>
          <div className="text-xl font-semibold mt-1">
            {material.projects_used_in}
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">Material details</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Category</div>
            <div className="font-medium mt-1">{material.category_name}</div>
          </div>

          <div>
            <div className="text-gray-500">Unit</div>
            <div className="font-medium mt-1">{material.unit}</div>
          </div>

          <div>
            <div className="text-gray-500">Durability rating</div>
            <div className="font-medium mt-1">
              {material.durability_rating} / 5
            </div>
          </div>

          <div>
            <div className="text-gray-500">Maintenance level</div>
            <div className="font-medium mt-1">
              {material.maintenance_level}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-gray-500 text-sm">Description</div>
          <p className="mt-1 text-sm whitespace-pre-line">
            {material.description}
          </p>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">Cheapest offer</h2>

        {cheapestOffers.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No supplier offers this material yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-right">Unit price</th>
                <th className="p-3 text-right">Lead time</th>
              </tr>
            </thead>
            <tbody>
              {cheapestOffers.map((offer) => (
                <tr key={offer.supplier_id} className="border-t">
                  <td className="p-3 font-medium">{offer.supplier_name}</td>
                  <td className="p-3 text-right">
                    {money(offer.unit_price)}/{material.unit}
                  </td>
                  <td className="p-3 text-right">
                    {offer.lead_time_days} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
