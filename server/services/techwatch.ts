import { pool } from '../db.js';

interface DomainDef {
  id: string;
  label: string;
  subdomains: { id: string; label: string; keywords: string[] }[];
}

interface AIProvider {
  id: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function parseProviderHeader(header?: string): AIProvider {
  try {
    const parsed = JSON.parse(header || '{}');
    return {
      id: parsed.id || 'OPENROUTER',
      apiKey: parsed.apiKey || process.env.OPENROUTER_API_KEY || '',
      baseUrl: parsed.baseUrl || 'https://openrouter.ai/api/v1',
      model: parsed.model || 'openai/gpt-4o',
    };
  } catch {
    return {
      id: 'OPENROUTER',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4o',
    };
  }
}

const GEOAI_DOMAINS: DomainDef[] = [
  {
    id: 'satellite-imagery', label: 'Imagerie Satellite & Remote Sensing',
    subdomains: [
      { id: 'optical', label: 'Optique multi-spectral', keywords: ['Sentinel-2','Landsat','Planet','SuperDove','multi-spectral','reflectance','atmospheric correction','Sen2Cor'] },
      { id: 'sar', label: 'SAR Radar', keywords: ['Sentinel-1','SAR','InSAR','PolSAR','RADARSAT','ALOS PALSAR'] },
      { id: 'hyperspectral', label: 'Hyperspectral', keywords: ['hyperspectral','PRISMA','EnMAP','spectral unmixing'] },
      { id: 'thermal', label: 'Thermique', keywords: ['thermal','ECOSTRESS','surface temperature','heat island'] },
    ],
  },
  {
    id: 'computer-vision', label: 'Computer Vision Géospatiale',
    subdomains: [
      { id: 'segmentation', label: 'Segmentation sémantique', keywords: ['U-Net','DeepLabV3+','SegFormer','semantic segmentation','land cover','HRNet'] },
      { id: 'object-detection', label: 'Détection d\'objets', keywords: ['YOLO','RetinaNet','Faster R-CNN','DETR','object detection','building detection','Rotated BBox'] },
      { id: 'change-detection', label: 'Détection de changement', keywords: ['change detection','siamese network','ChangeFormer','bitemporal','multi-temporal'] },
      { id: 'scene-classification', label: 'Classification de scène', keywords: ['scene classification','aerial scene','ViT','remote sensing scene'] },
    ],
  },
  {
    id: 'deep-learning', label: 'Deep Learning & Fondations',
    subdomains: [
      { id: 'transformers', label: 'Vision Transformers', keywords: ['ViT','Swin','SegFormer','Detection Transformer','DINOv2','self-attention'] },
      { id: 'foundation-models', label: 'Fondation Models Geo', keywords: ['Foundation Model','SatMAE','SpectralGPT','Prithvi','SkySense','GeoFM'] },
      { id: 'generative-geoai', label: 'GeoAI Générative', keywords: ['generative','diffusion','GAN','super-resolution','image generation','pix2pix'] },
      { id: 'self-supervised', label: 'Apprentissage auto-supervisé', keywords: ['self-supervised','MAE','contrastive','SSL4EO','pretraining'] },
    ],
  },
  {
    id: 'spatial-data-science', label: 'Data Science Spatiale',
    subdomains: [
      { id: 'spatial-ml', label: 'ML spatial classique', keywords: ['Random Forest','XGBoost','SVM','spatial cross-validation','GWR'] },
      { id: 'interpolation', label: 'Interpolation spatiale', keywords: ['kriging','IDW','spatial prediction','variogram'] },
      { id: 'dimensionality', label: 'Réduction de dimension', keywords: ['PCA','t-SNE','UMAP','feature extraction','spectral reduction'] },
    ],
  },
  {
    id: '3d-geoai', label: '3D GeoAI & LiDAR',
    subdomains: [
      { id: 'lidar', label: 'LiDAR', keywords: ['LiDAR','ALS','point cloud','ICESat-2','GEDI','UAV LiDAR'] },
      { id: 'point-cloud-dl', label: 'Deep Learning sur nuages de points', keywords: ['PointNet','PointNet++','PointTransformer','RandLA-Net','3D semantic segmentation'] },
      { id: 'digital-twins', label: 'Jumeaux numériques', keywords: ['Digital Twin','3D city model','CityGML','NERF','neural rendering'] },
    ],
  },
  {
    id: 'time-series', label: 'Séries Temporelles Géospatiales',
    subdomains: [
      { id: 'ndvi-time', label: 'NDVI & Végétation', keywords: ['NDVI','EVI','time series','phenology','MODIS','vegetation index'] },
      { id: 'land-cover-dynamics', label: 'Dynamique occupation sol', keywords: ['land cover change','LULC','deforestation','urbanization'] },
      { id: 'forecasting', label: 'Prédiction spatio-temporelle', keywords: ['forecasting','LSTM','ConvLSTM','PredRNN','spatiotemporal prediction'] },
    ],
  },
  {
    id: 'platforms-tools', label: 'Plateformes & Outils',
    subdomains: [
      { id: 'gee', label: 'Google Earth Engine', keywords: ['Google Earth Engine','GEE','Earth Engine','ImageCollection'] },
      { id: 'stac', label: 'STAC & COG', keywords: ['STAC','COG','Cloud Optimized GeoTIFF','STAC API','pystac-client','TiTiler'] },
      { id: 'frameworks', label: 'Frameworks GeoAI', keywords: ['torchgeo','segmentation-models-pytorch','timm','albumentations','rasterio','rioxarray'] },
    ],
  },
  {
    id: 'geoai-climate', label: 'GeoAI Climat & Environnement',
    subdomains: [
      { id: 'carbon', label: 'Carbone & Forêts', keywords: ['carbon','REDD+','forest biomass','deforestation','MRV','carbon stock'] },
      { id: 'disaster', label: 'Catastrophes', keywords: ['disaster','flood mapping','wildfire','damage assessment','humanitarian','Copernicus EMS'] },
      { id: 'agriculture', label: 'Agriculture de précision', keywords: ['precision agriculture','crop type','yield prediction','NDVI anomaly'] },
    ],
  },
  {
    id: 'geoai-africa', label: 'GeoAI Afrique',
    subdomains: [
      { id: 'food-security', label: 'Sécurité alimentaire', keywords: ['food security','crop monitoring','smallholder','subsistence agriculture','Africa'] },
      { id: 'land-tenure', label: 'Foncier & urbanisation', keywords: ['land tenure','urbanization','informal settlements','slum mapping','Africa'] },
      { id: 'climate-adaptation', label: 'Adaptation climatique', keywords: ['climate adaptation Africa','drought','flood','climate resilience'] },
    ],
  },
  {
    id: 'mlops-geoai', label: 'MLOps & Production GeoAI',
    subdomains: [
      { id: 'model-serving', label: 'Serving', keywords: ['model serving','FastAPI','ONNX','TorchServe','inference'] },
      { id: 'pipeline-orchestration', label: 'Orchestration', keywords: ['MLflow','DVC','Airflow','Dask','distributed'] },
      { id: 'geopackage', label: 'Déploiement', keywords: ['Docker','GeoDocker','PostGIS','VPS','deployment'] },
    ],
  },
  {
    id: 'emerging', label: 'Tendances Émergentes',
    subdomains: [
      { id: 'geoai-llm', label: 'GeoAI + LLM', keywords: ['GeoAI LLM','GeoGPT','GeoChat','LLaVA-Geo','VLM remote sensing'] },
      { id: 'edge-ai', label: 'Edge AI satellite', keywords: ['edge AI','onboard processing','PhiSat','nanosatellite','CubeSat'] },
      { id: 'federated', label: 'Federated GeoAI', keywords: ['federated learning','privacy preserving','distributed geoai','decentralized'] },
    ],
  },
];

async function callAI(prompt: string, provider?: AIProvider): Promise<string> {
  const p = provider || parseProviderHeader();
  const apiKey = p.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API key missing');

  const isOpenRouter = p.id === 'OPENROUTER' || p.baseUrl.includes('openrouter');
  const baseUrl = p.baseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://aegis-flow.insforge.site';
    headers['X-Title'] = 'Aegis Flow - Tech Watch';
  }

