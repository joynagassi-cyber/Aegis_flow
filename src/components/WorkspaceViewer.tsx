import { useState, useEffect, useCallback } from 'react';
import { File, Folder, FolderOpen, FileText, FileJson, FileCode, ChevronRight, RefreshCw } from 'lucide-react';
import { apiUrl } from '../services/apiConfig';

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileEntry[];
}

interface WorkspaceViewerProps {
  sessionId: string;
}

async function fetchWorkspaceTree(sessionId: string): Promise<FileEntry[]> {
  try {
    const res = await fetch(apiUrl(`/api/agent/workspace/${encodeURIComponent(sessionId)}`));
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function FileIcon({ name, type }: { name: string; type: string }) {
  if (type === 'dir') return <Folder className="h-4 w-4 text-amber-400 shrink-0" />;
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'json') return <FileJson className="h-4 w-4 text-yellow-400 shrink-0" />;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go', 'java'].includes(ext || ''))
    return <FileCode className="h-4 w-4 text-blue-400 shrink-0" />;
  if (['md', 'txt', 'csv'].includes(ext || ''))
    return <FileText className="h-4 w-4 text-gray-400 shrink-0" />;
  return <File className="h-4 w-4 text-gray-500 shrink-0" />;
}

function TreeNode({ entry, depth }: { entry: FileEntry; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const [children, setChildren] = useState<FileEntry[]>(entry.children || []);

  const toggle = useCallback(async () => {
    if (entry.type === 'dir') {
      if (!open && children.length === 0) {
        const fetched = await fetchWorkspaceTree(`dir:${entry.path}`);
        setChildren(fetched);
      }
      setOpen(!open);
    }
  }, [entry, open, children.length]);

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {entry.type === 'dir' && (
          <ChevronRight className={`h-3 w-3 transition ${open ? 'rotate-90' : ''}`} />
        )}
        <FileIcon name={entry.name} type={entry.type} />
        <span className="truncate">{entry.name}</span>
      </button>
      {open && children.length > 0 && (
        <div>
          {children.map(child => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceViewer({ sessionId }: WorkspaceViewerProps) {
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const t = await fetchWorkspaceTree(sessionId);
    setTree(t);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-bold text-[var(--text-muted)]">Workspace</span>
        <button onClick={load} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {loading && tree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[var(--text-muted)]">
            Chargement...
          </div>
        ) : tree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[var(--text-muted)]">
            Aucun fichier dans le workspace
          </div>
        ) : (
          tree.map(entry => <TreeNode key={entry.path} entry={entry} depth={0} />)
        )}
      </div>
    </div>
  );
}
