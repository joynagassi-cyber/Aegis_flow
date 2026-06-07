import { Task } from '../types';
import { GEOAI_ROADMAP } from './geoaiRoadmap';

export interface GeoAIExercice {
  id: string;
  text: string;
  done: boolean;
}

export interface GeoAISemaine {
  id: number;
  moisId: number;
  titre: string;
  objectif: string;
  exercices: GeoAIExercice[];
  technologies: string[];
  livrable: string;
  statut: 'a_faire' | 'en_cours' | 'termine';
}

export interface GeoAIMois {
  id: number;
  titre: string;
  livrableFinal: string;
  couleur: string;
  semaines: GeoAISemaine[];
}

export interface GeoAIRoadmap {
  titre: string;
  dateDebut: string;
  dureeSemaines: number;
  regleOr: string;
  mois: GeoAIMois[];
}

export interface SportData {
  pushups: number;
  crunches: number;
  squats: number;
  plankSeconds: number;
  jumpingJacks: number;
  stretchingDone: boolean;
  cardioDone: boolean;
  cardioMinutes: number;
}

export interface MenageData {
  daily: {
    lit: boolean;
    balayer: boolean;
    ranger: boolean;
    poubelles: boolean;
    bureau: boolean;
    vaisselle: boolean;
    salleDeBain: boolean;
    aerer: boolean;
  };
  weekly: {
    balayageMaison: boolean;
    serpilliere: boolean;
    toilettes: boolean;
    salleDeBainComplet: boolean;
    depoussierage: boolean;
    lessive: boolean;
    fenetres: boolean;
    poubellesComplet: boolean;
  };
  monthly: {
    derriereMeubles: boolean;
    desinfectionCuisine: boolean;
    rideauxDraps: boolean;
    desencombrement: boolean;
    ampoulesPrises: boolean;
  };
}

export interface SleepData {
  hoursSlept: number;
  quality: number;
  bedtime: string;
  wakeTime: string;
}

export interface NutritionData {
  mealsCount: number;
  waterGlasses: number;
  qualityScore: number;
}

export interface DayData {
  dayNumber: number;
  date: string;
  spiritual: {
    prayerHours: number;
    bibleChapters: number;
    fasting: boolean;
    score: number;
  };
  reading: {
    pagesRead: number;
    booksFinishedCount: number;
  };
  english: {
    minutes: number;
    completed: boolean;
  };
  tech: {
    tasksCompleted: number;
    payingCustomersDelta: number;
  };
  pitch: {
    pitchesDone: number;
    confidenceScore: number;
  };
  marketing: {
    coursesCompleted: number;
    actionsDone: number;
  };
  sport: SportData;
  menage: MenageData;
  sleep: SleepData;
  nutrition: NutritionData;
  validated: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  status: 'à lire' | 'en cours' | 'terminé';
  category: 'SIG' | 'Télédétection' | 'Urbanisme' | 'Mindset' | 'Développement personnel' | 'Culture générale' | 'Prise de parole' | 'Vente' | 'Management' | 'Gestion d\'entreprise' | 'Création de startup' | 'Littérature sociale' | 'Tech' | 'Spirituel';
  startDate?: string;
  endDate?: string;
  rating: number;
  summary: string;
  keyPoints: string[];
  coverColor: string;
  coverImage?: string;
}

export interface PitchLog {
  id: string;
  date: string;
  title: string;
  targetAudience: string;
  selfEvaluation: string;
  score: number;
}

export interface ProjectLog {
  id: string;
  date: string;
  title: string;
  content: string;
  tag: 'milestone' | 'release' | 'insight' | 'kpi';
}

export interface ProgramState {
  currentDay: number;
  startDate: string;
  englishLevel: number;
  englishStreak: number;
  sportStreak: number;
  payingCustomers: number;
  mrr: number;
  featuresDelivered: number;
  currentSaaSPhase: 'Idéation' | 'MVP' | 'Beta' | 'Lancement' | 'Scale';
  userName: string;
  userBio: string;
  userPhoto: string;
  geoaiRoadmap: GeoAIRoadmap;
  dailyChecklist: {
    prayer: boolean;
    bible: boolean;
    fasting: boolean;
    reading: boolean;
    english: boolean;
    techTask: boolean;
    marketingAction: boolean;
    geoaiTask: boolean;
  };
  currentDayInput: {
    prayerHours: number;
    bibleChapters: number;
    fasting: boolean;
    englishMinutes: number;
    techTasksCount: number;
    marketingActions: string;
    pitchConfidence: number;
    geoaiTasksCount: number;
    sport: SportData;
    menage: MenageData;
    sleep: SleepData;
    nutrition: NutritionData;
  };
  days: DayData[];
  books: Book[];
  tasks: Task[];
  pitchLogs: PitchLog[];
  projectLogs: ProjectLog[];
}

