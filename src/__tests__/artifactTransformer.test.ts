import { describe, it, expect } from 'vitest';
import { getAvailableTransformations, applyTransformation } from '../services/artifactTransformer';
import type { RichArtifact } from '../services/artifactDetector';

function makeArtifact(overrides: Partial<RichArtifact>): RichArtifact {
  return {
    id: 'test-1',
    type: 'csv',
    title: 'Test Artifact',
    content: '',
    language: 'csv',
    ...overrides,
  };
}

describe('artifactTransformer - CSV', () => {
  const csv = makeArtifact({
    content: 'name,age,score\nAlice,30,95\nBob,25,87\nCharlie,35,92',
    language: 'csv',
  });

  it('lists available transformations', () => {
    const t = getAvailableTransformations(csv);
    const labels = t.map(x => x.targetType);
    expect(labels).toContain('json');
    expect(labels).toContain('chart');
    expect(labels).toContain('html');
    expect(labels).toContain('markdown');
    expect(labels).toContain('statistics');
    expect(labels).toContain('diagram');
  });

  it('CSV → JSON', () => {
    const result = applyTransformation(csv, 'json');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('json');
    expect(result!.language).toBe('json');
    const parsed = JSON.parse(result!.content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ name: 'Alice', age: '30', score: '95' });
  });

  it('CSV → Markdown', () => {
    const result = applyTransformation(csv, 'markdown');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('markdown');
    expect(result!.content).toContain('| name | age | score |');
    expect(result!.content).toContain('| Alice | 30 | 95 |');
  });

  it('CSV → Chart (HTML)', () => {
    const result = applyTransformation(csv, 'chart');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('chart');
    expect(result!.content).toContain('<!DOCTYPE html>');
    expect(result!.content).toContain('<svg');
    expect(result!.metadata?.interactive).toBe(true);
  });

  it('CSV → Diagram (line chart)', () => {
    const result = applyTransformation(csv, 'diagram');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('diagram');
    expect(result!.content).toContain('<svg');
  });

  it('CSV → Statistics', () => {
    const result = applyTransformation(csv, 'statistics');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('html');
    expect(result!.content).toContain('Statistiques');
    expect(result!.content).toContain('Moyenne');
    expect(result!.content).toContain('95');
  });

  it('CSV → Interactive HTML Table', () => {
    const result = applyTransformation(csv, 'html');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('html');
    expect(result!.language).toBe('html');
    expect(result!.content).toContain('filterTable');
    expect(result!.content).toContain('sortTable');
    expect(result!.content).toContain('Alice');
  });

  it('returns null for empty CSV', () => {
    const empty = makeArtifact({ content: 'header\n', language: 'csv' });
    expect(applyTransformation(empty, 'json')).toBeNull();
  });
});

describe('artifactTransformer - JSON', () => {
  const json = makeArtifact({
    type: 'json',
    content: JSON.stringify([
      { product: 'Widget A', revenue: 1200, units: 50 },
      { product: 'Widget B', revenue: 800, units: 30 },
      { product: 'Widget C', revenue: 2000, units: 75 },
    ]),
    language: 'json',
  });

  it('lists JSON transformations', () => {
    const t = getAvailableTransformations(json);
    const labels = t.map(x => x.targetType);
    expect(labels).toContain('csv');
    expect(labels).toContain('html');
    expect(labels).toContain('markdown');
    expect(labels).toContain('chart');
    expect(labels).toContain('table');
  });

  it('JSON → CSV', () => {
    const result = applyTransformation(json, 'csv');
    expect(result).not.toBeNull();
    expect(result!.language).toBe('csv');
    expect(result!.content).toContain('product,revenue,units');
    expect(result!.content).toContain('Widget A,1200,50');
  });

  it('JSON → Chart', () => {
    const result = applyTransformation(json, 'chart');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('chart');
    expect(result!.content).toContain('<svg');
  });

  it('JSON → Interactive Table', () => {
    const result = applyTransformation(json, 'table');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('html');
    expect(result!.content).toContain('filterTable');
    expect(result!.content).toContain('Widget A');
  });

  it('JSON → Markdown', () => {
    const result = applyTransformation(json, 'markdown');
    expect(result).not.toBeNull();
    expect(result!.content).toContain('```json');
  });
});

