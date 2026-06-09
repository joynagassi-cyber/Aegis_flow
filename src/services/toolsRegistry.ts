export interface ToolDef {
  name: string;
  description: string;
  category: 'execution' | 'files' | 'search' | 'data' | 'system';
  parameters: { name: string; type: string; required: boolean; description: string }[];
  examples: string[];
  constraints: string[];
}

export const TOOLS: ToolDef[] = [
  {
    name: 'Bash',
    category: 'execution',
    description: 'Exécute des commandes shell (PowerShell 7+) dans un sandbox isolé par session. Le répertoire de travail est le workspace de la session.',
    parameters: [
      { name: 'command', type: 'string', required: true, description: 'Commande shell à exécuter' },
    ],
    examples: [
      'Bash: ls -la (lister les fichiers)',
      'Bash: node script.js (exécuter un script Node.js)',
      'Bash: pip install pandas (installer un package Python)',
      'Bash: python -c "print(\"hello\")" (exécuter Python inline)',
      'Bash: Get-ChildItem -Recurse *.json (PowerShell: trouver tous les fichiers JSON)',
    ],
    constraints: [
      'Timeout 60s maximum',
      'Sortie limitée à 100 KB',
      'Pas d\'accès réseau sortant vers des IP privées',
      'Sandbox isolé par sessionId — pas de persistance entre sessions',
    ],
  },
  {
    name: 'Read',
    category: 'files',
    description: 'Lit le contenu d\'un fichier ou liste un répertoire. Utilisé pour inspecter le code source, la configuration, ou explorer le workspace.',
    parameters: [
      { name: 'filePath', type: 'string', required: true, description: 'Chemin absolu ou relatif du fichier/répertoire à lire' },
    ],
    examples: [
      'Read: src/index.ts (lire un fichier source)',
      'Read: package.json (lire la configuration du projet)',
      'Read: src/components (lister le contenu d\'un dossier)',
    ],
    constraints: [
      'Limité aux fichiers dans le workspace du projet',
      'Lecture seule — ne modifie pas les fichiers',
    ],
  },
  {
    name: 'Write',
    category: 'files',
    description: 'Crée ou écrase un fichier avec le contenu spécifié. Utilisé pour générer du code, des fichiers de configuration, des rapports, etc.',
    parameters: [
      { name: 'filePath', type: 'string', required: true, description: 'Chemin absolu ou relatif du fichier à créer' },
      { name: 'content', type: 'string', required: true, description: 'Contenu complet du fichier' },
    ],
    examples: [
      'Write: hello.ts avec contenu "console.log(\'hello\')" (créer un fichier TypeScript)',
      'Write: data/output.json avec contenu JSON (créer un fichier de données)',
      'Write: README.md avec contenu markdown (créer de la documentation)',
    ],
    constraints: [
      'Taille max 5 MB par fichier',
      'Écrase le fichier existant sans confirmation',
      'Crée automatiquement les dossiers parents si nécessaires',
    ],
  },
  {
    name: 'Edit',
    category: 'files',
    description: 'Modifie un fichier existant par remplacement de texte. Plus précis que Write pour les petites modifications. Utilise oldString → newString.',
    parameters: [
      { name: 'filePath', type: 'string', required: true, description: 'Chemin du fichier à modifier' },
      { name: 'oldString', type: 'string', required: true, description: 'Texte existant à remplacer (doit être unique dans le fichier)' },
      { name: 'newString', type: 'string', required: true, description: 'Nouveau texte de remplacement' },
    ],
    examples: [
      'Edit: src/config.ts, oldString: "port: 3000", newString: "port: 8080" (changer une config)',
      'Edit: src/app.ts, oldString: "function oldName", newString: "function newName" (renommer une fonction)',
    ],
    constraints: [
      'oldString doit correspondre exactement — espaces et casse comptent',
      'oldString doit être unique dans le fichier',
      'Taille max 5 MB',
    ],
  },
  {
    name: 'Glob',
    category: 'files',
    description: 'Recherche des fichiers par motif (pattern) dans le workspace. Retourne les chemins triés par date de modification.',
    parameters: [
      { name: 'pattern', type: 'string', required: true, description: 'Motif glob (ex: **/*.ts, src/**/*.css)' },
    ],
    examples: [
      'Glob: **/*.tsx (trouver tous les composants React)',
      'Glob: src/**/*.css (trouver tous les fichiers CSS dans src)',
      'Glob: **/*.{ts,tsx} (trouver tous les fichiers TypeScript)',
    ],
    constraints: [
      'Pattern relatif au workspace root',
      'Retourne max 100 résultats',
    ],
  },
  {
    name: 'Grep',
    category: 'files',
    description: 'Recherche un motif (regex) dans le contenu des fichiers. Retourne les fichiers avec numéros de ligne contenant des correspondances.',
    parameters: [
      { name: 'pattern', type: 'string', required: true, description: 'Expression régulière à chercher' },
      { name: 'include', type: 'string', required: false, description: 'Filtre de fichier (ex: *.ts, *.{ts,tsx})' },
    ],
    examples: [
      'Grep: "function handle" (trouver toutes les fonctions handle*)',
      'Grep: "import.*React" include: *.tsx (trouver les imports React dans les fichiers TSX)',
      'Grep: "apiUrl|fetch" (trouver les appels API)',
    ],
    constraints: [
      'Regex standard — pas de flags avancés',
      'Limité aux fichiers dans le workspace',
    ],
  },
  {
    name: 'web_search',
    category: 'search',
    description: 'Effectue une recherche web via DuckDuckGo. Retourne un résumé textuel des résultats. Utilisé pour obtenir des informations actualisées, des news, des documentations récentes.',
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Requête de recherche naturelle' },
    ],
    examples: [
      'web_search: "React 19 new features 2025" (rechercher les nouveautés React)',
      'web_search: "tailwindcss v4 documentation flexbox" (chercher de la doc)',
      'web_search: "best practices TypeScript 2025" (bonnes pratiques)',
    ],
    constraints: [
      'Timeout 8s',
      'Résultats limités à 5000 caractères',
      'Utilise DuckDuckGo — résultats généralistes',
    ],
  },
  {
    name: 'get_checklists',
    category: 'data',
    description: 'Récupère la progression des checklists pour un type d\'objectif. Retourne les sections et items avec leur statut (coché/non coché).',
    parameters: [
      { name: 'objectiveType', type: 'string', required: true, description: 'Type d\'objectif: "saas" ou "geoai"' },
      { name: 'sectionId', type: 'string', required: false, description: 'ID de section optionnel pour filtrer' },
    ],
    examples: [
      'get_checklists: objectiveType="saas" (toutes les sections SaaS)',
      'get_checklists: objectiveType="geoai", sectionId="foundations" (section spécifique GeoAI)',
    ],
    constraints: [
      'Lecture seule',
      'objectiveType doit être "saas" ou "geoai"',
    ],
  },
  {
    name: 'toggle_checklist',
    category: 'data',
    description: 'Coche ou décoche un item de checklist. L\'agent DOIT demander confirmation à l\'utilisateur avant d\'exécuter cette action.',
    parameters: [
      { name: 'objectiveType', type: 'string', required: true, description: 'Type d\'objectif: "saas" ou "geoai"' },
      { name: 'sectionId', type: 'string', required: true, description: 'ID de la section' },
      { name: 'itemId', type: 'string', required: true, description: 'ID de l\'item à modifier' },
      { name: 'done', type: 'boolean', required: true, description: 'true pour cocher, false pour décocher' },
    ],
    examples: [
      'toggle_checklist: objectiveType="geoai", sectionId="deep-learning", itemId="vit-basics", done=true (cocher un item)',
    ],
    constraints: [
      'DOIT demander confirmation à l\'utilisateur avant',
      'Nécessite les bons IDs (récupérés via get_checklists)',
    ],
  },
  {
    name: 'get_kpis',
    category: 'data',
    description: 'Retourne les KPIs actuels du tableau de bord : MRR, nombre de clients, streaks, jour d\'abonnement, etc.',
    parameters: [],
    examples: [
      'get_kpis: {} (récupérer tous les KPIs)',
    ],
    constraints: [
      'Aucun paramètre requis',
      'Lecture seule',
    ],
  },
];

