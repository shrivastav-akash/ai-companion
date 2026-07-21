import type { Conversation, Message } from '@companion/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Request failed');
  return response.json();
}

export const api = {
  conversations: () => request<Conversation[]>('/api/conversations'),
  createConversation: () => request<Conversation>('/api/conversations', { method: 'POST' }),
  messages: (id: string) => request<Message[]>(`/api/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) => request<Message>(`/api/conversations/${id}/messages`, {
    method: 'POST', body: JSON.stringify({ content }),
  }),
};
