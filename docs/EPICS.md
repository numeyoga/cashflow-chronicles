# Epics - Cashflow Chronicles

## Vue d'ensemble

Ce document présente les **22 Epics** qui couvrent **100% des fonctionnalités** de l'application Cashflow Chronicles. Ces Epics sont organisés par phase de développement et priorité pour guider l'implémentation complète de l'application.

**Version:** 1.0.0
**Dernière mise à jour:** 2025-01-08

---

## Organisation des Epics

### Par Phase

| Phase | Epics | Durée estimée |
|-------|-------|---------------|
| **MVP** | 9 Epics | 6-8 mois |
| **Phase 2** | 2 Epics | 2-3 mois |
| **Phase 3** | 5 Epics | 3-4 mois |
| **Phase 4** | 5 Epics | 3-4 mois |
| **Continu** | 1 Epic | Tout au long |

**Estimation totale:** 14-19 mois pour une équipe de 2-3 développeurs full-stack

### Par Priorité

- **Critique** (8 Epics) : Fondations indispensables pour le MVP
- **Haute** (9 Epics) : Fonctionnalités principales et différenciantes
- **Moyenne** (4 Epics) : Fonctionnalités complémentaires
- **Basse** (1 Epic) : Nice-to-have

---

## MVP - Fondations (6-8 mois)

### EPIC-001 : Stockage et Parser TOML
**Priorité:** Critique | **Complexité:** Moyenne

Implémenter le système de stockage basé sur TOML. C'est la fondation de l'application.

**Objectifs clés:**
- Parser TOML compatible spec v1.0.0
- Lecture/écriture du fichier avec gestion d'erreurs
- Sauvegarde automatique avec backup
- Validation du format

**Critères d'acceptation:**
- Chargement < 1s pour 10 000 transactions
- Sauvegarde < 500ms
- Backup automatique avant modification
- Messages d'erreur clairs

---

### EPIC-002 : Gestion des Devises et Taux de Change
**Priorité:** Critique | **Complexité:** Moyenne

Support multi-devises avec taux de change historiques (CHF, EUR, USD, etc.).

**Objectifs clés:**
- Modèle de devises (code ISO 4217, nom, symbole)
- Gestion de la devise par défaut
- Taux de change historiques
- Conversions entre devises

**User Stories:**
- Définir ma devise principale (CHF)
- Ajouter d'autres devises (EUR, USD)
- Enregistrer les taux de change
- Voir l'historique des taux

**Validation:** Règles V-CUR-001 à V-CUR-012

---

### EPIC-003 : Gestion des Comptes
**Priorité:** Critique | **Complexité:** Haute

Système de comptes hiérarchiques avec 5 types (Assets, Liabilities, Income, Expenses, Equity).

**Objectifs clés:**
- CRUD comptes avec hiérarchie (notation par points)
- Validation nom hiérarchique vs. type
- Calcul des soldes
- Ouverture/fermeture de comptes
- Visualisation de la hiérarchie

**User Stories:**
- Créer un compte bancaire (Assets)
- Créer des catégories de dépenses (Expenses)
- Voir tous mes comptes organisés par type
- Voir le solde de chaque compte
- Fermer un compte inactif

**Validation:** Règles V-ACC-001 à V-ACC-013

---

### EPIC-004 : Gestion des Transactions Simples
**Priorité:** Critique | **Complexité:** Haute

Transactions mono-devise en partie double avec équilibre obligatoire (Σ = 0).

**Objectifs clés:**
- Modèle transaction avec postings
- Validation équilibre (somme = 0)
- Interface de saisie guidée
- Support multi-postings (> 2 écritures)
- Tags et métadonnées
- Liste avec filtres

**User Stories:**
- Enregistrer une dépense (Expenses → Assets)
- Enregistrer un revenu (Assets ← Income)
- Faire un transfert entre comptes
- Répartir une dépense sur plusieurs comptes
- Rechercher des transactions

**Validation:** Règles V-TXN-001 à V-TXN-006, V-POST-001 à V-POST-006, V-BAL-001

---

### EPIC-006 : Système de Validation et Règles d'Intégrité
**Priorité:** Critique | **Complexité:** Très Haute

Implémentation des **150+ règles de validation** pour garantir l'intégrité des données.

**Objectifs clés:**
- Toutes les règles V-XXX-YYY
- Système de rapport de validation
- Validation temps réel dans l'UI
- Niveaux de sévérité (Erreur, Avertissement, Info)
- Validation incrémentale
- Vérification équation comptable

