# User Stories - Cashflow Chronicles

## Vue d'ensemble

Ce dossier contient **toutes les User Stories** du projet Cashflow Chronicles, organisées par **Epic** selon les bonnes pratiques SCRUM et finance.

**Total prévu** : ~171 User Stories réparties sur 22 Epics

## Organisation des fichiers

### Format de nommage

Chaque user story est dans un fichier séparé suivant le format :

```
US-XXX-YY.md

Où :
  XXX = Numéro de l'epic (001 à 022)
  YY  = Numéro de la user story dans cet epic (01 à 99)
```

### Exemples

```
US-001-01.md  →  EPIC-001 : Stockage et Parser TOML - Charger un fichier TOML valide
US-002-01.md  →  EPIC-002 : Devises - Ajouter une nouvelle devise
US-004-01.md  →  EPIC-004 : Transactions - Enregistrer une dépense simple
```

## Structure d'une User Story

Chaque fichier de user story contient obligatoirement :

### 1. Informations générales

- **Epic parent** : Lien vers l'epic
- **Priorité** : Critique / Haute / Moyenne / Basse
- **Complexité** : Faible / Moyenne / Haute / Très Haute
- **Sprint** : Sprint(s) d'implémentation

### 2. Prérequis

Liste des user stories ou fonctionnalités qui doivent être complétées avant celle-ci.

Exemple :
```markdown
- **US-001-01** : Charger un fichier TOML valide
- **US-002-01** : Ajouter une nouvelle devise
- Au moins 2 devises configurées
```

### 3. Profil utilisateur

Description du type d'utilisateur concerné par cette US.

Exemple :
```markdown
**Utilisateur final** qui souhaite enregistrer une dépense courante
```

### 4. Objectif business

Pourquoi cette fonctionnalité est nécessaire d'un point de vue business/métier.

Exemple :
```markdown
Permettre à l'utilisateur d'enregistrer ses dépenses quotidiennes pour suivre
son budget et analyser ses finances.
```

### 5. Objectifs concrets

Liste précise de ce qui doit être implémenté.

Exemple :
```markdown
1. Créer une transaction avec 2 postings (partie double)
2. Débiter un compte Expenses (montant positif)
3. Créditer un compte Assets (montant négatif)
4. Valider l'équilibre de la transaction (somme = 0)
...
```

### 6. Scénario nominal

Description étape par étape du flux utilisateur principal.

### 7. Données de test

#### Données entrantes

Exemples de données en entrée (formulaires, fichiers, etc.)

#### Données sortantes

Exemples de résultats attendus (fichiers TOML, objets en mémoire, affichages UI)

### 8. Critères d'acceptation

Liste de critères mesurables à cocher pour valider que la US est complète.

Exemple :
```markdown
- [ ] Le formulaire de transaction est accessible
- [ ] La somme des montants doit être 0 (tolérance ±0.01)
- [ ] Les devises doivent correspondre aux comptes
- [ ] Un message de confirmation est affiché
```

### 9. Validation

Règles de validation appliquées (référence aux règles V-XXX-YYY du document VALIDATION-RULES.md)

### 10. Notes techniques

Détails d'implémentation, snippets de code, considérations techniques.

## Fichiers principaux

### INDEX.md

**Fichier de référence principal** contenant :
- Vue d'ensemble des 22 Epics
- Liste complète des ~171 User Stories
- Statut de chaque US (rédigée ✅ ou planifiée 📝)
- Répartition par phase (MVP, Phase 2-4, Continu)
- Résumé par sprint

👉 **Consultez [INDEX.md](./INDEX.md) pour la vue complète**

### README.md (ce fichier)

Documentation sur l'organisation et le format des user stories.

## Progression actuelle

### User Stories rédigées (10/171)

#### EPIC-001 : Stockage et Parser TOML (6 US)
- ✅ US-001-01 : Charger un fichier TOML valide
- ✅ US-001-02 : Gérer les erreurs de parsing TOML
- ✅ US-001-03 : Sauvegarder les données en fichier TOML
- ✅ US-001-04 : Créer un backup automatique avant modification
- ✅ US-001-05 : Valider la structure du fichier TOML au chargement
- ✅ US-001-06 : Sauvegarder automatiquement après chaque modification

#### EPIC-002 : Gestion des Devises (2 US)
- ✅ US-002-01 : Ajouter une nouvelle devise
- ✅ US-002-02 : Enregistrer un taux de change historique