export const getWorkoutQuota = (dayNumber: number, exercise: 'pushups' | 'crunches' | 'squats' | 'plankSeconds' | 'jumpingJacks'): number => {
  const currentMonth = Math.floor((dayNumber - 1) / 30) + 1; // Month 1 to 7

  if (exercise === 'pushups') {
    if (dayNumber <= 14) return 50;
    if (dayNumber <= 28) return 60;
    if (currentMonth === 2) return 70;
    if (currentMonth === 3) return 80;
    if (currentMonth === 4 || currentMonth === 5) return 90;
    return 100;
  }
  if (exercise === 'crunches' || exercise === 'squats') {
    // 50 base + 10 every month
    return 50 + (currentMonth - 1) * 10;
  }
  if (exercise === 'plankSeconds') {
    // 3 series x 30s base (90s total) + 3 series x 10s (30s total) every month
    return 90 + (currentMonth - 1) * 30;
  }
  if (exercise === 'jumpingJacks') {
    return 50;
  }
  return 50;
};

const getDefaultMenage = (): MenageData => ({
  daily: { lit: false, balayer: false, ranger: false, poubelles: false, bureau: false, vaisselle: false, salleDeBain: false, aerer: false },
  weekly: { balayageMaison: false, serpilliere: false, toilettes: false, salleDeBainComplet: false, depoussierage: false, lessive: false, fenetres: false, poubellesComplet: false },
  monthly: { derriereMeubles: false, desinfectionCuisine: false, rideauxDraps: false, desencombrement: false, ampoulesPrises: false }
});