**Critères d'acceptation:**
- 150+ règles implémentées
- Validation au chargement < 100ms (1000 tx)
- Validation incrémentale < 10ms
- Erreurs bloquent la sauvegarde
- Messages clairs et actionnables

**Équation comptable:**
```
Assets = Liabilities + Equity + (Income - Expenses)
```

---

### EPIC-009 : Dashboard et Vue d'Ensemble
**Priorité:** Haute | **Complexité:** Haute

Tableau de bord principal avec vue d'ensemble de la situation financière.

**Widgets MVP:**
- Soldes totaux par devise
- Valeur nette
- Graphique d'évolution
- Transactions récentes
- Répartition des dépenses

**Widgets Phase 3** (nécessitent EPIC-007 Budgets):
- Alertes de budget *(sera ajouté en Phase 3)*

**User Stories:**
- Voir ma situation financière en un coup d'œil
- Voir mes soldes par devise
- Voir l'évolution de ma valeur nette
- Voir mes dernières transactions
- Voir la répartition de mes dépenses par catégorie

**Performance:** Dashboard charge en < 2s

**Note:** Les alertes de budget seront ajoutées au Dashboard lors de l'implémentation de EPIC-007 (Phase 3).

---

### EPIC-012 : Interface Liste et Gestion des Comptes
**Priorité:** Critique | **Complexité:** Haute

Interface complète pour la gestion des comptes avec vue hiérarchique.

**Composants UI:**
- TreeView hiérarchique
- Filtres (type, devise, statut)
- Formulaires création/édition
- Badge solde en temps réel
- Bouton clôture

**User Stories:**
- Voir tous mes comptes organisés
- Filtrer par type de compte
- Créer un nouveau compte facilement
- Modifier les informations d'un compte
- Fermer un compte inactif

---

### EPIC-013 : Interface Liste et Gestion des Transactions
**Priorité:** Critique | **Complexité:** Très Haute

Interface complète pour la gestion des transactions avec recherche et filtres.

**Composants UI:**
- Liste paginée (50/page)
- Barre de recherche full-text
- Filtres multiples (date, compte, montant, tags)
- Formulaire de saisie guidé
- Indicateur d'équilibre
- Vue détaillée

**Fonctionnalités:**
- Recherche sur description, payee, tags
- Filtres cumulables
- Guidage pour équilibrage
- Modification/suppression

---

### EPIC-017 : Interface Paramètres et Configuration
**Priorité:** Moyenne | **Complexité:** Moyenne

Interface de paramétrage de l'application.

**Sections:**
- Général (devise, langue)
- Affichage (thème, format date)
- Fichier (chemin, auto-save)
- Validation (mode strict/permissif)
- Backup (auto, manuel)
- À propos (version, licence)

---

## Phase 2 - Multi-devises (2-3 mois)

### EPIC-005 : Gestion des Transactions Multi-devises
**Priorité:** Haute | **Complexité:** Très Haute

Extension pour les conversions entre devises avec taux de change.

**Objectifs clés:**
- Gestion taux de change dans postings
- Validation équilibre multi-devises
- Interface avec conversion
- Calcul automatique montants équivalents
- Gestion frais de change

**User Stories:**
- Transférer de l'argent de CHF vers EUR
- Enregistrer le taux de change utilisé
- Voir le montant équivalent en devise de base
- Enregistrer les frais de conversion

**Validation:** Règles V-BAL-002, V-BAL-003, V-FX-001 à V-FX-005

---

### EPIC-014 : Interface de Gestion des Devises
**Priorité:** Haute | **Complexité:** Moyenne

Interface de gestion des devises et taux de change.

**Composants UI:**
- Liste des devises avec statut
- Formulaire ajout devise
- Table historique taux
- Graphique évolution
- Formulaire mise à jour taux

**User Stories:**
- Voir toutes mes devises
- Ajouter une nouvelle devise
- Mettre à jour les taux de change
- Voir l'historique des taux
- Voir l'évolution en graphique

---

## Phase 3 - Budgets et Rapports (3-4 mois)

### EPIC-007 : Gestion des Budgets
**Priorité:** Haute | **Complexité:** Haute

Système de budgétisation avec suivi de progression.

**Fonctionnalités:**
- Périodes (daily, weekly, monthly, quarterly, yearly)
- Patterns de comptes avec wildcards (*)
- Calcul utilisation en temps réel
- Alertes (warning, critical)
- Rapports budget vs. réel

**User Stories:**
- Définir un budget mensuel pour l'alimentation
- Voir mon utilisation du budget en temps réel
- Être alerté à 80% du budget
- Comparer budget vs. réel

