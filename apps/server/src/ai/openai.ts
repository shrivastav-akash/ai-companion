import OpenAI from 'openai';
import { config } from '../config.js';

export const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function embed(text: string): Promise<number[]> {
  const result = await openai.embeddings.create({
    model: config.OPENAI_EMBEDDING_MODEL,
    input: text,
  });
  return result.data[0].embedding;
}
