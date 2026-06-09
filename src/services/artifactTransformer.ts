import type { RichArtifact } from './artifactDetector';

export interface Transformation {
  targetType: string;
  label: string;
  description: string;
}

const TRANSFORM_MAP: Record<string, Transformation[]> = {
  csv: [
    { targetType: 'json', label: '→ JSON', description: 'Convertir en tableau d\'objets JSON' },
    { targetType: 'chart', label: '→ Graphique', description: 'Visualiser en barres ou courbes' },
    { targetType: 'html', label: '→ Tableau HTML', description: 'Générer un tableau HTML stylé' },
    { targetType: 'markdown', label: '→ Markdown', description: 'Tableau en format markdown' },
    { targetType: 'statistics', label: '→ Statistiques', description: 'Analyse descriptive des colonnes numériques' },
    { targetType: 'diagram', label: '→ Diagramme', description: 'Graphique en courbes (évolution)' },
  ],
  json: [
    { targetType: 'csv', label: '→ CSV', description: 'Aplatir en tableau CSV' },
    { targetType: 'html', label: '→ HTML', description: 'Générer une page HTML structurée' },
    { targetType: 'markdown', label: '→ Markdown', description: 'Document markdown formaté' },
    { targetType: 'chart', label: '→ Graphique', description: 'Visualiser les données en barres' },
    { targetType: 'table', label: '→ Tableau', description: 'Tableau HTML interactif depuis JSON' },
  ],
  html: [
    { targetType: 'markdown', label: '→ Markdown', description: 'Extraire le texte en markdown' },
    { targetType: 'json', label: '→ JSON', description: 'Extraire les données structurées' },
  ],
  markdown: [
    { targetType: 'html', label: '→ HTML', description: 'Convertir en page HTML stylée' },
    { targetType: 'json', label: '→ JSON', description: 'Extraire les tableaux en JSON' },
    { targetType: 'csv', label: '→ CSV', description: 'Extraire les tableaux en CSV' },
  ],
  chart: [
    { targetType: 'csv', label: '→ CSV', description: 'Extraire les données en CSV' },
    { targetType: 'json', label: '→ JSON', description: 'Extraire les données en JSON' },
    { targetType: 'diagram', label: '→ Courbes', description: 'Graphique en courbes' },
  ],
  diagram: [
    { targetType: 'json', label: '→ JSON', description: 'Convertir en données structurées' },
    { targetType: 'markdown', label: '→ Markdown', description: 'Documentation du diagramme' },
  ],
};

export function getAvailableTransformations(artifact: RichArtifact): Transformation[] {
  const baseType = artifact.type === 'diagram' ? artifact.language : artifact.type;
  return TRANSFORM_MAP[baseType || ''] || TRANSFORM_MAP[artifact.language || ''] || [];
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
  return { headers, rows };
}

function extractNumericCols(rows: string[][], headers: string[]): { colIdx: number; colName: string; values: number[] }[] {
  const cols: { colIdx: number; colName: string; values: number[] }[] = [];
  headers.forEach((h, i) => {
    const nums = rows.map(r => parseFloat(r[i])).filter(v => !isNaN(v));
    if (nums.length > 0) {
      cols.push({ colIdx: i, colName: h, values: nums });
    }
  });
  return cols;
}

function extractTablesFromMarkdown(content: string): string[][] {
  const tables: string[][] = [];
  const lines = content.split('\n');
  let inTable = false;
  let tableLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) { inTable = true; tableLines = []; }
      if (!line.replace(/[\s|-]/g, '').includes('---')) {
        tableLines.push(line);
      }
    } else {
      if (inTable && tableLines.length > 1) {
        const csvLines = tableLines.map(tl =>
          tl.split('|').slice(1, -1).map(c => c.trim()).join(',')
        );
        tables.push(csvLines);
      }
      inTable = false;
    }
  }
  if (inTable && tableLines.length > 1) {
    const csvLines = tableLines.map(tl =>
      tl.split('|').slice(1, -1).map(c => c.trim()).join(',')
    );
    tables.push(csvLines);
  }
  return tables;
}

