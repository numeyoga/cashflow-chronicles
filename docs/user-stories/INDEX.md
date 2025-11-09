# Index des User Stories - Cashflow Chronicles

## Vue d'ensemble

Ce document présente l'index complet de toutes les **User Stories** organisées par **Epic**. Chaque user story est détaillée dans un fichier séparé avec le format `US-XXX-YY.md`.

**Total d'Epics** : 22
**Total de User Stories** : ~150-180 (estimation)

---

## Légende

- ✅ **US rédigée** : Le fichier détaillé existe
- 📝 **US planifiée** : À rédiger
- 🔴 **Critique** : User story bloquante pour le MVP
- 🟠 **Haute** : User story importante
- 🟡 **Moyenne** : User story complémentaire
- 🟢 **Basse** : User story optionnelle

---

## MVP - Fondations (Sprint 1-8)

### EPIC-001 : Stockage et Parser TOML

**Priorité : Critique | Complexité : Moyenne**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-001-01 | Charger un fichier TOML valide | ✅ | 🔴 Critique | 1 |
| US-001-02 | Gérer les erreurs de parsing TOML | ✅ | 🔴 Critique | 1 |
| US-001-03 | Sauvegarder les données en fichier TOML | ✅ | 🔴 Critique | 1 |
| US-001-04 | Créer un backup automatique avant modification | ✅ | 🔴 Critique | 1 |
| US-001-05 | Valider la structure du fichier TOML au chargement | ✅ | 🔴 Critique | 1 |
| US-001-06 | Sauvegarder automatiquement après chaque modification | ✅ | 🟠 Haute | 2 |
| US-001-07 | Gérer les conflits de fichier (modifié externement) | 📝 | 🟡 Moyenne | 2 |
| US-001-08 | Gérer la perte de connexion/permission en cours de sauvegarde | 📝 | 🟡 Moyenne | 2 |
| US-001-09 | Récupérer après un crash (données non sauvegardées) | 📝 | 🟡 Moyenne | 2 |
| US-001-10 | Restaurer depuis un backup | 📝 | 🟠 Haute | 2 |

**Total EPIC-001** : 10 User Stories

---

### EPIC-002 : Gestion des Devises et Taux de Change

**Priorité : Critique | Complexité : Moyenne**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-002-01 | Ajouter une nouvelle devise | ✅ | 🔴 Critique | 1-2 |
| US-002-02 | Enregistrer un taux de change historique | ✅ | 🔴 Critique | 2 |
| US-002-03 | Modifier une devise existante | 📝 | 🟠 Haute | 2 |
| US-002-04 | Supprimer une devise non utilisée | 📝 | 🟠 Haute | 2 |
| US-002-05 | Définir la devise par défaut | 📝 | 🔴 Critique | 1-2 |
| US-002-06 | Mettre à jour un taux de change existant | 📝 | 🟠 Haute | 2 |
| US-002-07 | Supprimer un taux de change non utilisé | 📝 | 🟡 Moyenne | 2 |
| US-002-08 | Visualiser l'historique des taux pour une devise | 📝 | 🟠 Haute | 2 |
| US-002-09 | Exporter l'historique des taux en CSV | 📝 | 🟡 Moyenne | 3 |

**Total EPIC-002** : 9 User Stories

---

### EPIC-003 : Gestion des Comptes

**Priorité : Critique | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-003-01 | Créer un compte bancaire (Assets) | ✅ | 🔴 Critique | 2 |
| US-003-02 | Créer un compte de dépenses (Expenses) | 📝 | 🔴 Critique | 2 |
| US-003-03 | Créer un compte de revenus (Income) | 📝 | 🔴 Critique | 2 |
| US-003-04 | Créer un compte de passif (Liabilities) | 📝 | 🔴 Critique | 2 |
| US-003-05 | Créer un compte d'équité (Equity) | 📝 | 🔴 Critique | 2 |
| US-003-06 | Modifier un compte existant | 📝 | 🟠 Haute | 3 |
| US-003-07 | Supprimer un compte non utilisé | 📝 | 🟠 Haute | 3 |
| US-003-08 | Fermer un compte (clôture) | 📝 | 🟠 Haute | 3 |
| US-003-09 | Visualiser la hiérarchie des comptes par type | 📝 | 🔴 Critique | 3 |
| US-003-10 | Calculer le solde d'un compte | 📝 | 🔴 Critique | 3 |
| US-003-11 | Afficher le solde équivalent en devise de référence | 📝 | 🟠 Haute | 3 |
| US-003-12 | Filtrer les comptes par type | 📝 | 🟠 Haute | 3 |
| US-003-13 | Filtrer les comptes par devise | 📝 | 🟠 Haute | 3 |
| US-003-14 | Rechercher un compte par nom | 📝 | 🟡 Moyenne | 4 |