export const RECOMMENDED_BOOKS: Book[] = [
  // SIG & Télédétection
  { id: 'rec_1', title: 'Geographic Information Systems and Science', author: 'Paul A. Longley', status: 'à lire', category: 'SIG', rating: 10, summary: 'La référence absolue pour comprendre les SIG modernes.', keyPoints: ['Spatial Analysis', 'Data Models', 'GIS Science'], coverColor: '#0066FF' },
  { id: 'rec_2', title: 'Remote Sensing and Image Interpretation', author: 'Thomas M. Lillesand', status: 'à lire', category: 'Télédétection', rating: 10, summary: 'Fondamentaux de la télédétection et de l\'interprétation d\'images.', keyPoints: ['Spectral Signatures', 'Satellite Imagery', 'Photogrammetry'], coverColor: '#00B4FF' },
  { id: 'rec_3', title: 'QGIS for Hydrological Applications', author: 'Hans van der Kwast', status: 'à lire', category: 'SIG', rating: 9, summary: 'Application pratique des SIG open source.', keyPoints: ['QGIS', 'Hydrology', 'Open Source'], coverColor: '#00C4B4' },
  
  // Urbanisme
  { id: 'rec_4', title: 'The Death and Life of Great American Cities', author: 'Jane Jacobs', status: 'à lire', category: 'Urbanisme', rating: 10, summary: 'Une vision révolutionnaire de l\'urbanisme moderne.', keyPoints: ['Urban Diversity', 'Sidewalks', 'City Planning'], coverColor: '#FF4D6A' },
  { id: 'rec_5', title: 'Urbanisme', author: 'Le Corbusier', status: 'à lire', category: 'Urbanisme', rating: 9, summary: 'Les principes fondamentaux de l\'architecture et de la ville.', keyPoints: ['Fonctionnalisme', 'Ville radieuse', 'Architecture'], coverColor: '#4D9FFF' },
  
  // Mindset & Développement Personnel
  { id: 'rec_6', title: 'Mindset: The New Psychology of Success', author: 'Carol S. Dweck', status: 'à lire', category: 'Mindset', rating: 10, summary: 'Fixed vs Growth Mindset.', keyPoints: ['Growth Mindset', 'Learning', 'Resilience'], coverColor: '#FFD700' },
  { id: 'rec_7', title: 'Can\'t Hurt Me', author: 'David Goggins', status: 'à lire', category: 'Mindset', rating: 10, summary: 'Dépassement de soi et discipline extrême.', keyPoints: ['Callous Your Mind', '40% Rule', 'Discipline'], coverColor: '#000000' },
  { id: 'rec_8', title: 'Les 48 lois du pouvoir', author: 'Robert Greene', status: 'à lire', category: 'Développement personnel', rating: 9, summary: 'Stratégies de pouvoir et de manipulation.', keyPoints: ['Power', 'Strategy', 'Human Nature'], coverColor: '#8B0000' },
  
  // Prise de parole & Vente
  { id: 'rec_9', title: 'Talk Like TED', author: 'Carmine Gallo', status: 'à lire', category: 'Prise de parole', rating: 9, summary: 'Les secrets des présentations publiques les plus inspirantes.', keyPoints: ['Storytelling', 'Passion', 'Practice'], coverColor: '#FF6600' },
  { id: 'rec_10', title: 'Never Split the Difference', author: 'Chris Voss', status: 'à lire', category: 'Vente', rating: 10, summary: 'Négociation de haut niveau par un ancien du FBI.', keyPoints: ['Tactical Empathy', 'Mirroring', 'Labeling'], coverColor: '#003380' },
  { id: 'rec_11', title: 'Influence et Manipulation', author: 'Robert Cialdini', status: 'à lire', category: 'Vente', rating: 10, summary: 'La psychologie de la persuasion.', keyPoints: ['Réciprocité', 'Preuve sociale', 'Rareté'], coverColor: '#00C4B4' },
  
  // Management & Gestion d'entreprise
  { id: 'rec_12', title: 'High Output Management', author: 'Andrew S. Grove', status: 'à lire', category: 'Management', rating: 10, summary: 'Le manuel de management pour les dirigeants de la Silicon Valley.', keyPoints: ['Leverage', 'Meetings', 'Performance'], coverColor: '#0052CC' },
  { id: 'rec_13', title: 'Good to Great', author: 'Jim Collins', status: 'à lire', category: 'Gestion d\'entreprise', rating: 9, summary: 'Pourquoi certaines entreprises font le saut et d\'autres non.', keyPoints: ['Level 5 Leadership', 'Hedgehog Concept', 'Flywheel'], coverColor: '#FFD600' },
  
  // Startup & Tech
  { id: 'rec_14', title: 'The Lean Startup', author: 'Eric Ries', status: 'à lire', category: 'Création de startup', rating: 9, summary: 'Comment les entrepreneurs d\'aujourd\'hui utilisent l\'innovation continue.', keyPoints: ['MVP', 'Pivot', 'Mesure'], coverColor: '#FF4D6A' },
  { id: 'rec_15', title: 'Zero to One', author: 'Peter Thiel', status: 'à lire', category: 'Création de startup', rating: 9, summary: 'Notes sur les startups, ou comment construire le futur.', keyPoints: ['Monopole', 'Innovation', 'Secret'], coverColor: '#4D9FFF' },
  { id: 'rec_16', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', status: 'à lire', category: 'Gestion d\'entreprise', rating: 10, summary: 'Construire une entreprise quand tout va mal.', keyPoints: ['Wartime CEO', 'Culture', 'Hard Choices'], coverColor: '#111111' },
  
  // Culture Générale & Littérature
  { id: 'rec_17', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', status: 'à lire', category: 'Culture générale', rating: 10, summary: 'Une histoire de l\'humanité.', keyPoints: ['Cognitive Revolution', 'Agricultural Revolution', 'Science'], coverColor: '#FFD700' },
  { id: 'rec_18', title: 'Les Misérables', author: 'Victor Hugo', status: 'à lire', category: 'Littérature sociale', rating: 10, summary: 'Chef-d\'œuvre de la littérature sociale française.', keyPoints: ['Justice', 'Rédemption', 'Société'], coverColor: '#003380' },
  { id: 'rec_19', title: '1984', author: 'George Orwell', status: 'à lire', category: 'Culture générale', rating: 10, summary: 'Dystopie sur le totalitarisme et la surveillance.', keyPoints: ['Big Brother', 'Thought Police', 'Freedom'], coverColor: '#FF0000' },
  { id: 'rec_20', title: 'La Bible', author: 'Dieu', status: 'à lire', category: 'Spirituel', rating: 10, summary: 'La parole de Dieu, fondement de la foi et de la sagesse.', keyPoints: ['Foi', 'Amour', 'Sagesse'], coverColor: '#FFFFFF' },
  { id: 'rec_21', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', status: 'à lire', category: 'Culture générale', rating: 9, summary: 'Les destins des sociétés humaines.', keyPoints: ['Géographie', 'Histoire', 'Société'], coverColor: '#8B4513' },
  { id: 'rec_22', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', status: 'à lire', category: 'Gestion d\'entreprise', rating: 9, summary: 'Pourquoi la plupart des petites entreprises ne fonctionnent pas et quoi faire.', keyPoints: ['Systèmes', 'Technicien', 'Entrepreneur'], coverColor: '#556B2F' },
  { id: 'rec_23', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', status: 'à lire', category: 'Mindset', rating: 10, summary: 'Les deux systèmes qui dirigent notre pensée.', keyPoints: ['Système 1', 'Système 2', 'Biais cognitifs'], coverColor: '#483D8B' },
  { id: 'rec_24', title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', status: 'à lire', category: 'Prise de parole', rating: 9, summary: 'L\'art de se faire des amis et d\'influencer les autres.', keyPoints: ['Relations humaines', 'Communication', 'Empathie'], coverColor: '#CD853F' },
  { id: 'rec_25', title: 'The Psychology of Selling', author: 'Brian Tracy', status: 'à lire', category: 'Vente', rating: 9, summary: 'Augmentez vos ventes plus facilement et rapidement que vous ne le pensiez possible.', keyPoints: ['Psychologie', 'Closing', 'Prospection'], coverColor: '#B22222' },
  { id: 'rec_26', title: 'The Jungle', author: 'Upton Sinclair', status: 'à lire', category: 'Littérature sociale', rating: 9, summary: 'Roman dénonçant les conditions de travail dans les abattoirs de Chicago.', keyPoints: ['Conditions de travail', 'Capitalisme', 'Réforme sociale'], coverColor: '#800000' },
  { id: 'rec_27', title: 'Measure What Matters', author: 'John Doerr', status: 'à lire', category: 'Management', rating: 9, summary: 'OKRs : la méthode de Google, Bono et la Fondation Gates pour définir des objectifs ambitieux.', keyPoints: ['OKRs', 'Objectifs', 'Résultats clés'], coverColor: '#2F4F4F' },
  { id: 'rec_28', title: 'Blitzscaling', author: 'Reid Hoffman', status: 'à lire', category: 'Création de startup', rating: 9, summary: 'L\'art de construire une entreprise massive à une vitesse fulgurante.', keyPoints: ['Croissance rapide', 'Échelle', 'Priorisation'], coverColor: '#191970' },
  { id: 'rec_29', title: 'Remote Sensing of the Environment', author: 'John R. Jensen', status: 'à lire', category: 'Télédétection', rating: 10, summary: 'Une perspective sur les ressources de la Terre.', keyPoints: ['Ressources', 'Environnement', 'Capteurs'], coverColor: '#2E8B57' },
  { id: 'rec_30', title: 'L\'Homme qui plantait des arbres', author: 'Jean Giono', status: 'à lire', category: 'Littérature sociale', rating: 10, summary: 'Une histoire sur la persévérance et la nature.', keyPoints: ['Nature', 'Persévérance', 'Impact'], coverColor: '#228B22' },
];

export const getInitialState = (): ProgramState => {
  return {
    currentDay: 1,
    startDate: '2026-06-01',
    englishLevel: 1,
    englishStreak: 0,
    sportStreak: 0,
    payingCustomers: 0,
    mrr: 0,
    featuresDelivered: 0,
    currentSaaSPhase: 'Idéation',
    userName: 'Commander VIP',
    userBio: 'Fondateur & CEO • Focus extrême sur la construction d\'un monopole SaaS à 100 000 clients payants.',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90&fit=crop',
    geoaiRoadmap: GEOAI_ROADMAP,
    dailyChecklist: {
      prayer: false,
      bible: false,
      fasting: false,
      reading: false,
      english: false,
      techTask: false,
      marketingAction: false,
      geoaiTask: false,
    },
    currentDayInput: {
      prayerHours: 0,
      bibleChapters: 0,
      fasting: false,
      englishMinutes: 0,
      techTasksCount: 0,
      marketingActions: '',
      pitchConfidence: 0,
      geoaiTasksCount: 0,
      sport: {
        pushups: 0,
        crunches: 0,
        squats: 0,
        plankSeconds: 0,
        jumpingJacks: 0,
        stretchingDone: false,
        cardioDone: false,
        cardioMinutes: 0
      },
      menage: getDefaultMenage(),
      sleep: { hoursSlept: 0, quality: 0, bedtime: '', wakeTime: '' },
      nutrition: { mealsCount: 0, waterGlasses: 0, qualityScore: 0 },
    },
    days: [],
    books: [],
    tasks: [],
    pitchLogs: [],
    projectLogs: [],
  };
};
