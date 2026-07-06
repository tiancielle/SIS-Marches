# Architecture du projet

## Vue d'ensemble
Backend FastAPI (API REST + SQLite) et Frontend React séparés, communiquant en JSON.
L'authentification est prévue dès l'architecture (routers/auth.py, core/security.py,
frontend/src/auth/*) mais son implémentation est reportée après les modules Projets
et Sous-traitants.

## Découpage backend
- `core/` : configuration, connexion DB, sécurité (JWT)
- `models/` : tables SQLAlchemy (une entité = un fichier)
- `schemas/` : validation/sérialisation Pydantic (Create/Update/Read)
- `routers/` : endpoints REST, un fichier par entité
- `services/` : logique métier séparée des routers (testable indépendamment)
- `storage/` : fichiers uploadés (dev local), remplaçable plus tard par un stockage cloud

## Découpage frontend
- `auth/` : contexte d'authentification, page de connexion, garde de route
- `pages/` : un écran = un fichier (Projets, Sous-traitants, puis Dashboard en dernier)
- `components/layout` : Sidebar + Header partagés
- `components/ui` : atomes réutilisables (Badge, Table, Modal, StatCard, FileInput)
- `components/forms` : formulaires de création/édition
- `api/` : un fichier d'appels HTTP par entité
- `styles/tokens.css` : palette et typographie (inspirées de TenderWatch)

## Ordre d'implémentation
1. Auth (squelette posé, code plus tard)
2. Projets (CRUD complet)
3. Sous-traitants (CRUD complet)
4. Contrats -> Factures -> Paiements
5. Dashboard (agrégats sur tout ce qui précède)

## Anticipation Phase 2 (ne pas construire maintenant)
La table `Document` centralise toutes les pièces jointes (contrats, mémoires
techniques, reçus). C'est le point d'ancrage naturel pour ajouter plus tard une
colonne d'embedding ou un index vectoriel, sans modifier les autres modèles.