**Total EPIC-003** : 14 User Stories

---

### EPIC-004 : Gestion des Transactions Simples

**Priorité : Critique | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-004-01 | Enregistrer une dépense simple (2 postings, 1 devise) | ✅ | 🔴 Critique | 3 |
| US-004-02 | Enregistrer un revenu (salaire) | 📝 | 🔴 Critique | 3 |
| US-004-03 | Enregistrer un transfert entre comptes | 📝 | 🔴 Critique | 3 |
| US-004-04 | Enregistrer une transaction multi-postings (> 2 postings) | 📝 | 🔴 Critique | 3 |
| US-004-05 | Répartir une dépense sur plusieurs catégories | 📝 | 🟠 Haute | 4 |
| US-004-06 | Ajouter des tags à une transaction | 📝 | 🟠 Haute | 4 |
| US-004-07 | Ajouter des métadonnées à une transaction | 📝 | 🟡 Moyenne | 4 |
| US-004-08 | Modifier une transaction existante | 📝 | 🟠 Haute | 4 |
| US-004-09 | Supprimer une transaction | 📝 | 🟠 Haute | 4 |
| US-004-10 | Dupliquer une transaction | 📝 | 🟡 Moyenne | 4 |
| US-004-11 | Visualiser la liste de toutes les transactions | 📝 | 🔴 Critique | 3 |
| US-004-12 | Filtrer les transactions par date | 📝 | 🟠 Haute | 4 |
| US-004-13 | Filtrer les transactions par compte | 📝 | 🟠 Haute | 4 |
| US-004-14 | Filtrer les transactions par tag | 📝 | 🟡 Moyenne | 4 |
| US-004-15 | Rechercher une transaction par description | 📝 | 🟠 Haute | 4 |
| US-004-16 | Trier les transactions par date/montant | 📝 | 🟡 Moyenne | 4 |

**Total EPIC-004** : 16 User Stories

---

### EPIC-006 : Système de Validation et Règles d'Intégrité

**Priorité : Critique | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-006-01 | Valider l'équilibre des transactions (V-BAL-001) | 📝 | 🔴 Critique | 3-4 |
| US-006-02 | Valider l'équation comptable globale (V-EQ-001) | 📝 | 🔴 Critique | 4 |
| US-006-03 | Valider les dates des transactions (V-TXN-003, V-TXN-006) | 📝 | 🔴 Critique | 3-4 |
| US-006-04 | Valider la cohérence des devises (V-POST-003) | 📝 | 🔴 Critique | 3-4 |
| US-006-05 | Valider l'existence des comptes référencés (V-POST-001, V-REF-*) | 📝 | 🔴 Critique | 3-4 |
| US-006-06 | Valider la cohérence temporelle des comptes (V-POST-004/005/006) | 📝 | 🔴 Critique | 4 |
| US-006-07 | Valider les soldes des comptes (V-SOL-*) | 📝 | 🟠 Haute | 4 |
| US-006-08 | Valider les taux de change (V-FX-*) | 📝 | 🔴 Critique | 4 |
| US-006-09 | Générer un rapport de validation complet | 📝 | 🟠 Haute | 4 |
| US-006-10 | Afficher les erreurs de validation en temps réel dans l'UI | 📝 | 🟠 Haute | 4 |
| US-006-11 | Proposer des corrections automatiques pour erreurs courantes | 📝 | 🟡 Moyenne | 5 |
| US-006-12 | Configurer le mode de validation (strict/permissif) | 📝 | 🟡 Moyenne | 5 |

**Total EPIC-006** : 12 User Stories

---

### EPIC-009 : Dashboard et Vue d'Ensemble

