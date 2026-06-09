export interface GeoAIDomain {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  subdomains: { id: string; label: string; keywords: string[] }[];
}

export const GEOAI_DOMAINS: GeoAIDomain[] = [
  {
    id: 'satellite-imagery', label: 'Imagerie Satellite & Remote Sensing', description: 'Sources, prétraitement et analyse d\'images satellite', enabled: true,
    subdomains: [
      { id: 'optical', label: 'Optique multi-spectral', keywords: ['Sentinel-2','Landsat','NAIP','Planet','SuperDove','multi-spectral','reflectance','atmospheric correction','Sen2Cor'] },
      { id: 'sar', label: 'SAR Radar', keywords: ['Sentinel-1','SAR','radar','InSAR','PolSAR','interferometry','RADARSAT','ALOS PALSAR'] },
      { id: 'hyperspectral', label: 'Hyperspectral', keywords: ['hyperspectral','PRISMA','EnMAP','AVIRIS','spectral unmixing','band selection'] },
      { id: 'thermal', label: 'Thermique', keywords: ['thermal','Landsat TIRS','ECOSTRESS','surface temperature','heat island'] },
      { id: 'cloud-masking', label: 'Masquage nuages & QA', keywords: ['cloud masking','Fmask','SCL','Sen2Cloud','cloud shadow','atmospheric compensation'] },
    ],
  },
  {
    id: 'computer-vision', label: 'Computer Vision Géospatiale', description: 'Deep learning pour analyse d\'images aériennes/satellite', enabled: true,
    subdomains: [
      { id: 'segmentation', label: 'Segmentation sémantique', keywords: ['U-Net','DeepLabV3+','SegFormer','semantic segmentation','land cover','FCN','HRNet'] },
      { id: 'object-detection', label: 'Détection d\'objets', keywords: ['YOLO','RetinaNet','Faster R-CNN','DETR','object detection','building detection','vehicle detection','Rotated BBox'] },
      { id: 'instance-segmentation', label: 'Segmentation d\'instances', keywords: ['Mask R-CNN','YOLO-seg','instance segmentation','SAM','Segment Anything','building footprint'] },
      { id: 'change-detection', label: 'Détection de changement', keywords: ['change detection','siamese network','bitemporal','ChangeFormer','CD','multi-temporal'] },
      { id: 'scene-classification', label: 'Classification de scène', keywords: ['scene classification','aerial scene','ResNet','EfficientNet','ViT','remote sensing scene'] },
    ],
  },
  {
    id: 'deep-learning', label: 'Deep Learning & Fondations', description: 'Architectures modernes et modèles pré-entraînés pour GeoAI', enabled: true,
    subdomains: [
      { id: 'cnn-architectures', label: 'Architectures CNN', keywords: ['ResNet','EfficientNet','ConvNeXt','DenseNet','MobileNet','depthwise separable'] },
      { id: 'transformers', label: 'Vision Transformers', keywords: ['ViT','Swin','SegFormer','Detection Transformer','DINOv2','self-attention','patch embedding'] },
      { id: 'foundation-models', label: 'Fondation Models Geo', keywords: ['Foundation Model','SatMAE','SpectralGPT','Prithvi','SkySense','GeoFM','remote sensing foundation model'] },
      { id: 'generative-geoai', label: 'GeoAI Générative', keywords: ['generative','diffusion','GAN','super-resolution','image inpainting','satellite image generation','pix2pix'] },
      { id: 'self-supervised', label: 'Apprentissage auto-supervisé', keywords: ['self-supervised','MAE','contrastive learning','SimCLR','BYOL','pretraining','SSL4EO'] },
    ],
  },
  {
    id: 'spatial-data-science', label: 'Data Science Spatiale', description: 'Analyse statistique et ML classique pour données géo', enabled: true,
    subdomains: [
      { id: 'spatial-ml', label: 'ML spatial classique', keywords: ['Random Forest','XGBoost','SVM','spatial cross-validation','geographically weighted','GWR'] },
      { id: 'point-patterns', label: 'Analyse de motifs spatiaux', keywords: ['point pattern','clustering','DBSCAN','HDBSCAN','ripley K','hotspot','Getis-Ord'] },
      { id: 'interpolation', label: 'Interpolation spatiale', keywords: ['kriging','IDW','spline','interpolation','spatial prediction','variogram'] },
      { id: 'dimensionality', label: 'Réduction de dimension', keywords: ['PCA','t-SNE','UMAP','feature extraction','band selection','spectral reduction'] },
    ],
  },
  {
    id: '3d-geoai', label: '3D GeoAI & LiDAR', description: 'Analyse 3D, nuages de points, MNE, jumeaux numériques', enabled: true,
    subdomains: [
      { id: 'lidar', label: 'LiDAR', keywords: ['LiDAR','ALS','TLS','UAV LiDAR','point cloud','ICESat-2','GEDI'] },
      { id: 'point-cloud-dl', label: 'Deep Learning sur nuages de points', keywords: ['PointNet','PointNet++','PointTransformer','RandLA-Net','KPConv','3D semantic segmentation'] },
      { id: 'dem-dsm', label: 'MNE/MNS', keywords: ['DEM','DSM','DTM','digital elevation','SRTM','COP DEM','TanDEM-X','stereo reconstruction'] },
      { id: 'digital-twins', label: 'Jumeaux numériques 3D', keywords: ['Digital Twin','3D city model','CityGML','LOD2','mesh reconstruction','neural rendering','NERF'] },
    ],
  },
  {
    id: 'time-series', label: 'Séries Temporelles Géospatiales', description: 'Analyse multi-temporelle et suivi d\'évolution', enabled: true,
    subdomains: [
      { id: 'ndvi-time', label: 'NDVI & Végétation', keywords: ['NDVI','EVI','LAI','time series','phenology','Landsat time series','MODIS','vegetation index'] },
      { id: 'land-cover-dynamics', label: 'Dynamique occupation sol', keywords: ['land cover change','LULC','deforestation','urbanization','agricultural expansion','LUCAS'] },
      { id: 'forecasting', label: 'Prédiction spatio-temporelle', keywords: ['forecasting','LSTM','ConvLSTM','PredRNN','spatiotemporal prediction','ST-GCN'] },
      { id: 'anomaly', label: 'Détection d\'anomalies', keywords: ['anomaly detection','outlier','novelty','unsupervised','autoencoder','MARTA'] },
    ],
  },
  {
    id: 'platforms-tools', label: 'Plateformes & Outils', description: 'Infrastructures cloud, outils et frameworks GeoAI', enabled: true,
    subdomains: [
      { id: 'gee', label: 'Google Earth Engine', keywords: ['Google Earth Engine','GEE','gee api','JavaScript API','Python API','Asset','ImageCollection','reducer'] },
      { id: 'stac', label: 'STAC & COG', keywords: ['STAC','COG','Cloud Optimized GeoTIFF','STAC API','pystac-client','stac-server','TiTiler','STAC Browser'] },
      { id: 'open-data', label: 'Données ouvertes', keywords: ['open data','RADARSAT','Copernicus','ESA','USGS EarthExplorer','NASA CMR','sentinel hub'] },
      { id: 'frameworks', label: 'Frameworks GeoAI', keywords: ['torchgeo','segmentation-models-pytorch','timm','albumentations','rasterio','rioxarray','solaris','geopandas'] },
    ],
  },
  {
    id: 'geoai-climate', label: 'GeoAI pour le Climat & Environnement', description: 'Applications climatiques, carbone, catastrophes', enabled: true,
    subdomains: [
      { id: 'carbon', label: 'Carbone & Forêts', keywords: ['carbon','REDD+','forest biomass','AGB','deforestation','MRV','JRC','carbon stock'] },
      { id: 'disaster', label: 'Réponse aux catastrophes', keywords: ['disaster','flood mapping','wildfire','earthquake','damage assessment','humanitarian','Copernicus EMS'] },
      { id: 'water', label: 'Ressources en eau', keywords: ['water quality','bathymetry','surface water','JRC water','coastal erosion','bathymetry'] },
      { id: 'agriculture', label: 'Agriculture de précision', keywords: ['precision agriculture','crop type','yield prediction','irrigation','NDVI anomaly','phenotyping','SmartAgri'] },
    ],
  },
  {
    id: 'geoai-africa', label: 'GeoAI pour l\'Afrique', description: 'Cas d\'usage, défis et opportunités africains', enabled: true,
    subdomains: [
      { id: 'food-security', label: 'Sécurité alimentaire', keywords: ['food security','crop monitoring','smallholder','subsistence agriculture','Africa','food system'] },
      { id: 'land-tenure', label: 'Foncier & urbanisation', keywords: ['land tenure','urbanization Africa','informal settlements','slum mapping','land administration'] },
      { id: 'african-datasets', label: 'Datasets africains', keywords: ['Africa dataset','rare earth labels','OAM','open africa','Drc','Rwanda','Kenya','agriculture africa'] },
      { id: 'climate-adaptation', label: 'Adaptation climatique', keywords: ['climate adaptation Africa','drought monitoring','flood africa','food production','climate resilience'] },
    ],
  },
  {
    id: 'mlops-geoai', label: 'MLOps & Production GeoAI', description: 'Déploiement, scaling, industrialisation de modèles GeoAI', enabled: true,
    subdomains: [
      { id: 'model-serving', label: 'Serving de modèles', keywords: ['model serving','FastAPI','ONNX','TorchServe','Triton','inference pipeline','batch inference'] },
      { id: 'pipeline-orchestration', label: 'Orchestration', keywords: ['pipeline','MLflow','DVC','Airflow','Kubeflow','Dask','distributed processing'] },
      { id: 'geopackage', label: 'Packaging & déploiement', keywords: ['Docker','GeoDocker','PostGIS','pg_featureserv','pg_tileserv','nginx','VPS deployment'] },
      { id: 'monitoring', label: 'Monitoring & drift', keywords: ['model monitoring','data drift','concept drift','ground truth','model retraining','active learning'] },
    ],
  },
  {
    id: 'emerging', label: 'Tendances Émergentes', description: 'Nouveaux paradigmes et innovations GeoAI', enabled: true,
    subdomains: [
      { id: 'geoai-llm', label: 'GeoAI + LLM', keywords: ['GeoAI LLM','GeoGPT','GeoChat','LLaVA-Geo','VLM remote sensing','visual question answering'] },
      { id: 'edge-ai', label: 'Edge AI satellite', keywords: ['edge AI','onboard processing','PhiSat','ESA PhiLab','on-device AI','nanosatellite','CubeSat'] },
      { id: 'federated', label: 'Federated GeoAI', keywords: ['federated learning','privacy preserving','distributed geoai','decentralized mapping'] },
      { id: 'crowdsourcing', label: 'Géo-crowdsourcing', keywords: ['crowdsourcing','OpenStreetMap','Mapillary','Kobotoolbox','citizen science','ground truth collection'] },
    ],
  },
];
