import { FormEvent, useEffect, useRef, useState } from 'react';
import { Menu, MessageCirclePlus, Mic, Send, Sparkles, X } from 'lucide-react';
import type { Conversation, Message } from '@companion/shared';
import { api } from './api';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void boot(); }, []);
  useEffect(() => { if (activeId) void api.messages(activeId).then(setMessages); }, [activeId]);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, sending]);

  async function boot() {
    const list = await api.conversations();
    if (list.length) { setConversations(list); setActiveId(list[0].id); return; }
    const created = await api.createConversation();
    setConversations([created]); setActiveId(created.id);
  }

  async function newConversation() {
    const created = await api.createConversation();
    setConversations((current) => [created, ...current]);
    setActiveId(created.id); setMessages([]); setSidebar(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    const optimistic: Message = { id: crypto.randomUUID(), conversationId: activeId, role: 'user', content, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]); setDraft(''); setSending(true);
    try {
      const reply = await api.sendMessage(activeId, content);
      setMessages((current) => [...current, reply]);
      setConversations(await api.conversations());
    } catch {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setDraft(content);
    } finally { setSending(false); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
      <div className="sidebar-head"><div className="brand-mark"><Sparkles size={18}/></div><strong>Companion</strong><button className="icon-button mobile-only" onClick={() => setSidebar(false)}><X/></button></div>
      <button className="new-chat" onClick={newConversation}><MessageCirclePlus size={18}/> New conversation</button>
      <div className="conversation-list">{conversations.map((conversation) => <button key={conversation.id} className={activeId === conversation.id ? 'active' : ''} onClick={() => {setActiveId(conversation.id);setSidebar(false)}}>{conversation.title || 'New conversation'}<small>{new Date(conversation.updatedAt).toLocaleDateString()}</small></button>)}</div>
    </aside>
    {sidebar && <button className="scrim mobile-only" onClick={() => setSidebar(false)} aria-label="Close menu"/>}

    <main className="chat">
      <header><button className="icon-button mobile-only" onClick={() => setSidebar(true)}><Menu/></button><div><strong>Companion</strong><span><i/> here with you</span></div><button className="voice-button" title="Voice conversation — coming next"><Mic size={19}/><span>Talk</span></button></header>

      <section className={`messages ${messages.length === 0 ? 'empty' : ''}`}>
        {messages.length === 0 ? <div className="welcome"><div className="orb"><Sparkles/></div><h1>What's on your mind?</h1><p>You don't need to organize it first. Just start wherever you are.</p></div> : messages.map((message) => <article key={message.id} className={`message ${message.role}`}><div className="message-label">{message.role === 'user' ? 'You' : 'Companion'}</div><div className="bubble">{message.content}</div></article>)}
        {sending && <article className="message assistant"><div className="message-label">Companion</div><div className="thinking"><span/><span/><span/></div></article>}
        <div ref={bottomRef}/>
      </section>

      <form className="composer" onSubmit={submit}><div className="composer-box"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tell me what's on your mind..." rows={1} onKeyDown={(e) => {if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/><button className="mic-inline" type="button" title="Voice conversation — coming next"><Mic/></button><button className="send" disabled={!draft.trim() || sending} aria-label="Send"><Send/></button></div><small>Companion can be wrong. Trust your judgment on important decisions.</small></form>
    </main>
  </div>;
}
