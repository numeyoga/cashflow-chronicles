# Documentation Cashflow Chronicles

Bienvenue dans la documentation de **Cashflow Chronicles**, une application de gestion de budget personnel multi-devises basée sur les principes de Plain Text Accounting et la comptabilité en partie double.

## 📚 Table des matières

### 1. [Spécification Fonctionnelle](./SPECIFICATION.md)

Document principal décrivant:
- Vue d'ensemble et objectifs du projet
- Concepts fondamentaux de comptabilité en partie double
- Types de comptes et structure hiérarchique
- Fonctionnalités principales (comptes, transactions, budgets, rapports)
- Architecture de l'interface utilisateur
- Contraintes techniques et évolutions futures

**À lire en premier** pour comprendre le projet dans son ensemble.

### 2. [Epics - Planification Agile](./EPICS.md)

Plan de développement complet avec 22 Epics couvrant 100% des fonctionnalités:
- Organisation par phase (MVP, Phase 2, Phase 3, Phase 4)
- Priorisation et estimation de complexité
- User stories et critères d'acceptation
- Dépendances entre Epics
- Roadmap de développement

**Indispensable** pour les chefs de projet, product owners et développeurs.

**Formats disponibles:**
- [EPICS.md](./EPICS.md) - Version markdown lisible
- [EPICS.toml](./EPICS.toml) - Version TOML structurée

### 3. [Architecture Logicielle](./ARCHITECTURE.md)

Documentation complète de l'architecture de l'application:
- Architecture en couches (Clean Architecture / Hexagonal)
- Modèles de données et entités du domaine
- Patterns et principes de conception (SOLID, Repository, Use Cases)
- Flux de données (lecture/écriture/validation)
- Stratégies de performance et cache
- Structure des modules et packages
- Gestion de l'état avec Svelte Stores
- Décisions architecturales (ADRs)

**Essentiel** pour les architectes, développeurs et tech leads.

### 4. [Format de fichier TOML](./TOML-FORMAT.md)

Spécification technique détaillée du format de données:
- Structure générale du fichier TOML
- Format de chaque entité (devises, comptes, transactions, budgets, récurrences)
- Propriétés obligatoires et optionnelles
- Exemples concrets pour chaque type d'entité
- Règles de nommage et conventions
- Avantages de TOML pour Plain Text Accounting

**Indispensable** pour implémenter le stockage des données.

### 5. [Règles de validation](./VALIDATION-RULES.md)

Documentation complète de toutes les règles de validation:
- Validation structurelle (format TOML, types)
- Validation métier (règles comptables)
- Validation d'intégrité (cohérence globale)
- Codes de règles (V-XXX-YYY) avec sévérité (Erreur/Avertissement/Info)
- Équation comptable et équilibre des transactions
- Processus de validation et rapports

**Essentiel** pour garantir l'intégrité des données.

### 6. [Fichier d'exemple](./example-data.toml)

Fichier TOML d'exemple complet démontrant:
- Toutes les sections et leur structure
- Transactions simples et multi-devises
- Budgets et transactions récurrentes
- Commentaires et annotations
- Bonnes pratiques de formatage

**Référence pratique** pour commencer rapidement.

## 🎯 Concepts clés

### Plain Text Accounting

L'application s'inspire des outils de Plain Text Accounting (Beancount, Ledger, hledger) qui utilisent:
- **Comptabilité en partie double** : Chaque transaction affecte au moins 2 comptes
- **Fichiers texte** : Données lisibles et versionables (ici en TOML)
- **Validation stricte** : Équilibre des transactions et cohérence garantie
- **Multi-devises** : Support natif de plusieurs devises avec taux de change

### Pourquoi TOML ?

