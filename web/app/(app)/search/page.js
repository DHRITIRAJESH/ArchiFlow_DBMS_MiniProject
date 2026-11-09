"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const examples = [
  "affordable, low-maintenance flooring for high-traffic areas",
  "sound-absorbing ceiling for a school hall",
  "waterproof finish for a humid coastal bathroom",
];

function ResultCard({ result, kind }) {
  const semantic = kind === "semantic";

  return (
    <Link
      href={`/materials/${result.material_id}`}
      className="block border rounded-lg bg-white p-4 shadow-sm hover:border-gray-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{result.name}</div>
          <span className="inline-block mt-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {result.category}
          </span>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">
            {semantic ? "Similarity" : "Relevance"}
          </div>
          <div className="font-semibold">{result.score.toFixed(3)}</div>
        </div>
      </div>

      {semantic && (
        <div className="h-1.5 bg-gray-200 rounded mt-3">
          <div
            className="h-1.5 bg-black rounded"
            style={{ width: `${Math.max(0, Math.min(result.score, 1)) * 100}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <div className="text-gray-500">Cheapest</div>
          <div className="font-medium">
            {result.price === null
              ? "No offers"
              : `${money(result.price)}/${result.unit}`}
          </div>
          {result.cheapest_supplier && (
            <div className="text-xs text-gray-500">{result.cheapest_supplier}</div>
          )}
        </div>
        <div>
          <div className="text-gray-500">Durability</div>
          <div className="font-medium">{result.durability} / 5</div>
        </div>
        <div>
          <div className="text-gray-500">Maintenance</div>
          <div className="font-medium">{result.maintenance}</div>
        </div>
        <div>
          <div className="text-gray-500">Used in</div>
          <div className="font-medium">
            {result.projects_used_in} project
            {result.projects_used_in === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ResultList({ results, error, kind, emptyText }) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="border rounded-lg bg-white px-4 py-8 text-center text-gray-500 text-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <ResultCard key={result.material_id} result={result} kind={kind} />
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [categories, setCategories] = useState([]);

  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minDurability, setMinDurability] = useState("");
  const [compare, setCompare] = useState(false);

  const [data, setData] = useState(null);
  const [searchedFor, setSearchedFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/materials/options")
      .then((res) => res.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  async function runSearch(text, compareKeyword = compare) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please describe what you are looking for.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          category: category || undefined,
          maxPrice: maxPrice || undefined,
          minDurability: minDurability || undefined,
          compareKeyword,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Search failed.");
      }

      setData(result);
      setSearchedFor(trimmed);
    } catch (err) {
      setData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    runSearch(queryText);
  }

  function pickExample(text) {
    setQueryText(text);
    runSearch(text);
  }

  function toggleCompare(checked) {
    setCompare(checked);
    // Re-run the current search so both columns are for the same query
    if (searchedFor) runSearch(searchedFor, checked);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Semantic Search</h1>
        <p className="text-gray-500 mt-1">
          Describe what you need in plain language. Materials are matched by
          meaning, then priced live from the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-5 space-y-4">
        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              runSearch(queryText);
            }
          }}
          rows={2}
          maxLength={500}
          placeholder="e.g. durable, easy-to-clean flooring for a busy hospital corridor"
          className="w-full border rounded-lg px-4 py-2"
        />

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-1">Try:</span>
          {examples.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => pickExample(text)}
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {text}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price (₹ per unit)"
            className="border rounded-lg px-3 py-2"
          />

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

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => toggleCompare(e.target.checked)}
          />
          Compare with keyword search (MySQL FULLTEXT)
        </label>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading && !data && (
        <p className="text-gray-500">
          Searching... (the first search loads the AI model and can take a few seconds)
        </p>
      )}

      {data && (
        <div className={loading ? "opacity-50" : ""}>
          <p className="text-sm text-gray-500 mb-3">
            Results for &quot;{searchedFor}&quot;
          </p>

          {data.keywordResults !== undefined ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">Semantic search</h2>
                  <p className="text-xs text-gray-500">
                    Qdrant · matches meaning (cosine similarity, 0–1)
                  </p>
                </div>
                <ResultList
                  results={data.results}
                  error={data.semanticError}
                  kind="semantic"
                  emptyText="No materials match these filters."
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">Keyword search</h2>
                  <p className="text-xs text-gray-500">
                    MySQL MATCH…AGAINST · matches exact words (relevance score)
                  </p>
                </div>
                <ResultList
                  results={data.keywordResults}
                  error={data.keywordError}
                  kind="keyword"
                  emptyText="No keyword matches: none of these words appear in a material's name or description."
                />
              </div>
            </div>
          ) : (
            <ResultList
              results={data.results}
              error={data.semanticError}
              kind="semantic"
              emptyText="No materials match these filters."
            />
          )}
        </div>
      )}
    </div>
  );
}