#### EPIC-003 : Gestion des Comptes (1 US)
- ✅ US-003-01 : Créer un compte bancaire (Assets)

#### EPIC-004 : Gestion des Transactions Simples (1 US)
- ✅ US-004-01 : Enregistrer une dépense simple (2 postings, 1 devise)

### Prochaines priorités

Les prochaines user stories à rédiger en priorité pour le MVP :

1. **US-003-02 à US-003-05** : Créer les autres types de comptes (Expenses, Income, Liabilities, Equity)
2. **US-004-02 à US-004-04** : Enregistrer revenus, transferts, et transactions multi-postings
3. **US-006-01 à US-006-10** : Règles de validation critiques pour l'intégrité des données
4. **US-012-01 à US-012-05** : Interface de gestion des comptes avec TreeView
5. **US-013-01 à US-013-08** : Interface de gestion des transactions avec filtres

## Bonnes pratiques

### Pour rédiger une nouvelle US

1. **Copier le template d'une US existante** (ex: US-001-01.md)
2. **Respecter le format** avec toutes les sections obligatoires
3. **Être spécifique** : données de test réalistes, critères mesurables
4. **Penser au développeur** : donner toutes les infos nécessaires, pas plus
5. **Identifier les edge cases** : les documenter dans des US séparées si complexes
6. **Référencer les règles de validation** : utiliser les codes V-XXX-YYY

### Séparation des scénarios

- **Scénario nominal** : dans la US principale
- **Edge cases / cas d'erreur** : dans des US séparées avec suffixe
  - Exemple : US-004-01 (nominal) → US-004-01-E01 (erreur équilibre)

### Données de test

Toujours fournir des **données réalistes et testables** :
- Fichiers TOML complets
- Exemples de formulaires remplis
- Résultats attendus précis
- Messages d'erreur exacts

## Nomenclature des Epics

| Epic | Nom | Phase | Priorité |
|------|-----|-------|----------|
| EPIC-001 | Stockage et Parser TOML | MVP | Critique |
| EPIC-002 | Gestion des Devises | MVP | Critique |
| EPIC-003 | Gestion des Comptes | MVP | Critique |
| EPIC-004 | Transactions Simples | MVP | Critique |
| EPIC-005 | Transactions Multi-devises | Phase 2 | Haute |
| EPIC-006 | Validation et Intégrité | MVP | Critique |
| EPIC-007 | Budgets | Phase 3 | Haute |
| EPIC-008 | Récurrences | Phase 3 | Haute |
| EPIC-009 | Dashboard | MVP | Haute |
| EPIC-010 | Rapports et Visualisations | Phase 3 | Haute |
| EPIC-011 | Import/Export | Phase 4 | Moyenne |
| EPIC-012 | Interface Comptes | MVP | Critique |
| EPIC-013 | Interface Transactions | MVP | Critique |
| EPIC-014 | Interface Devises | Phase 2 | Haute |
| EPIC-015 | Interface Budgets | Phase 3 | Haute |
| EPIC-016 | Interface Récurrences | Phase 3 | Haute |
| EPIC-017 | Paramètres | MVP | Moyenne |
| EPIC-018 | Recherche Avancée | Phase 4 | Moyenne |
| EPIC-019 | Réconciliation Bancaire | Phase 4 | Basse |
| EPIC-020 | Performance | Phase 4 | Haute |
| EPIC-021 | Tests et Qualité | Continu | Critique |
| EPIC-022 | Documentation Utilisateur | Phase 4 | Moyenne |

## Références

- **[EPICS.md](../EPICS.md)** : Description détaillée de tous les epics
- **[SPECIFICATION.md](../SPECIFICATION.md)** : Spécification fonctionnelle complète
- **[VALIDATION-RULES.md](../VALIDATION-RULES.md)** : 102 règles de validation (V-XXX-YYY)
- **[TOML-FORMAT.md](../TOML-FORMAT.md)** : Format de données TOML
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** : Architecture technique du projet

## Contribution

Pour ajouter ou modifier une user story :

1. Suivre le format standardisé décrit ci-dessus
2. Mettre à jour le fichier [INDEX.md](./INDEX.md)
3. Référencer les règles de validation appropriées
4. Ajouter des données de test réalistes
5. Créer une pull request avec une description claire

---

**Document maintenu par** : Équipe Cashflow Chronicles
**Dernière mise à jour** : 2025-01-09
**Version** : 1.0.0