**Priorité : Haute | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-009-01 | Afficher les soldes totaux par devise | 📝 | 🟠 Haute | 7 |
| US-009-02 | Afficher la valeur nette (Assets - Liabilities) | 📝 | 🟠 Haute | 7 |
| US-009-03 | Afficher un graphique d'évolution de la valeur nette | 📝 | 🟠 Haute | 7 |
| US-009-04 | Afficher les transactions récentes | 📝 | 🟠 Haute | 7 |
| US-009-05 | Afficher la répartition des dépenses par catégorie | 📝 | 🟠 Haute | 7 |
| US-009-06 | Afficher les soldes par type de compte | 📝 | 🟡 Moyenne | 7 |
| US-009-07 | Configurer les widgets du dashboard | 📝 | 🟡 Moyenne | 8 |
| US-009-08 | Exporter le dashboard en PDF | 📝 | 🟢 Basse | 8 |

**Total EPIC-009** : 8 User Stories

---

### EPIC-012 : Interface Liste et Gestion des Comptes

**Priorité : Critique | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-012-01 | Afficher la TreeView hiérarchique des comptes | 📝 | 🔴 Critique | 5 |
| US-012-02 | Filtrer les comptes par type | 📝 | 🟠 Haute | 5 |
| US-012-03 | Filtrer les comptes par devise | 📝 | 🟠 Haute | 5 |
| US-012-04 | Afficher le solde en temps réel de chaque compte | 📝 | 🔴 Critique | 5 |
| US-012-05 | Créer un compte via formulaire modal | 📝 | 🔴 Critique | 5 |
| US-012-06 | Modifier un compte via formulaire modal | 📝 | 🟠 Haute | 5 |
| US-012-07 | Fermer un compte | 📝 | 🟠 Haute | 6 |
| US-012-08 | Afficher les statistiques par type de compte | 📝 | 🟡 Moyenne | 6 |

**Total EPIC-012** : 8 User Stories

---

### EPIC-013 : Interface Liste et Gestion des Transactions

**Priorité : Critique | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-013-01 | Afficher la liste paginée des transactions (50/page) | 📝 | 🔴 Critique | 5-6 |
| US-013-02 | Barre de recherche full-text sur description/payee/tags | 📝 | 🟠 Haute | 6 |
| US-013-03 | Filtrer par plage de dates | 📝 | 🟠 Haute | 6 |
| US-013-04 | Filtrer par compte | 📝 | 🟠 Haute | 6 |
| US-013-05 | Filtrer par montant (min/max) | 📝 | 🟡 Moyenne | 6 |
| US-013-06 | Filtrer par tag | 📝 | 🟡 Moyenne | 6 |
| US-013-07 | Cumuler plusieurs filtres | 📝 | 🟠 Haute | 6 |
| US-013-08 | Formulaire de saisie guidé avec indicateur d'équilibre | 📝 | 🔴 Critique | 5-6 |
| US-013-09 | Afficher une vue détaillée d'une transaction | 📝 | 🟠 Haute | 6 |
| US-013-10 | Modifier une transaction via formulaire modal | 📝 | 🟠 Haute | 6 |
| US-013-11 | Supprimer une transaction avec confirmation | 📝 | 🟠 Haute | 6 |
| US-013-12 | Dupliquer une transaction | 📝 | 🟡 Moyenne | 6 |

**Total EPIC-013** : 12 User Stories

---

### EPIC-017 : Interface Paramètres et Configuration

**Priorité : Moyenne | Complexité : Moyenne**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-017-01 | Configurer la devise par défaut | 📝 | 🔴 Critique | 5 |
| US-017-02 | Configurer la langue de l'interface | 📝 | 🟡 Moyenne | 7 |
| US-017-03 | Configurer le thème (clair/sombre) | 📝 | 🟡 Moyenne | 7 |
| US-017-04 | Configurer le format de date | 📝 | 🟡 Moyenne | 7 |
| US-017-05 | Configurer le chemin du fichier TOML | 📝 | 🟠 Haute | 5 |
| US-017-06 | Configurer l'auto-save | 📝 | 🟠 Haute | 5 |
| US-017-07 | Configurer les backups automatiques | 📝 | 🟠 Haute | 5 |
| US-017-08 | Configurer le mode de validation (strict/permissif) | 📝 | 🟡 Moyenne | 7 |
| US-017-09 | Afficher les informations "À propos" (version, licence) | 📝 | 🟡 Moyenne | 8 |

**Total EPIC-017** : 9 User Stories

---

## Phase 2 - Multi-devises (Sprint 9-10)

### EPIC-005 : Gestion des Transactions Multi-devises

