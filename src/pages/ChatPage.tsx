import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, FileText, Trash2, Sparkles, X, Terminal, Bot, Cpu, Paperclip, Brain, Image, FileUp } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { ArtifactPanel } from '../components/ArtifactPanel';
import { TerminalOutput } from '../components/TerminalOutput';
import { WorkspaceViewer } from '../components/WorkspaceViewer';
import { FileUpload } from '../components/FileUpload';
import { streamChat, generateId, scanForArtifacts, resetSeenArtifacts, searchWeb, readFileAsText, readFileAsBase64 } from '../services/chatService';
import { getApiBase } from '../services/apiConfig';
import { saveArtifactsBatch } from '../services/artifactService';
import { streamAgentChat, generateSessionId } from '../services/agentClient';
import type { ChatMessage, Artifact } from '../services/chatService';
import type { ToolCall } from '../services/agentClient';

type Mode = 'chat' | 'agent';
type PanelTab = 'artefacts' | 'terminal' | 'workspace';
type ReasoningLevel = 'off' | 'low' | 'medium' | 'high' | 'max';

interface ChatPageProps {
  initialSessionId?: string | null;
}

export function ChatPage({ initialSessionId }: ChatPageProps) {
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
  const [streamArtifactCount, setStreamArtifactCount] = useState(0);
  const [toolCallsMap, setToolCallsMap] = useState<Record<string, ToolCall[]>>({});
  const [allToolCalls, setAllToolCalls] = useState<ToolCall[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  const [showReasoningMenu, setShowReasoningMenu] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const sessionIdRef = useRef(initialSessionId || generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef('');
  const assistantIdRef = useRef('');
  const streamArtifactsRef = useRef<Artifact[]>([]);
  const currentToolCallsRef = useRef<ToolCall[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleClear = () => {
    resetSeenArtifacts();
    setMessages([{ id: 'welcome', role: 'assistant', content: '🧹 Conversation effacée. Que puis-je pour toi ?', timestamp: Date.now() }]);
    setArtifact(null);
    setShowPanel(false);
    setStreamArtifactCount(0);
    setToolCallsMap({});
    setAllToolCalls([]);
    setAttachedFiles([]);
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
      const systemMsg = webSearch
        ? `Tu es un assistant IA utile intégré à Aegis Flow Dashboard. L'utilisateur active la recherche web. Contexte : ${await searchWeb(text)}`
        : 'Tu es un assistant IA utile intégré à Aegis Flow Dashboard. Réponds en markdown. Quand tu génères du code HTML, JSON, CSV, SVG, Mermaid ou markdown dans des blocs de code, préfixe avec ```lang.';

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
          streamArtifactsRef.current = [...streamArtifactsRef.current, ...newArtifacts];
          newArtifacts.forEach(a => {
            setArtifact(a);
            setStreamArtifactCount(prev => prev + 1);
          });
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
      const gen = streamAgentChat(history, {
        sessionId: sessionIdRef.current,
        reasoning,
        webSearchEnabled: webSearch,
      });

      let chunkCount = 0;
      for await (const event of gen) {
        switch (event.type) {
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
            {streamArtifactCount > 0 && (
              <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] text-[var(--accent)]">
                {streamArtifactCount} artefact{streamArtifactCount > 1 ? 's' : ''}
              </span>
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
              <FileText className="h-3.5 w-3.5" />
              Outils
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onSelectArtifact={handleSelectArtifact}
                toolCalls={msg.role === 'assistant' ? getAssistantToolCalls(msg.id) : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <div className="mx-auto max-w-3xl">
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
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-2 transition focus-within:border-[var(--accent)]/50">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={streaming ? 'Génération en cours...' : mode === 'agent' ? 'Demande à l\'agent... (bash, fichiers, code, recherche)' : 'Pose une question... (Enter pour envoyer)'}
                rows={1}
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none"
                disabled={streaming}
              />
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => { setShowFileUpload(!showFileUpload); setShowReasoningMenu(false); }}
                    className={`rounded-lg p-2 transition ${showFileUpload ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}
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
                  className={`rounded-lg p-2 transition ${
                    webSearch ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
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
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition disabled:opacity-30"
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
        <div className="w-[420px] border-l border-[var(--border)] bg-[var(--surface-1)] flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text)]">Panneau</span>
            </div>
            <button onClick={() => setShowPanel(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex border-b border-[var(--border)]">
            {(['artefacts', 'terminal', 'workspace'] as PanelTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                  panelTab === tab
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab === 'artefacts' ? 'Artefacts' : tab === 'terminal' ? 'Terminal' : 'Workspace'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {panelTab === 'artefacts' && (
              artifact ? (
                <ArtifactPanel artifact={artifact} onClose={() => { setArtifact(null); }} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <FileText className="h-12 w-12 text-[var(--surface-3)] mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Génère du code dans le chat pour le voir ici</p>
                </div>
              )
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
      )}
    </div>
  );
}
