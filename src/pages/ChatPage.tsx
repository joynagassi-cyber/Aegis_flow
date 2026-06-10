import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, FileText, Trash2, Sparkles, X, Terminal, Bot, Cpu, Paperclip, Brain, Image, FileUp, Archive, GripVertical, List, ChevronDown } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { ArtifactPanel } from '../components/ArtifactPanel';
import { ArtifactCanvas } from '../components/ArtifactCanvas';
import { TerminalOutput } from '../components/TerminalOutput';
import { WorkspaceViewer } from '../components/WorkspaceViewer';
import { FileUpload } from '../components/FileUpload';
import { streamChat, generateId, searchWeb, readFileAsText, readFileAsBase64 } from '../services/chatService';
import { scanForArtifacts, resetSeenArtifacts } from '../services/artifactDetector';
import type { RichArtifact } from '../services/artifactDetector';
import { getApiBase } from '../services/apiConfig';
import { saveArtifactsBatch } from '../services/artifactService';
import { streamAgentChat, generateSessionId } from '../services/agentClient';
import type { ChatMessage, Artifact } from '../services/chatService';
import type { ToolCall } from '../services/agentClient';
import { buildUserContext } from '../services/userContext';
import { buildToolsContext } from '../services/toolsRegistry';
import type { ProgramState } from '../data/initialData';
import { addArtifact } from '../store/artifactStore';

type Mode = 'chat' | 'agent';
type PanelTab = 'artefacts' | 'terminal' | 'workspace' | 'canvas';
type ReasoningLevel = 'off' | 'low' | 'medium' | 'high' | 'max';

interface ChatPageProps {
  initialSessionId?: string | null;
  state?: ProgramState;
}