describe('artifactTransformer - Markdown', () => {
  const mdWithTable = makeArtifact({
    type: 'markdown',
    content: `# Sales Data

| Month | Revenue | Growth |
|-------|---------|--------|
| Jan   | 10000   | 5%     |
| Feb   | 12000   | 20%    |
| Mar   | 15000   | 25%    |

Some notes here.`,
    language: 'markdown',
  });

  const mdPlain = makeArtifact({
    type: 'markdown',
    content: '# Just a heading\n\nSome paragraph text.',
    language: 'markdown',
  });

  it('Markdown → HTML (with table extraction)', () => {
    const result = applyTransformation(mdWithTable, 'html');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('html');
    expect(result!.content).toContain('<table');
  });

  it('Markdown without tables → HTML', () => {
    const result = applyTransformation(mdPlain, 'html');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('html');
  });

  it('Markdown → JSON extracts tables', () => {
    const result = applyTransformation(mdWithTable, 'json');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('json');
    const parsed = JSON.parse(result!.content);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('Markdown → CSV extracts tables', () => {
    const result = applyTransformation(mdWithTable, 'csv');
    expect(result).not.toBeNull();
    expect(result!.language).toBe('csv');
    expect(result!.content).toContain('Month');
    expect(result!.content).toContain('Jan');
  });
});

describe('artifactTransformer - HTML', () => {
  const html = makeArtifact({
    type: 'html',
    content: '<!DOCTYPE html><html><body><h1>Hello</h1><p>World</p></body></html>',
    language: 'html',
  });

  it('HTML → Markdown', () => {
    const result = applyTransformation(html, 'markdown');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('markdown');
  });

  it('HTML → JSON', () => {
    const result = applyTransformation(html, 'json');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('json');
    const parsed = JSON.parse(result!.content);
    expect(parsed.extracted).toContain('Hello');
  });
});

describe('artifactTransformer - Chart', () => {
  const chart = makeArtifact({
    type: 'chart',
    content: '<!DOCTYPE html><html><body><svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg></body></html>',
    language: 'html',
  });

  it('lists chart transformations', () => {
    const t = getAvailableTransformations(chart);
    const labels = t.map(x => x.targetType);
    expect(labels).toContain('csv');
    expect(labels).toContain('json');
    expect(labels).toContain('diagram');
  });

  it('Chart → JSON extracts content', () => {
    const result = applyTransformation(chart, 'json');
    expect(result).not.toBeNull();
  });
});

describe('artifactTransformer - edge cases', () => {
  it('returns empty array for unknown type', () => {
    const unknown = makeArtifact({ type: 'pdf', language: 'pdf', content: '%PDF-1.4' });
    expect(getAvailableTransformations(unknown)).toEqual([]);
  });

  it('returns null for unsupported target type', () => {
    const csv = makeArtifact({ content: 'a,b\n1,2', language: 'csv' });
    expect(applyTransformation(csv, 'pdf')).toBeNull();
  });

  it('handles malformed CSV gracefully', () => {
    const bad = makeArtifact({ content: 'just a single line', language: 'csv' });
    expect(applyTransformation(bad, 'json')).toBeNull();
  });

  it('handles malformed JSON gracefully', () => {
    const bad = makeArtifact({ type: 'json', content: '{not valid json}', language: 'json' });
    expect(applyTransformation(bad, 'csv')).toBeNull();
  });

  it('handles empty content', () => {
    const empty = makeArtifact({ content: '', language: 'csv' });
    expect(applyTransformation(empty, 'html')).toBeNull();
  });

  it('Statistics returns null for non-numeric CSV', () => {
    const textCsv = makeArtifact({
      content: 'name,color\nAlice,red\nBob,blue',
      language: 'csv',
    });
    const result = applyTransformation(textCsv, 'statistics');
    expect(result).toBeNull();
  });
});

describe('artifactTransformer - data integrity', () => {
  it('CSV → JSON → CSV roundtrip preserves data', () => {
    const original = 'name,age\nAlice,30\nBob,25';
    const csv = makeArtifact({ content: original, language: 'csv' });
    const asJson = applyTransformation(csv, 'json')!;
    expect(asJson).not.toBeNull();
    const backToCsv = applyTransformation(asJson, 'csv')!;
    expect(backToCsv).not.toBeNull();
    expect(backToCsv.content).toContain('Alice');
    expect(backToCsv.content).toContain('30');
  });

  it('JSON with single object is wrapped in array', () => {
    const single = makeArtifact({
      type: 'json',
      content: JSON.stringify({ name: 'Only', value: 42 }),
      language: 'json',
    });
    const result = applyTransformation(single, 'csv');
    expect(result).not.toBeNull();
    expect(result!.content).toContain('name,value');
    expect(result!.content).toContain('Only,42');
  });

  it('CSV with special characters handles quotes', () => {
    const quoted = makeArtifact({
      content: '"First Name","Last Name"\n"Jean","Dupont"',
      language: 'csv',
    });
    const result = applyTransformation(quoted, 'json');
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!.content);
    expect(parsed[0]['First Name']).toBe('Jean');
    expect(parsed[0]['Last Name']).toBe('Dupont');
  });
});

describe('artifactStore - state management', () => {
  it('store exports are functions', async () => {
    const mod = await import('../store/artifactStore');
    expect(typeof mod.useArtifactStore).toBe('function');
    expect(typeof mod.addArtifact).toBe('function');
    expect(typeof mod.removeArtifact).toBe('function');
    expect(typeof mod.searchArtifacts).toBe('function');
    expect(typeof mod.addTemplate).toBe('function');
  });

  it('store has default templates', async () => {
    const mod = await import('../store/artifactStore');
    const state = mod.useArtifactStore.getState();
    expect(state.templates.length).toBeGreaterThanOrEqual(5);
    const names = state.templates.map(t => t.name);
    expect(names).toContain('Graphique MRR');
    expect(names).toContain('Tableau de cohorte');
    expect(names).toContain('Diagramme d\'architecture');
  });

  it('addArtifact does not duplicate', async () => {
    const mod = await import('../store/artifactStore');
    const art: RichArtifact = { id: 'dup-1', type: 'csv', title: 'Dup', content: 'a,b\n1,2', language: 'csv' };
    mod.addArtifact(art);
    mod.addArtifact(art);
    const state = mod.useArtifactStore.getState();
    const matches = state.artifacts.filter(a => a.id === 'dup-1');
    expect(matches.length).toBe(1);
  });

  it('searchArtifacts filters by title', async () => {
    const mod = await import('../store/artifactStore');
    const art: RichArtifact = { id: 'search-1', type: 'json', title: 'Revenue Report', content: '{}', language: 'json' };
    mod.addArtifact(art);
    const found = mod.searchArtifacts('revenue');
    expect(found.some(a => a.id === 'search-1')).toBe(true);
    const notFound = mod.searchArtifacts('zzzzz');
    expect(notFound.some(a => a.id === 'search-1')).toBe(false);
  });
});
