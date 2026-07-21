import { pool } from '../db/pool.js';
import { openai } from '../ai/openai.js';
import { COMPANION_PROMPT } from '../ai/prompt.js';
import { config } from '../config.js';
import { extractMemories, retrieveMemories } from '../memory/service.js';

export async function ensureLocalUser() {
  const existing = await pool.query('SELECT id FROM users ORDER BY created_at LIMIT 1');
  if (existing.rowCount) return existing.rows[0].id as string;
  const created = await pool.query("INSERT INTO users (display_name) VALUES ('You') RETURNING id");
  return created.rows[0].id as string;
}

export async function createConversation(userId: string) {
  const result = await pool.query(
    "INSERT INTO conversations (user_id, mode) VALUES ($1, 'text') RETURNING id, title, mode, created_at AS \"createdAt\", updated_at AS \"updatedAt\"",
    [userId],
  );
  return result.rows[0];
}

export async function listConversations(userId: string) {
  const result = await pool.query(
    `SELECT id, title, mode, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM conversations WHERE user_id=$1 ORDER BY updated_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getMessages(conversationId: string, userId: string) {
  const result = await pool.query(
    `SELECT m.id, m.conversation_id AS "conversationId", m.role, m.content, m.created_at AS "createdAt"
       FROM messages m JOIN conversations c ON c.id=m.conversation_id
      WHERE m.conversation_id=$1 AND c.user_id=$2 ORDER BY m.created_at`,
    [conversationId, userId],
  );
  return result.rows;
}

export async function sendMessage(userId: string, conversationId: string, content: string) {
  await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1,\'user\',$2)', [conversationId, content]);
  const history = await getMessages(conversationId, userId);
  const memories = await retrieveMemories(userId, content);
  const memoryContext = memories.length
    ? `Relevant context from previous conversations:\n${memories.map((m) => `- [${m.kind}] ${m.content}`).join('\n')}`
    : 'No relevant long-term memories were retrieved.';

  const completion = await openai.chat.completions.create({
    model: config.OPENAI_CHAT_MODEL,
    messages: [
      { role: 'system', content: COMPANION_PROMPT },
      { role: 'system', content: memoryContext },
      ...history.slice(-24).map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content })),
    ],
  });
  const reply = completion.choices[0].message.content?.trim() || 'I’m here. Tell me a little more.';
  const saved = await pool.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1,'assistant',$2)
     RETURNING id, conversation_id AS "conversationId", role, content, created_at AS "createdAt"`,
    [conversationId, reply],
  );
  await pool.query('UPDATE conversations SET updated_at=now(), title=COALESCE(title, LEFT($2, 60)) WHERE id=$1', [conversationId, content]);

  const transcript = history.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n') + `\nassistant: ${reply}`;
  void extractMemories(userId, conversationId, transcript).catch((error) => console.error('Memory extraction failed', error));
  return saved.rows[0];
}
