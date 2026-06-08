import { type ElementType } from 'react';
import {
  LayoutDashboard, CalendarDays, CheckCircle2, BookOpen, Rocket,
  Sparkles, BarChart3, Clock, Timer, Settings2, User, MessageSquare,
  ChevronLeft, ChevronRight, Archive,
} from 'lucide-react';
import { Logo } from './Logo';

export type TabId =
  | 'overview' | 'daily' | 'tasks' | 'books' | 'geoai'
  | 'journal' | 'analytics' | 'planning' | 'pomodoro' | 'settings' | 'profile'
  | 'chat' | 'artifacts';

export interface SidebarTab {
  id: TabId;
  label: string;
  icon: ElementType;
  category: 'operations' | 'progress' | 'resources';
}

export const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'daily', label: 'Journée', icon: CalendarDays, category: 'operations' },
  { id: 'tasks', label: 'Tâches', icon: CheckCircle2, category: 'operations' },
  { id: 'planning', label: 'Planning', icon: Clock, category: 'operations' },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer, category: 'operations' },
  { id: 'chat', label: 'IA Chat', icon: MessageSquare, category: 'operations' },
  { id: 'overview', label: 'Vue générale', icon: LayoutDashboard, category: 'progress' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'progress' },
  { id: 'journal', label: 'Journal', icon: Sparkles, category: 'progress' },
  { id: 'books', label: 'Bibliothèque', icon: BookOpen, category: 'resources' },
  { id: 'artifacts', label: 'Artefacts', icon: Archive, category: 'resources' },
  { id: 'geoai', label: 'Geo-AI', icon: Rocket, category: 'resources' },
  { id: 'profile', label: 'Profil', icon: User, category: 'resources' },
  { id: 'settings', label: 'Réglages', icon: Settings2, category: 'resources' },
];

const CATEGORY_COLORS: Record<string, { label: string; accent: string; glow: string; border: string }> = {
  operations: { label: 'Opérations', accent: '#00B4FF', glow: 'rgba(0,180,255,0.15)', border: 'rgba(0,180,255,0.3)' },
  progress: { label: 'Progrès', accent: '#00E676', glow: 'rgba(0,230,118,0.15)', border: 'rgba(0,230,118,0.3)' },
  resources: { label: 'Ressources', accent: '#FFD600', glow: 'rgba(255,214,0,0.15)', border: 'rgba(255,214,0,0.3)' },
};

interface SidebarProps {
  activeTab: TabId;
  collapsed: boolean;
  mobileOpen: boolean;
  onTabChange: (tab: TabId) => void;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  disciplineScore: number;
}

export function Sidebar({
  activeTab,
  collapsed,
  mobileOpen,
  onTabChange,
  onToggleCollapse,
  onMobileClose,
  disciplineScore,
}: SidebarProps) {
  const categories = ['operations', 'progress', 'resources'] as const;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`sidebar fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Aegis Flow</p>
              <p className="mt-0.5 font-syne text-base font-bold">Command Center</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--text)] ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {categories.map(cat => {
          const catColor = CATEGORY_COLORS[cat];
          return (
            <div key={cat} className="mb-4">
              {!collapsed && (
                <div
                  className="mb-2 rounded-lg px-2 py-1.5"
                  style={{ background: catColor.glow }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: catColor.accent }}
                  >
                    {catColor.label}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {SIDEBAR_TABS.filter(t => t.category === cat).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                        isActive
                          ? 'text-white shadow-[0_0_20px_rgba(0,102,255,0.2)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`}
                      style={isActive ? { background: catColor.accent } : undefined}
                      title={collapsed ? tab.label : undefined}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={isActive ? { color: '#FFFFFF' } : { color: catColor.accent }}
                      />
                      {!collapsed && <span>{tab.label}</span>}
                      {isActive && !collapsed && (
                        <span
                          className="ml-auto h-2 w-2 rounded-full"
                          style={{ background: catColor.accent, opacity: 0.6 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
              {disciplineScore}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Discipline</p>
            <p className="mt-1 font-syne text-xl font-bold" style={{ color: '#00B4FF' }}>{disciplineScore}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${disciplineScore}%`, background: 'linear-gradient(90deg, #00B4FF, #00E676)' }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
