import { Router } from 'express';
import { pool } from '../db.js';
import { scanDomain, runFullScan, generateGlobalSynthesis } from '../services/techwatch.js';

const router = Router();

const DOMAINS = [
  { id: 'satellite-imagery', label: 'Imagerie Satellite & Remote Sensing', description: 'Sources, prétraitement et analyse d\'images satellite', enabled: true,
    subdomains: [
      { id: 'optical', label: 'Optique multi-spectral', keywords: ['Sentinel-2','Landsat','Planet','SuperDove','multi-spectral','reflectance','atmospheric correction','Sen2Cor'] },
      { id: 'sar', label: 'SAR Radar', keywords: ['Sentinel-1','SAR','InSAR','PolSAR','RADARSAT','ALOS PALSAR'] },
      { id: 'hyperspectral', label: 'Hyperspectral', keywords: ['hyperspectral','PRISMA','EnMAP','spectral unmixing'] },
      { id: 'thermal', label: 'Thermique', keywords: ['thermal','ECOSTRESS','surface temperature','heat island'] },
    ] },
  { id: 'computer-vision', label: 'Computer Vision Géospatiale', description: 'Deep learning pour analyse d\'images aériennes/satellite', enabled: true,
    subdomains: [
      { id: 'segmentation', label: 'Segmentation sémantique', keywords: ['U-Net','DeepLabV3+','SegFormer','semantic segmentation','land cover','HRNet'] },
      { id: 'object-detection', label: 'Détection d\'objets', keywords: ['YOLO','RetinaNet','Faster R-CNN','DETR','object detection','building detection','Rotated BBox'] },
      { id: 'change-detection', label: 'Détection de changement', keywords: ['change detection','siamese network','ChangeFormer','bitemporal','multi-temporal'] },
      { id: 'scene-classification', label: 'Classification de scène', keywords: ['scene classification','aerial scene','ViT','remote sensing scene'] },
    ] },
  { id: 'deep-learning', label: 'Deep Learning & Fondations', description: 'Architectures modernes et modèles pré-entraînés pour GeoAI', enabled: true,
    subdomains: [
      { id: 'transformers', label: 'Vision Transformers', keywords: ['ViT','Swin','SegFormer','Detection Transformer','DINOv2','self-attention'] },
      { id: 'foundation-models', label: 'Fondation Models Geo', keywords: ['Foundation Model','SatMAE','SpectralGPT','Prithvi','SkySense','GeoFM'] },
      { id: 'generative-geoai', label: 'GeoAI Générative', keywords: ['generative','diffusion','GAN','super-resolution','image generation','pix2pix'] },
      { id: 'self-supervised', label: 'Apprentissage auto-supervisé', keywords: ['self-supervised','MAE','contrastive','SSL4EO','pretraining'] },
    ] },
  { id: 'spatial-data-science', label: 'Data Science Spatiale', description: 'Analyse statistique et ML classique pour données géo', enabled: true,
    subdomains: [
      { id: 'spatial-ml', label: 'ML spatial classique', keywords: ['Random Forest','XGBoost','SVM','spatial cross-validation','GWR'] },
      { id: 'interpolation', label: 'Interpolation spatiale', keywords: ['kriging','IDW','spatial prediction','variogram'] },
      { id: 'dimensionality', label: 'Réduction de dimension', keywords: ['PCA','t-SNE','UMAP','feature extraction','spectral reduction'] },
    ] },
  { id: '3d-geoai', label: '3D GeoAI & LiDAR', description: 'Analyse 3D, nuages de points, MNE, jumeaux numériques', enabled: true,
    subdomains: [
      { id: 'lidar', label: 'LiDAR', keywords: ['LiDAR','ALS','point cloud','ICESat-2','GEDI','UAV LiDAR'] },
      { id: 'point-cloud-dl', label: 'Deep Learning sur nuages de points', keywords: ['PointNet','PointNet++','PointTransformer','RandLA-Net','3D semantic segmentation'] },
      { id: 'digital-twins', label: 'Jumeaux numériques', keywords: ['Digital Twin','3D city model','CityGML','NERF','neural rendering'] },
    ] },
  { id: 'time-series', label: 'Séries Temporelles Géospatiales', description: 'Analyse multi-temporelle et suivi d\'évolution', enabled: true,
    subdomains: [
      { id: 'ndvi-time', label: 'NDVI & Végétation', keywords: ['NDVI','EVI','time series','phenology','MODIS','vegetation index'] },
      { id: 'land-cover-dynamics', label: 'Dynamique occupation sol', keywords: ['land cover change','LULC','deforestation','urbanization'] },
      { id: 'forecasting', label: 'Prédiction spatio-temporelle', keywords: ['forecasting','LSTM','ConvLSTM','PredRNN','spatiotemporal prediction'] },
    ] },
  { id: 'platforms-tools', label: 'Plateformes & Outils', description: 'Infrastructures cloud, outils et frameworks GeoAI', enabled: true,
    subdomains: [
      { id: 'gee', label: 'Google Earth Engine', keywords: ['Google Earth Engine','GEE','Earth Engine','ImageCollection'] },
      { id: 'stac', label: 'STAC & COG', keywords: ['STAC','COG','Cloud Optimized GeoTIFF','STAC API','pystac-client','TiTiler'] },
      { id: 'frameworks', label: 'Frameworks GeoAI', keywords: ['torchgeo','segmentation-models-pytorch','timm','albumentations','rasterio','rioxarray'] },
    ] },
  { id: 'geoai-climate', label: 'GeoAI Climat & Environnement', description: 'Applications climatiques, carbone, catastrophes', enabled: true,
    subdomains: [
      { id: 'carbon', label: 'Carbone & Forêts', keywords: ['carbon','REDD+','forest biomass','deforestation','MRV','carbon stock'] },
      { id: 'disaster', label: 'Catastrophes', keywords: ['disaster','flood mapping','wildfire','damage assessment','humanitarian','Copernicus EMS'] },
      { id: 'agriculture', label: 'Agriculture de précision', keywords: ['precision agriculture','crop type','yield prediction','NDVI anomaly'] },
    ] },
  { id: 'geoai-africa', label: 'GeoAI Afrique', description: 'Cas d\'usage, défis et opportunités africains', enabled: true,
    subdomains: [
      { id: 'food-security', label: 'Sécurité alimentaire', keywords: ['food security','crop monitoring','smallholder','subsistence agriculture','Africa'] },
      { id: 'land-tenure', label: 'Foncier & urbanisation', keywords: ['land tenure','urbanization','informal settlements','slum mapping','Africa'] },
      { id: 'climate-adaptation', label: 'Adaptation climatique', keywords: ['climate adaptation Africa','drought','flood','climate resilience'] },
    ] },
  { id: 'mlops-geoai', label: 'MLOps & Production GeoAI', description: 'Déploiement, scaling, industrialisation', enabled: true,
    subdomains: [
      { id: 'model-serving', label: 'Serving', keywords: ['model serving','FastAPI','ONNX','TorchServe','inference'] },
      { id: 'pipeline-orchestration', label: 'Orchestration', keywords: ['MLflow','DVC','Airflow','Dask','distributed'] },
      { id: 'geopackage', label: 'Déploiement', keywords: ['Docker','GeoDocker','PostGIS','VPS','deployment'] },
    ] },
  { id: 'emerging', label: 'Tendances Émergentes', description: 'Nouveaux paradigmes et innovations GeoAI', enabled: true,
    subdomains: [
      { id: 'geoai-llm', label: 'GeoAI + LLM', keywords: ['GeoAI LLM','GeoGPT','GeoChat','LLaVA-Geo','VLM remote sensing'] },
      { id: 'edge-ai', label: 'Edge AI satellite', keywords: ['edge AI','onboard processing','PhiSat','nanosatellite','CubeSat'] },
      { id: 'federated', label: 'Federated GeoAI', keywords: ['federated learning','privacy preserving','distributed geoai','decentralized'] },
    ] },
];

