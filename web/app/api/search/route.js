import { requireUser } from "@/lib/session";
import { describeQdrantError } from "@/lib/qdrant";
import { keywordSearch, semanticSearch } from "@/lib/search";

// POST { query, category?, maxPrice?, minDurability?, compareKeyword? }
// Any logged-in user.
// Returns { results, semanticError?, keywordResults?, keywordError? }
export async function POST(request) {
  const { error } = await requireUser();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const queryText = typeof body.query === "string" ? body.query.trim() : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : null;
  const maxPrice =
    body.maxPrice === "" || body.maxPrice == null ? null : Number(body.maxPrice);
  const minDurability =
    body.minDurability === "" || body.minDurability == null
      ? null
      : Number(body.minDurability);

  if (!queryText) {
    return Response.json(
      { error: "Please describe what you are looking for." },
      { status: 400 }
    );
  }

  if (queryText.length > 500) {
    return Response.json(
      { error: "Please keep the requirement under 500 characters." },
      { status: 400 }
    );
  }

  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice <= 0)) {
    return Response.json(
      { error: "Max price must be a number greater than 0." },
      { status: 400 }
    );
  }

  if (
    minDurability !== null &&
    (!Number.isInteger(minDurability) || minDurability < 1 || minDurability > 5)
  ) {
    return Response.json(
      { error: "Minimum durability must be between 1 and 5." },
      { status: 400 }
    );
  }

  const filters = { category, maxPrice, minDurability };
  const response = {};

  // Semantic and keyword run independently, so the keyword column still
  // works for the demo even if Qdrant or the model is unavailable.
  const [semantic, keyword] = await Promise.allSettled([
    semanticSearch(queryText, filters),
    body.compareKeyword ? keywordSearch(queryText, filters) : Promise.resolve(null),
  ]);

  if (semantic.status === "fulfilled") {
    response.results = semantic.value;
  } else {
    const err = semantic.reason;
    console.error("POST /api/search semantic error:", err);

    // semanticSearch() tags which step failed
    const reason =
      err?.searchStage === "embed"
        ? "the embedding model could not be loaded (the first run needs internet to download it)"
        : err?.searchStage === "qdrant"
          ? describeQdrantError(err)
          : "the database query failed";

    response.results = null;
    response.semanticError = `Semantic search is unavailable right now: ${reason}.`;
  }

  if (body.compareKeyword) {
    if (keyword.status === "fulfilled") {
      response.keywordResults = keyword.value;
    } else {
      console.error("POST /api/search keyword error:", keyword.reason);
      response.keywordResults = null;
      response.keywordError = "Keyword search failed.";
    }
  }

  // Nothing usable at all -> 503 so the page shows a clear error
  const nothingWorked =
    response.results === null &&
    (!body.compareKeyword || response.keywordResults === null);

  if (nothingWorked) {
    return Response.json(
      { ...response, error: response.semanticError || "Search failed." },
      { status: 503 }
    );
  }

  return Response.json(response);
}