TOML (Tom's Obvious Minimal Language) est le format idéal pour ce projet:
- **Lisibilité supérieure** : Syntaxe claire et minimale, parfaite pour l'édition manuelle
- **Commentaires natifs** : Annoter vos données financières directement dans le fichier
- **Structure claire** : Sections bien délimitées, faciles à naviguer
- **Git-friendly** : Format texte optimisé pour le versionning
- **Adoption croissante** : Utilisé par Rust, Hugo, et de nombreux projets modernes

### Types de comptes

| Type | Description | Exemples |
|------|-------------|----------|
| **Assets** | Ce que vous possédez | Comptes bancaires, espèces, investissements |
| **Liabilities** | Ce que vous devez | Cartes de crédit, prêts, hypothèques |
| **Income** | Vos revenus | Salaire, bonus, intérêts |
| **Expenses** | Vos dépenses | Alimentation, transport, loisirs |
| **Equity** | Capitaux propres | Soldes d'ouverture, ajustements |

### Équation comptable

**Assets = Liabilities + Equity + (Income - Expenses)**

Cette équation doit toujours être respectée.

### Règle d'or des transactions

Pour chaque transaction : **Σ Débits = Σ Crédits**

Chaque transaction doit être équilibrée dans chaque devise.

## 📖 Comment utiliser cette documentation

### Pour un Product Owner / Chef de projet

1. Lire la [Spécification Fonctionnelle](./SPECIFICATION.md) complète
2. **Étudier les [Epics](./EPICS.md) pour la planification et la roadmap**
3. Parcourir les exemples dans [Format TOML](./TOML-FORMAT.md)
4. Consulter le [fichier d'exemple](./example-data.toml) pour visualiser les données
5. Comprendre les contraintes dans [Règles de validation](./VALIDATION-RULES.md)

### Pour un Développeur Frontend

1. Comprendre les concepts dans [Spécification Fonctionnelle](./SPECIFICATION.md) (sections 2-3)
2. **Étudier l'[Architecture](./ARCHITECTURE.md) (sections 2.1, 7, 4.1) pour la structure des composants**
3. Comprendre les [Epics](./EPICS.md) pour prioriser le développement
4. Étudier le [Format TOML](./TOML-FORMAT.md) pour l'intégration
5. Référencer les [Règles de validation](./VALIDATION-RULES.md) pour l'UX
6. Consulter le [fichier d'exemple](./example-data.toml) pour des cas concrets

### Pour un Développeur Backend / Data

1. **Maîtriser l'[Architecture](./ARCHITECTURE.md) complète (couches, patterns, flux)**
2. Comprendre les [Epics](./EPICS.md) pour la roadmap d'implémentation
3. Implémenter le modèle de domaine (voir ARCHITECTURE.md section 3)
4. Maîtriser le [Format TOML](./TOML-FORMAT.md) dans son intégralité
5. Implémenter toutes les [Règles de validation](./VALIDATION-RULES.md)
6. Choisir un parser TOML approprié (voir TOML-FORMAT.md section 9.2)
7. Référencer la [Spécification Fonctionnelle](./SPECIFICATION.md) pour la logique métier

### Pour un Architecte / Tech Lead

1. **Lire l'[Architecture](./ARCHITECTURE.md) en priorité**
2. Examiner les [Epics](./EPICS.md) pour la planification
3. Valider les [Règles de validation](./VALIDATION-RULES.md) (150+ règles)
4. Comprendre la [Spécification Fonctionnelle](./SPECIFICATION.md)
5. Analyser les décisions architecturales (ADRs dans ARCHITECTURE.md section 12)

### Pour un QA / Testeur

1. Comprendre les fonctionnalités dans [Spécification Fonctionnelle](./SPECIFICATION.md)
2. Créer des cas de test à partir des [Règles de validation](./VALIDATION-RULES.md)
3. Utiliser le [fichier d'exemple](./example-data.toml) et créer des variations

## 🔗 Références externes

### Plain Text Accounting
- [Plain Text Accounting](https://plaintextaccounting.org) - Communauté et ressources
- [Beancount](https://beancount.github.io/) - Outil de référence en Python
- [hledger](https://hledger.org/) - Alternative en Haskell
- [Ledger](https://www.ledger-cli.org/) - L'original en C++

### Comptabilité en partie double
- [Double-entry bookkeeping - Wikipedia](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)
- [Tutorial on multiple currency accounting](https://www.mathstat.dal.ca/~selinger/accounting/tutorial.html)

### Standards
- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- [TOML Specification v1.0.0](https://toml.io/en/v1.0.0)

## 📋 Liste de contrôle d'implémentation

### Phase 1 : MVP (Minimum Viable Product)

- [ ] Parser TOML et chargement du fichier
- [ ] Gestion des comptes (CRUD)
- [ ] Gestion des transactions simples (une devise)
- [ ] Validation de base (équilibre, types)
- [ ] Sauvegarde en TOML
- [ ] Dashboard avec soldes
- [ ] Liste des transactions avec filtres

### Phase 2 : Multi-devises

- [ ] Gestion des devises
- [ ] Transactions multi-devises avec taux de change
- [ ] Conversion automatique pour l'affichage
- [ ] Gestion de l'historique des taux

### Phase 3 : Budgets et rapports

- [ ] Définition de budgets
- [ ] Suivi budget vs. réel
- [ ] Transactions récurrentes
- [ ] Rapports (bilan, compte de résultat)
- [ ] Graphiques d'évolution

### Phase 4 : Avancé

- [ ] Import/Export CSV
- [ ] Validation complète selon toutes les règles
- [ ] Recherche avancée
- [ ] Réconciliation bancaire
- [ ] Performance (optimisation pour gros fichiers)

## 🤝 Contribuer

Cette documentation est vivante et peut être améliorée. Pour toute suggestion:

1. Identifier le document concerné
2. Proposer les modifications
3. Expliquer le rationale
4. Soumettre pour review

## 📄 Licence

Documentation sous licence MIT - voir LICENSE dans le projet principal.

---

**Version de la documentation** : 1.0.0
**Dernière mise à jour** : 2025-01-08
**Auteurs** : Équipe Cashflow Chronicles
