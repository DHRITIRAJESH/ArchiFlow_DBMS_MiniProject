import { QdrantClient } from "@qdrant/js-client-rest";

// Same settings as search/config.mjs
export const COLLECTION = "materials";
export const VECTOR_SIZE = 384;

export const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

const g = globalThis;

export const qdrant =
  g._archiflowQdrant ??
  new QdrantClient({
    url: QDRANT_URL,
    timeout: 5000, // fail fast instead of hanging if Qdrant is down
    checkCompatibility: false, // skip the startup version probe request
  });

if (process.env.NODE_ENV !== "production") g._archiflowQdrant = qdrant;

// Turns a Qdrant / network error into a short, human-readable reason
export function describeQdrantError(err) {
  // ApiError (non-2xx) carries .status and .data; network failures carry
  // .cause.code (e.g. ECONNREFUSED); timeouts are QdrantClientTimeoutError
  const text = `${err?.name || ""} ${err?.message || ""} ${err?.cause?.code || ""} ${
    JSON.stringify(err?.data || "")
  }`;

  if (err?.status === 404 && /collection/i.test(text)) {
    return `the Qdrant collection "${COLLECTION}" does not exist yet (run "npm run embed" in search/)`;
  }

  if (err?.status) {
    return `Qdrant returned an error (HTTP ${err.status})`;
  }

  if (/ECONNREFUSED|ECONNRESET|fetch failed|ENOTFOUND|timeout|timed out|aborted/i.test(text)) {
    return `Qdrant is not reachable at ${QDRANT_URL}`;
  }

  return "the vector search service failed";
}
