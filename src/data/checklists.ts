export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface SectionChecklist {
  sectionId: string;
  sectionLabel: string;
  items: ChecklistItem[];
}

export const SAAS_CHECKLISTS: SectionChecklist[] = [
  {
    sectionId: 'mvp',
    sectionLabel: 'Phase MVP (J1-J30)',
    items: [
      { id: 'saas-mvp-1', text: 'Déployer le POC fonctionnel (architecture 3-tier)', done: false },
      { id: 'saas-mvp-2', text: 'Implémenter l\'ingestion de documents (PDF, YouTube, URL)', done: false },
      { id: 'saas-mvp-3', text: 'Créer le système de flashcards avec SRS', done: false },
      { id: 'saas-mvp-4', text: 'Construire le Knowledge Graph de base', done: false },
      { id: 'saas-mvp-5', text: 'Implémenter les agents Goal Interpreter + Doc Ingestion', done: false },
      { id: 'saas-mvp-6', text: 'Configurer le pipeline auth et base de données', done: false },
      { id: 'saas-mvp-7', text: 'Déployer en bêta fermée avec 10 utilisateurs tests', done: false },
      { id: 'saas-mvp-8', text: 'Mettre en place le système de billing de base', done: false },
    ],
  },
  {
    sectionId: 'developpement',
    sectionLabel: 'Phase Développement (J31-J60)',
    items: [
      { id: 'saas-dev-1', text: 'Livrer Agent-07 Quiz interactif', done: false },
      { id: 'saas-dev-2', text: 'Livrer Agent-08 Image & Audio', done: false },
      { id: 'saas-dev-3', text: 'Améliorer ingestion, FLYIQ et BRAIN v2', done: false },
      { id: 'saas-dev-4', text: 'Connecter Stripe pour le premium billing', done: false },
      { id: 'saas-dev-5', text: 'Itérer sur les retours des 30 utilisateurs tests', done: false },
      { id: 'saas-dev-6', text: 'Mettre en place le tunnel de vente actif', done: false },
      { id: 'saas-dev-7', text: 'Atteindre MRR 1000€', done: false },
    ],
  },
  {
    sectionId: 'premier-paiement',
    sectionLabel: 'Phase Premier Paiement (J61-J90)',
    items: [
      { id: 'saas-pp-1', text: 'Livrer Agent-09 Mind Palace 3D', done: false },
      { id: 'saas-pp-2', text: 'Implémenter Proof of Skill', done: false },
      { id: 'saas-pp-3', text: 'Lancer la Marketplace', done: false },
      { id: 'saas-pp-4', text: 'Activer la monétisation — premier client payant', done: false },
      { id: 'saas-pp-5', text: 'Optimiser coût LLM (<0.10$ Free, <0.50$ Premium)', done: false },
      { id: 'saas-pp-6', text: 'Atteindre 100 clients et MRR >5k€', done: false },
      { id: 'saas-pp-7', text: 'Full NEURON-CHAINS opérationnel', done: false },
    ],
  },
  {
    sectionId: 'lancement',
    sectionLabel: 'Phase Lancement (J91-J120)',
    items: [
      { id: 'saas-lancement-1', text: 'Lancement public de la plateforme', done: false },
      { id: 'saas-lancement-2', text: 'Campagne marketing et acquisition massive', done: false },
      { id: 'saas-lancement-3', text: 'Atteindre NPS >40', done: false },
      { id: 'saas-lancement-4', text: 'Maintenir rétention J7 >40%', done: false },
      { id: 'saas-lancement-5', text: 'ASCENT Completion Rate >70%', done: false },
      { id: 'saas-lancement-6', text: 'Atteindre 500 clients payants', done: false },
      { id: 'saas-lancement-7', text: 'Atteindre MRR >15k€', done: false },
    ],
  },
  {
    sectionId: 'iterations',
    sectionLabel: 'Phase Itérations (J121+)',
    items: [
      { id: 'saas-iter-1', text: 'Atteindre 5 000+ clients', done: false },
      { id: 'saas-iter-2', text: 'Cache Hit Rate >60%', done: false },
      { id: 'saas-iter-3', text: 'Score Confiance Docs ≥85/100', done: false },
      { id: 'saas-iter-4', text: 'Réduire le temps jusqu\'à compétence de 40%', done: false },
      { id: 'saas-iter-5', text: 'Roadmap communautaire active', done: false },
      { id: 'saas-iter-6', text: 'Itérations produit continues basées sur données', done: false },
    ],
  },
];