**Priorité : Haute | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-005-01 | Enregistrer un transfert avec conversion de devises | 📝 | 🟠 Haute | 9 |
| US-005-02 | Enregistrer les frais de change | 📝 | 🟠 Haute | 9 |
| US-005-03 | Valider l'équilibre multi-devises (V-BAL-002, V-BAL-003) | 📝 | 🔴 Critique | 9 |
| US-005-04 | Calculer automatiquement le montant équivalent | 📝 | 🟠 Haute | 9 |
| US-005-05 | Afficher les conversions dans la liste des transactions | 📝 | 🟠 Haute | 10 |
| US-005-06 | Modifier une transaction multi-devises | 📝 | 🟠 Haute | 10 |

**Total EPIC-005** : 6 User Stories

---

### EPIC-014 : Interface de Gestion des Devises

**Priorité : Haute | Complexité : Moyenne**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-014-01 | Afficher la liste des devises avec statut | 📝 | 🟠 Haute | 10 |
| US-014-02 | Ajouter une devise via formulaire modal | 📝 | 🟠 Haute | 10 |
| US-014-03 | Afficher la table d'historique des taux | 📝 | 🟠 Haute | 10 |
| US-014-04 | Afficher un graphique d'évolution des taux | 📝 | 🟡 Moyenne | 10 |
| US-014-05 | Mettre à jour un taux via formulaire modal | 📝 | 🟠 Haute | 10 |

**Total EPIC-014** : 5 User Stories

---

## Phase 3 - Budgets et Rapports (Sprint 11-14)

### EPIC-007 : Gestion des Budgets

**Priorité : Haute | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-007-01 | Créer un budget mensuel pour une catégorie | 📝 | 🟠 Haute | 11 |
| US-007-02 | Définir un pattern de comptes avec wildcard (*) | 📝 | 🟠 Haute | 11 |
| US-007-03 | Calculer l'utilisation du budget en temps réel | 📝 | 🟠 Haute | 11 |
| US-007-04 | Afficher les alertes de budget (warning, critical) | 📝 | 🟠 Haute | 11 |
| US-007-05 | Modifier un budget existant | 📝 | 🟡 Moyenne | 12 |
| US-007-06 | Supprimer un budget | 📝 | 🟡 Moyenne | 12 |
| US-007-07 | Visualiser le rapport budget vs. réel | 📝 | 🟠 Haute | 12 |
| US-007-08 | Créer un budget pour différentes périodes (daily, weekly, monthly, quarterly, yearly) | 📝 | 🟠 Haute | 11 |

**Total EPIC-007** : 8 User Stories

---

### EPIC-008 : Transactions Récurrentes

**Priorité : Haute | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-008-01 | Créer une récurrence mensuelle (salaire) | 📝 | 🟠 Haute | 12 |
| US-008-02 | Créer une récurrence hebdomadaire | 📝 | 🟠 Haute | 12 |
| US-008-03 | Créer une récurrence annuelle | 📝 | 🟡 Moyenne | 12 |
| US-008-04 | Définir des variables dans le template ({{month}}, {{year}}) | 📝 | 🟡 Moyenne | 12 |
| US-008-05 | Générer automatiquement les transactions récurrentes | 📝 | 🟠 Haute | 13 |
| US-008-06 | Activer/désactiver une récurrence | 📝 | 🟠 Haute | 13 |
| US-008-07 | Modifier une récurrence existante | 📝 | 🟡 Moyenne | 13 |
| US-008-08 | Supprimer une récurrence | 📝 | 🟡 Moyenne | 13 |

**Total EPIC-008** : 8 User Stories

---

### EPIC-010 : Rapports et Visualisations

**Priorité : Haute | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-010-01 | Générer un bilan comptable (Balance Sheet) | 📝 | 🟠 Haute | 13 |
| US-010-02 | Générer un compte de résultat (Income Statement) | 📝 | 🟠 Haute | 13 |
| US-010-03 | Analyser l'évolution temporelle (graphique linéaire) | 📝 | 🟠 Haute | 13 |
| US-010-04 | Analyser les dépenses par catégorie (camembert) | 📝 | 🟠 Haute | 13 |
| US-010-05 | Comparer les périodes (mois vs. mois) | 📝 | 🟡 Moyenne | 14 |
| US-010-06 | Filtrer les rapports par plage de dates | 📝 | 🟠 Haute | 14 |
| US-010-07 | Exporter un rapport en PDF | 📝 | 🟡 Moyenne | 14 |
| US-010-08 | Exporter un rapport en CSV | 📝 | 🟡 Moyenne | 14 |

