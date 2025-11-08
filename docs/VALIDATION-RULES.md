# Règles de validation et contrôles d'intégrité

## 1. Introduction

Ce document décrit toutes les règles de validation et contrôles d'intégrité qui doivent être implémentés dans **Cashflow Chronicles** pour garantir la cohérence et l'exactitude des données financières.

Les validations sont organisées en plusieurs niveaux:
1. **Validation structurelle** : Format et types de données
2. **Validation métier** : Règles comptables et financières
3. **Validation d'intégrité** : Cohérence globale du fichier

## 2. Validation du fichier JSON

### 2.1 Structure générale

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-FILE-001** | Le fichier doit être un JSON valide | Erreur |
| **V-FILE-002** | L'encodage doit être UTF-8 | Erreur |
| **V-FILE-003** | La propriété `version` doit être présente | Erreur |
| **V-FILE-004** | La version doit suivre le format semver (X.Y.Z) | Erreur |
| **V-FILE-005** | Toutes les propriétés racine requises doivent être présentes | Erreur |

### 2.2 Propriétés racine requises

```
version, metadata, currencies, accounts, transactions, budgets, recurringTransactions
```

## 3. Validation des métadonnées

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-META-001** | `created` doit être une date ISO 8601 valide | Erreur |
| **V-META-002** | `lastModified` doit être une date ISO 8601 valide | Erreur |
| **V-META-003** | `lastModified` >= `created` | Erreur |
| **V-META-004** | `defaultCurrency` doit être un code ISO 4217 valide | Erreur |
| **V-META-005** | `defaultCurrency` doit exister dans la liste des devises | Erreur |

## 4. Validation des devises

### 4.1 Structure de base

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-CUR-001** | `code` doit être un code ISO 4217 (3 lettres majuscules) | Erreur |
| **V-CUR-002** | `code` doit être unique dans la liste | Erreur |
| **V-CUR-003** | `name` ne peut pas être vide | Erreur |
| **V-CUR-004** | `symbol` ne peut pas être vide | Erreur |
| **V-CUR-005** | `decimalPlaces` doit être >= 0 et <= 8 | Erreur |
| **V-CUR-006** | Une et une seule devise doit avoir `isDefault: true` | Erreur |
| **V-CUR-007** | La devise par défaut doit correspondre à `metadata.defaultCurrency` | Erreur |

### 4.2 Taux de change

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-CUR-008** | `date` doit être au format YYYY-MM-DD | Erreur |
| **V-CUR-009** | `rate` doit être > 0 | Erreur |
| **V-CUR-010** | `rate` ne peut pas être exactement 1.0 (utiliser la devise par défaut) | Avertissement |
| **V-CUR-011** | Les dates de taux doivent être uniques pour une même devise | Erreur |
| **V-CUR-012** | La devise par défaut ne doit pas avoir de taux de change | Erreur |

## 5. Validation des comptes

### 5.1 Structure de base

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-ACC-001** | `id` doit suivre le format `acc_XXX` (XXX = numéro) | Erreur |
| **V-ACC-002** | `id` doit être unique | Erreur |
| **V-ACC-003** | `name` ne peut pas être vide | Erreur |
| **V-ACC-004** | `name` doit être unique | Erreur |
| **V-ACC-005** | `type` doit être: Assets, Liabilities, Income, Expenses, ou Equity | Erreur |
| **V-ACC-006** | `currency` doit exister dans la liste des devises | Erreur |
| **V-ACC-007** | `opened` doit être au format YYYY-MM-DD | Erreur |
| **V-ACC-008** | Si `closed` est défini, `closed` >= `opened` | Erreur |

### 5.2 Nom hiérarchique

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-ACC-009** | Le nom doit contenir au moins 2 segments séparés par `:` | Erreur |
| **V-ACC-010** | Le premier segment doit correspondre au `type` du compte | Erreur |
| **V-ACC-011** | Aucun segment ne peut être vide | Erreur |
| **V-ACC-012** | Les segments ne doivent contenir que lettres, chiffres, espaces | Avertissement |

Exemples valides:
- ✓ `Assets:Bank:CHF:PostFinance`
- ✓ `Expenses:Food:Restaurants`
- ✗ `Assets` (pas assez de segments)
- ✗ `Income:Salary:` (segment vide)
- ✗ `Expenses:Transport` mais type=Assets (incohérence)

