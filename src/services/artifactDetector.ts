import type { Artifact } from './chatService';

export type ArtifactType = Artifact['type'] | 'chart' | 'diagram' | 'widget' | 'dashboard' | 'notebook' | 'flow';

export interface RichArtifact extends Artifact {
  type: ArtifactType;
  metadata?: {
    interactive?: boolean;
    stateful?: boolean;
    width?: number;
    height?: number;
    source?: string;
  };
}

const blockRegex = /```(\w+)?\n([\s\S]*?)```/g;
const seenArtifacts = new Set<string>();

export function resetSeenArtifacts() {
  seenArtifacts.clear();
}

const TYPE_HINTS: Record<string, ArtifactType> = {
  chart: 'chart', charts: 'chart', graph: 'chart', graphs: 'chart',
  mermaid: 'diagram', diagram: 'diagram', architecture: 'diagram', flow: 'flow', reactflow: 'flow', workflow: 'flow',
  widget: 'widget', interactive: 'widget', app: 'widget', component: 'widget',
  dashboard: 'dashboard', overview: 'dashboard',
  python: 'notebook', notebook: 'notebook', analysis: 'notebook',
  plotly: 'chart', echarts: 'chart', d3: 'widget',
};

export function scanForArtifacts(fullContent: string): RichArtifact[] {
  const found: RichArtifact[] = [];
  let match;

  while ((match = blockRegex.exec(fullContent)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const code = match[2].trim();
    if (!code) continue;

    const hash = `${lang}:${code.slice(0, 64)}`;
    if (seenArtifacts.has(hash)) continue;
    seenArtifacts.add(hash);

    const hintType = TYPE_HINTS[lang];
    const lowerContent = code.toLowerCase().slice(0, 200);

    if (hintType === 'chart' || lang === 'chart' || lowerContent.includes('<svg') && (lowerContent.includes('chart') || lowerContent.includes('axis'))) {
      found.push({ id: crypto.randomUUID(), type: 'chart', title: 'Graphique', content: code, language: lang });
    } else if (hintType === 'diagram' || lang === 'mermaid' || lang === 'flow' || lang === 'diagram') {
      found.push({ id: crypto.randomUUID(), type: 'diagram', title: 'Diagramme', content: code, language: lang });
    } else if (hintType === 'widget' || lang === 'widget' || lang === 'jsx' || lang === 'tsx') {
      found.push({ id: crypto.randomUUID(), type: 'widget', title: 'Widget Interactif', content: code, language: lang });
    } else if (hintType === 'dashboard') {
      found.push({ id: crypto.randomUUID(), type: 'dashboard', title: 'Dashboard', content: code, language: lang });
    } else if (hintType === 'notebook' || lang === 'python' || lang === 'jupyter' || lang === 'ipynb') {
      found.push({ id: crypto.randomUUID(), type: 'notebook', title: 'Notebook', content: code, language: lang });
    } else if (lang === 'html' || lang === 'htm') {
      const interactive = lowerContent.includes('script') || lowerContent.includes('onclick') || lowerContent.includes('input') || lowerContent.includes('button');
      found.push({
        id: crypto.randomUUID(), type: 'html', title: interactive ? 'Widget HTML' : 'Aperçu HTML',
        content: code, language: 'html',
        metadata: { interactive },
      });
    } else if (lang === 'json') {
      try { JSON.parse(code); found.push({ id: crypto.randomUUID(), type: 'json', title: 'Données JSON', content: code, language: 'json' }); }
      catch { continue; }
    } else if (lang === 'csv') {
      found.push({ id: crypto.randomUUID(), type: 'csv', title: 'Tableau CSV', content: code, language: 'csv' });
    } else if (lang === 'markdown' || lang === 'md') {
      found.push({ id: crypto.randomUUID(), type: 'markdown', title: 'Document Markdown', content: code, language: 'markdown' });
    } else if (lang === 'svg') {
      found.push({ id: crypto.randomUUID(), type: 'diagram', title: 'Image SVG', content: code, language: 'svg' });
    } else if (lang === 'plotly' || lang === 'vega' || lang === 'vega-lite') {
      found.push({ id: crypto.randomUUID(), type: 'chart', title: 'Graphique interactif', content: code, language: lang, metadata: { interactive: true } });
    } else if (hintType === 'flow' || lang === 'flow' || lang === 'reactflow') {
      found.push({ id: crypto.randomUUID(), type: 'flow', title: 'Flux interactif', content: code, language: 'flow', metadata: { interactive: true } });
    }
  }

  return found;
}

export function detectArtifact(content: string): RichArtifact | null {
  const artifacts = scanForArtifacts(content);
  return artifacts[0] || null;
}
