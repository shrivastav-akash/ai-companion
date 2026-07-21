import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { config } from './config.js';
import { createConversation, ensureLocalUser, getMessages, listConversations, sendMessage } from './conversation/service.js';

const app = express();
app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/conversations', async (_req, res, next) => {
  try { const userId = await ensureLocalUser(); res.json(await listConversations(userId)); } catch (error) { next(error); }
});

app.post('/api/conversations', async (_req, res, next) => {
  try { const userId = await ensureLocalUser(); res.status(201).json(await createConversation(userId)); } catch (error) { next(error); }
});

app.get('/api/conversations/:id/messages', async (req, res, next) => {
  try { const userId = await ensureLocalUser(); res.json(await getMessages(req.params.id, userId)); } catch (error) { next(error); }
});

app.post('/api/conversations/:id/messages', async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().trim().min(1).max(12000) }).parse(req.body);
    const userId = await ensureLocalUser();
    res.status(201).json(await sendMessage(userId, req.params.id, content));
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid request', details: error.flatten() });
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(config.PORT, () => console.log(`Companion API listening on http://localhost:${config.PORT}`));
