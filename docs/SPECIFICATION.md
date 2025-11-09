# Cashflow Chronicles - Spécification Fonctionnelle

## 1. Vue d'ensemble

**Cashflow Chronicles** est une application de gestion de budget personnel multi-devises basée sur les principes de **Plain Text Accounting** et la **comptabilité en partie double**.

### 1.1 Objectifs

- Gérer un budget personnel avec plusieurs comptes dans différentes devises (CHF, EUR, et autres)
- Suivre toutes les transactions financières avec précision
- Supporter les transferts entre comptes avec conversion de devises
- Fournir une vue claire et vérifiable de la situation financière
- Garantir l'intégrité des données par des règles de validation strictes

### 1.2 Principes de conception

L'application s'inspire de **Plain Text Accounting** (Beancount, Ledger, hledger) et applique les principes suivants:

1. **Comptabilité en partie double** : Chaque transaction affecte au moins deux comptes
2. **Équilibre des transactions** : La somme des débits égale toujours la somme des crédits
3. **Traçabilité** : Toutes les opérations sont enregistrées et auditables
4. **Support multi-devises** : Gestion native des taux de change
5. **Validation stricte** : Contrôles d'intégrité à tous les niveaux

## 2. Concepts fondamentaux

### 2.1 Comptabilité en partie double (Double-Entry Bookkeeping)

Chaque transaction financière est enregistrée dans au moins deux comptes :
- Un compte est **débité** (argent qui sort ou actif qui augmente)
- Un autre compte est **crédité** (argent qui entre ou passif qui augmente)

**Règle d'or** : `Σ Débits = Σ Crédits`

### 2.2 Types de comptes

L'application utilise 5 types de comptes principaux:

| Type | Description | Solde normal | Exemples |
|------|-------------|--------------|----------|
| **Assets** (Actifs) | Ce que vous possédez | Débit | Compte bancaire, espèces, investissements |
| **Liabilities** (Passifs) | Ce que vous devez | Crédit | Carte de crédit, prêt, hypothèque |
| **Income** (Revenus) | Sources de revenus | Crédit | Salaire, bonus, intérêts |
| **Expenses** (Dépenses) | Où va votre argent | Débit | Alimentation, transport, loisirs |
| **Equity** (Capitaux propres) | Valeur nette, soldes initiaux | Crédit | Solde d'ouverture, ajustements |

### 2.3 Structure hiérarchique des comptes

Les comptes sont organisés de manière hiérarchique avec la notation par points:

```
Assets:Bank:CHF:PostFinance
Assets:Bank:EUR:Revolut
Assets:Cash:CHF
Expenses:Food:Groceries
Expenses:Food:Restaurants
Income:Salary:NetPay
Liabilities:CreditCard:Visa
Equity:OpeningBalances
```

### 2.4 Devises

L'application supporte plusieurs devises simultanément:
- **CHF** (Franc suisse) - devise principale
- **EUR** (Euro)
- **USD** (Dollar américain)
- Et autres selon les besoins

Chaque compte a une **devise de base** dans laquelle son solde est exprimé.

### 2.5 Taux de change

Pour les transactions impliquant plusieurs devises, un **taux de change** doit être spécifié:

```
100 EUR @ 0.95 CHF/EUR = 95 CHF
```

Signifie: 100 EUR valent 95 CHF (taux de 0.95 CHF par EUR)

## 3. Fonctionnalités principales

### 3.1 Gestion des comptes

#### Création de compte
- Nom hiérarchique unique
- Type de compte (Assets, Liabilities, Income, Expenses, Equity)
- Devise de base
- Date d'ouverture
- Description (optionnelle)

#### Visualisation
- Liste de tous les comptes par type
- Solde actuel dans la devise du compte
- Historique des transactions
- Solde équivalent dans la devise de référence (CHF)

### 3.2 Transactions

#### Transactions simples (une devise)
```
Date: 2025-01-15
Description: Courses au supermarché
  Expenses:Food:Groceries     120.50 CHF
  Assets:Bank:CHF:PostFinance  -120.50 CHF
```

#### Transactions multi-comptes
```
Date: 2025-01-20
Description: Paiement salaire
  Assets:Bank:CHF:PostFinance   5500.00 CHF
  Income:Salary:NetPay         -5000.00 CHF
  Income:Bonus                  -500.00 CHF
```

#### Transferts avec conversion de devises
```
Date: 2025-01-25
Description: Transfert CHF vers EUR
  Assets:Bank:EUR:Revolut        100.00 EUR @ 0.95 CHF/EUR
  Assets:Bank:CHF:PostFinance    -95.00 CHF
  Expenses:Banking:FXFees         -0.50 CHF
```

### 3.3 Transactions récurrentes

Support des transactions automatiques:
- Fréquence (quotidienne, hebdomadaire, mensuelle, annuelle)
- Date de début et de fin
- Modèle de transaction à répéter

Exemples:
- Salaire mensuel
- Loyer mensuel
- Abonnements

### 3.4 Budgets

Définition de budgets par catégorie de dépenses:
- Période (mensuelle, trimestrielle, annuelle)
- Catégorie de compte (ex: Expenses:Food)
- Montant alloué
- Suivi du budget vs. réel

### 3.5 Rapports et visualisations

