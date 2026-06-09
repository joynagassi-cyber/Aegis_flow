import { type ElementType } from 'react';
import {
  LayoutDashboard, CalendarDays, CheckCircle2, BookOpen, Rocket,
  Sparkles, BarChart3, Clock, Timer, Settings2, User, MessageSquare,
  ChevronLeft, ChevronRight, Archive, Target, History, Radar,
} from 'lucide-react';
import { Logo } from './Logo';

export type TabId =
  | 'overview' | 'daily' | 'tasks' | 'books' | 'geoai'
  | 'journal' | 'analytics' | 'planning' | 'pomodoro' | 'settings' | 'profile'
  | 'chat' | 'artifacts' | 'objectives' | 'sessions' | 'techwatch';

export type TabCategory = 'overview' | 'flux' | 'data' | 'resources' | 'account';

export interface SidebarTab {
  id: TabId;
  label: string;
  icon: ElementType;
  category: TabCategory;
}

export const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'overview', label: 'Vue générale', icon: LayoutDashboard, category: 'overview' },
  { id: 'daily', label: 'Journée', icon: CalendarDays, category: 'flux' },
  { id: 'planning', label: 'Planning', icon: Clock, category: 'flux' },
  { id: 'tasks', label: 'Tâches', icon: CheckCircle2, category: 'flux' },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer, category: 'flux' },
  { id: 'chat', label: 'IA Chat', icon: MessageSquare, category: 'flux' },
  { id: 'sessions', label: 'Sessions', icon: History, category: 'flux' },
  { id: 'objectives', label: 'Objectifs SaaS', icon: Target, category: 'data' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'data' },
  { id: 'journal', label: 'Journal', icon: Sparkles, category: 'data' },
  { id: 'books', label: 'Bibliothèque', icon: BookOpen, category: 'resources' },
  { id: 'artifacts', label: 'Artefacts', icon: Archive, category: 'resources' },
  { id: 'geoai', label: 'Geo-AI', icon: Rocket, category: 'resources' },
  { id: 'techwatch', label: 'Tech Watch', icon: Radar, category: 'resources' },
  { id: 'profile', label: 'Profil', icon: User, category: 'account' },
  { id: 'settings', label: 'Réglages', icon: Settings2, category: 'account' },
];

const CATEGORY_LABELS: Record<TabCategory, string> = {
  overview: 'Vue d\'ensemble',
  flux: 'Mon flux',
  data: 'Objectifs & Données',
  resources: 'Ressources',
  account: 'Compte',
};

const CATEGORY_OPACITY: Record<TabCategory, number> = {
  overview: 1,
  flux: 0.85,
  data: 0.7,
  resources: 0.55,
  account: 0.4,
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
  const categories: TabCategory[] = ['overview', 'flux', 'data', 'resources', 'account'];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`sidebar fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)] bg-[var(--bg)] transition-all duration-300 ${
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
          return (
            <div key={cat} className={cat === 'overview' ? 'mb-3' : 'mb-5'}>
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-subtle)]" style={{ opacity: CATEGORY_OPACITY[cat] }}>
                  {CATEGORY_LABELS[cat]}
                </p>
              )}
              <div className="space-y-0.5">
                {SIDEBAR_TABS.filter(t => t.category === cat).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`group relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                      style={isActive ? { background: 'var(--primary)', boxShadow: 'var(--shadow-btn)' } : undefined}
                      title={collapsed ? tab.label : undefined}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/20'
                            : 'bg-transparent group-hover:bg-[var(--surface-3)]'
                        }`}
                      >
                        <Icon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{
                            color: isActive
                              ? '#FFFFFF'
                              : 'var(--text-muted)',
                            opacity: isActive ? 1 : 0.6,
                          }}
                        />
                      </span>
                      {!collapsed && <span>{tab.label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/40" />
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
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Discipline</p>
            <p className="mt-1 font-syne text-xl font-bold text-[var(--primary)]">{disciplineScore}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${disciplineScore}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  boxShadow: '0 0 8px var(--primary-glow)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
