// Turns text into vectors (embeddings) with the all-MiniLM-L6-v2 model.
// The model (~90 MB) downloads from Hugging Face on first use, then is cached.
import { pipeline } from '@huggingface/transformers';

let extractor = null;

export async function embed(texts) {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX');
  }
  // mean pooling = average the word vectors into one sentence vector;
  // normalize = scale to length 1 so cosine similarity works well
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  return output.tolist();                   // array of 384-number arrays, one per text
}
