# Guide CLI InsForge — Projet Aegis Flow

## Contexte projet

```
Projet:       oss-project
URL backend:  https://m4tvusq2.us-east.insforge.app
Région:       us-test
```

## Les 3 clés à ne pas confondre

| Rôle | Variable | Où la trouver | Usage |
|------|----------|---------------|-------|
| **Anon Key** (frontend) | `VITE_INSFORGE_ANON_KEY` | Dashboard InsForge > onglet **API Settings** | `createClient({ baseUrl, anonKey })` côté navigateur |
| **API Key** (CLI) | `ik_5a7b2505092a81cc42816e9a89829cb8` | `.insforge/project.json` | `npx @insforge/cli ...` — permet les requêtes SQL, migrations, etc. |
| **Google Client Secret** | `GOOGLE_CLIENT_SECRET` | Configuré dans les **secrets** InsForge | Utilisé côté serveur pour l'OAuth Google |

> **Important** : L'anon key n'est pas l'API key du CLI. L'anon key sert à initialiser le SDK côté client (`createClient`). Sans elle, le SDK fonctionne quand même (les routes d'auth n'en ont pas besoin), mais certaines requêtes PostgREST peuvent être refusées si l'anon key est vide.

## Récupérer l'anon key

1. Va sur https://m4tvusq2.us-east.insforge.app (le dashboard InsForge)
2. Connecte-toi avec ton compte
3. Va dans **API Settings** → copie la valeur `anon key`
4. Colle-la dans `.env` :
   ```
   VITE_INSFORGE_ANON_KEY=ta_anon_key_ici
   ```
5. Redémarre le serveur de dev

## Commandes CLI essentielles

### Exécuter du SQL

```bash
npx @insforge/cli db query "SELECT * FROM users;"
```

### Lister les tables

```bash
npx @insforge/cli db tables
```

### Voir les politiques RLS

```bash
npx @insforge/cli db policies
```

### Lister les index

```bash
npx @insforge/cli db indexes
```

### Créer une table (exemple)

```bash
npx @insforge/cli db query "CREATE TABLE ma_table (id text PRIMARY KEY, data jsonb);"
```

### Activer RLS sur une table

```bash
npx @insforge/cli db query "ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY; ALTER TABLE ma_table FORCE ROW LEVEL SECURITY;"
```

### Ajouter une politique RLS

```bash
npx @insforge/cli db query "CREATE POLICY ma_policy ON ma_table FOR ALL TO public USING (auth.email() = ...);"
```

### Voir le contexte CLI

```bash
npx @insforge/cli current
```

### Voir les secrets du projet

```bash
npx @insforge/cli secrets list
```

### Ajouter/modifier un secret

```bash
npx @insforge/cli secrets set MON_SECRET valeur_du_secret
```

### Consulter les logs

```bash
npx @insforge/cli logs insforge.logs    # logs applicatifs
npx @insforge/cli logs postgres.logs    # logs base de données
```

### Exporter la base

```bash
npx @insforge/cli db export --data-only > backup.sql
```

## Schéma actuel de la base

Tables créées :

- `users` — utilisateurs (id text, email, etc.)
- `daily_data` — données journalières du programme (prayer, bible, sport, etc.)
- `books` — livres
- `kanban_tasks` — tâches Kanban
- `saas_journal` — journal SaaS
- `geo_roadmaps`, `geo_mois`, `geo_semaines`, `geo_exercices` — hiérarchie géo-AI
- `ai_clients`, `ai_providers`, `ai_requests`, `ai_usage_metrics` — suivi AI
- `user_state` — snapshot global de l'état (sync locale → cloud)
- `app_state` — configuration publique en lecture seule

## RLS : comment ça marche

Toutes les politiques utilisent `auth.email()` pour vérifier que l'utilisateur connecté possède les données. Le `users.id` peut être un UUID (nouveaux comptes) ou une chaîne comme `"u-geo"` (anciens seed), mais la jointure se fait toujours via `users.email = auth.email()`.

## Workflow typique

1. **Dev local** : les données sont en localStorage (PWA offline-first)
2. **Sync manuelle** : bouton "Sync" dans l'UI → pousse l'état vers `user_state`
3. **Sync automatique** : à chaque changement d'état (débouncé 350ms) si `navigator.onLine`
4. **Après login OAuth** : la session est restaurée via cookie httpOnly + `getCurrentUser()`