**Total EPIC-010** : 8 User Stories

---

### EPIC-015 : Interface de Gestion des Budgets

**Priorité : Haute | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-015-01 | Afficher les cartes budget avec progression | 📝 | 🟠 Haute | 12 |
| US-015-02 | Afficher les barres de progression colorées | 📝 | 🟠 Haute | 12 |
| US-015-03 | Afficher les alertes visuelles (warning, critical) | 📝 | 🟠 Haute | 12 |
| US-015-04 | Créer un budget via formulaire modal | 📝 | 🟠 Haute | 12 |
| US-015-05 | Afficher un graphique budget vs. réel | 📝 | 🟡 Moyenne | 12 |

**Total EPIC-015** : 5 User Stories

---

### EPIC-016 : Interface de Gestion des Récurrences

**Priorité : Haute | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-016-01 | Afficher la liste des récurrences avec statut | 📝 | 🟠 Haute | 13 |
| US-016-02 | Toggle activation/désactivation rapide | 📝 | 🟠 Haute | 13 |
| US-016-03 | Afficher la liste des prochaines occurrences | 📝 | 🟠 Haute | 13 |
| US-016-04 | Éditeur de template de transaction | 📝 | 🟠 Haute | 13 |
| US-016-05 | Prévisualiser la prochaine transaction générée | 📝 | 🟡 Moyenne | 13 |

**Total EPIC-016** : 5 User Stories

---

## Phase 4 - Fonctionnalités Avancées (Sprint 15-18)

### EPIC-011 : Import/Export de Données

**Priorité : Moyenne | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-011-01 | Importer des transactions depuis CSV | 📝 | 🟡 Moyenne | 15 |
| US-011-02 | Mapper les colonnes CSV aux champs de transaction | 📝 | 🟡 Moyenne | 15 |
| US-011-03 | Détecter les doublons avant import | 📝 | 🟡 Moyenne | 15 |
| US-011-04 | Prévisualiser l'import avant confirmation | 📝 | 🟡 Moyenne | 15 |
| US-011-05 | Exporter toutes les données en TOML | 📝 | 🟡 Moyenne | 16 |
| US-011-06 | Exporter les transactions en CSV | 📝 | 🟡 Moyenne | 16 |
| US-011-07 | Exporter en format Beancount (optionnel) | 📝 | 🟢 Basse | 16 |

**Total EPIC-011** : 7 User Stories

---

### EPIC-018 : Recherche et Filtres Avancés

**Priorité : Moyenne | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-018-01 | Recherche globale full-text | 📝 | 🟡 Moyenne | 17 |
| US-018-02 | Filtres combinables (ET/OU) | 📝 | 🟡 Moyenne | 17 |
| US-018-03 | Sauvegarder des recherches favorites | 📝 | 🟢 Basse | 17 |
| US-018-04 | Autocomplétion dans la recherche | 📝 | 🟡 Moyenne | 17 |
| US-018-05 | Recherche par montant (min/max, exact) | 📝 | 🟡 Moyenne | 17 |
| US-018-06 | Filtres de date flexibles (ce mois, mois dernier, etc.) | 📝 | 🟡 Moyenne | 17 |

**Total EPIC-018** : 6 User Stories

---

### EPIC-019 : Réconciliation Bancaire

**Priorité : Basse | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-019-01 | Marquer une transaction comme réconciliée | 📝 | 🟢 Basse | 18 |
| US-019-02 | Matching automatique avec relevé bancaire | 📝 | 🟢 Basse | 18 |
| US-019-03 | Détecter les écarts de réconciliation | 📝 | 🟢 Basse | 18 |
| US-019-04 | Générer un rapport de réconciliation | 📝 | 🟢 Basse | 18 |

**Total EPIC-019** : 4 User Stories

---

### EPIC-020 : Performance et Optimisation

**Priorité : Haute | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-020-01 | Optimiser le chargement pour 10 000 transactions (< 1s) | 📝 | 🟠 Haute | 16-17 |
| US-020-02 | Optimiser le calcul des soldes (< 100ms) | 📝 | 🟠 Haute | 16-17 |
| US-020-03 | Optimiser la recherche (< 100ms) | 📝 | 🟠 Haute | 17 |
| US-020-04 | Virtualisation des listes longues | 📝 | 🟠 Haute | 17 |
| US-020-05 | Lazy loading des graphiques | 📝 | 🟡 Moyenne | 17 |
| US-020-06 | Utiliser Web Workers pour calculs lourds | 📝 | 🟡 Moyenne | 17 |
| US-020-07 | Implémenter un cache des soldes | 📝 | 🟠 Haute | 16-17 |