#### Bilan (Balance Sheet)
- Vue d'ensemble de tous les actifs et passifs
- Valeur nette (Assets - Liabilities)
- Conversion dans la devise de référence

#### Compte de résultat (Income Statement)
- Total des revenus par catégorie
- Total des dépenses par catégorie
- Solde (Income - Expenses)
- Sur une période donnée

#### Évolution temporelle
- Graphiques d'évolution du solde par compte
- Évolution de la valeur nette
- Tendances de dépenses par catégorie

#### Analyse multi-devises
- Exposition par devise
- Impact des variations de change
- Historique des taux utilisés

### 3.6 Import/Export

#### Import
- Import de transactions depuis CSV
- Mapping des colonnes
- Détection des doublons

#### Export
- Export en TOML (format natif)
- Export en CSV pour analyse externe
- Export en format Beancount/Ledger (optionnel)

## 4. Interface utilisateur

### 4.1 Pages principales

1. **Dashboard**
   - Vue d'ensemble de la situation financière
   - Solde total par devise
   - Graphiques de synthèse
   - Transactions récentes

2. **Comptes**
   - Liste de tous les comptes
   - Filtrage par type et devise
   - Création/modification de comptes

3. **Transactions**
   - Liste de toutes les transactions
   - Filtrage par période, compte, catégorie
   - Création/modification de transactions
   - Recherche

4. **Budgets**
   - Vue des budgets définis
   - Progression vs. objectifs
   - Alertes de dépassement

5. **Rapports**
   - Génération de rapports personnalisés
   - Graphiques et analyses
   - Export de données

6. **Paramètres**
   - Configuration de l'application
   - Gestion des devises et taux de change
   - Import/Export de données
   - Préférences utilisateur

### 4.2 Principes UX

- Interface claire et épurée
- Validation en temps réel
- Messages d'erreur explicites
- Responsive design (mobile-first)
- Raccourcis clavier pour les power users
- Confirmation pour les opérations critiques

## 5. Contraintes techniques

### 5.1 Stack technique

- **Frontend**: SvelteKit
- **Stockage**: Fichier TOML local
- **Déploiement**: Application web statique

### 5.2 Format de données

- Toutes les données sont stockées dans un fichier TOML
- Format texte lisible et éditable manuellement
- Support des commentaires pour annotations
- Structure versionnable (compatible Git)
- Validation stricte du schéma
- Sauvegardes automatiques

**Pourquoi TOML ?**
- Plus lisible que JSON pour l'édition manuelle
- Support natif des commentaires
- Syntaxe minimale et claire
- Parfaitement aligné avec l'esprit Plain Text Accounting
- Format utilisé par de nombreux outils modernes (Rust, Hugo, etc.)

### 5.3 Performance

- Chargement rapide du fichier TOML (< 1s pour 10 000 transactions)
- Calculs de soldes optimisés
- Mise en cache des agrégations

## 6. Sécurité et intégrité

### 6.1 Validation des données

- Vérification de l'équilibre de chaque transaction
- Validation des types de comptes
- Contrôle des devises et montants
- Détection des références circulaires

### 6.2 Sauvegarde

- Sauvegarde automatique à chaque modification
- Historique des versions (optionnel)
- Export manuel recommandé régulièrement

### 6.3 Confidentialité

- Données stockées localement uniquement
- Pas d'envoi vers des serveurs externes
- Chiffrement optionnel du fichier TOML

## 7. Évolutions futures

### 7.1 Roadmap v1.0 (Phases 1-4)

**Couvert par les Epics** :
- ✅ Multi-devises et taux de change (Phase 2)
- ✅ Budgets et rapports (Phase 3)
- ✅ Transactions récurrentes (Phase 3)
- ✅ Import/Export CSV (Phase 4)
- ✅ Réconciliation bancaire (Phase 4)
- ✅ Performance et optimisation (Phase 4)

### 7.2 Hors scope v1.0 (Futures versions)

Les fonctionnalités suivantes sont **reportées** à des versions ultérieures :

**v2.0 - Collaboration** :
- Support des pièces jointes (reçus, factures) - `EPIC-023`
- Multi-utilisateurs / partage de budgets - `EPIC-024`
- Synchronisation cloud optionnelle - `EPIC-025`

**v2.1 - Mobile** :
- Application mobile native (iOS/Android) - `EPIC-026`
- Mode hors ligne avec sync

**v3.0 - Intelligence** :
- OCR pour extraction automatique des données de reçus
- Catégorisation automatique par IA
- Prévisions et recommandations budgétaires
- Intégration avec des APIs bancaires (Open Banking)

**Note** : Ces fonctionnalités avancées ne sont pas planifiées pour v1.0 afin de maintenir un scope réaliste. Elles pourront être ajoutées dans des versions futures selon les retours utilisateurs.

## 8. Glossaire

- **Débit** : Augmentation d'un actif ou d'une dépense, diminution d'un passif ou d'un revenu
- **Crédit** : Augmentation d'un passif ou d'un revenu, diminution d'un actif ou d'une dépense
- **Posting** : Une ligne dans une transaction (ex: "Assets:Bank 100 CHF")
- **Transaction** : Ensemble de postings équilibrés
- **Taux de change** : Prix d'une devise exprimé en une autre (ex: 1 EUR = 0.95 CHF)
- **Solde** : Somme des montants pour un compte à une date donnée