export const GEOAI_CHECKLISTS: SectionChecklist[] = [
  {
    sectionId: '1',
    sectionLabel: 'Mois 1 — Fondations Geo-AI',
    items: [
      { id: 'geo-m1-1', text: 'Écosystème Geo-AI et cas d\'usage africains', done: false },
      { id: 'geo-m1-2', text: 'Python spatial avec GeoPandas', done: false },
      { id: 'geo-m1-3', text: 'Images satellites avec Rasterio', done: false },
      { id: 'geo-m1-4', text: 'Formats STAC/xarray et pipeline exploration', done: false },
    ],
  },
  {
    sectionId: '2',
    sectionLabel: 'Mois 2 — Données spatiales + ML',
    items: [
      { id: 'geo-m2-1', text: 'Sources de données et collecte (GADM, OSM, GEE)', done: false },
      { id: 'geo-m2-2', text: 'Prétraitement d\'images satellites', done: false },
      { id: 'geo-m2-3', text: 'Création de jeux de données étiquetés', done: false },
      { id: 'geo-m2-4', text: 'Pipeline qualité et équilibrage', done: false },
    ],
  },
  {
    sectionId: '3',
    sectionLabel: 'Mois 3 — ML géospatial',
    items: [
      { id: 'geo-m3-1', text: 'Random Forest, XGBoost, SVM sur données géo', done: false },
      { id: 'geo-m3-2', text: 'Carte de classification complète', done: false },
      { id: 'geo-m3-3', text: 'Validation et optimisation hyperparamètres', done: false },
      { id: 'geo-m3-4', text: 'Projet classification occupation du sol 50x50km', done: false },
    ],
  },
  {
    sectionId: '4',
    sectionLabel: 'Mois 4 — Deep Learning géospatial',
    items: [
      { id: 'geo-m4-1', text: 'PyTorch Config + DatasetGeoAI custom', done: false },
      { id: 'geo-m4-2', text: 'CNN pour classification d\'images satellites', done: false },
      { id: 'geo-m4-3', text: 'Transfer Learning ResNet/EfficientNet', done: false },
      { id: 'geo-m4-4', text: 'Pipeline DL complet de bout en bout', done: false },
    ],
  },
  {
    sectionId: '5',
    sectionLabel: 'Mois 5 — Détection + segmentation',
    items: [
      { id: 'geo-m5-1', text: 'Segmentation sémantique U-Net', done: false },
      { id: 'geo-m5-2', text: 'Détection d\'objets YOLOv8 (bâtiments)', done: false },
      { id: 'geo-m5-3', text: 'Segmentation avancée (SAM, YOLO-seg)', done: false },
      { id: 'geo-m5-4', text: 'Détecteur opérationnel en production', done: false },
    ],
  },
  {
    sectionId: '6',
    sectionLabel: 'Mois 6 — Spatio-temporel',
    items: [
      { id: 'geo-m6-1', text: 'Analyse séries temporelles NDVI', done: false },
      { id: 'geo-m6-2', text: 'Détection de changement multi-temporel', done: false },
      { id: 'geo-m6-3', text: 'Industrialisation (MLflow, Dask, FastAPI)', done: false },
      { id: 'geo-m6-4', text: 'Prototype service Geo-AI bout en bout', done: false },
    ],
  },
  {
    sectionId: '7',
    sectionLabel: 'Mois 7 — Produit Geo-AI',
    items: [
      { id: 'geo-m7-1', text: 'Choix du produit africain + architecture', done: false },
      { id: 'geo-m7-2', text: 'Backend FastAPI + PostGIS + auth JWT', done: false },
      { id: 'geo-m7-3', text: 'Interface web avec cartes Leaflet.js', done: false },
      { id: 'geo-m7-4', text: 'Déploiement Docker + VPS + vidéo démo', done: false },
    ],
  },
];

export function getSaaSChecklist(phaseId: string): SectionChecklist | undefined {
  return SAAS_CHECKLISTS.find(c => c.sectionId === phaseId);
}

export function getCurrentSaaSChecklist(currentDay: number): SectionChecklist {
  const phaseIndex = currentDay <= 30 ? 0 : currentDay <= 60 ? 1 : currentDay <= 90 ? 2 : currentDay <= 120 ? 3 : 4;
  return SAAS_CHECKLISTS[Math.min(phaseIndex, SAAS_CHECKLISTS.length - 1)];
}

export function getGeoAIChecklist(monthId: number): SectionChecklist | undefined {
  return GEOAI_CHECKLISTS.find(c => c.sectionId === String(monthId));
}

export function getChecklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter(i => i.done).length;
  return Math.round((done / items.length) * 100);
}