### 5.3 Cohérence du type

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-ACC-013** | Un compte parent doit avoir le même type que ses enfants | Erreur |

Exemple:
```
Assets:Bank:CHF (type: Assets)
  └─ Assets:Bank:CHF:PostFinance (type: Assets) ✓
  └─ Assets:Bank:CHF:UBS (type: Assets) ✓
  └─ Expenses:Bank:CHF:Fees (type: Expenses) ✗
```

## 6. Validation des transactions

### 6.1 Structure de base

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-TXN-001** | `id` doit suivre le format `txn_XXX` | Erreur |
| **V-TXN-002** | `id` doit être unique | Erreur |
| **V-TXN-003** | `date` doit être au format YYYY-MM-DD | Erreur |
| **V-TXN-004** | `description` ne peut pas être vide | Erreur |
| **V-TXN-005** | `postings` doit contenir au moins 2 écritures | Erreur |
| **V-TXN-006** | `date` ne peut pas être dans le futur (> aujourd'hui) | Avertissement |

### 6.2 Validation des postings (écritures)

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-POST-001** | `accountId` doit référencer un compte existant | Erreur |
| **V-POST-002** | `amount` ne peut pas être 0 | Erreur |
| **V-POST-003** | `currency` doit correspondre à la devise du compte | Erreur |
| **V-POST-004** | Le compte référencé ne doit pas être fermé à la date de la transaction | Erreur |
| **V-POST-005** | La date de transaction doit être >= date d'ouverture du compte | Erreur |
| **V-POST-006** | La précision décimale doit respecter `decimalPlaces` de la devise | Avertissement |

### 6.3 Équilibre de la transaction (Règle d'or)

**Principe fondamental** : Pour chaque devise, la somme de tous les montants doit être 0.

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-BAL-001** | Pour chaque devise présente, Σ montants = 0 (tolérance: ±0.01) | Erreur |
| **V-BAL-002** | Si plusieurs devises, des `exchangeRate` doivent être définis | Erreur |
| **V-BAL-003** | Les conversions doivent s'équilibrer dans toutes les devises | Erreur |

#### Exemples d'équilibre

**Transaction simple (une devise):**
```json
{
  "postings": [
    { "accountId": "acc_001", "amount": 100, "currency": "CHF" },
    { "accountId": "acc_002", "amount": -100, "currency": "CHF" }
  ]
}
```
✓ CHF: 100 + (-100) = 0

**Transaction multi-comptes (une devise):**
```json
{
  "postings": [
    { "accountId": "acc_001", "amount": 5500, "currency": "CHF" },
    { "accountId": "acc_002", "amount": -5000, "currency": "CHF" },
    { "accountId": "acc_003", "amount": -500, "currency": "CHF" }
  ]
}
```
✓ CHF: 5500 + (-5000) + (-500) = 0

**Transaction avec conversion:**
```json
{
  "postings": [
    {
      "accountId": "acc_eur",
      "amount": 100,
      "currency": "EUR",
      "exchangeRate": {
        "rate": 0.95,
        "baseCurrency": "CHF",
        "quoteCurrency": "EUR",
        "equivalentAmount": 95
      }
    },
    { "accountId": "acc_chf", "amount": -95, "currency": "CHF" }
  ]
}
```
✓ EUR: 100 = 100
✓ CHF: -95 = -95 (équivalent de 100 EUR @ 0.95)

### 6.4 Validation des taux de change

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-FX-001** | `rate` doit être > 0 | Erreur |
| **V-FX-002** | `baseCurrency` doit être la devise par défaut | Erreur |
| **V-FX-003** | `quoteCurrency` doit être la devise du posting | Erreur |
| **V-FX-004** | `equivalentAmount` = `amount` × `rate` (tolérance ±0.01) | Erreur |
| **V-FX-005** | Si taux défini dans `currencies`, il doit être cohérent | Avertissement |

### 6.5 Logique métier

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-LOG-001** | Une transaction Assets→Assets devrait avoir `tags: ["transfer"]` | Avertissement |
| **V-LOG-002** | Une transaction Income→Assets est normale (revenus) | Info |
| **V-LOG-003** | Une transaction Assets→Expenses est normale (dépenses) | Info |
| **V-LOG-004** | Une transaction Income→Expenses est suspecte | Avertissement |
| **V-LOG-005** | Éviter les transactions Equity sauf ouverture/clôture | Avertissement |

## 7. Validation des budgets

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-BUD-001** | `id` doit suivre le format `bud_XXX` | Erreur |
| **V-BUD-002** | `id` doit être unique | Erreur |
| **V-BUD-003** | `name` ne peut pas être vide | Erreur |
| **V-BUD-004** | `accountPattern` doit être valide | Erreur |
| **V-BUD-005** | `period` doit être: daily, weekly, monthly, quarterly, yearly | Erreur |
| **V-BUD-006** | `amount` doit être > 0 | Erreur |
| **V-BUD-007** | `currency` doit exister dans la liste des devises | Erreur |
| **V-BUD-008** | `startDate` doit être au format YYYY-MM-DD | Erreur |
| **V-BUD-009** | Si `endDate` défini, `endDate` >= `startDate` | Erreur |
| **V-BUD-010** | `accountPattern` doit matcher au moins un compte | Avertissement |
| **V-BUD-011** | Les seuils doivent être entre 0 et 1 | Erreur |
| **V-BUD-012** | `warningThreshold` < `criticalThreshold` | Erreur |

### Patterns de comptes valides

- `Expenses:Food:*` : Tous les sous-comptes de Food
- `Expenses:*` : Tous les comptes de dépenses
- `Expenses:Transport:Public:*` : Sous-comptes spécifiques
- `Assets:Bank:CHF:PostFinance` : Compte exact

## 8. Validation des transactions récurrentes

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-REC-001** | `id` doit suivre le format `rec_XXX` | Erreur |
| **V-REC-002** | `id` doit être unique | Erreur |
| **V-REC-003** | `name` ne peut pas être vide | Erreur |
| **V-REC-004** | `frequency` doit être: daily, weekly, monthly, yearly | Erreur |
| **V-REC-005** | Si monthly, `dayOfMonth` doit être entre 1 et 31 | Erreur |
| **V-REC-006** | Si weekly, `dayOfWeek` doit être entre 0 et 6 | Erreur |
| **V-REC-007** | Si yearly, `dayOfYear` doit être au format MM-DD | Erreur |
| **V-REC-008** | `startDate` doit être au format YYYY-MM-DD | Erreur |
| **V-REC-009** | Si `endDate` défini, `endDate` >= `startDate` | Erreur |
| **V-REC-010** | `enabled` doit être un booléen | Erreur |
| **V-REC-011** | Le template doit être une transaction valide | Erreur |
| **V-REC-012** | Le template doit respecter toutes les règles V-TXN-* | Erreur |

## 9. Validation de cohérence globale

### 9.1 Références entre entités

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-REF-001** | Tous les `accountId` dans transactions doivent exister | Erreur |
| **V-REF-002** | Tous les `accountId` dans budgets doivent exister | Erreur |
| **V-REF-003** | Tous les `accountId` dans récurrences doivent exister | Erreur |
| **V-REF-004** | Toutes les devises utilisées doivent être déclarées | Erreur |
| **V-REF-005** | Pas de références circulaires dans la hiérarchie de comptes | Erreur |

### 9.2 Cohérence temporelle

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-TIME-001** | Les transactions doivent être ordonnées par date (recommandé) | Avertissement |
| **V-TIME-002** | Pas de transactions avant `metadata.created` | Avertissement |
| **V-TIME-003** | Les taux de change doivent être <= date de transaction | Erreur |
| **V-TIME-004** | Pour une conversion, un taux doit exister <= date transaction | Erreur |

### 9.3 Doublons

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-DUP-001** | Détecter les transactions en doublon potentiel | Avertissement |

Critères de doublon potentiel:
- Même date
- Même description
- Mêmes montants
- Mêmes comptes

## 10. Validation des soldes de comptes

### 10.1 Calcul des soldes

Le solde d'un compte à une date donnée = Σ de tous les postings jusqu'à cette date.

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-SOL-001** | Le solde d'un compte Assets ne devrait pas être négatif | Avertissement |
| **V-SOL-002** | Le solde d'un compte Liabilities ne devrait pas être positif | Avertissement |
| **V-SOL-003** | Le solde d'un compte Income ne devrait pas être positif | Avertissement |
| **V-SOL-004** | Le solde d'un compte Expenses ne devrait pas être négatif | Avertissement |

Note: Ces règles sont des avertissements car des situations légitimes peuvent les violer temporairement.

### 10.2 Équation comptable fondamentale

**Assets = Liabilities + Equity + (Income - Expenses)**

| Règle | Description | Sévérité |
|-------|-------------|----------|
| **V-EQ-001** | L'équation comptable doit être respectée (tolérance ±0.01) | Erreur |

À tout moment:
```
Σ(Assets) + Σ(Expenses) = Σ(Liabilities) + Σ(Equity) + Σ(Income)
```

## 11. Niveaux de sévérité

### Erreur (Error)
- Violation d'une règle fondamentale
- Le fichier est considéré invalide
- L'application ne doit pas charger le fichier
- Correction obligatoire

### Avertissement (Warning)
- Situation suspecte ou non conventionnelle
- Le fichier reste valide
- L'utilisateur doit être informé
- Correction recommandée

### Info (Info)
- Information utile pour l'utilisateur
- Pas de problème détecté
- Aucune action requise

## 12. Processus de validation

### 12.1 Lors du chargement du fichier

1. Validation structurelle (V-FILE-*)
2. Validation des métadonnées (V-META-*)
3. Validation des devises (V-CUR-*)
4. Validation des comptes (V-ACC-*)
5. Validation des transactions (V-TXN-*, V-POST-*, V-BAL-*, V-FX-*)
6. Validation des budgets (V-BUD-*)
7. Validation des récurrences (V-REC-*)
8. Validation de cohérence globale (V-REF-*, V-TIME-*, V-DUP-*)
9. Validation des soldes et équation comptable (V-SOL-*, V-EQ-*)

### 12.2 Lors de la modification

- Re-validation incrémentale de l'entité modifiée
- Re-validation des contraintes d'intégrité affectées
- Validation de l'équilibre global si transaction ajoutée/modifiée

### 12.3 Rapport de validation

Le rapport doit inclure:
- Nombre total de règles vérifiées
- Nombre d'erreurs, avertissements, infos
- Détail de chaque violation avec:
  - Code de règle (ex: V-TXN-001)
  - Description de la violation
  - Localisation (transaction ID, compte, etc.)
  - Suggestion de correction

Exemple:
```
ERREUR [V-TXN-005]: Transaction txn_042
  → La transaction doit contenir au moins 2 postings (trouvé: 1)
  → Suggestion: Ajouter au moins un posting de contrepartie

AVERTISSEMENT [V-SOL-001]: Compte acc_001 (Assets:Bank:CHF)
  → Le solde est négatif: -150.00 CHF
  → Suggestion: Vérifier les transactions ou ajouter un dépôt
```

## 13. Tests de validation

### 13.1 Cas de test

Chaque règle de validation doit avoir:
- Au moins 1 test qui la viole (doit échouer)
- Au moins 1 test qui la respecte (doit réussir)
- Tests de cas limites

### 13.2 Fichiers de test

Créer des fichiers JSON de test:
- `valid-minimal.json` : Fichier minimal valide
- `valid-complete.json` : Fichier complet avec tous les types d'entités
- `valid-multicurrency.json` : Cas multi-devises complexe
- `invalid-*.json` : Fichiers violant des règles spécifiques

## 14. Performance de validation

### 14.1 Objectifs de performance

- Validation d'un fichier de 1000 transactions : < 100ms
- Validation d'un fichier de 10000 transactions : < 1s
- Validation incrémentale d'une transaction : < 10ms

### 14.2 Optimisations

- Validation en parallèle quand possible
- Indexation des comptes et IDs
- Cache des soldes calculés
- Validation incrémentale pour les modifications

## 15. Interface utilisateur de validation

### 15.1 Affichage en temps réel

- Indicateur visuel de validation (✓ valide, ✗ invalide, ⚠ avertissement)
- Compteur d'erreurs/avertissements
- Messages contextuels à côté des champs en erreur

### 15.2 Correction assistée

- Suggestions de correction automatique
- Bouton "Corriger automatiquement" pour les cas simples
- Wizard pour les cas complexes (ex: équilibrage de transaction)

### 15.3 Mode strict vs. permissif

- **Mode strict** : Toutes les règles activées, pas de sauvegarde si erreurs
- **Mode permissif** : Autoriser la sauvegarde avec avertissements seulement
- Configurable dans les paramètres
