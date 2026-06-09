import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, Trash2, Sparkles, X, PanelRightOpen } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { ArtifactPanel } from './ArtifactPanel';
import { streamChat, generateId, scanForArtifacts, resetSeenArtifacts, searchWeb } from '../services/chatService';
import type { ChatMessage, Artifact } from '../services/chatService';

interface ChatOverlayProps {
  onClose: () => void;
  onOpenFull: () => void;
}

export function ChatOverlay({ onClose, onOpenFull }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Bienvenue dans **Aegis Flow IA**.\n\nPose-moi une question, demande un résumé, ou tape `/aide` pour voir ce que je peux faire.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [artifactCount, setArtifactCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => scrollToBottom(), [messages, streaming, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    resetSeenArtifacts();
    contentRef.current = '';

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: text, timestamp: Date.now() };
    const assistantId = generateId();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const systemMsg = webSearch ? `Tu es un assistant IA utile. L'utilisateur active la recherche web. Voici le contexte de recherche : ${await searchWeb(text)}` : 'Tu es un assistant IA utile intégré à Aegis Flow Dashboard. Réponds avec des blocs de code quand pertinent.';

      let chunkCount = 0;
      const gen = streamChat([{ role: 'system', content: systemMsg }, ...history]);
      for await (const chunk of gen) {
        contentRef.current += chunk;
        chunkCount++;

        if (chunkCount % 3 === 0) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));
        }

        const newArtifacts = scanForArtifacts(contentRef.current);
        if (newArtifacts.length > 0) {
          newArtifacts.forEach(a => setArtifact(a));
          setArtifactCount(prev => prev + newArtifacts.length);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, artifacts: [...(m.artifacts || []), ...newArtifacts] } : m));
        }
      }

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `❌ Erreur : ${err.message}` } : m));
    } finally {
      setStreaming(false);
      setWebSearch(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    resetSeenArtifacts();
    setMessages([{ id: 'welcome', role: 'assistant', content: '🧹 Conversation effacée. Que puis-je pour toi ?', timestamp: Date.now() }]);
    setArtifact(null);
    setArtifactCount(0);
  };

  const handleSelectArtifact = (content: string, lang: string) => {
    const types: Record<string, Artifact['type']> = { html: 'html', json: 'json', csv: 'csv', markdown: 'markdown', md: 'markdown' };
    setArtifact({ id: crypto.randomUUID(), type: types[lang] || 'markdown', title: `Fichier .${lang}`, content, language: lang });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text)]">IA Chat</span>
          {streaming && <span className="flex gap-0.5"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '0ms' }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '150ms' }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '300ms' }} /></span>}
          {artifactCount > 0 && (
            <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] text-[var(--accent)]">{artifactCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenFull} title="Plein écran" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition">
            <PanelRightOpen className="h-4 w-4" />
          </button>
          <button onClick={onClose} title="Fermer" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} onSelectArtifact={handleSelectArtifact} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border)] p-3">
        {artifact && (
          <div className="mb-2 max-h-[300px] overflow-auto rounded-xl border border-[var(--accent)]/20 bg-[var(--surface-2)]">
            <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2 transition focus-within:border-[var(--accent)]/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? 'Génération en cours...' : 'Pose une question...'}
            rows={1}
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] outline-none"
            disabled={streaming}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWebSearch(!webSearch)}
              className={`rounded-lg p-1.5 transition ${webSearch ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'}`}
              title="Recherche web"
              disabled={streaming}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--danger)] transition"
              title="Effacer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
