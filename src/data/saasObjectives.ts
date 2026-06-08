export interface SaaSPhaseDef {
  id: string;
  label: string;
  daysStart: number;
  daysEnd: number;
  color: string;
  description: string;
  objectives: string[];
  targets: {
    mrr: number;
    customers: number;
    features: number;
  };
  milestones: string[];
}

export const SAAS_PHASES: SaaSPhaseDef[] = [
  {
    id: 'mvp',
    label: 'MVP',
    daysStart: 1,
    daysEnd: 30,
    color: '#0066FF',
    description: 'POC (J4) + Phase 0 (16j) : Ingestion, NEURON-CHAINS, FLYIQ, APEX, BRAIN, ASCENT Agents 01-06.',
    objectives: [
      'Livrer le POC fonctionnel en 4 jours',
      'Construire le MVP : ingestion docs/YouTube/URL, flashcards, SRS, graphe de connaissances',
      'Implémenter les 6 agents ASCENT de base (Goal Interpreter, Doc Ingestion, Flash Card Creator, SRS, Knowledge Graph, Review Commander)',
      'Déployer en bêta fermée pour les premiers utilisateurs tests',
      'Mettre en place le billing de base et les abonnements',
    ],
    targets: { mrr: 0, customers: 10, features: 20 },
    milestones: [
      'POC livré J4',
      'MVP en bêta fermée',
      '10 utilisateurs tests actifs',
    ],
  },
  {
    id: 'developpement',
    label: 'Développement',
    daysStart: 31,
    daysEnd: 60,
    color: '#00B4FF',
    description: 'V1 Phase 1 (7j) : Agents 07-08 Quiz & Image/Audio, Ingestion/FLYIQ/BRAIN v2, Stripe Premium.',
    objectives: [
      'Livrer la V1 : Agent-07 Quiz, Agent-08 Image & Audio',
      'Améliorer Ingestion, FLYIQ et BRAIN v2',
      'Connecter Stripe pour le premium billing',
      'Itérer sur les retours des utilisateurs tests',
      'Recruter 30 utilisateurs actifs',
    ],
    targets: { mrr: 1000, customers: 30, features: 35 },
    milestones: [
      'V1 livrée',
      'Stripe connecté',
      'Tunnel de vente actif',
    ],
  },
  {
    id: 'premier-paiement',
    label: 'Premier Paiement',
    daysStart: 61,
    daysEnd: 90,
    color: '#00E676',
    description: 'V2 Phase 2 (12j) : Agent-09 Mind Palace 3D, Proof of Skill, Marketplace, monétisation active.',
    objectives: [
      'Livrer la V2 : Agent-09 Mind Palace (3D), Proof of Skill, Marketplace',
      'Full NEURON-CHAINS',
      'Activer la monétisation et obtenir les premiers clients payants',
      'Optimiser le coût LLM (<$0.10 Free, <$0.50 Premium par mois)',
      'Atteindre 100 clients et MRR >5k€',
    ],
    targets: { mrr: 5000, customers: 100, features: 50 },
    milestones: [
      'Premier client payant',
      'MRR >5k€',
      'Proof of Skill en ligne',
    ],
  },
  {
    id: 'lancement',
    label: 'Lancement',
    daysStart: 91,
    daysEnd: 120,
    color: '#FFD600',
    description: 'Lancement public, campagne marketing, passage à l\'échelle avec NPS >40 et rétention J7 >40%.',
    objectives: [
      'Lancer publiquement la plateforme',
      'Campagne marketing et acquisition massive',
      'Atteindre NPS >40 et rétention J7 >40%',
      'Maintenir ASCENT Completion Rate >70%',
      'Atteindre 500 clients payants',
    ],
    targets: { mrr: 15000, customers: 500, features: 70 },
    milestones: [
      'Lancement public réussi',
      '500 clients actifs',
      'NPS >40 atteint',
    ],
  },
  {
    id: 'iterations',
    label: 'Itérations',
    daysStart: 121,
    daysEnd: 9999,
    color: '#FF9100',
    description: 'Scale, itérations continues, Cache Hit Rate >60%, Score Confiance Docs ≥85/100.',
    objectives: [
      'Atteindre 5 000+ clients',
      'Optimiser le cache hit rate >60% et le score de confiance docs ≥85/100',
      'Réduire le temps jusqu\'à compétence de 40%',
      'Expansion et roadmap communautaire',
      'Itérations produit continues basées sur les données utilisateurs',
    ],
    targets: { mrr: 50000, customers: 5000, features: 120 },
    milestones: [
      'Scale atteint',
      'Cache hit rate >60%',
      'Roadmap communautaire active',
    ],
  },
];

export function getCurrentPhase(dayNumber: number): SaaSPhaseDef {
  for (const phase of SAAS_PHASES) {
    if (dayNumber >= phase.daysStart && dayNumber <= phase.daysEnd) {
      return phase;
    }
  }
  return SAAS_PHASES[SAAS_PHASES.length - 1];
}

export function getPhaseProgress(
  dayNumber: number,
  phase: SaaSPhaseDef,
  overrides?: { mrr?: number; customers?: number; features?: number },
): number {
  if (phase.daysEnd === 9999 && overrides) {
    const mrrRatio = overrides.mrr ? Math.min(1, overrides.mrr / phase.targets.mrr) : 0;
    const custRatio = overrides.customers ? Math.min(1, overrides.customers / phase.targets.customers) : 0;
    const featRatio = overrides.features ? Math.min(1, overrides.features / phase.targets.features) : 0;
    return Math.min(100, Math.round((mrrRatio + custRatio + featRatio) / 3 * 100));
  }
  const range = phase.daysEnd - phase.daysStart;
  const elapsed = dayNumber - phase.daysStart;
  return Math.min(100, Math.round((elapsed / range) * 100));
}