function buildLineChart(labels: string[], series: { name: string; values: number[] }[], title: string): string {
  const allVals = series.flatMap(s => s.values);
  const maxVal = Math.max(...allVals, 1);
  const w = Math.max(300, labels.length * 60);
  const h = 250;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const paths = series.map((s, si) => {
    const color = `hsl(${(si * 137.5) % 360}, 60%, 55%)`;
    const pts = s.values.map((v, i) => {
      const x = pad.left + (i / Math.max(labels.length - 1, 1)) * chartW;
      const y = pad.top + chartH - (v / maxVal) * chartH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<path d="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');

  const dots = series.map((s, si) => {
    const color = `hsl(${(si * 137.5) % 360}, 60%, 55%)`;
    return s.values.map((v, i) => {
      const x = pad.left + (i / Math.max(labels.length - 1, 1)) * chartW;
      const y = pad.top + chartH - (v / maxVal) * chartH;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
    }).join('');
  }).join('');

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = pad.top + (i / 4) * chartH;
    const val = maxVal - (i / 4) * maxVal;
    return `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${w - pad.right}" y2="${y.toFixed(1)}" stroke="#e8e8e8" stroke-width="1"/>
      <text x="${pad.left - 8}" y="${y.toFixed(1) + 4}" text-anchor="end" fill="#888" font-size="10">${Math.round(val)}</text>`;
  }).join('');

  const xLabels = labels.map((l, i) => {
    const x = pad.left + (i / Math.max(labels.length - 1, 1)) * chartW;
    return `<text x="${x.toFixed(1)}" y="${h - 8}" text-anchor="middle" fill="#888" font-size="10" transform="rotate(-20,${x.toFixed(1)},${h - 8})">${l}</text>`;
  }).join('');

  const legend = series.map((s, si) => {
    const color = `hsl(${(si * 137.5) % 360}, 60%, 55%)`;
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:11px;color:#555"><span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>${s.name}</span>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:system-ui;background:#fff}#chart{width:100%;overflow-x:auto}</style></head><body>
    <h3 style="margin:0 0 12px;font-size:14px;color:#333">${title}</h3>
    <div style="margin-bottom:8px">${legend}</div>
    <div id="chart"><svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${gridLines}${paths}${dots}${xLabels}</svg></div>
  </body></html>`;
}

function buildStatisticsHTML(headers: string[], rows: string[][], title: string): string {
  const numericCols = extractNumericCols(rows, headers);
  if (numericCols.length === 0) return '';

  const statRows = numericCols.map((col, si) => {
    const v = col.values;
    const n = v.length;
    const sum = v.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sorted = [...v].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[n - 1];
    const color = `hsl(${(si * 137.5) % 360}, 60%, 55%)`;

    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px"></span>${col.colName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${n}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${mean.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${median.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${min.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${max.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${stdDev.toFixed(2)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;font-family:system-ui;background:#fff}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8f8f8;padding:8px 12px;text-align:right;border-bottom:2px solid #ddd;font-size:11px;color:#666}th:first-child{text-align:left}</style></head><body>
    <h3 style="margin:0 0 16px;font-size:14px;color:#333">Statistiques descriptives — ${title}</h3>
    <table><thead><tr><th style="text-align:left">Variable</th><th>n</th><th>Moyenne</th><th>Médiane</th><th>Min</th><th>Max</th><th>Écart-type</th></tr></thead>
    <tbody>${statRows}</tbody></table>
  </body></html>`;
}

function buildInteractiveTable(headers: string[], rows: string[][]): string {
  const thead = headers.map(h => `<th style="padding:8px 12px;border-bottom:2px solid #ddd;font-size:11px;color:#666;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:#f8f8f8;cursor:pointer;user-select:none" onclick="sortTable(${headers.indexOf(h)})">${h} <span class="sort-icon"></span></th>`).join('');
  const tbody = rows.map((r, ri) =>
    `<tr style="${ri % 2 === 0 ? 'background:#fff' : 'background:#fafafa'}" class="data-row">${r.map(c => `<td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:12px;color:#333">${c}</td>`).join('')}</tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}
    body{margin:0;padding:0;font-family:system-ui;background:#fff}
    .controls{padding:8px 12px;background:#f8f8f8;border-bottom:1px solid #ddd;display:flex;gap:8px;align-items:center}
    input{padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;flex:1;outline:none}
    input:focus{border-color:#666}
    table{width:100%;border-collapse:collapse;font-size:12px}
    .sort-icon{opacity:0.4;margin-left:4px}
    th:hover .sort-icon{opacity:1}
  </style></head><body>
    <div class="controls">
      <input id="filter" placeholder="Filtrer..." oninput="filterTable(this.value)">
      <span style="font-size:11px;color:#888" id="count">${rows.length} lignes</span>
    </div>
    <div style="overflow-x:auto;max-height:calc(100vh - 60px);overflow-y:auto">
      <table><thead><tr>${thead}</tr></thead><tbody id="tbody">${tbody}</tbody></table>
    </div>
    <script>
      let sortDir = {};
      function sortTable(col) {
        sortDir[col] = sortDir[col] === 'asc' ? 'desc' : 'asc';
        const tbody = document.getElementById('tbody');
        const rows = Array.from(tbody.querySelectorAll('.data-row'));
        rows.sort((a, b) => {
          const va = a.cells[col].textContent, vb = b.cells[col].textContent;
          const na = parseFloat(va), nb = parseFloat(vb);
          const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : va.localeCompare(vb);
          return sortDir[col] === 'asc' ? cmp : -cmp;
        });
        rows.forEach(r => tbody.appendChild(r));
        document.querySelectorAll('.sort-icon').forEach((el, i) => { el.textContent = i === col ? (sortDir[col] === 'asc' ? '▲' : '▼') : ''; });
      }
      function filterTable(q) {
        const rows = document.querySelectorAll('.data-row');
        let count = 0;
        rows.forEach(r => {
          const match = q === '' || Array.from(r.cells).some(c => c.textContent.toLowerCase().includes(q.toLowerCase()));
          r.style.display = match ? '' : 'none';
          if (match) count++;
        });
        document.getElementById('count').textContent = count + ' lignes';
      }
    <\/script>
  </body></html>`;
}

export function applyTransformation(artifact: RichArtifact, targetType: string): RichArtifact | null {
  const content = artifact.content;
  const lang = artifact.language || '';

  try {
    switch (targetType) {
      case 'json': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length === 0) return null;
          const data = rows.map(line => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = line[i] || ''; });
            return obj;
          });
          return { ...artifact, type: 'json', title: `${artifact.title} (JSON)`, content: JSON.stringify(data, null, 2), language: 'json' };
        }
        if (lang === 'markdown' || lang === 'md') {
          const tables = extractTablesFromMarkdown(content);
          if (tables.length > 0) {
            const csvContent = tables[0].join('\n');
            const { headers, rows } = parseCSV(csvContent);
            const data = rows.map(line => {
              const obj: Record<string, string> = {};
              headers.forEach((h, i) => { obj[h] = line[i] || ''; });
              return obj;
            });
            return { ...artifact, type: 'json', title: `${artifact.title} (JSON)`, content: JSON.stringify(data, null, 2), language: 'json' };
          }
        }
        if (lang === 'html') {
          const text = content.replace(/<[^>]+>/g, '').trim();
          return { ...artifact, type: 'json', title: `${artifact.title} (JSON)`, content: JSON.stringify({ extracted: text }, null, 2), language: 'json' };
        }
        return null;
      }

      case 'csv': {
        if (lang === 'json') {
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          if (arr.length === 0) return null;
          const headers = Object.keys(arr[0]);
          const csvLines = [headers.join(','), ...arr.map((row: any) => headers.map(h => String(row[h] ?? '')).join(','))];
          return { ...artifact, type: 'csv', title: `${artifact.title} (CSV)`, content: csvLines.join('\n'), language: 'csv' };
        }
        if (lang === 'markdown' || lang === 'md') {
          const tables = extractTablesFromMarkdown(content);
          if (tables.length > 0) {
            return { ...artifact, type: 'csv', title: `${artifact.title} (CSV)`, content: tables[0].join('\n'), language: 'csv' };
          }
        }
        return null;
      }

      case 'html': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length === 0) return null;
          const html = buildInteractiveTable(headers, rows);
          return { ...artifact, type: 'html', title: `${artifact.title} (Tableau)`, content: html, language: 'html', metadata: { interactive: true } };
        }
        if (lang === 'json') {
          const parsed = JSON.parse(content);
          const pretty = JSON.stringify(parsed, null, 2);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          let tableHtml = '';
          if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
            const headers = Object.keys(arr[0]);
            const rows = arr.map((item: any) => headers.map(h => String(item[h] ?? '')));
            tableHtml = buildInteractiveTable(headers, rows);
          }
          const html = tableHtml || `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:monospace;padding:2rem;background:#f5f5f5;white-space:pre-wrap}</style></head><body><pre>${pretty}</pre></body></html>`;
          return { ...artifact, type: 'html', title: `${artifact.title} (HTML)`, content: html, language: 'html' };
        }
        if (lang === 'markdown' || lang === 'md') {
          const tables = extractTablesFromMarkdown(content);
          let mdHtml = content.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('\n');
          if (tables.length > 0) {
            const { headers, rows } = parseCSV(tables[0].join('\n'));
            if (rows.length > 0) {
              mdHtml = buildInteractiveTable(headers, rows);
            }
          }
          if (!mdHtml.includes('<table')) {
            mdHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:2rem;line-height:1.6;max-width:800px;margin:0 auto}pre{background:#f5f5f5;padding:1rem;border-radius:8px;overflow:auto}code{background:#f0f0f0;padding:0.2em 0.4em;border-radius:4px}</style></head><body>${mdHtml}</body></html>`;
          }
          return { ...artifact, type: 'html', title: `${artifact.title} (HTML)`, content: mdHtml, language: 'html' };
        }
        return null;
      }

      case 'chart': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length < 2) return null;
          const labels = rows.map(r => r[0] || '');
          const numericCols = extractNumericCols(rows, headers);
          if (numericCols.length === 0) return null;
          const series = numericCols.map(c => ({ name: c.colName, values: c.values }));
          const chartHtml = buildLineChart(labels, series, artifact.title);
          return { ...artifact, type: 'chart', title: `${artifact.title} (Graphique)`, content: chartHtml, language: 'html', metadata: { interactive: true } };
        }
        if (lang === 'json') {
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          if (arr.length < 2 || typeof arr[0] !== 'object') return null;
          const keys = Object.keys(arr[0]);
          const firstCol = keys[0];
          const numericKeys = keys.slice(1).filter(k => typeof arr[0][k] === 'number' || !isNaN(parseFloat(arr[0][k])));
          if (numericKeys.length === 0) return null;
          const labels = arr.map((item: any) => String(item[firstCol] ?? ''));
          const series = numericKeys.map(k => ({ name: k, values: arr.map((item: any) => parseFloat(item[k]) || 0) }));
          const chartHtml = buildLineChart(labels, series, artifact.title);
          return { ...artifact, type: 'chart', title: `${artifact.title} (Graphique)`, content: chartHtml, language: 'html', metadata: { interactive: true } };
        }
        return null;
      }

      case 'diagram': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length < 2) return null;
          const labels = rows.map(r => r[0] || '');
          const numericCols = extractNumericCols(rows, headers);
          if (numericCols.length === 0) return null;
          const series = numericCols.map(c => ({ name: c.colName, values: c.values }));
          const chartHtml = buildLineChart(labels, series, artifact.title);
          return { ...artifact, type: 'diagram', title: `${artifact.title} (Courbes)`, content: chartHtml, language: 'html', metadata: { interactive: true } };
        }
        return null;
      }

      case 'statistics': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length < 2) return null;
          const html = buildStatisticsHTML(headers, rows, artifact.title);
          if (!html) return null;
          return { ...artifact, type: 'html', title: `${artifact.title} (Statistiques)`, content: html, language: 'html' };
        }
        return null;
      }

      case 'table': {
        if (lang === 'json') {
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          if (arr.length === 0 || typeof arr[0] !== 'object') return null;
          const headers = Object.keys(arr[0]);
          const rows = arr.map((item: any) => headers.map(h => String(item[h] ?? '')));
          const html = buildInteractiveTable(headers, rows);
          return { ...artifact, type: 'html', title: `${artifact.title} (Tableau)`, content: html, language: 'html', metadata: { interactive: true } };
        }
        return null;
      }

      case 'markdown': {
        if (lang === 'csv') {
          const { headers, rows } = parseCSV(content);
          if (rows.length === 0) return null;
          const headerMd = `| ${headers.join(' | ')} |`;
          const sepMd = `| ${headers.map(() => '---').join(' | ')} |`;
          const rowMd = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
          const md = `# ${artifact.title}\n\n${headerMd}\n${sepMd}\n${rowMd}`;
          return { ...artifact, type: 'markdown', title: `${artifact.title} (Markdown)`, content: md, language: 'markdown' };
        }
        if (lang === 'json') {
          const md = `# ${artifact.title}\n\n\`\`\`json\n${JSON.stringify(JSON.parse(content), null, 2)}\n\`\`\``;
          return { ...artifact, type: 'markdown', title: `${artifact.title} (Markdown)`, content: md, language: 'markdown' };
        }
        if (lang === 'html' || lang === 'svg') {
          const text = content.replace(/<[^>]+>/g, '').trim();
          const md = `# ${artifact.title}\n\n${text}`;
          return { ...artifact, type: 'markdown', title: `${artifact.title} (Markdown)`, content: md, language: 'markdown' };
        }
        return null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}