export function ChatPage({ initialSessionId, state }: ChatPageProps) {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Bienvenue dans **Aegis Flow IA**.\n\nChoisis un mode ci-dessous :\n\n- **💬 Chat** — Assistant conversationnel standard (markdown, artefacts)\n- **🤖 Agent** — Agent avec terminal + workspace (bash, fichiers, outils, recherche web)\n\nTape directement ta question ou passe en mode Agent pour exécuter du code.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [reasoning, setReasoning] = useState<ReasoningLevel>('off');
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('artefacts');
  const [, setStreamArtifactCount] = useState(0);
  const [toolCallsMap, setToolCallsMap] = useState<Record<string, ToolCall[]>>({});
  const [allToolCalls, setAllToolCalls] = useState<ToolCall[]>([]);
  const [allCanvasArtifacts, setAllCanvasArtifacts] = useState<RichArtifact[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const [showReasoningMenu, setShowReasoningMenu] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [sessionArtifacts, setSessionArtifacts] = useState<Artifact[]>([]);
  const [showSessionArtifacts, setShowSessionArtifacts] = useState(false);
  const [panelWidth, setPanelWidth] = useState(420);
  const [resizing, setResizing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const sessionIdRef = useRef(initialSessionId || generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef('');
  const assistantIdRef = useRef('');
  const streamArtifactsRef = useRef<Artifact[]>([]);
  const currentToolCallsRef = useRef<ToolCall[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  useEffect(() => scrollToBottom(), [messages, streaming, scrollToBottom]);

  useEffect(() => {
    const sid = sessionIdRef.current;
    if (sid) localStorage.setItem('AEGIS_SESSION_ID', sid);
    const base = getApiBase();
    fetch(`${base}/api/chat/history/${encodeURIComponent(sid)}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (rows.length > 0) {
          const msgs: ChatMessage[] = rows
            .filter((r: any) => r.role !== 'system')
            .map((r: any) => ({
              id: `db_${r.id}`,
              role: r.role as 'user' | 'assistant',
              content: r.content,
              timestamp: new Date(r.created_at).getTime(),
            }));
          if (msgs.length > 0) {
            setMessages(prev => {
              if (prev.length === 1 && prev[0].id === 'welcome') return msgs;
              return [...msgs, ...prev.filter(m => m.id !== 'welcome')];
            });
          }
        }
      })
      .catch(() => {});
  }, [initialSessionId]);

  const handleOpenArtifact = useCallback((art: Artifact) => {
    setArtifact(art);
    setPanelTab('artefacts');
    setShowPanel(true);
    const rich = art as RichArtifact;
    if (rich.type) addArtifact(rich);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = panelWidth;

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(320, Math.min(800, startW - (ev.clientX - startX)));
      setPanelWidth(newW);
    };
    const onUp = () => { setResizing(false); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  const handleClear = () => {
    resetSeenArtifacts();
    setMessages([{ id: 'welcome', role: 'assistant', content: '🧹 Conversation effacée. Que puis-je pour toi ?', timestamp: Date.now() }]);
    setArtifact(null);
    setShowPanel(false);
    setStreamArtifactCount(0);
    setToolCallsMap({});
    setAllToolCalls([]);
    setAttachedFiles([]);
    setSessionArtifacts([]);
  };

  const handleSelectArtifact = (content: string, lang: string) => {
    const typeMap: Record<string, Artifact['type']> = { html: 'html', json: 'json', csv: 'csv', markdown: 'markdown', md: 'markdown', svg: 'html', mermaid: 'markdown' };
    setArtifact({ id: crypto.randomUUID(), type: typeMap[lang] || 'markdown', title: `Fichier .${lang}`, content, language: lang });
    setPanelTab('artefacts');
    setShowPanel(true);
  };

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

  const handleChatSend = async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || streaming) return;
    setInput('');
    const content = buildContentWithFiles(text);
    resetSeenArtifacts();
    contentRef.current = '';
    streamArtifactsRef.current = [];

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: typeof content === 'string' ? content : JSON.stringify(content), timestamp: Date.now() };
    const assistantId = generateId();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setAttachedFiles([]);
    setStreaming(true);

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const context = state ? buildUserContext(state) : undefined;
      const toolsCtx = buildToolsContext();
      const systemMsg = webSearch
        ? `Tu es un assistant IA utile intégré à Aegis Flow Dashboard. L'utilisateur active la recherche web. Contexte : ${await searchWeb(text)}\n\n${toolsCtx}`
        : `Tu es un assistant IA utile intégré à Aegis Flow Dashboard. Réponds en markdown. Quand tu génères du code HTML, JSON, CSV, SVG, Mermaid ou markdown dans des blocs de code, préfixe avec \`\`\`lang.\n\n${toolsCtx}`;

      let chunkCount = 0;
      const gen = streamChat([{ role: 'system', content: systemMsg }, ...history], context);
      for await (const chunk of gen) {
        contentRef.current += chunk;
        chunkCount++;

        if (chunkCount % 3 === 0) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));
        }

        const newArtifacts = scanForArtifacts(contentRef.current);
        if (newArtifacts.length > 0) {
          streamArtifactsRef.current = [...streamArtifactsRef.current, ...newArtifacts];
          newArtifacts.forEach(a => {
            setArtifact(a);
            setStreamArtifactCount(prev => prev + 1);
          });
          setSessionArtifacts(prev => {
            const existing = new Set(prev.map(a => a.id));
            const add = newArtifacts.filter(a => !existing.has(a.id));
            return add.length ? [...prev, ...add] : prev;
          });
          setAllCanvasArtifacts(prev => [...prev.filter(ca => !newArtifacts.some(na => na.id === ca.id)), ...newArtifacts]);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, artifacts: [...(m.artifacts || []), ...newArtifacts] } : m));
          setPanelTab('artefacts');
          setShowPanel(true);
        }
      }

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));

      if (streamArtifactsRef.current.length > 0) {
        saveArtifactsBatch(streamArtifactsRef.current.map(a => ({
          session_id: sessionIdRef.current,
          title: a.title,
          type: a.type,
          content: a.content,
          language: a.language,
          source_message_id: assistantId,
        }))).catch(console.error);
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `❌ Erreur : ${err.message}` } : m));
    } finally {
      setStreaming(false);
      setWebSearch(false);
    }
  };

  const handleAgentSend = async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || streaming) return;
    setInput('');
    const content = buildContentWithFiles(text);

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: typeof content === 'string' ? content : JSON.stringify(content), timestamp: Date.now() };
    const assistantId = generateId();
    assistantIdRef.current = assistantId;
    contentRef.current = '';
    currentToolCallsRef.current = [];

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setAttachedFiles([]);
    setStreaming(true);

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const context = state ? buildUserContext(state) : undefined;
      const gen = streamAgentChat(history, {
        sessionId: sessionIdRef.current,
        reasoning,
        webSearchEnabled: webSearch,
        context,
      });

      const reasoningRef = { current: '' };
      let chunkCount = 0;
      for await (const event of gen) {
        switch (event.type) {
          case 'reasoning':
            reasoningRef.current += event.content || '';
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, reasoning: reasoningRef.current } : m));
            break;

          case 'text':
            contentRef.current += event.content || '';
            chunkCount++;
            if (chunkCount % 3 === 0) {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));
            }
            {
              const newArtifacts = scanForArtifacts(contentRef.current);
              if (newArtifacts.length > 0) {
                streamArtifactsRef.current = [...streamArtifactsRef.current, ...newArtifacts];
                newArtifacts.forEach(a => { setArtifact(a); setStreamArtifactCount(prev => prev + 1); });
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, artifacts: [...(m.artifacts || []), ...newArtifacts] } : m));
              }
            }
            break;

          case 'tool-start': {
            const tc: ToolCall = {
              id: event.id || `tc_${Date.now()}`,
              toolName: event.toolName || 'unknown',
              args: event.args || {},
              status: 'running',
            };
            currentToolCallsRef.current = [...currentToolCallsRef.current, tc];
            setAllToolCalls(prev => [...prev, tc]);
            setToolCallsMap(prev => ({ ...prev, [assistantId]: [...(prev[assistantId] || []), tc] }));
            break;
          }

          case 'tool-result': {
            const id = event.id || '';
            currentToolCallsRef.current = currentToolCallsRef.current.map(tc =>
              tc.id === id ? { ...tc, result: event.result, status: 'done' as const } : tc
            );
            setAllToolCalls(prev => prev.map(tc => tc.id === id ? { ...tc, result: event.result, status: 'done' as const } : tc));
            setToolCallsMap(prev => ({
              ...prev,
              [assistantId]: (prev[assistantId] || []).map(tc => tc.id === id ? { ...tc, result: event.result, status: 'done' as const } : tc),
            }));
            break;
          }

          case 'error':
            contentRef.current += `\n\n❌ **Erreur agent**: ${event.error || 'Erreur inconnue'}`;
            break;
        }
      }

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));

      if (streamArtifactsRef.current.length > 0) {
        saveArtifactsBatch(streamArtifactsRef.current.map(a => ({
          session_id: sessionIdRef.current,
          title: a.title,
          type: a.type,
          content: a.content,
          language: a.language,
          source_message_id: assistantId,
        }))).catch(console.error);
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `❌ Erreur : ${err.message}` } : m));
    } finally {
      setStreaming(false);
    }
  };

  const handleSend = () => {
    if (mode === 'agent') handleAgentSend();
    else handleChatSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleMode = () => {
    if (streaming) return;
    const newMode = mode === 'chat' ? 'agent' : 'chat';
    setMode(newMode);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: newMode === 'agent'
        ? '🤖 **Mode Agent activé** — Je peux exécuter des commandes bash, lire/écrire des fichiers, chercher sur le web, et utiliser des outils dans mon sandbox.'
        : '💬 **Mode Chat activé** — Mode assistant standard avec génération de contenu, artefacts et vision (images).',
      timestamp: Date.now(),
    }]);
    setArtifact(null);
    setShowPanel(false);
    setStreamArtifactCount(0);
    setToolCallsMap({});
    setAllToolCalls([]);
    setAttachedFiles([]);
    sessionIdRef.current = generateSessionId();
  };

  const getAssistantToolCalls = (msgId: string) => toolCallsMap[msgId] || [];

  const handleFormSubmit = async (answers: string) => {
    if (streaming) return;
    const text = `Formulaire soumis :\n\n${answers}`;
    setInput('');
    resetSeenArtifacts();
    contentRef.current = '';
    streamArtifactsRef.current = [];

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: text, timestamp: Date.now() };
    const assistantId = generateId();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setStreaming(true);

    const reasoningRef = { current: '' };
    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const context = state ? buildUserContext(state) : undefined;

      const toolsCtx = buildToolsContext();
      let chunkCount = 0;
      const gen = mode === 'agent'
        ? streamAgentChat([...history], { sessionId: sessionIdRef.current, context })
        : streamChat([{ role: 'system', content: `Tu es un assistant IA utile intégré à Aegis Flow Dashboard. Réponds en markdown.\n\n${toolsCtx}` }, ...history], context);
      for await (const chunk of gen) {
        if (typeof chunk === 'string') {
          contentRef.current += chunk;
        } else if (chunk.type === 'reasoning') {
          reasoningRef.current += chunk.content || '';
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, reasoning: reasoningRef.current } : m));
          continue;
        } else if (chunk.type === 'text') {
          contentRef.current += chunk.content || '';
        } else if (chunk.type === 'tool-start') {
          continue;
        }
        chunkCount++;
        if (chunkCount % 3 === 0) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: contentRef.current } : m));
        }
        const newArtifacts = scanForArtifacts(contentRef.current);
        if (newArtifacts.length > 0) {
          streamArtifactsRef.current = [...streamArtifactsRef.current, ...newArtifacts];
          newArtifacts.forEach(a => { setArtifact(a); });
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
    }
  };

  const reasoningLabels: Record<ReasoningLevel, string> = { off: 'Off', low: 'Low', medium: 'Med', high: 'High', max: 'Max' };

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            {mode === 'agent' ? (
              <Cpu className="h-5 w-5 text-emerald-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            )}
            <h1 className="text-lg font-bold text-[var(--text)]">
              {mode === 'agent' ? 'Agent IA' : 'IA Chat'}
            </h1>
            {streaming && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                {mode === 'agent' ? 'Agent en cours' : 'Génération en cours'}
              </span>
            )}
            {sessionArtifacts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSessionArtifacts(!showSessionArtifacts)}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition"
                >
                  <Archive className="h-3 w-3" />
                  {sessionArtifacts.length} artefact{sessionArtifacts.length > 1 ? 's' : ''}
                </button>
                {showSessionArtifacts && (
                  <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50">
                    <p className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Artefacts de la session</p>
                    {sessionArtifacts.map(a => {
                      const typeMap: Record<string, string> = { html: 'HTML', json: 'JSON', csv: 'CSV', markdown: 'MD', md: 'MD', chart: 'Chart', flow: 'Flow' };
                      return (
                        <button
                          key={a.id}
                          onClick={() => { handleOpenArtifact(a); setShowSessionArtifacts(false); }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
                        >
                          <FileText className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                          <span className="truncate flex-1 text-left">{a.title}</span>
                          <span className="shrink-0 rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[8px] font-bold uppercase">{typeMap[a.language || a.type] || a.type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                mode === 'agent'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {mode === 'agent' ? <Cpu className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              {mode === 'agent' ? 'Agent' : 'Chat'}
            </button>
            <button
              onClick={() => { setShowPanel(!showPanel); if (!showPanel) setPanelTab('artefacts'); }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                showPanel ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              {showPanel ? 'Fermer' : 'Panneau'}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Effacer
            </button>
          </div>
        </div>

        <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 relative">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onSelectArtifact={handleSelectArtifact}
                onOpenArtifact={handleOpenArtifact}
                toolCalls={msg.role === 'assistant' ? getAssistantToolCalls(msg.id) : undefined}
                onFormSubmit={handleFormSubmit}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 hover:bg-[var(--primary)] transition-all hover:scale-105 animate-bounce"
              title="Aller en bas"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Barre d'écriture flottante avec effet de profondeur */}
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-2">
          <div className="relative mx-auto max-w-3xl">
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-xs">
                    {f.type === 'image' ? <Image className="h-3 w-3 text-[var(--accent)]" /> : <FileUp className="h-3 w-3 text-[var(--accent)]" />}
                    <span className="text-[var(--text-muted)]">{f.name}</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-[var(--text-muted)] hover:text-[var(--danger)]">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.1)] transition-all focus-within:border-[var(--primary)]/40 focus-within:shadow-[0_4px_24px_rgba(0,102,255,0.08),0_0_0_1px_rgba(0,102,255,0.15)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={streaming ? 'Génération en cours...' : mode === 'agent' ? 'Demande à l\'agent...' : 'Pose une question...'}
                rows={1}
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] outline-none"
                disabled={streaming}
              />
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <button
                    onClick={() => { setShowFileUpload(!showFileUpload); setShowReasoningMenu(false); }}
                    className={`rounded-[10px] p-2 transition ${showFileUpload ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}
                    title="Joindre un fichier"
                    disabled={streaming}
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  {showFileUpload && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-elevated)] z-50">
                      <FileUpload onFileSelect={handleFileSelect} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setWebSearch(!webSearch)}
                  className={`rounded-[10px] p-2 transition ${
                    webSearch ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                  title="Recherche web"
                  disabled={streaming}
                >
                  <Globe className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => { setShowReasoningMenu(!showReasoningMenu); setShowFileUpload(false); }}
                    className={`rounded-lg p-2 transition ${reasoning !== 'off' ? 'bg-purple-500/20 text-purple-400' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}
                    title={`Raisonnement: ${reasoningLabels[reasoning]}`}
                    disabled={streaming}
                  >
                    <Brain className="h-4 w-4" />
                  </button>
                  {showReasoningMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50">
                      {(['off', 'low', 'medium', 'high', 'max'] as ReasoningLevel[]).map(level => (
                        <button
                          key={level}
                          onClick={() => { setReasoning(level); setShowReasoningMenu(false); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                            reasoning === level ? 'bg-purple-500/20 text-purple-400' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          <Brain className="h-3 w-3" />
                          {reasoningLabels[level]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachedFiles.length === 0) || streaming}
                  className={`rounded-[10px] p-2 transition ${
                    input.trim()
                      ? 'text-white bg-[var(--primary)] hover:bg-[var(--secondary)] shadow-[0_0_12px_var(--primary-glow)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                  } disabled:opacity-30`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(webSearch || reasoning !== 'off') && (
              <div className="mt-1 flex items-center gap-2 px-2">
                {webSearch && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--accent)] font-bold">
                    <Globe className="h-3 w-3" /> Web
                  </span>
                )}
                {reasoning !== 'off' && (
                  <span className="flex items-center gap-1 text-[10px] text-purple-400 font-bold">
                    <Brain className="h-3 w-3" /> {reasoningLabels[reasoning]}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPanel && (
        <>
          <div
            className="w-[6px] cursor-col-resize shrink-0 border-l border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center transition hover:bg-[var(--accent)]/20 group"
            onMouseDown={handleResizeStart}
            style={resizing ? { userSelect: 'none' } : undefined}
          >
            <GripVertical className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="border-l border-[var(--border)] bg-[var(--surface-1)] flex flex-col shrink-0" style={{ width: panelWidth }}>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text)]">Panneau</span>
            </div>
            <button onClick={() => setShowPanel(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex border-b border-[var(--border)]">
            {(['artefacts', 'canvas', 'terminal', 'workspace'] as PanelTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                  panelTab === tab
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab === 'artefacts' ? 'Artefacts' : tab === 'canvas' ? 'Canvas' : tab === 'terminal' ? 'Terminal' : 'Workspace'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {panelTab === 'artefacts' && (
              artifact ? (
                <ArtifactPanel artifact={artifact} onClose={() => { setArtifact(null); }} onOpenCanvas={(arts) => { setAllCanvasArtifacts(arts); setPanelTab('canvas'); }} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <FileText className="h-12 w-12 text-[var(--surface-3)] mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Génère du code dans le chat pour le voir ici</p>
                </div>
              )
            )}
            {panelTab === 'canvas' && (
              <ArtifactCanvas
                artifacts={allCanvasArtifacts}
                onClose={() => setPanelTab('artefacts')}
                onRemove={(id) => setAllCanvasArtifacts(prev => prev.filter(a => a.id !== id))}
              />
            )}
            {panelTab === 'terminal' && (
              <div className="p-3">
                <TerminalOutput toolCalls={allToolCalls} />
                {allToolCalls.filter(t => t.toolName === 'Bash').length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                    <Terminal className="h-12 w-12 text-[var(--surface-3)] mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">Les commandes bash exécutées par l'agent apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}
            {panelTab === 'workspace' && (
              <WorkspaceViewer sessionId={sessionIdRef.current} />
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
