import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radar, Globe, AlertCircle, CheckCircle2, Clock, Loader2,
  RefreshCw, Target, Zap, ChevronDown,
  FileDown, FileText, BookOpen, ExternalLink, FileArchive,
  Maximize2, Minimize2, PanelBottomClose, Sparkles
} from 'lucide-react';
import type { TechWatchDomain, TechWatchReport } from '../services/techwatchService';
import { fetchDomains, fetchAllReports, scanDomain, scanAllDomains, generateSynthesis } from '../services/techwatchService';

function ImportanceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = { high: 'bg-red-500/20 text-red-400', medium: 'bg-yellow-500/20 text-yellow-400', low: 'bg-blue-500/20 text-blue-400' };
  const labels = { high: 'Haut', medium: 'Moyen', low: 'Bas' };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${colors[level]}`}>{labels[level]}</span>;
}

function PriorityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  const labels = { high: 'Prioritaire', medium: 'Important', low: 'Optionnel' };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${colors[level]}`}>{labels[level]}</span>;
}

function SourceLink({ url }: { url: string }) {
  const [preview, setPreview] = useState(false);
  const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 55);
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];

  const icon = url.includes('arxiv.org') ? '📄'
    : url.includes('semanticscholar.org') ? '🎓'
    : url.includes('google') ? '🔍'
    : '🌐';

  return (
    <div className="relative inline-flex">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setPreview(true)}
        onMouseLeave={() => setPreview(false)}
        className="group inline-flex items-center gap-1 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all border border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-sm max-w-[220px]"
        title={url}
      >
        <span className="text-xs">{icon}</span>
        <span className="truncate font-medium">{display}</span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition" />
      </a>
      {preview && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-3 w-3 text-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{domain}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed break-all">{url}</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--text-muted)]">Nouvel onglet</span>
            <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--text-muted)]">Source externe</span>
          </div>
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[var(--surface)] border-r border-b border-[var(--border)] rotate-45" />
        </div>
      )}
    </div>
  );
}