  const r = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: p.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3072,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`AI ${p.id} ${r.status}: ${await r.text().catch(() => '')}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content || '';
}

async function searchWebTech(query: string): Promise<{ source: string; snippet: string; url: string; title: string }[]> {
  try {
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    const results: { source: string; snippet: string; url: string; title: string }[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({ source: 'DuckDuckGo', snippet: data.AbstractText, url: data.AbstractURL, title: data.Heading || 'Résultat' });
    }

    if (Array.isArray(data.Results)) {
      for (const item of data.Results) {
        if (item.FirstURL && item.Text) {
          results.push({ source: 'DuckDuckGo', snippet: item.Text, url: item.FirstURL, title: item.Text?.split(' - ')[0] || 'Résultat' });
        }
      }
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const item of data.RelatedTopics.slice(0, 5)) {
        if (item.FirstURL && item.Text) {
          results.push({ source: 'DuckDuckGo', snippet: item.Text, url: item.FirstURL, title: item.Text?.split(' - ')[0] || 'Résultat' });
        } else if (item.Topics) {
          for (const sub of item.Topics.slice(0, 2)) {
            if (sub.FirstURL && sub.Text) {
              results.push({ source: 'DuckDuckGo', snippet: sub.Text, url: sub.FirstURL, title: sub.Text?.split(' - ')[0] || 'Résultat' });
            }
          }
        }
      }
    }

    return results.slice(0, 8);
  } catch {
    return [];
  }
}

async function searchArXiv(query: string): Promise<{ source: string; snippet: string; url: string; title: string }[]> {
  try {
    const q = encodeURIComponent(`all:${query.replace(/[^a-zA-Z0-9\s]/g, ' ')}`);
    const r = await fetch(
      `https://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!r.ok) return [];
    const xml = await r.text();