**Total EPIC-020** : 7 User Stories

---

### EPIC-022 : Documentation Utilisateur

**Priorité : Moyenne | Complexité : Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-022-01 | Rédiger le guide de démarrage | 📝 | 🟡 Moyenne | 18 |
| US-022-02 | Rédiger les tutoriels par fonctionnalité | 📝 | 🟡 Moyenne | 18 |
| US-022-03 | Implémenter l'aide contextuelle dans l'UI | 📝 | 🟡 Moyenne | 18 |
| US-022-04 | Créer une FAQ | 📝 | 🟡 Moyenne | 18 |
| US-022-05 | Créer un glossaire de termes comptables | 📝 | 🟡 Moyenne | 18 |

**Total EPIC-022** : 5 User Stories

---

## Continu - Qualité (Tout au long du projet)

### EPIC-021 : Tests et Qualité du Code

**Priorité : Critique | Complexité : Très Haute**

| US | Titre | Statut | Priorité | Sprint |
|----|-------|--------|----------|--------|
| US-021-01 | Tests unitaires pour le parser TOML | 📝 | 🔴 Critique | 1-2 |
| US-021-02 | Tests unitaires pour les règles de validation | 📝 | 🔴 Critique | 3-4 |
| US-021-03 | Tests d'intégration pour les transactions | 📝 | 🔴 Critique | 4-5 |
| US-021-04 | Tests E2E pour les flux principaux | 📝 | 🟠 Haute | 6-8 |
| US-021-05 | Configurer CI/CD avec GitHub Actions | 📝 | 🟠 Haute | 3 |
| US-021-06 | Atteindre une couverture de tests > 80% | 📝 | 🟠 Haute | Continu |
| US-021-07 | Tests de performance (10 000 transactions) | 📝 | 🟠 Haute | 16-17 |

**Total EPIC-021** : 7 User Stories

---

## Résumé par Phase

| Phase | Epics | User Stories | Sprints |
|-------|-------|--------------|---------|
| **MVP** | 9 Epics | ~90 US | 1-8 |
| **Phase 2** | 2 Epics | ~11 US | 9-10 |
| **Phase 3** | 5 Epics | ~34 US | 11-14 |
| **Phase 4** | 5 Epics | ~29 US | 15-18 |
| **Continu** | 1 Epic | ~7 US | Tout au long |
| **TOTAL** | **22 Epics** | **~171 US** | **18 Sprints** |

---

## Organisation des fichiers

Tous les fichiers de user stories sont organisés dans `/docs/user-stories/` avec le format :

```
US-XXX-YY.md

Où :
  XXX = Numéro de l'epic (001-022)
  YY  = Numéro de la user story dans cet epic (01-99)

Exemples :
  US-001-01.md → EPIC-001, première user story
  US-004-15.md → EPIC-004, quinzième user story
```

---

## Progression actuelle

✅ **Epics avec user stories rédigées** :
- EPIC-001 : 6/10 US rédigées
- EPIC-002 : 2/9 US rédigées
- EPIC-003 : 1/14 US rédigées
- EPIC-004 : 1/16 US rédigées

📝 **Prochaines user stories prioritaires à rédiger** :
1. US-003-02 à US-003-05 (Créer les autres types de comptes)
2. US-004-02 à US-004-04 (Enregistrer revenus et transferts)
3. US-006-01 à US-006-10 (Règles de validation critiques)
4. US-012-01 à US-012-05 (Interface de gestion des comptes)
5. US-013-01 à US-013-08 (Interface de gestion des transactions)

---

## Notes

- Les user stories marquées 🔴 **Critique** sont bloquantes pour le MVP
- Les user stories marquées 📝 **Planifiée** suivent le même format que celles rédigées
- Chaque user story contient :
  - Prérequis
  - Objectif business
  - Objectifs concrets
  - Profil utilisateur
  - Scénario nominal
  - Données de test (entrantes/sortantes)
  - Critères d'acceptation
  - Validation et règles appliquées

---

**Document maintenu par** : Équipe Cashflow Chronicles
**Dernière mise à jour** : 2025-01-09
**Version** : 1.0.0
