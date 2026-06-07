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

export const GEOAI_ROADMAP: GeoAIRoadmap = {
  titre: "Geo-AI 7 Mois — Autodidacte Afrique",
  dateDebut: "2026-06-01",
  dureeSemaines: 28,
  regleOr: "70% pratique — 20% lecture — 10% théorie",
  mois: [
    {
      id: 1, titre: "Fondations Geo-AI + Python spatial", livrableFinal: "Notebook d'exploration complet", couleur: "#1a759f",
      semaines: [
        { id: 1, moisId: 1, titre: "Comprendre le Geo-AI et son écosystème", objectif: "Vision claire du Geo-AI, cas d'usage africains, environnement installé", exercices: [
          { id: "s1e1", text: "Lister 10 problèmes africains résolvables par Geo-AI", done: false },
          { id: "s1e2", text: "Lire 3 articles sur applications Geo-AI en Afrique", done: false },
          { id: "s1e3", text: "Installer conda + numpy, pandas, matplotlib, jupyter", done: false }
        ], technologies: ["numpy","pandas","matplotlib","seaborn","jupyter"], livrable: "Fiche synthèse 2 pages + environnement installé", statut: "a_faire" },
        { id: 2, moisId: 1, titre: "Python pour les données spatiales", objectif: "Manipuler données vectorielles avec GeoPandas/Shapely", exercices: [
          { id: "s2e1", text: "Charger shapefile avec GeoPandas, visualiser", done: false },
          { id: "s2e2", text: "Calculer surfaces en km² avec projection", done: false },
          { id: "s2e3", text: "Créer point GPS et trouver zone d'appartenance", done: false }
        ], technologies: ["geopandas","shapely","pyproj"], livrable: "Notebook GeoPandas + carte simple", statut: "a_faire" },
        { id: 3, moisId: 1, titre: "Lire et manipuler des images satellites", objectif: "Ouvrir, lire, visualiser image satellite avec Python", exercices: [
          { id: "s3e1", text: "Télécharger Sentinel-2, ouvrir avec Rasterio", done: false },
          { id: "s3e2", text: "Visualiser fausses couleurs infrarouges", done: false },
          { id: "s3e3", text: "Calculer et visualiser NDVI", done: false }
        ], technologies: ["rasterio","numpy","matplotlib"], livrable: "Notebook Rasterio + NDVI commenté", statut: "a_faire" },
        { id: 4, moisId: 1, titre: "Formats avancés et exploration complète", objectif: "Formats modernes (STAC, xarray), pipeline d'exploration", exercices: [
          { id: "s4e1", text: "Chercher images Sentinel-2 via pystac-client", done: false },
          { id: "s4e2", text: "Ouvrir avec xarray vs rasterio", done: false },
          { id: "s4e3", text: "Construire fonction explorer_image()", done: false }
        ], technologies: ["xarray","rioxarray","pystac-client"], livrable: "Pipeline STAC + xarray complet", statut: "a_faire" }
      ]
    },
    {
      id: 2, titre: "Données spatiales + préparation ML", livrableFinal: "Dataset propre + pipeline", couleur: "#1a759f",
      semaines: [
        { id: 5, moisId: 2, titre: "Sources de données et collecte", objectif: "Collecter données multi-sources pour projet Geo-AI", exercices: [
          { id: "s5e1", text: "Télécharger frontières GADM du pays", done: false },
          { id: "s5e2", text: "Extraire bâtiments OpenStreetMap avec osmnx", done: false },
          { id: "s5e3", text: "Connecter Google Earth Engine", done: false }
        ], technologies: ["requests","osmnx","earthengine-api"], livrable: "Dossier data/ organisé multi-sources", statut: "a_faire" },
        { id: 6, moisId: 2, titre: "Prétraitement d'images satellites", objectif: "Corriger, découper, normaliser images satellites", exercices: [
          { id: "s6e1", text: "Découper Sentinel-2 sur zone cible", done: false },
          { id: "s6e2", text: "Appliquer masque nuages SCL", done: false },
          { id: "s6e3", text: "Comparer 3 méthodes normalisation", done: false }
        ], technologies: ["rasterio","numpy","geopandas"], livrable: "Pipeline prétraitement complet", statut: "a_faire" },
        { id: 7, moisId: 2, titre: "Création de jeux de données étiquetés", objectif: "Créer données d'entraînement pour modèles Geo-AI", exercices: [
          { id: "s7e1", text: "Créer 6 zones entraînement (3 classes min)", done: false },
          { id: "s7e2", text: "Extraire valeurs pixels dans zones", done: false },
          { id: "s7e3", text: "Découper image en tuiles 256x256", done: false }
        ], technologies: ["geopandas","rasterio","numpy"], livrable: "Dataset CSV + tuiles DL 3 classes", statut: "a_faire" },
        { id: 8, moisId: 2, titre: "Qualité des données et pipeline complet", objectif: "Vérifier qualité, équilibrer, assembler pipeline ML ready", exercices: [
          { id: "s8e1", text: "Vérifier qualité dataset (missing, distribution)", done: false },
          { id: "s8e2", text: "Équilibrer classes déséquilibrées", done: false },
          { id: "s8e3", text: "Construire PipelineDonneesGeoAI réutilisable", done: false }
        ], technologies: ["pandas","sklearn","matplotlib"], livrable: "Pipeline complet train/val/test", statut: "a_faire" }
      ]
    },
    {
      id: 3, titre: "Machine Learning géospatial", livrableFinal: "Modèle ML + carte de prédiction", couleur: "#6a4c93",
      semaines: [
        { id: 9, moisId: 3, titre: "ML classique pour données spatiales", objectif: "Appliquer Random Forest, XGBoost, SVM sur données géo", exercices: [
          { id: "s9e1", text: "Entraîner Random Forest sur dataset", done: false },
          { id: "s9e2", text: "Comparer RF vs XGBoost vs SVM", done: false },
          { id: "s9e3", text: "Visualiser importance bandes spectrales", done: false }
        ], technologies: ["sklearn","xgboost","seaborn"], livrable: "Comparaison 3 modèles ML + métriques", statut: "a_faire" },
        { id: 10, moisId: 3, titre: "Prédiction sur image et carte classification", objectif: "Appliquer modèle ML sur image satellite complète", exercices: [
          { id: "s10e1", text: "Appliquer RF sur image entière pixel par pixel", done: false },
          { id: "s10e2", text: "Sauvegarder carte classification en GeoTIFF", done: false },
          { id: "s10e3", text: "Calculer surfaces par classe en km²", done: false }
        ], technologies: ["rasterio","numpy","matplotlib"], livrable: "Carte classification + stats surface", statut: "a_faire" },
        { id: 11, moisId: 3, titre: "Validation et amélioration du modèle", objectif: "Évaluer correctement performance spatiale et améliorer", exercices: [
          { id: "s11e1", text: "Validation croisée 5-fold stratifiée", done: false },
          { id: "s11e2", text: "GridSearch optimisation hyperparamètres", done: false },
          { id: "s11e3", text: "Analyser métriques par classe (OA, Kappa)", done: false }
        ], technologies: ["sklearn","pandas"], livrable: "Rapport OA + Kappa + analyse erreurs", statut: "a_faire" },
        { id: 12, moisId: 3, titre: "Projet ML complet : occupation du sol", objectif: "Livrer projet complet cartographie occupation sol", exercices: [
          { id: "s12e1", text: "Cartographier zone 50x50km avec 4 classes min", done: false },
          { id: "s12e2", text: "Rédiger rapport complet méthode + résultats", done: false },
          { id: "s12e3", text: "Ouvrir carte dans QGIS pour validation", done: false }
        ], technologies: ["sklearn","rasterio","matplotlib","QGIS"], livrable: "Carte GeoTIFF + rapport + notebook documenté", statut: "a_faire" }
      ]
    },
    {
      id: 4, titre: "Deep Learning géospatial", livrableFinal: "Modèle CNN/segmentation", couleur: "#6a4c93",
      semaines: [
        { id: 13, moisId: 4, titre: "Introduction Deep Learning géospatial", objectif: "Configurer PyTorch pour images satellites", exercices: [
          { id: "s13e1", text: "Installer PyTorch (CPU/GPU selon dispo)", done: false },
          { id: "s13e2", text: "Créer DatasetGeoAI custom avec tuiles", done: false },
          { id: "s13e3", text: "Visualiser 9 tuiles aléatoires dataset", done: false }
        ], technologies: ["pytorch","rasterio","numpy"], livrable: "Dataset PyTorch + DataLoaders + visualisation", statut: "a_faire" },
        { id: 14, moisId: 4, titre: "CNN pour classification d'images satellites", objectif: "Entraîner premier réseau neuronal convolutif", exercices: [
          { id: "s14e1", text: "Entraîner CNN simple sur tuiles satellites", done: false },
          { id: "s14e2", text: "Comparer performance CNN vs Random Forest", done: false },
          { id: "s14e3", text: "Ajouter augmentation données (flip, rotate)", done: false }
        ], technologies: ["pytorch","albumentations"], livrable: "CNN entraîné + courbes + comparaison RF", statut: "a_faire" },
        { id: 15, moisId: 4, titre: "Transfer Learning avec modèles pré-entraînés", objectif: "Adapter ResNet/EfficientNet pour images satellites multi-bandes", exercices: [
          { id: "s15e1", text: "Entraîner ResNet50 sur données satellites", done: false },
          { id: "s15e2", text: "Comparer EfficientNet-B0 (vitesse vs précision)", done: false },
          { id: "s15e3", text: "Appliquer fine-tuning progressif (freeze/unfreeze)", done: false }
        ], technologies: ["pytorch","timm"], livrable: "Comparaison CNN vs ResNet vs EfficientNet", statut: "a_faire" },
        { id: 16, moisId: 4, titre: "Projet Deep Learning complet", objectif: "Livrer pipeline DL de bout en bout", exercices: [
          { id: "s16e1", text: "Construire classe PipelineDL complète", done: false },
          { id: "s16e2", text: "Évaluation complète sur test set", done: false },
          { id: "s16e3", text: "Carte classification DL finale", done: false }
        ], technologies: ["pytorch","timm","rasterio"], livrable: "Modèle DL + comparaison ML vs DL + rapport", statut: "a_faire" }
      ]
    },
    {
      id: 5, titre: "Détection d'objets + segmentation avancée", livrableFinal: "Détecteur opérationnel", couleur: "#f4a261",
      semaines: [
        { id: 17, moisId: 5, titre: "Segmentation sémantique avec U-Net", objectif: "Classifier chaque pixel image (segmentation dense)", exercices: [
          { id: "s17e1", text: "Installer segmentation-models-pytorch", done: false },
          { id: "s17e2", text: "Préparer masques segmentation pour tuiles", done: false },
          { id: "s17e3", text: "Entraîner U-Net ResNet34 backbone 10 epochs", done: false }
        ], technologies: ["pytorch","segmentation-models-pytorch"], livrable: "U-Net entraîné sur tuiles satellites + masques", statut: "a_faire" },
        { id: 18, moisId: 5, titre: "Détection d'objets avec YOLO", objectif: "Détecter objets spécifiques dans images satellites", exercices: [
          { id: "s18e1", text: "Télécharger images satellites bâtiments ville", done: false },
          { id: "s18e2", text: "Annoter 200 bâtiments avec CVAT ou Labelme", done: false },
          { id: "s18e3", text: "Entraîner YOLOv8s sur dataset annoté", done: false }
        ], technologies: ["ultralytics","YOLO","CVAT"], livrable: "Modèle YOLO détecteur bâtiments + mAP", statut: "a_faire" },
        { id: 19, moisId: 5, titre: "Segmentation avancée et instances", objectif: "Segmentation d'instances et modèles avancés (SAM)", exercices: [
          { id: "s19e1", text: "Appliquer SAM (Segment Anything Model) sur satellite", done: false },
          { id: "s19e2", text: "Entraîner YOLOv8-seg segmentation instances", done: false },
          { id: "s19e3", text: "Calculer mIoU résultats segmentation", done: false }
        ], technologies: ["segment-anything","ultralytics"], livrable: "Comparaison U-Net vs YOLO-seg vs SAM", statut: "a_faire" },
        { id: 20, moisId: 5, titre: "Détecteur d'objets opérationnel", objectif: "Livrer outil détection géospatiale production-ready", exercices: [
          { id: "s20e1", text: "Construire classe DetecteurObjetsGeo complète", done: false },
          { id: "s20e2", text: "Export détections en GeoJSON géoréférencé", done: false },
          { id: "s20e3", text: "Visualiser résultats dans QGIS", done: false }
        ], technologies: ["ultralytics","rasterio","geopandas"], livrable: "DetecteurObjetsGeo + GeoJSON + rapport mAP/mIoU", statut: "a_faire" }
      ]
    },
    {
      id: 6, titre: "Spatio-temporel + industrialisation", livrableFinal: "Pipeline scalable + prototype", couleur: "#f4a261",
      semaines: [
        { id: 21, moisId: 6, titre: "Analyse séries temporelles géospatiales", objectif: "Analyser évolution territoire dans le temps", exercices: [
          { id: "s21e1", text: "Extraire série temporelle NDVI via Google Earth Engine", done: false },
          { id: "s21e2", text: "Visualiser évolution NDVI sur 2 ans", done: false },
          { id: "s21e3", text: "Comparer zone forêt vs zone urbaine", done: false }
        ], technologies: ["earthengine-api","xarray","matplotlib"], livrable: "Graphique NDVI temporel commenté 2 zones", statut: "a_faire" },
        { id: 22, moisId: 6, titre: "Détection de changement", objectif: "Détecter changements automatiques entre 2 images", exercices: [
          { id: "s22e1", text: "Télécharger 2 images même zone années différentes", done: false },
          { id: "s22e2", text: "Appliquer détection différence NDVI simple", done: false },
          { id: "s22e3", text: "Entraîner réseau siamois basique (optionnel)", done: false }
        ], technologies: ["rasterio","numpy","pytorch"], livrable: "Carte détection changement + zones impactées", statut: "a_faire" },
        { id: 23, moisId: 6, titre: "Industrialisation et pipelines scalables", objectif: "Rendre pipelines reproductibles, maintenables, scalables", exercices: [
          { id: "s23e1", text: "Configurer MLflow, lancer 3 expériences tracking", done: false },
          { id: "s23e2", text: "Traiter image 5000x5000 pixels avec Dask", done: false },
          { id: "s23e3", text: "Créer API FastAPI simple locale", done: false }
        ], technologies: ["mlflow","dask","fastapi"], livrable: "API FastAPI + MLflow configuré + tracking", statut: "a_faire" },
        { id: 24, moisId: 6, titre: "Prototype avancé et préparation produit", objectif: "Assembler prototype service Geo-AI bout en bout", exercices: [
          { id: "s24e1", text: "Définir architecture complète service Geo-AI", done: false },
          { id: "s24e2", text: "Construire classe RegistreModeles versioning", done: false },
          { id: "s24e3", text: "Prototype service analytique fonctionnel", done: false }
        ], technologies: ["fastapi","docker","mlflow","postgis"], livrable: "Service Geo-AI prototype + doc technique", statut: "a_faire" }
      ]
    },
    {
      id: 7, titre: "Produit Geo-AI complet et déploiement", livrableFinal: "MVP déployé + démo", couleur: "#2d6a4f",
      semaines: [
        { id: 25, moisId: 7, titre: "Choix du produit et architecture", objectif: "Définir produit africain concret et architecture technique", exercices: [
          { id: "s25e1", text: "Choisir produit (AgriSat/UrbanScan/EauSat/MineVision/RiskMap)", done: false },
          { id: "s25e2", text: "Rédiger fiche produit 1 page complète", done: false },
          { id: "s25e3", text: "Dessiner schéma architecture technique", done: false }
        ], technologies: ["conception","architecture"], livrable: "Fiche produit + schéma architecture", statut: "a_faire" },
        { id: 26, moisId: 7, titre: "Développement du backend", objectif: "Construire backend complet FastAPI + PostGIS", exercices: [
          { id: "s26e1", text: "Lancer FastAPI, tester authentification JWT", done: false },
          { id: "s26e2", text: "Connecter backend à PostgreSQL + PostGIS", done: false },
          { id: "s26e3", text: "Intégrer modèle Geo-AI dans endpoint /analyses", done: false }
        ], technologies: ["fastapi","postgresql","postgis","jwt"], livrable: "Backend fonctionnel auth + base spatiale", statut: "a_faire" },
        { id: 27, moisId: 7, titre: "Interface et visualisation", objectif: "Interface web connectée API avec cartes interactives", exercices: [
          { id: "s27e1", text: "Créer page HTML avec Leaflet.js carte interactive", done: false },
          { id: "s27e2", text: "Connecter interface à API backend", done: false },
          { id: "s27e3", text: "Ajouter graphique Chart.js évolution temporelle", done: false }
        ], technologies: ["leaflet.js","chart.js","html/css/js"], livrable: "Interface web + dashboard fonctionnel", statut: "a_faire" },
        { id: 28, moisId: 7, titre: "Déploiement, documentation et démo", objectif: "Déployer produit, documenter complètement, préparer démo", exercices: [
          { id: "s28e1", text: "Créer Dockerfile + docker-compose.yml complets", done: false },
          { id: "s28e2", text: "Déployer sur VPS (DigitalOcean/Contabo/OVH)", done: false },
          { id: "s28e3", text: "Préparer vidéo démo 3-5 minutes", done: false }
        ], technologies: ["docker","nginx","vps","documentation"], livrable: "MVP déployé + doc complète + démo vidéo", statut: "a_faire" }
      ]
    }
  ]
};
