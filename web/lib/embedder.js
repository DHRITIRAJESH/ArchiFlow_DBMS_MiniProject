// Turns text into 384-number vectors with all-MiniLM-L6-v2 (same model and
// options as search/embedder.mjs, so app vectors match the ones already in Qdrant).
// The model (~90 MB) downloads from Hugging Face on first use, then is cached.

const MODEL = "onnx-community/all-MiniLM-L6-v2-ONNX";

// Keep one loaded model across requests and dev hot-reloads.
// We store the *promise* so two requests at start-up don't load it twice.
const g = globalThis;

async function getExtractor() {
  if (!g._archiflowExtractor) {
    g._archiflowExtractor = import("@huggingface/transformers")
      .then(({ pipeline }) => pipeline("feature-extraction", MODEL))
      .catch((err) => {
        g._archiflowExtractor = null; // let the next request retry
        throw err;
      });
  }
  return g._archiflowExtractor;
}

export async function embed(texts) {
  const extractor = await getExtractor();
  // mean pooling = average the word vectors into one sentence vector;
  // normalize = scale to length 1 so cosine similarity works well
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist(); // one 384-number array per text
}
