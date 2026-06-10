import { createStore } from './simpleStore';
import type { RichArtifact } from '../services/artifactDetector';

export interface WidgetState {
  [widgetId: string]: Record<string, unknown>;
}

export interface ArtifactStoreState {
  artifacts: RichArtifact[];
  pinnedArtifacts: string[];
  widgetStates: WidgetState;
  templates: ArtifactTemplate[];
  searchIndex: string;
}

export interface ArtifactTemplate {
  id: string;
  name: string;
  description: string;
  type: RichArtifact['type'];
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_TEMPLATES: ArtifactTemplate[] = [
  {
    id: 'mrr-chart',
    name: 'Graphique MRR',
    description: 'Bar chart d\'évolution du MRR mensuel',
    type: 'chart',
    language: 'chart',
    content: `| Mois | MRR |
|------|-----|
| Jan  | 5000 |
| Fév  | 7200 |
| Mar  | 8900 |
| Avr  | 10500 |
| Mai  | 12300 |
| Jui  | 14100 |`,
    metadata: { interactive: true },
  },
  {
    id: 'cohort-table',
    name: 'Tableau de cohorte',
    description: 'Rétention utilisateur par cohorte',
    type: 'csv',
    language: 'csv',
    content: `Cohorte,M+0,M+1,M+2,M+3,M+4,M+5
2025-01,1000,420,380,340,310,290
2025-02,1100,460,410,370,340,0
2025-03,1200,500,450,400,0,0
2025-04,1300,540,480,0,0,0
2025-05,1400,580,0,0,0,0
2025-06,1500,0,0,0,0,0`,
  },
  {
    id: 'arch-diagram',
    name: 'Diagramme d\'architecture',
    description: 'Diagramme système en Mermaid',
    type: 'diagram',
    language: 'mermaid',
    content: `graph TD
    Client[Client Web] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Billing[Billing Service]
    API --> Analytics[Analytics Service]
    Auth --> DB[(PostgreSQL)]
    Billing --> DB
    Analytics --> DB
    Analytics --> Cache[(Redis)]
    Billing --> Stripe[Stripe API]`,
    metadata: { interactive: false },
  },
  {
    id: 'kpi-dashboard',
    name: 'Dashboard KPI',
    description: 'Indicateurs clés de performance',
    type: 'dashboard',
    language: 'dashboard',
    content: `## Performance Dashboard
- **Revenu mensuel**: 48 200 € (+12%)
- **Utilisateurs actifs**: 2 847 (+8.3%)
- **Taux de conversion**: 3.2% (+0.4pp)
- **Churn rate**: 1.8% (-0.3pp)
- **NPS**: 72 (+5pts)`,
    metadata: { interactive: false },
  },
  {
    id: 'data-notebook',
    name: 'Analyse de données',
    description: 'Notebook d\'analyse avec code Python',
    type: 'notebook',
    language: 'python',
    content: `import pandas as pd
import matplotlib.pyplot as plt

# Chargement des données
df = pd.read_csv('revenue.csv')

# Agrégation par mois
monthly = df.groupby('month')['revenue'].sum()

# Visualisation
plt.figure(figsize=(10, 6))
plt.plot(monthly.index, monthly.values, marker='o')
plt.title('Revenu mensuel')
plt.grid(True, alpha=0.3)
plt.show()`,
  },
];

export const useArtifactStore = createStore<ArtifactStoreState>(
  () => ({
    artifacts: [],
    pinnedArtifacts: [],
    widgetStates: {},
    templates: DEFAULT_TEMPLATES,
    searchIndex: '',
  }),
  { storageKey: 'artifact-store' },
);

export function addArtifact(artifact: RichArtifact) {
  const state = useArtifactStore.getState();
  const exists = state.artifacts.some(a => a.id === artifact.id);
  if (exists) return;
  useArtifactStore.setState({
    artifacts: [artifact, ...state.artifacts],
  });
}

export function removeArtifact(id: string) {
  const state = useArtifactStore.getState();
  useArtifactStore.setState({
    artifacts: state.artifacts.filter(a => a.id !== id),
    pinnedArtifacts: state.pinnedArtifacts.filter(p => p !== id),
  });
}

export function pinArtifact(id: string) {
  const state = useArtifactStore.getState();
  if (state.pinnedArtifacts.includes(id)) return;
  useArtifactStore.setState({
    pinnedArtifacts: [...state.pinnedArtifacts, id],
  });
}

export function unpinArtifact(id: string) {
  const state = useArtifactStore.getState();
  useArtifactStore.setState({
    pinnedArtifacts: state.pinnedArtifacts.filter(p => p !== id),
  });
}

export function updateWidgetState(widgetId: string, state: Record<string, unknown>) {
  const store = useArtifactStore.getState();
  useArtifactStore.setState({
    widgetStates: {
      ...store.widgetStates,
      [widgetId]: { ...(store.widgetStates[widgetId] || {}), ...state },
    },
  });
}

export function getWidgetState(widgetId: string): Record<string, unknown> {
  return useArtifactStore.getState().widgetStates[widgetId] || {};
}

export function addTemplate(template: ArtifactTemplate) {
  const state = useArtifactStore.getState();
  useArtifactStore.setState({
    templates: [...state.templates, template],
  });
}

export function removeTemplate(id: string) {
  const state = useArtifactStore.getState();
  useArtifactStore.setState({
    templates: state.templates.filter(t => t.id !== id),
  });
}

export function getPinnedArtifacts(): RichArtifact[] {
  const state = useArtifactStore.getState();
  return state.artifacts.filter(a => state.pinnedArtifacts.includes(a.id));
}

export function searchArtifacts(query: string): RichArtifact[] {
  const state = useArtifactStore.getState();
  if (!query) return state.artifacts;
  const q = query.toLowerCase();
  return state.artifacts.filter(
    a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.language || '').toLowerCase().includes(q),
  );
}
