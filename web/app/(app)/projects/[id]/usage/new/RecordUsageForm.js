"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function RecordUsageForm({ id }) {
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [options, setOptions] = useState([]);

  const [materialId, setMaterialId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [areaApplied, setAreaApplied] = useState("");
  const [usedOn, setUsedOn] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [projectRes, optionsRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/projects/${id}/usage/options`),
        ]);

        if (!projectRes.ok) {
          throw new Error("Could not load project.");
        }

        if (!optionsRes.ok) {
          throw new Error("Could not load material options.");
        }

        const projectData = await projectRes.json();
        const optionsData = await optionsRes.json();

        setProject(projectData.project);
        setOptions(optionsData.options);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const materials = useMemo(() => {
    const seen = new Set();

    return options.filter((option) => {
      if (seen.has(option.material_id)) return false;
      seen.add(option.material_id);
      return true;
    });
  }, [options]);

  const selectedMaterial = useMemo(
    () =>
      options.find(
        (option) => String(option.material_id) === String(materialId)
      ),
    [options, materialId]
  );

  const suppliers = useMemo(
    () =>
      options
        .filter(
          (option) => String(option.material_id) === String(materialId)
        )
        .sort((a, b) => a.unit_price - b.unit_price),
    [options, materialId]
  );

  const selectedSupplier = useMemo(
    () =>
      suppliers.find(
        (supplier) => String(supplier.supplier_id) === String(supplierId)
      ),
    [suppliers, supplierId]
  );

  const estimatedTotal =
    selectedSupplier && Number(quantity) > 0
      ? selectedSupplier.unit_price * Number(quantity)
      : 0;

  function handleMaterialChange(value) {
    setMaterialId(value);

    const firstSupplier = options
      .filter((option) => String(option.material_id) === String(value))
      .sort((a, b) => a.unit_price - b.unit_price)[0];

    setSupplierId(firstSupplier ? String(firstSupplier.supplier_id) : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!materialId || !supplierId) {
      setError("Please select a material and supplier.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (!usedOn) {
      setError("Please select a usage date.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${id}/usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material_id: Number(materialId),
          supplier_id: Number(supplierId),
          quantity: Number(quantity),
          area_applied: areaApplied,
          used_on: usedOn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not record material usage.");
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

  if (error && !project) {
    return <p className="text-red-600">{error}</p>;
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

        <h1 className="text-2xl font-bold mt-3">
          Record material usage
        </h1>

        {project && (
          <p className="text-gray-500 mt-1">
            {project.name}
          </p>
        )}
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
            Material
          </label>

          <select
            value={materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select material</option>

            {materials.map((material) => (
              <option
                key={material.material_id}
                value={material.material_id}
              >
                {material.category_name} — {material.material_name}
              </option>
            ))}
          </select>
        </div>

        {selectedMaterial && (
          <p className="text-sm text-gray-500">
            Unit:{" "}
            <span className="font-medium text-gray-800">
              {selectedMaterial.unit}
            </span>
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Supplier
          </label>

          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            disabled={!materialId}
            required
          >
            <option value="">
              {materialId ? "Select supplier" : "Select a material first"}
            </option>

            {suppliers.map((supplier) => (
              <option
                key={supplier.supplier_id}
                value={supplier.supplier_id}
              >
                {supplier.supplier_name} —{" "}
                {money(supplier.unit_price)} / {supplier.unit}
              </option>
            ))}
          </select>
        </div>

        {selectedSupplier && (
          <div className="rounded-lg bg-gray-50 border p-4">
            <p className="text-sm text-gray-500">
              Current unit price
            </p>

            <p className="text-lg font-semibold mt-1">
              {money(selectedSupplier.unit_price)} /{" "}
              {selectedSupplier.unit}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Price is taken from the supplier's current database price.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Quantity
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter quantity"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Area applied{" "}
            <span className="text-gray-400">(optional)</span>
          </label>

          <input
            type="text"
            value={areaApplied}
            onChange={(e) => setAreaApplied(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Ground floor reception"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Usage date
          </label>

          <input
            type="date"
            value={usedOn}
            onChange={(e) => setUsedOn(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        {estimatedTotal > 0 && (
          <div className="border-t pt-5">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Estimated total
              </span>

              <span className="text-xl font-bold">
                {money(estimatedTotal)}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Final amount is calculated by the database using the
              supplier's current unit price.
            </p>
          </div>
        )}

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
            {submitting ? "Recording..." : "Record usage"}
          </button>
        </div>
      </form>
    </div>
  );
}