router.get('/domains', (_req, res) => {
  res.json(DOMAINS);
});

router.post('/scan/:domainId', async (req, res) => {
  const { domainId } = req.params;
  const domain = DOMAINS.find(d => d.id === domainId);
  if (!domain) { res.status(404).json({ error: 'Domaine inconnu' }); return; }

  const provider = req.body?.provider ? JSON.parse(req.body.provider) : undefined;

  try {
    const result = await scanDomain(domain, provider);
    await pool.query(
      `INSERT INTO tech_watch_reports (domain_id, domain_label, status, summary, key_findings, learning_impact, recommended_actions, source_urls, completed_at)
       VALUES ($1, $2, 'done', $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, NOW())
       ON CONFLICT DO NOTHING`,
      [domain.id, domain.label, result.summary, JSON.stringify(result.keyFindings), result.learningImpact, JSON.stringify(result.recommendedActions), JSON.stringify(result.sourceUrls)]
    );
    res.json({ ...result, domainId: domain.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

router.post('/scan-all', async (req, res) => {
  const provider = req.body?.provider ? JSON.parse(req.body.provider) : undefined;
  res.json({ status: 'started', message: 'Scan complet lancé en arrière-plan' });
  runFullScan(provider).then(r => console.log('Tech watch scan complete:', r.map(x => `${x.domain}:${x.status}`).join(', ')));
});

router.get('/reports', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, domain_id, domain_label, status, summary, key_findings, learning_impact, recommended_actions, error, triggered_at, completed_at
       FROM tech_watch_reports
       ORDER BY completed_at DESC NULLS LAST, triggered_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS tech_watch_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id TEXT NOT NULL,
        domain_label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        summary TEXT,
        key_findings JSONB DEFAULT '[]'::jsonb,
        learning_impact TEXT,
        recommended_actions JSONB DEFAULT '[]'::jsonb,
        source_urls JSONB DEFAULT '[]'::jsonb,
        error TEXT,
        triggered_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )`);
    } catch {}
    res.json([]);
  }
});

router.get('/reports/:domainId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tech_watch_reports WHERE domain_id = $1 ORDER BY triggered_at DESC LIMIT 1`,
      [req.params.domainId]
    );
    res.json(rows[0] || null);
  } catch { res.json(null); }
});

router.post('/synthesis', async (req, res) => {
  try {
    const provider = req.body?.provider ? JSON.parse(req.body.provider) : undefined;
    const synthesis = await generateGlobalSynthesis(provider);
    res.json({ synthesis, generatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
