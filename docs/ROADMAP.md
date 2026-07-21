# AI Companion — Product & Implementation Roadmap

## Product goal

Build a private, persistent personal companion that can be used through text or turn-based voice. It should listen first, remember useful context automatically, ask natural follow-up questions, revisit unresolved threads, and offer thoughtful life/relationship coaching without turning every conversation into formal analysis.

## Implemented — V1 foundation

### Application foundation
- TypeScript npm-workspaces monorepo.
- React + Vite frontend.
- Node.js + Express TypeScript API.
- Shared domain types package.
- Mobile-first responsive layout.
- Installable PWA foundation.

### Conversation system
- Create and list conversations.
- Persist user and assistant messages.
- Restore conversation history.
- Companion system behavior/prompt.
- Recent-message context supplied to the model.

### Memory foundation
- PostgreSQL + pgvector schema.
- Automatic memory extraction from conversation; no slash commands.
- Semantic embedding and retrieval.
- Initial memory categories: fact, episode, person, user belief, agent hypothesis, pattern, open thread.
- Importance and confidence fields.
- Active/resolved/superseded lifecycle field.
- Prompt rules that distinguish facts, beliefs, and hypotheses.

### PWA/UI foundation
- Responsive desktop/mobile chat UI.
- Conversation sidebar/drawer.
- Optimistic user-message UI and assistant thinking state.
- Voice entry points reserved in the interface.

## Next implementation phases

### Phase 2 — Harden the current text MVP

Goal: make the existing vertical slice reliable enough for regular personal testing.

1. Add schema migrations instead of relying on one monolithic schema runner.
2. Add ownership checks for every conversation mutation.
3. Improve API error states and frontend retry/error feedback.
4. Add conversation rename/delete/archive.
5. Add message streaming so text replies appear progressively.
6. Add model/provider abstraction so the app is not tightly coupled to one provider.
7. Add server logging and basic request diagnostics.
8. Add automated typecheck/build validation in GitHub Actions.
9. Add basic API tests for conversations, messages, and memory behavior.

Acceptance: a deployed user can have long text conversations repeatedly without losing history or silently failing.

### Phase 3 — Memory Engine V2

Goal: move from storing isolated memories to maintaining a coherent evolving understanding of the user.

1. Deduplicate semantically similar memories before insertion.
2. Consolidate repeated evidence into stronger memories.
3. Prevent a single conversation from becoming a behavioral pattern.
4. Add explicit evidence/source links from memories to messages/conversations.
5. Resolve or supersede contradicted/outdated memories.
6. Create first-class person profiles for recurring people in the user's life.
7. Associate episodes, beliefs, and open threads with those people.
8. Add open-thread lifecycle: open -> revisited -> resolved/abandoned.
9. Rank retrieval using semantic relevance + importance + recency + confidence.
10. Add periodic memory consolidation rather than extracting duplicate memories after every turn.
11. Add a private memory/debug view for development so stored context can be inspected and corrected.

Acceptance: the companion remembers useful facts and situations across conversations while minimizing duplication and false assumptions.

### Phase 4 — Turn-based voice conversation

Goal: support the voice behavior agreed for the product: the companion listens until the user finishes, then responds. It must not interrupt mid-thought.

1. Microphone permission and audio session UI.
2. Capture user audio.
3. Voice activity/end-of-turn detection with a conservative silence threshold.
4. Speech-to-text transcription.
5. Send the completed transcript through the same conversation + memory pipeline as text.
6. Generate assistant reply only after the user's turn is complete.
7. Text-to-speech response playback.
8. Display both user transcript and assistant text in the shared conversation history.
9. Allow stopping/skipping assistant playback.
10. Handle microphone/network/transcription failures gracefully.
11. Keep voice and text interchangeable within one conversation.

Acceptance: user can press Talk, speak naturally, stop speaking, receive one spoken response, and continue turn-by-turn without losing shared memory.

### Phase 5 — Companion intelligence and coaching quality

Goal: make conversations feel like an increasingly knowledgeable companion rather than a generic chatbot.

1. Conversation-mode reasoning: casual listening, emotional support, reflection, advice, relationship analysis, decision support.
2. Ask follow-up questions only when useful rather than mechanically after every message.
3. Detect when the user mainly wants to vent versus wants advice.
4. Surface contradictions gently.
5. Revisit relevant unresolved situations naturally.
6. Separate observed evidence from interpretations of another person's motives.
7. Track recurring relationship dynamics only after repeated evidence.
8. Add optional post-conversation reflection summaries.
9. Add configurable companion tone/personality later without changing memory truthfulness rules.

Acceptance: responses appropriately switch between listening, asking, reflecting, and advising while using long-term context naturally.

### Phase 6 — Privacy, identity, and user control

Goal: make persistent personal memory safe and controllable.

1. Authentication and real per-user isolation.
2. Secure sessions/token handling.
3. Memory browser: view, edit, delete, or correct stored memories.
4. Delete conversation and associated derived data where appropriate.
5. Delete account/data workflow.
6. Export conversations/memories.
7. Clear explanation of what is stored.
8. Sensitive-data handling and retention controls.
9. Rate limiting and abuse protection on public API endpoints.

Acceptance: multiple accounts cannot access one another and a user can inspect/control their stored personal data.

### Phase 7 — PWA/mobile polish

1. Proper generated PNG/maskable app icons and splash assets.
2. Offline shell and friendly offline state.
3. Install guidance where useful.
4. Mobile safe-area/keyboard behavior testing.
5. Background/resume handling for voice sessions.
6. Accessibility pass.
7. Performance and bundle-size pass.

### Phase 8 — Production readiness

1. Structured migrations and deployment migration strategy.
2. Staging/production environments.
3. CI for typecheck, tests, and build.
4. Error monitoring.
5. Database backups and recovery plan.
6. Health/readiness endpoints.
7. Dependency/security checks.
8. Cost/usage monitoring for chat, embeddings, STT, and TTS.
9. Prompt/model version tracking.

## Recommended development order

1. Deployment readiness + deploy current MVP.
2. Phase 2 text-MVP hardening.
3. Memory Engine V2.
4. Turn-based voice.
5. Companion/coaching quality iteration using real conversations.
6. Authentication/privacy controls before broader external usage.
7. Mobile/PWA polish.
8. Production hardening.

The key architectural rule is that text and voice must share the same conversation, message, retrieval, and memory pipeline. Voice is another input/output interface, not a separate companion brain.
