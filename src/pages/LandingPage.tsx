import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, CalendarDays, Target, BarChart3, MessageSquare, Timer,
  CheckCircle2, ArrowRight, ChevronDown,
  Layers,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { AuthModal } from '../components/AuthModal';

interface Feature {
  id: string;
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  demo: string[];
  accent: string;
}

const FEATURES: Feature[] = [
  {
    id: 'daily',
    icon: CalendarDays,
    title: 'Rituel quotidien',
    description: 'Planifie et suit chaque journée avec précision. Prière, lecture biblique, sport, ménage — chaque domaine a son indicateur.',
    demo: ['J42 · Score 78%', 'Prière 4/6h', 'Lecture 22/40ch', 'Sport 3 séances', 'Ménage 5/8'],
    accent: '#0066FF',
  },
  {
    id: 'tasks',
    icon: CheckCircle2,
    title: 'Kanban & Tâches',
    description: 'Gestion de projet visuelle par tableau Kanban. Suis l\'avancement de chaque mission en temps réel.',
    demo: ['SaaS Phase 3 → 12/18', 'En cours: 4', 'À faire: 8', 'Terminé: 6', 'Blocage: 1'],
    accent: '#00E676',
  },
  {
    id: 'geo',
    icon: Target,
    title: 'Geo-AI Strategist',
    description: 'Assistant géopolitique et stratégique. Roadmaps, exercices, analyses par pays et décryptage de l\'actualité mondiale.',
    demo: ['USA · Analyse', 'Chine · Roadmap', 'UE · Exercice', 'Inde · Briefing', 'Corée · Watch'],
    accent: '#FFD600',
  },
  {
    id: 'pomodoro',
    icon: Timer,
    title: 'Pomodoro & Focus',
    description: 'Cycles de travail intensifs avec pause automatique. Optimise ta concentration sur les périodes clés.',
    demo: ['Session 3/4', 'Focus 22min', 'Pause 5min', 'Objectif 2h', 'Productivité 89%'],
    accent: '#FF6B35',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Agent IA & Chat',
    description: 'Assistant avec terminal bash, lecture/écriture fichiers et exécution d\'outils dans un sandbox isolé.',
    demo: ['Mode Agent actif', 'Bash · ls -la', 'Écriture fichier', 'Git status', 'Read · package.json'],
    accent: '#00B4FF',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics & Tracking',
    description: 'Visualise ta progression sur 14 jours glissants. Discipline, spiritualité, anglais, clients — tout en un coup d\'œil.',
    demo: ['Discipline 78% ↑12%', 'Spiritualité 82%', 'Anglais 45min/j', 'Clients +3', 'Tendance 7j'],
    accent: '#7C3AED',
  },
];

function FeatureSection({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`flex flex-col lg:flex-row items-center gap-16 py-24 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${isEven ? '' : 'lg:flex-row-reverse'}`}
    >
      <div className="flex-1 max-w-lg">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
          style={{ background: `${feature.accent}15`, color: feature.accent }}
        >
          <Icon className="h-3.5 w-3.5" />
          {feature.title}
        </div>
        <h3 className="text-3xl font-bold text-white mb-4 leading-tight">
          {feature.title}
        </h3>
        <p className="text-[#888] leading-relaxed mb-8">
          {feature.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {feature.demo.map((item, i) => (
            <div
              key={i}
              className="rounded-lg px-3 py-1.5 text-xs font-mono"
              style={{
                background: `${feature.accent}08`,
                color: feature.accent,
                border: `1px solid ${feature.accent}20`,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-xl">
        <div
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{
            borderColor: `${feature.accent}20`,
            background: `linear-gradient(135deg, ${feature.accent}05 0%, transparent 100%)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}40, transparent)` }} />
          <div className="space-y-3">
            {feature.demo.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: i === 0 ? `${feature.accent}10` : 'var(--surface-2)',
                  borderLeft: `2px solid ${feature.accent}${i === 0 ? '60' : '20'}`,
                }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: `${feature.accent}20`, color: feature.accent }}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-[#ccc] font-mono">{item}</span>
                {i < feature.demo.length - 1 && (
                  <ChevronDown className="h-3 w-3 text-[#555] ml-auto rotate-[-90deg]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showAuth) {
    return <AuthModal onSuccess={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#030303]/90 backdrop-blur-xl border-b border-[#222]' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#555]">Aegis Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAuth(true)}
              className="rounded-xl px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              Connexion
            </button>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#222] bg-[#111] px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#666]">Plateforme active</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-6">
            Aegis Flow
            <br />
            <span className="bg-gradient-to-r from-[#0066FF] via-[#00B4FF] to-[#00E676] bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-[#888] leading-relaxed mb-10">
            Plateforme de gestion personnelle tout-en-un. Planifie ton quotidien,
            suis tes objectifs, analyse tes performances et pilote ta croissance
            avec un assistant IA intégré.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              Accéder au dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="flex items-center gap-2 rounded-xl border border-[#333] px-8 py-3.5 text-sm font-bold text-[#888] transition hover:border-[#555] hover:text-white"
            >
              Découvrir
            </button>
          </div>
        </div>

        <button onClick={scrollToFeatures} className="absolute bottom-10 text-[#444] hover:text-[#666] transition animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      <section id="features" className="px-6 pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#222] bg-[#111] px-4 py-1.5 mb-6">
              <Layers className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#666]">Modules</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-[#888] max-w-lg mx-auto">
              Un dashboard complet pour orchestrer chaque dimension de ta vie personnelle et professionnelle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-32">
            {FEATURES.slice(0, 6).map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  className="group rounded-2xl border border-[#222] p-6 transition-all duration-300 hover:border-transparent hover:-translate-y-1"
                  style={{ background: 'var(--surface)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${f.accent}30`;
                    e.currentTarget.style.boxShadow = `0 0 30px ${f.accent}10`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${f.accent}15` }}>
                    <Icon className="h-5 w-5" style={{ color: f.accent }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-[#666] leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-8">
            {FEATURES.map((feature, index) => (
              <FeatureSection key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-[#222] px-6 py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Prêt à prendre le contrôle ?
          </h2>
          <p className="text-[#888] mb-10">
            Rejoins Aegis Flow et transforme ta discipline en résultats mesurables.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            Commencer maintenant
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#222] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#444]">Aegis Flow</span>
          </div>
          <p className="text-[10px] text-[#444] uppercase tracking-widest">
            &copy; 2026 Aegis Flow
          </p>
        </div>
      </footer>
    </div>
  );
}
