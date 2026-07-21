# AI Companion

A mobile-first, persistent AI companion designed for natural text and voice conversations, long-term contextual memory, thoughtful follow-up questions, and life/relationship reflection.

## Current milestone

This branch implements the first working text + memory vertical slice:

- React + TypeScript responsive PWA
- Node.js + TypeScript API
- PostgreSQL + pgvector
- Persistent conversations and messages
- Companion behavioral prompt
- Semantic memory retrieval
- Automatic memory extraction (no `/remember` or other commands)
- Memory categories for facts, episodes, people, beliefs, hypotheses, patterns, and open threads
- Voice UI entry points reserved for the next milestone

## Local setup

Requirements: Node.js 20+, npm, Docker.

```bash
cp .env.example .env
# Add OPENAI_API_KEY to .env

docker compose up -d
npm install
npm run db:migrate
npm run dev
```

Web: `http://localhost:5173`

API health: `http://localhost:4000/health`

## Memory principles

- Memory extraction is automatic.
- Trivial chatter should not become durable memory.
- User interpretations are stored as beliefs, not facts.
- Agent hypotheses are kept separate from facts.
- Behavioral patterns require repeated evidence.
- Open threads capture unresolved situations worth naturally revisiting.
- Relevant memories are retrieved semantically rather than injecting the full history into every request.

## V1 roadmap

1. Text + persistent memory foundation (this milestone)
2. Memory consolidation/deduplication and stronger people/open-thread handling
3. Turn-based realtime voice: listen until the user finishes, then respond
4. Shared text/voice transcripts and memory
5. Reflections and longer-term pattern surfacing

> This project is a personal companion, not a replacement for professional medical, mental-health, legal, or emergency support.
