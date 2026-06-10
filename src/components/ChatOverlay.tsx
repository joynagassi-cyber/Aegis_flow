import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, Trash2, Sparkles, X, PanelRightOpen, Paperclip, Image, FileUp, Grid3x3, Archive, FileText } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { ArtifactPanel } from './ArtifactPanel';
import { ArtifactCanvas } from './ArtifactCanvas';
import { FileUpload } from './FileUpload';
import { streamChat, generateId, searchWeb, readFileAsText, readFileAsBase64 } from '../services/chatService';
import { scanForArtifacts, resetSeenArtifacts } from '../services/artifactDetector';
import type { RichArtifact } from '../services/artifactDetector';
import type { ChatMessage, Artifact } from '../services/chatService';
import { buildUserContext } from '../services/userContext';
import type { ProgramState } from '../data/initialData';

interface ChatOverlayProps {
  onClose: () => void;
  onOpenFull: () => void;
  state?: ProgramState;
}

export function ChatOverlay({ onClose, onOpenFull, state }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Bienvenue dans **Aegis Flow IA**.\n\nPose-moi une question, demande un résumé, joins une image, ou tape `/aide` pour voir ce que je peux faire.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [, setArtifactCount] = useState(0);
  const [allCanvasArtifacts, setAllCanvasArtifacts] = useState<RichArtifact[]>([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [sessionArtifacts, setSessionArtifacts] = useState<Artifact[]>([]);
  const [showSessionArtifacts, setShowSessionArtifacts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => scrollToBottom(), [messages, streaming, scrollToBottom]);

  const handleOpenArtifact = useCallback((art: Artifact) => {
    setArtifact(art);
  }, []);

  const handleFileSelect = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
    const isText = ['md', 'markdown', 'txt', 'csv', 'json', 'html', 'js', 'ts', 'py', 'css'].includes(ext);
    const isPdf = ext === 'pdf';

    if (isImage) {
      const base64 = await readFileAsBase64(file);
      setAttachedFiles(prev => [...prev, { name: file.name, content: `data:${file.type};base64,${base64}`, type: 'image' }]);
    } else if (isText) {
      const text = await readFileAsText(file);
      setAttachedFiles(prev => [...prev, { name: file.name, content: text, type: 'text' }]);
    } else if (isPdf) {
      const text = await readFileAsText(file);
      setAttachedFiles(prev => [...prev, { name: file.name, content: text, type: 'pdf' }]);
    }
    setShowFileUpload(false);
  };

  const buildContentWithFiles = (text: string): any => {
    if (attachedFiles.length === 0) return text;
    const parts: any[] = [];
    if (text.trim()) parts.push({ type: 'text', text });
    for (const f of attachedFiles) {
      if (f.type === 'image') {
        parts.push({ type: 'image_url', image_url: { url: f.content } });
      } else {
        parts.push({ type: 'text', text: `\n\n[Fichier joint: ${f.name}]\n\`\`\`\n${f.content.slice(0, 10000)}\n\`\`\`` });
      }
    }
    return parts.length === 1 ? parts[0].text : parts;
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || streaming) return;
    setInput('');
    const content = buildContentWithFiles(text);
    resetSeenArtifacts();
    contentRef.current = '';

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: typeof content === 'string' ? content : JSON.stringify(content), timestamp: Date.now() };
    const assistantId = generateId();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setAttachedFiles([]);
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const systemMsg = webSearch ? `Tu es un assistant IA utile. L'utilisateur active la recherche web. Voici le contexte de recherche : ${await searchWeb(text)}` : 'Tu es un assistant IA utile intégré à Aegis Flow Dashboard. Réponds avec des blocs de code quand pertinent.';

      let chunkCount = 0;
      const context = state ? buildUserContext(state) : undefined;
      const gen = streamChat([{ role: 'system', content: systemMsg }, ...history], context);
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
          setSessionArtifacts(prev => {
            const existing = new Set(prev.map(a => a.id));
            const add = newArtifacts.filter(a => !existing.has(a.id));
            return add.length ? [...prev, ...add] : prev;
          });
          setAllCanvasArtifacts(prev => [...prev.filter(ca => !newArtifacts.some(na => na.id === ca.id)), ...newArtifacts]);
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
    setSessionArtifacts([]);
  };

  const handleSelectArtifact = (content: string, lang: string) => {
    const types: Record<string, Artifact['type']> = { html: 'html', json: 'json', csv: 'csv', markdown: 'markdown', md: 'markdown' };
    setArtifact({ id: crypto.randomUUID(), type: types[lang] || 'markdown', title: `Fichier .${lang}`, content, language: lang });
  };

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-[var(--primary)]/10">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          </div>
          <span className="text-xs font-bold text-[var(--text)]">Aegis IA</span>
          {streaming && (
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" style={{ animationDelay: '0s', animationDuration: '1.2s' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" style={{ animationDelay: '0.4s', animationDuration: '1.2s' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" style={{ animationDelay: '0.8s', animationDuration: '1.2s' }} />
            </span>
          )}
          {sessionArtifacts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSessionArtifacts(!showSessionArtifacts)}
                className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/25 transition"
              >
                <Archive className="h-3 w-3 inline mr-1" />
                {sessionArtifacts.length}
              </button>
              {showSessionArtifacts && (
                <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50">
                  {sessionArtifacts.map(a => {
                    const typeMap: Record<string, string> = { html: 'HTML', json: 'JSON', csv: 'CSV', markdown: 'MD', chart: 'Chart', flow: 'Flow' };
                    return (
                      <button
                        key={a.id}
                        onClick={() => { handleOpenArtifact(a); setShowSessionArtifacts(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
                      >
                        <FileText className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                        <span className="truncate flex-1 text-left">{a.title}</span>
                        <span className="shrink-0 rounded bg-[var(--surface-3)] px-1 py-0.5 text-[7px] font-bold uppercase">{typeMap[a.language || a.type] || a.type}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {allCanvasArtifacts.length > 0 && (
            <button onClick={() => setShowCanvas(!showCanvas)} title={showCanvas ? 'Artefact simple' : 'Canvas multi-artefacts'} className={`rounded-[8px] p-1.5 transition ${showCanvas ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'}`}>
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onOpenFull} title="Plein écran" className="rounded-[8px] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition">
            <PanelRightOpen className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} title="Fermer" className="rounded-[8px] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} onSelectArtifact={handleSelectArtifact} onOpenArtifact={handleOpenArtifact} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border)] p-3">
        {artifact && !showCanvas && (
          <div className="mb-2 max-h-[300px] overflow-auto rounded-xl border border-[var(--accent)]/20 bg-[var(--surface-2)]">
            <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} onOpenCanvas={(arts) => { setAllCanvasArtifacts(arts); setShowCanvas(true); }} />
          </div>
        )}
        {showCanvas && (
          <div className="mb-2 max-h-[400px] overflow-auto rounded-xl border border-[var(--accent)]/20 bg-[var(--surface-2)]">
            <ArtifactCanvas artifacts={allCanvasArtifacts} onClose={() => setShowCanvas(false)} onRemove={(id) => setAllCanvasArtifacts(prev => prev.filter(a => a.id !== id))} />
          </div>
        )}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-[10px]">
                {f.type === 'image' ? <Image className="h-3 w-3 text-[var(--accent)]" /> : <FileUp className="h-3 w-3 text-[var(--accent)]" />}
                <span className="text-[var(--text-muted)]">{f.name}</span>
                <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-[var(--text-muted)] hover:text-[var(--danger)]">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-2 transition focus-within:border-[var(--primary)]/40 focus-within:shadow-[0_0_0_1px_var(--primary)]/10">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); setTimeout(adjustHeight, 0); }}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? 'Génération en cours...' : 'Pose une question...'}
            rows={1}
            className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] outline-none"
            disabled={streaming}
          />
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`rounded-lg p-1.5 transition ${showFileUpload ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'}`}
                title="Joindre un fichier"
                disabled={streaming}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              {showFileUpload && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50">
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
              )}
            </div>
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
              disabled={(!input.trim() && attachedFiles.length === 0) || streaming}
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