**Validation:** Règles V-BUD-001 à V-BUD-012

---

### EPIC-008 : Transactions Récurrentes
**Priorité:** Haute | **Complexité:** Haute

Automatisation des transactions répétitives.

**Fonctionnalités:**
- Fréquences (daily, weekly, monthly, yearly)
- Templates de transaction
- Variables ({{month}}, {{year}}, etc.)
- Génération automatique
- Activation/désactivation

**User Stories:**
- Automatiser mon salaire mensuel
- Créer une récurrence pour mon loyer
- Gérer des abonnements hebdomadaires
- Désactiver temporairement une récurrence

**Validation:** Règles V-REC-001 à V-REC-012

---

### EPIC-010 : Rapports et Visualisations
**Priorité:** Haute | **Complexité:** Très Haute

Système de rapports financiers détaillés.

**Types de rapports:**
- Bilan (Balance Sheet)
- Compte de Résultat (Income Statement)
- Évolution temporelle
- Analyse multi-devises
- Répartition par catégorie

**Types de graphiques:**
- Ligne (évolution)
- Barres (comparaison)
- Camembert (répartition)
- Aire (cumul)

**User Stories:**
- Voir mon bilan comptable
- Voir mon compte de résultat mensuel
- Analyser mes dépenses par catégorie
- Exporter un rapport en PDF

---

### EPIC-015 : Interface de Gestion des Budgets
**Priorité:** Haute | **Complexité:** Haute

Interface de gestion des budgets avec visualisations.

**Composants UI:**
- Carte budget avec progression
- Barre de progression colorée
- Alertes visuelles
- Formulaire création
- Graphique budget vs. réel

---

### EPIC-016 : Interface de Gestion des Récurrences
**Priorité:** Haute | **Complexité:** Haute

Interface de gestion des transactions récurrentes.

**Composants UI:**
- Liste des récurrences avec statut
- Toggle activation/désactivation
- Liste prochaines occurrences
- Éditeur de template

---

## Phase 4 - Fonctionnalités Avancées (3-4 mois)

### EPIC-011 : Import/Export de Données
**Priorité:** Moyenne | **Complexité:** Haute

Import/export pour migration et analyse externe.

**Formats:**
- **Import:** CSV
- **Export:** CSV, TOML, Beancount (optionnel), Ledger (optionnel)

**Fonctionnalités:**
- Mapping de colonnes configurable
- Détection de doublons
- Aperçu avant import
- Gestion d'erreurs

**User Stories:**
- Importer mes relevés bancaires CSV
- Mapper les colonnes CSV
- Détecter les doublons avant import
- Exporter toutes mes données

**Validation:** Règle V-DUP-001

---

### EPIC-018 : Recherche et Filtres Avancés
**Priorité:** Moyenne | **Complexité:** Haute

Système de recherche avancée et filtres combinables.

**Fonctionnalités:**
- Recherche globale full-text
- Filtres combinables
- Recherches sauvegardées
- Autocomplétion
- Recherche par montant
- Filtres de date flexibles

**Types de recherche:**
- Full-text
- Par montant
- Par date
- Par compte
- Par tag

**Performance:** < 100ms

---

### EPIC-019 : Réconciliation Bancaire
**Priorité:** Basse | **Complexité:** Très Haute

Vérification des transactions vs. relevés bancaires.

**Fonctionnalités:**
- Interface de réconciliation
- Matching automatique
- Marquage réconcilié/non réconcilié
- Détection d'écarts
- Rapport de réconciliation

**Statuts:**
- Réconcilié
- Non réconcilié
- En cours

---

### EPIC-020 : Performance et Optimisation
**Priorité:** Haute | **Complexité:** Très Haute

Optimisation pour gérer 10 000+ transactions.

**Objectifs de performance:**
- Chargement < 1s pour 10 000 transactions
- Calcul des soldes < 100ms
- Recherche < 100ms
- Rendu graphiques < 500ms

**Techniques:**
- Indexation
- Cache des soldes
- Virtualisation des listes
- Lazy loading
- Web Workers pour calculs lourds

---

### EPIC-022 : Documentation Utilisateur
**Priorité:** Moyenne | **Complexité:** Haute

Documentation complète pour faciliter l'adoption.

**Types de documentation:**
- Guide de démarrage
- Tutoriels par fonctionnalité
- Aide contextuelle
- FAQ
- Vidéos de démonstration
- Glossaire de termes comptables

---

## Continu - Qualité

