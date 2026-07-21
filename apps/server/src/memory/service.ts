import { z } from 'zod';
import { pool } from '../db/pool.js';
import { embed, openai } from '../ai/openai.js';
import { config } from '../config.js';

const extractedMemorySchema = z.object({
  memories: z.array(z.object({
    kind: z.enum(['fact','episode','person','user_belief','agent_hypothesis','pattern','open_thread']),
    content: z.string().min(1),
    importance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    metadata: z.record(z.unknown()).optional().default({}),
  })).max(8),
});

const vectorLiteral = (values: number[]) => `[${values.join(',')}]`;

export async function retrieveMemories(userId: string, query: string) {
  const queryEmbedding = await embed(query);
  const result = await pool.query(
    `SELECT id, kind, content, importance, confidence, status, metadata,
            1 - (embedding <=> $2::vector) AS similarity
       FROM memories
      WHERE user_id = $1 AND status = 'active' AND embedding IS NOT NULL
      ORDER BY (embedding <=> $2::vector) - (importance * 0.12) ASC
      LIMIT 10`,
    [userId, vectorLiteral(queryEmbedding)],
  );
  return result.rows;
}

export async function extractMemories(userId: string, conversationId: string, transcript: string) {
  const response = await openai.chat.completions.create({
    model: config.OPENAI_CHAT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extract only durable, useful memories from a personal conversation. Do not save trivial chatter. Never convert a user's interpretation into a fact. A pattern should only be extracted when the transcript itself contains repeated evidence; otherwise omit it. Open threads are future actions, promised follow-ups, or unresolved situations worth revisiting. Return JSON: {"memories":[{"kind":"fact|episode|person|user_belief|agent_hypothesis|pattern|open_thread","content":"...","importance":0..1,"confidence":0..1,"metadata":{}}]}.`,
      },
      { role: 'user', content: transcript },
    ],
  });

  const raw = response.choices[0].message.content ?? '{"memories":[]}';
  const parsed = extractedMemorySchema.parse(JSON.parse(raw));

  for (const memory of parsed.memories) {
    const embedding = await embed(memory.content);
    await pool.query(
      `INSERT INTO memories (user_id, source_conversation_id, kind, content, importance, confidence, metadata, embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::vector)`,
      [userId, conversationId, memory.kind, memory.content, memory.importance, memory.confidence, JSON.stringify(memory.metadata), vectorLiteral(embedding)],
    );
  }
}