    const results: { source: string; snippet: string; url: string; title: string }[] = [];
    const titleRegex = /<title>([^<]+)<\/title>/gi;
    const summaryRegex = /<summary>([^<]+)<\/summary>/gi;
    const idRegex = /<id>([^<]+)<\/id>/gi;

    const titles: string[] = [];
    let m;
    while ((m = titleRegex.exec(xml)) !== null) {
      if (titles.length === 0) { titles.push(m[1]); continue; }
      titles.push(m[1]);
    }
    const summaries: string[] = [];
    while ((m = summaryRegex.exec(xml)) !== null) {
      summaries.push(m[1].replace(/\s+/g, ' ').trim());
    }
    const ids: string[] = [];
    while ((m = idRegex.exec(xml)) !== null) {
      if (ids.length === 0) { ids.push(m[1]); continue; }
      ids.push(m[1]);
    }

    for (let i = 0; i < Math.min(titles.length, ids.length); i++) {
      results.push({
        source: 'ArXiv',
        snippet: summaries[i]?.slice(0, 300) || '',
        url: ids[i],
        title: titles[i]?.replace(/\s+/g, ' ').trim() || '',
      });
    }

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

async function searchSemanticScholar(query: string): Promise<{ source: string; snippet: string; url: string; title: string }[]> {
  try {
    const r = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&year=2025-2026&fields=title,url,year,externalIds,abstract`,
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'AegisFlow/1.0' } }
    );
    if (!r.ok) return [];
    const data = await r.json();
    if (!Array.isArray(data.data)) return [];

    return data.data.slice(0, 5).map((p: any) => ({
      source: 'Semantic Scholar',
      snippet: p.abstract?.slice(0, 300) || '',
      url: p.url || `https://api.semanticscholar.org/CorpusID:${p.externalIds?.CorpusId || ''}`,
      title: p.title || '',
    }));
  } catch {
    return [];
  }
}

async function searchGoogle(query: string): Promise<{ source: string; snippet: string; url: string; title: string }[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!apiKey || !cx) return [];

  try {
    const r = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&lr=lang_fr&num=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    if (!Array.isArray(data.items)) return [];

    return data.items.slice(0, 5).map((item: any) => ({
      source: 'Google',
      snippet: item.snippet || '',
      url: item.link || '',
      title: item.title || '',
    }));
  } catch {
    return [];
  }
}