export function buildToolsContext(): string {
  const byCategory = TOOLS.reduce<Record<string, ToolDef[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  const sections = Object.entries(byCategory).map(([cat, tools]) => {
    const header = `### ${catLabel(cat)}`;
    const list = tools.map(t => formatTool(t)).join('\n\n');
    return `${header}\n${list}`;
  });

  return `## Outils disponibles\n\nTu as accès aux outils suivants dans cet environnement. Utilise-les selon les besoins :\n\n${sections.join('\n\n')}\n\n## Règles d'utilisation des outils\n- Explique toujours ce que tu vas faire AVANT d'utiliser un outil\n- Préfère Bash pour exécuter du code, Write/Edit pour manipuler des fichiers\n- web_search est parfait pour vérifier des informations récentes\n- Ne JAMAIS halluciner des résultats d'outils — si un outil échoue, dis-le à l'utilisateur`;
}

function catLabel(cat: string): string {
  const labels: Record<string, string> = {
    execution: '⚡ Exécution',
    files: '📁 Fichiers',
    search: '🔍 Recherche',
    data: '📊 Données',
    system: '⚙️ Système',
  };
  return labels[cat] || cat;
}

function formatTool(t: ToolDef): string {
  const params = t.parameters.length > 0
    ? `Paramètres :\n${t.parameters.map(p => `  - ${p.name}${p.required ? ' (requis)' : ' (optionnel)'} : ${p.type} — ${p.description}`).join('\n')}`
    : 'Pas de paramètres';

  const examples = `Exemples :\n${t.examples.map(e => `  - \`${e}\``).join('\n')}`;

  const constraints = t.constraints.length > 0
    ? `Contraintes :\n${t.constraints.map(c => `  - ${c}`).join('\n')}`
    : '';

  return `#### ${t.name}\n${t.description}\n\n${params}\n\n${examples}${constraints ? `\n\n${constraints}` : ''}`;
}