function generateMarkdownReport(
  domains: TechWatchDomain[],
  reports: Record<string, TechWatchReport>,
  synthesis: string | null
): string {
  const lines: string[] = [];
  lines.push('# GeoAI Tech Watch — Rapport de Veille');
  lines.push('');
  lines.push(`> Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push('');
  lines.push(`**Domaines analysés :** ${Object.values(reports).filter(r => r.status === 'done').length}/${domains.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (synthesis) {
    lines.push('## Synthèse Stratégique');
    lines.push('');
    lines.push(synthesis);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const domain of domains) {
    const report = reports[domain.id];
    if (!report || report.status !== 'done') {
      lines.push(`## ${domain.label} — Non scanné`);
      lines.push('');
      continue;
    }

    lines.push(`## ${domain.label}`);
    lines.push('');
    lines.push(`${report.summary}`);
    lines.push('');

    lines.push('### Découvertes');
    lines.push('');
    for (const f of report.key_findings) {
      const imp = f.importance === 'high' ? '🔴' : f.importance === 'medium' ? '🟡' : '🔵';
      lines.push(`- ${imp} **${f.subdomain}** : ${f.finding}`);
    }
    lines.push('');

    lines.push('### Impact Apprentissage');
    lines.push('');
    lines.push(report.learning_impact || 'Non spécifié');
    lines.push('');

    if (report.recommended_actions.length > 0) {
      lines.push('### Actions Recommandées');
      lines.push('');
      for (const a of report.recommended_actions) {
        const prio = a.priority === 'high' ? '🔥' : a.priority === 'medium' ? '💡' : '📌';
        lines.push(`- ${prio} ${a.action}`);
      }
      lines.push('');
    }

    if (report.source_urls && report.source_urls.length > 0) {
      lines.push('### Sources');
      lines.push('');
      for (const url of report.source_urls) {
        lines.push(`- ${url}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function DomainCard({
  domain, report, onScan, allExpanded,
  onDownloadMd, onDownloadPdf, pdfLoading,
}: {
  domain: TechWatchDomain; report?: TechWatchReport | null;
  onScan: (id: string) => void; allExpanded: boolean;
  onDownloadMd: (id: string) => void; onDownloadPdf: (id: string) => void;
  pdfLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const isOpen = expanded || allExpanded;

  const statusIcon = report?.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-green-400" />
    : report?.status === 'error' ? <AlertCircle className="h-4 w-4 text-red-400" />
    : report?.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
    : <Clock className="h-4 w-4 text-[var(--text-muted)]" />;

  return (
    <div className="card-glass space-y-3 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="shrink-0">{statusIcon}</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[var(--text)] truncate">{domain.label}</h3>
            <p className="text-[11px] text-[var(--text-subtle)]">
              {domain.subdomains.length} sous-domaines
              {report?.status === 'done' && ` · ${report.key_findings.length} découvertes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {report?.status === 'done' && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition"
                  title="Exporter"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50">
                    <button onClick={() => { onDownloadMd(domain.id); setShowExport(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                      <FileText className="h-3.5 w-3.5" /> Markdown
                    </button>
                    <button onClick={() => { onDownloadPdf(domain.id); setShowExport(false); }}
                      disabled={pdfLoading}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30">
                      {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} PDF
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition"
                title={isOpen ? 'Réduire' : 'Déplier'}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </>
          )}
          <button
            onClick={() => onScan(domain.id)}
            disabled={report?.status === 'running'}
            className="rounded-lg p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition disabled:opacity-30"
            title="Lancer le scan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${report?.status === 'running' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {report?.status === 'done' && report.summary && (
        <div className="bg-[var(--surface-2)] rounded-xl px-3.5 py-2.5 border border-[var(--border)]">
          <p className="text-[12px] leading-relaxed text-[var(--text-muted)] line-clamp-3">{report.summary}</p>
        </div>
      )}

      {report?.status === 'error' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3.5 py-2.5 border border-red-500/20">{report.error}</p>
      )}

      {isOpen && report?.status === 'done' && (
        <div className="space-y-4 border-t border-[var(--border)] pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {report.key_findings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Découvertes</p>
              </div>
              <div className="space-y-2">
                {report.key_findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-2)] p-3 border border-[var(--border)] hover:border-[var(--accent)]/20 transition">
                    <div className="shrink-0 mt-0.5">
                      <ImportanceBadge level={f.importance} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-[var(--accent)] mb-0.5">{f.subdomain}</p>
                      <p className="text-xs leading-relaxed text-[var(--text)]">{f.finding}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.learning_impact && (
            <div className="rounded-xl bg-[var(--surface-2)] p-3.5 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-3 w-3 text-green-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Impact apprentissage</p>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text)]">{report.learning_impact}</p>
            </div>
          )}

          {report.recommended_actions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Target className="h-3 w-3 text-yellow-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Actions recommandées</p>
              </div>
              <div className="space-y-1.5">
                {report.recommended_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-[var(--surface-2)] transition">
                    <Target className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]" />
                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                      <span className="text-xs leading-relaxed text-[var(--text)]">{a.action}</span>
                      <PriorityBadge level={a.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.source_urls && report.source_urls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Globe className="h-3 w-3 text-blue-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Sources</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.source_urls.map((url, i) => (
                  <SourceLink key={i} url={url} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TechWatchPage() {
  const [domains, setDomains] = useState<TechWatchDomain[]>([]);
  const [reports, setReports] = useState<Record<string, TechWatchReport>>({});
  const [scanningAll, setScanningAll] = useState(false);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [d, r] = await Promise.all([fetchDomains(), fetchAllReports()]);
    setDomains(d.filter(dd => dd.enabled));
    const map: Record<string, TechWatchReport> = {};
    for (const report of r) map[report.domain_id] = report;
    setReports(map);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScan = async (domainId: string) => {
    setReports(prev => ({ ...prev, [domainId]: { ...prev[domainId], status: 'running' } as TechWatchReport }));
    try {
      const result = await scanDomain(domainId);
      setReports(prev => ({
        ...prev,
        [domainId]: {
          id: result.domainId,
          domain_id: result.domainId,
          domain_label: domains.find(d => d.id === result.domainId)?.label || '',
          status: 'done',
          summary: result.summary,
          key_findings: result.keyFindings || [],
          learning_impact: result.learningImpact || '',
          recommended_actions: result.recommendedActions || [],
          source_urls: result.sourceUrls || [],
          triggered_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        } as TechWatchReport,
      }));
    } catch {
      setReports(prev => ({ ...prev, [domainId]: { ...prev[domainId], status: 'error', error: 'Scan failed' } as TechWatchReport }));
    }
  };

  const handleScanAll = async () => {
    setScanningAll(true);
    await scanAllDomains();
    setTimeout(async () => { await load(); setScanningAll(false); }, 5000);
  };

  const handleSynthesis = async () => {
    setSynthesisLoading(true);
    try {
      const result = await generateSynthesis();
      setSynthesis(result.synthesis);
    } catch { setSynthesis('Erreur lors de la génération de la synthèse.'); }
    setSynthesisLoading(false);
  };

  const downloadMarkdown = (domainId?: string) => {
    const md = domainId && reports[domainId]
      ? generateMarkdownReport(
          domains.filter(d => d.id === domainId),
          { [domainId]: reports[domainId] },
          null
        )
      : generateMarkdownReport(domains, reports, synthesis);

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = domainId ? `-${domainId}` : '-complet';
    a.download = `techwatch${suffix}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (domainId?: string) => {
    setDownloadLoading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = document.createElement('div');
      el.style.cssText = 'padding:40px;font-family:system-ui;color:#111;background:#fff;max-width:900px;margin:0 auto;line-height:1.8';
      el.innerHTML = `
        <div style="text-align:center;margin-bottom:40px">
          <h1 style="font-size:24px;font-weight:700;margin:0">GeoAI Tech Watch</h1>
          <p style="color:#666;font-size:13px;margin-top:8px">Rapport de veille — ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <hr style="border:none;border-top:2px solid #0066FF;margin:24px 0" />
      `;

      const targets = domainId
        ? domains.filter(d => d.id === domainId)
        : domains;

      for (const domain of targets) {
        const report = reports[domain.id];
        if (!report || report.status !== 'done') continue;

        el.innerHTML += `
          <h2 style="font-size:18px;font-weight:700;margin:24px 0 12px">${domain.label}</h2>
          <p style="color:#444;font-size:13px;line-height:1.7;margin-bottom:16px">${report.summary || ''}</p>
          <h3 style="font-size:14px;font-weight:600;color:#0066FF;margin:16px 0 8px">Découvertes</h3>
          ${report.key_findings.map(f => `
            <div style="background:#f5f5f5;border-radius:8px;padding:10px 14px;margin-bottom:8px;border-left:3px solid ${f.importance === 'high' ? '#ef4444' : f.importance === 'medium' ? '#eab308' : '#3b82f6'}">
              <strong style="font-size:12px;color:#0066FF">${f.subdomain}</strong>
              <p style="font-size:12px;color:#333;margin:4px 0 0">${f.finding}</p>
            </div>
          `).join('')}
          ${report.learning_impact ? `
            <h3 style="font-size:14px;font-weight:600;color:#22c55e;margin:16px 0 8px">Impact Apprentissage</h3>
            <p style="color:#444;font-size:12px;line-height:1.7">${report.learning_impact}</p>
          ` : ''}
          ${report.recommended_actions.length > 0 ? `
            <h3 style="font-size:14px;font-weight:600;color:#eab308;margin:16px 0 8px">Actions Recommandées</h3>
            ${report.recommended_actions.map(a => `
              <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
                <span>${a.priority === 'high' ? '🔥' : a.priority === 'medium' ? '💡' : '📌'}</span>
                <div><span style="font-size:12px;color:#333">${a.action}</span></div>
              </div>
            `).join('')}
          ` : ''}
          <hr style="border:none;border-top:1px solid #ddd;margin:20px 0" />
        `;
      }

      el.innerHTML += `
        <div style="text-align:center;color:#999;font-size:11px;margin-top:32px;padding-top:16px;border-top:1px solid #ddd">
          Généré par Aegis Flow IA — ${new Date().toLocaleString('fr-FR')}
        </div>
      `;

      const suffix = domainId ? `-${domainId}` : '-complet';
      await (html2pdf as any)().set({
        margin: [10, 10, 10, 10],
        filename: `techwatch${suffix}-${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
    setDownloadLoading(false);
  };

  const completedCount = Object.values(reports).filter(r => r.status === 'done').length;
  const totalCount = domains.length;

  return (
    <section className="space-y-6">
      <div className="card-glass flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--text-muted)]">Veille Technologique</p>
          <h2 className="mt-2 font-syne text-2xl font-bold">GeoAI Tech Watch</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Agent autonome de veille — {totalCount} domaines, {completedCount} scannés
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--surface-3)] transition"
          >
            {allExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {allExpanded ? 'Tout réduire' : 'Tout déplier'}
          </button>
          {completedCount > 0 && (
            <>
              <div className="relative group">
                <button className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--surface-3)] transition">
                  <FileArchive className="h-3.5 w-3.5" />
                  Exporter
                </button>
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={() => downloadMarkdown()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                    <FileText className="h-3.5 w-3.5" /> Markdown complet
                  </button>
                  <button onClick={() => downloadPDF()} disabled={downloadLoading} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30">
                    {downloadLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                    PDF complet
                  </button>
                </div>
              </div>
            </>
          )}
          <button
            onClick={handleSynthesis}
            disabled={synthesisLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--surface-3)] transition disabled:opacity-30"
          >
            {synthesisLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
            Synthèse
          </button>
          <button
            onClick={handleScanAll}
            disabled={scanningAll}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-white hover:opacity-80 transition disabled:opacity-30"
          >
            {scanningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {scanningAll ? 'Scan en cours...' : 'Scanner tout'}
          </button>
        </div>
      </div>

      {synthesis && (
        <div className="card-glass space-y-3 border-l-4 border-l-[var(--accent)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="font-syne font-bold">Synthèse Stratégique</h3>
            </div>
            <button
              onClick={() => setSynthesis(null)}
              className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition"
            >
              <PanelBottomClose className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-sm leading-8 text-[var(--text)] space-y-2 [&_strong]:text-[var(--accent)] [&_em]:text-[var(--text-muted)]">
            {synthesis.split('\n').map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.match(/^\d\./)) return <p key={i} className="flex gap-2"><span className="text-[var(--accent)] font-bold shrink-0">•</span><span>{line.replace(/^\d\.\s*\*\*/, '').replace(/\*\*/g, match => match)}</span></p>;
              if (line.startsWith('**')) return <p key={i} className="font-bold text-[var(--text)]">{line.replace(/\*\*/g, '')}</p>;
              return <p key={i}>{line}</p>;
            })}
          </div>
        </div>
      )}

      <div ref={reportRef} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {domains.map(domain => (
          <DomainCard
            key={domain.id}
            domain={domain}
            report={reports[domain.id]}
            onScan={handleScan}
            allExpanded={allExpanded}
            onDownloadMd={downloadMarkdown}
            onDownloadPdf={downloadPDF}
            pdfLoading={downloadLoading}
          />
        ))}
      </div>
    </section>
  );
}