### EPIC-021 : Tests et Qualité du Code
**Priorité:** Critique | **Complexité:** Très Haute

Stratégie de tests complète.

**Types de tests:**
- Unitaires (Vitest)
- Intégration
- E2E (Playwright)
- Validation (150+ règles)

**Objectifs:**
- Couverture > 80%
- Tests en < 2 minutes
- CI/CD avec GitHub Actions
- Détection des régressions

---

## Couverture Fonctionnelle Complète

Ces 22 Epics couvrent **100% des fonctionnalités** documentées:

✅ Stockage et Parser TOML
✅ Gestion multi-devises
✅ Gestion des comptes hiérarchiques
✅ Transactions simples et multi-devises
✅ Validation et intégrité (150+ règles)
✅ Budgets et suivi
✅ Transactions récurrentes
✅ Dashboard et rapports
✅ Import/Export
✅ Interfaces utilisateur complètes
✅ Recherche avancée
✅ Réconciliation bancaire
✅ Performance et optimisation
✅ Tests et qualité
✅ Documentation utilisateur

---

## Dépendances entre Epics

```
EPIC-001 (TOML)
    ├─> EPIC-002 (Devises)
    │       ├─> EPIC-003 (Comptes)
    │       │       ├─> EPIC-004 (Transactions simples)
    │       │       │       ├─> EPIC-005 (Transactions multi-devises)
    │       │       │       ├─> EPIC-007 (Budgets)
    │       │       │       ├─> EPIC-008 (Récurrences)
    │       │       │       ├─> EPIC-011 (Import/Export)
    │       │       │       ├─> EPIC-018 (Recherche)
    │       │       │       └─> EPIC-019 (Réconciliation)
    │       │       │
    │       │       ├─> EPIC-006 (Validation)
    │       │       ├─> EPIC-009 (Dashboard)
    │       │       ├─> EPIC-012 (UI Comptes)
    │       │       └─> EPIC-013 (UI Transactions)
    │       │
    │       ├─> EPIC-014 (UI Devises)
    │       └─> EPIC-017 (Paramètres)
    │
    └─> EPIC-010 (Rapports)
    └─> EPIC-015 (UI Budgets)
    └─> EPIC-016 (UI Récurrences)
    └─> EPIC-020 (Performance)
    └─> EPIC-021 (Tests)
    └─> EPIC-022 (Documentation)
```

---

## Priorisation Recommandée

### Sprint 1-2 (MVP Core)
1. EPIC-001 : Stockage TOML
2. EPIC-002 : Devises
3. EPIC-003 : Comptes

### Sprint 3-4 (MVP Transactions)
4. EPIC-004 : Transactions simples
5. EPIC-006 : Validation

### Sprint 5-6 (MVP UI)
6. EPIC-012 : UI Comptes
7. EPIC-013 : UI Transactions
8. EPIC-017 : Paramètres

### Sprint 7-8 (MVP Dashboard)
9. EPIC-009 : Dashboard
10. EPIC-021 : Tests (continu)

### Sprint 9-10 (Phase 2)
11. EPIC-005 : Transactions multi-devises
12. EPIC-014 : UI Devises

### Sprint 11-14 (Phase 3)
13. EPIC-007 : Budgets
14. EPIC-008 : Récurrences
15. EPIC-010 : Rapports
16. EPIC-015 : UI Budgets
17. EPIC-016 : UI Récurrences

### Sprint 15-18 (Phase 4)
18. EPIC-011 : Import/Export
19. EPIC-018 : Recherche avancée
20. EPIC-020 : Performance
21. EPIC-019 : Réconciliation (optionnel)
22. EPIC-022 : Documentation

---

## Métriques de Succès

### Qualité
- Couverture de tests > 80%
- 0 erreur de validation non gérée
- 150+ règles de validation implémentées

### Performance
- Chargement < 1s pour 10 000 transactions
- Validation < 100ms pour 1000 transactions
- Recherche < 100ms

### Adoption
- Guide de démarrage complété en < 15 minutes
- 90% des fonctionnalités utilisées
- Documentation complète et claire

---

## Notes Importantes

1. **Tests continus** : EPIC-021 doit être travaillé en parallèle de tous les autres Epics
2. **Validation critique** : EPIC-006 est bloquant pour la qualité des données
3. **Performance** : EPIC-020 peut être anticipé si nécessaire
4. **Documentation** : EPIC-022 peut être produite progressivement

---

**Document maintenu par:** Équipe Cashflow Chronicles
**Contact:** Voir README principal
**Licence:** MIT