export async function scanDomain(
  domain: DomainDef,
  provider?: AIProvider
): Promise<{
  summary: string;
  keyFindings: { subdomain: string; finding: string; importance: 'high' | 'medium' | 'low' }[];
  learningImpact: string;
  recommendedActions: { action: string; priority: 'high' | 'medium' | 'low' }[];
  sourceUrls: string[];
}> {
  const subdomainList = domain.subdomains.map(s => `- ${s.label}: ${s.keywords.join(', ')}`).join('\n');

  const searchQueries = domain.subdomains.flatMap(s =>
    s.keywords.slice(0, 2).map(kw => `${kw} 2025 2026`)
  ).slice(0, 4);

  const allSearches = searchQueries.flatMap(q => [
    searchWebTech(q),
    searchArXiv(q),
    searchSemanticScholar(q),
    searchGoogle(q),
  ]);
  const searchResults = (await Promise.all(allSearches)).flat().filter(r => r.snippet || r.title);

  const deduped = new Map<string, typeof searchResults[0]>();
  for (const r of searchResults) {
    const key = r.url.split('?')[0].split('#')[0];
    if (!deduped.has(key)) deduped.set(key, r);
  }
  const unique = [...deduped.values()].slice(0, 24);

  const searchContext = unique.length > 0
    ? `\n\nRÉSULTATS DE RECHERCHE WEB (sources vérifiées) :\n${unique.map(r => `[${r.source}] ${r.title}: ${r.snippet} (${r.url})`).join('\n')}`
    : '';

  const prompt = `Tu es un expert en veille technologique GeoAI. Analyse le domaine "${domain.label}" et ses sous-domaines :

${subdomainList}
${searchContext}

Pour CHAQUE sous-domaine, trouve les 2-3 développements les plus récents et importants (2025-2026). Sois spécifique : cite des papiers, modèles, datasets, outils ou événements précis.
Utilise les résultats de recherche ci-dessus comme SOURCE PRINCIPALE pour tes découvertes, puis complète avec ta connaissance.

IMPORTANT : Ne génère PAS de fausses URLs. Les sourceUrls doivent correspondre aux URLs des résultats de recherche ci-dessus.

Réponds EXACTEMENT au format JSON suivant, sans markdown, sans commentaires :
{
  "summary": "Résumé 3-5 phrases de l'état du domaine en 2026",
  "keyFindings": [
    {"subdomain": "nom_du_sous_domaine", "finding": "Découverte spécifique (papier, modèle, outil, tendance)", "importance": "high|medium|low"}
  ],
  "learningImpact": "Comment ces évolutions impactent l'apprentissage GeoAI d'un autodidacte en Afrique",
  "recommendedActions": [
    {"action": "Action concrète à prendre (apprendre X, essayer Y, intégrer Z)", "priority": "high|medium|low"}
  ],
  "sourceUrls": ["url1", "url2"]
}

Sois exhaustif mais concret. Ne mets que des vraies découvertes vérifiables.`;

  try {
    const raw = await callAI(prompt, provider);
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || 'Analyse non disponible',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      learningImpact: parsed.learningImpact || '',
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      sourceUrls: Array.isArray(parsed.sourceUrls) ? parsed.sourceUrls : unique.map(r => r.url),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Scan failed for ${domain.label}: ${msg}`);
  }
}

export async function runFullScan(provider?: AIProvider): Promise<{ domain: string; status: string; error?: string }[]> {
  const results: { domain: string; status: string; error?: string }[] = [];

  for (const domain of GEOAI_DOMAINS) {
    try {
      await pool.query(
        `INSERT INTO tech_watch_reports (domain_id, domain_label, status)
         VALUES ($1, $2, 'running')
         ON CONFLICT DO NOTHING`,
        [domain.id, domain.label]
      );
    } catch {
      /* table may not exist yet */
    }

    try {
      const result = await scanDomain(domain, provider);

      await pool.query(
        `INSERT INTO tech_watch_reports (domain_id, domain_label, status, summary, key_findings, learning_impact, recommended_actions, source_urls, completed_at)
         VALUES ($1, $2, 'done', $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, NOW())
         ON CONFLICT DO NOTHING`,
        [
          domain.id,
          domain.label,
          result.summary,
          JSON.stringify(result.keyFindings),
          result.learningImpact,
          JSON.stringify(result.recommendedActions),
          JSON.stringify(result.sourceUrls),
        ]
      );

      results.push({ domain: domain.label, status: 'done' });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      try {
        await pool.query(
          `INSERT INTO tech_watch_reports (domain_id, domain_label, status, error, completed_at)
           VALUES ($1, $2, 'error', $3, NOW())
           ON CONFLICT DO NOTHING`,
          [domain.id, domain.label, errMsg]
        );
      } catch {}
      results.push({ domain: domain.label, status: 'error', error: errMsg });
    }
  }

  return results;
}

export async function generateGlobalSynthesis(provider?: AIProvider): Promise<string> {
  const queries = ['GeoAI remote sensing trends 2026', 'deep learning earth observation 2026', 'geospatial artificial intelligence 2026'];
  const allHits = (await Promise.all(queries.flatMap(q => [
    searchWebTech(q), searchArXiv(q), searchSemanticScholar(q), searchGoogle(q),
  ]))).flat().filter(r => r.snippet || r.title);
  const deduped = [...new Map(allHits.map(r => [r.url.split('?')[0], r])).values()].slice(0, 16);
  const searchCtx = deduped.length > 0
    ? `\nRésultats de recherche:\n${deduped.map(r => `[${r.source}] ${r.title}: ${r.snippet} (${r.url})`).join('\n')}\n`
    : '';

  const prompt = `Tu es un stratège GeoAI. Fais une synthèse globale des tendances GeoAI actuelles (2025-2026).${searchCtx}
Structure :
1. **Top 5 tendances** qui changent la donne
2. **Technologies à surveiller** pour un autodidacte
3. **Opportunités Afrique** spécifiques
4. **Ajustements recommandés** au plan d'apprentissage

Format : réponse en français, structurée en sections, avec emojis. Pas de JSON.`;

  try {
    return await callAI(prompt, provider);
  } catch {
    return 'Synthèse globale non disponible pour le moment.';
  }
}
