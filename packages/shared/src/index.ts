export type MessageRole = 'user' | 'assistant';
export type ConversationMode = 'text' | 'voice';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  mode: ConversationMode;
  createdAt: string;
  updatedAt: string;
}

export type MemoryKind =
  | 'fact'
  | 'episode'
  | 'person'
  | 'user_belief'
  | 'agent_hypothesis'
  | 'pattern'
  | 'open_thread';

export interface Memory {
  id: string;
  kind: MemoryKind;
  content: string;
  importance: number;
  confidence: number;
  status: 'active' | 'resolved' | 'superseded';
  createdAt: string;
  updatedAt: string;
}
