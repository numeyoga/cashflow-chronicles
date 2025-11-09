# Format de fichier TOML - Cashflow Chronicles

## 1. Structure générale

Le fichier TOML contient toutes les données de l'application organisées en sections claires et lisibles.

```toml
version = "1.0.0"

[metadata]
created = "2025-01-01T00:00:00Z"
lastModified = "2025-01-15T14:30:00Z"
defaultCurrency = "CHF"
owner = "John Doe"
description = "Budget personnel 2025"

[[currency]]
# Devises...

[[account]]
# Comptes...

[[transaction]]
# Transactions...

[[budget]]
# Budgets...

[[recurring]]
# Transactions récurrentes...
```

## 2. Métadonnées (metadata)

Informations générales sur le fichier de données.

```toml
[metadata]
created = "2025-01-01T00:00:00Z"
lastModified = "2025-01-15T14:30:00Z"
defaultCurrency = "CHF"
owner = "John Doe"
description = "Budget personnel 2025"
```

### Propriétés

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `created` | datetime | Oui | Date de création du fichier (ISO 8601) |
| `lastModified` | datetime | Oui | Dernière modification (ISO 8601) |
| `defaultCurrency` | string | Oui | Devise de référence (code ISO 4217) |
| `owner` | string | Non | Nom du propriétaire |
| `description` | string | Non | Description du fichier |

## 3. Devises (currency)

Liste des devises utilisées dans l'application avec leurs taux de change historiques.

```toml
# Devise par défaut (CHF)
[[currency]]
code = "CHF"
name = "Swiss Franc"
symbol = "CHF"
decimalPlaces = 2
isDefault = true

# Euro avec historique de taux
[[currency]]
code = "EUR"
name = "Euro"
symbol = "€"
decimalPlaces = 2

  [[currency.exchangeRate]]
  date = "2025-01-15"
  rate = 0.95
  source = "manual"

  [[currency.exchangeRate]]
  date = "2025-01-20"
  rate = 0.94
  source = "manual"

# Dollar américain
[[currency]]
code = "USD"
name = "US Dollar"
symbol = "$"
decimalPlaces = 2

  [[currency.exchangeRate]]
  date = "2025-01-15"
  rate = 0.88
  source = "manual"
```

### Propriétés de devise

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `code` | string | Oui | Code ISO 4217 (CHF, EUR, USD, etc.) |
| `name` | string | Oui | Nom complet de la devise |
| `symbol` | string | Oui | Symbole de la devise |
| `decimalPlaces` | integer | Oui | Nombre de décimales (généralement 2) |
| `isDefault` | boolean | Non | True si c'est la devise de référence |
| `exchangeRate` | array | Non | Historique des taux de change |

### Propriétés de taux de change

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `date` | date | Oui | Date du taux (YYYY-MM-DD) |
| `rate` | float | Oui | Taux de change vers la devise par défaut |
| `source` | string | Non | Source du taux (manual, api, etc.) |

## 4. Comptes (account)

Tous les comptes organisés par type selon les principes de comptabilité en partie double.

```toml
# Compte bancaire principal en CHF
[[account]]
id = "acc_001"
name = "Assets:Bank:CHF:PostFinance"
type = "Assets"
currency = "CHF"
opened = "2024-01-01"
description = "Compte bancaire principal PostFinance"

  [account.metadata]
  iban = "CH93 0076 2011 6238 5295 7"
  institution = "PostFinance"

# Compte Revolut en EUR
[[account]]
id = "acc_002"
name = "Assets:Bank:EUR:Revolut"
type = "Assets"
currency = "EUR"
opened = "2024-06-15"
description = "Compte Revolut en euros"

# Compte de dépenses
[[account]]
id = "acc_003"
name = "Expenses:Food:Groceries"
type = "Expenses"
currency = "CHF"
opened = "2024-01-01"
description = "Courses alimentaires"

# Compte de revenus
[[account]]
id = "acc_004"
name = "Income:Salary:NetPay"
type = "Income"
currency = "CHF"
opened = "2024-01-01"
description = "Salaire net"

# Compte de passif
[[account]]
id = "acc_005"
name = "Liabilities:CreditCard:Visa"
type = "Liabilities"
currency = "CHF"
opened = "2024-01-01"
description = "Carte de crédit Visa"

# Compte d'équité
[[account]]
id = "acc_006"
name = "Equity:OpeningBalances"
type = "Equity"
currency = "CHF"
opened = "2024-01-01"
description = "Soldes d'ouverture"
```

### Propriétés de compte

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `acc_XXX`) |
| `name` | string | Oui | Nom hiérarchique unique (séparé par `:`) |
| `type` | string | Oui | Type: `Assets`, `Liabilities`, `Income`, `Expenses`, `Equity` |
| `currency` | string | Oui | Code de devise ISO 4217 |
| `opened` | date | Oui | Date d'ouverture (YYYY-MM-DD) |
| `closed` | date | Non | Date de clôture (absente si actif) |
| `description` | string | Non | Description du compte |
| `metadata` | table | Non | Métadonnées supplémentaires |

### Règles de nommage des comptes

- Format hiérarchique avec `:` comme séparateur
- Structure: `Type:Category:Subcategory:...:Name`
- Exemples:
  - `Assets:Bank:CHF:PostFinance`
  - `Expenses:Food:Restaurants:FastFood`
  - `Income:Salary:NetPay`

## 5. Transactions

Enregistrements de toutes les opérations financières.

### Transaction simple (une devise)

```toml
[[transaction]]
id = "txn_001"
date = "2025-01-15"
description = "Courses au supermarché Migros"
payee = "Migros"
tags = ["groceries", "food"]

  [[transaction.posting]]
  accountId = "acc_003"
  amount = 120.50
  currency = "CHF"

  [[transaction.posting]]
  accountId = "acc_001"
  amount = -120.50
  currency = "CHF"

  [transaction.metadata]
  location = "Lausanne"
  receiptId = "REC_2025_001"
```

### Transaction multi-comptes

```toml
[[transaction]]
id = "txn_002"
date = "2025-01-25"
description = "Salaire janvier 2025"
payee = "Employeur SA"
tags = ["salary", "income"]

  [[transaction.posting]]
  accountId = "acc_001"
  amount = 5500.00
  currency = "CHF"

  [[transaction.posting]]
  accountId = "acc_004"
  amount = -5000.00
  currency = "CHF"
  comment = "Salaire net"

  [[transaction.posting]]
  accountId = "acc_005"
  amount = -500.00
  currency = "CHF"
  comment = "Prime de performance"
```

### Transaction avec conversion de devises

```toml
[[transaction]]
id = "txn_003"
date = "2025-01-25"
description = "Transfert CHF vers EUR"
tags = ["transfer", "fx"]

  # Crédit du compte EUR
  [[transaction.posting]]
  accountId = "acc_002"
  amount = 100.00
  currency = "EUR"

    # Taux de change pour la conversion
    [transaction.posting.exchangeRate]
    # IMPORTANT: Ce taux exprime la conversion EUR → CHF
    # Formule: equivalentAmount (CHF) = amount (EUR) × rate
    # Exemple: 95.00 CHF = 100.00 EUR × 0.95
    rate = 0.95                    # 1 EUR = 0.95 CHF (taux du marché)
    baseCurrency = "CHF"           # Devise de référence du système
    quoteCurrency = "EUR"          # Devise de la transaction
    equivalentAmount = 95.00       # Montant équivalent en CHF

  # Débit du compte CHF (équivalent de 100 EUR)
  [[transaction.posting]]
  accountId = "acc_001"
  amount = -95.00
  currency = "CHF"

  # Frais de change (optionnel)
  [[transaction.posting]]
  accountId = "acc_007"  # Compte Expenses:Banking:FXFees
  amount = 0.50
  currency = "CHF"
  comment = "Frais de change"

  [[transaction.posting]]
  accountId = "acc_001"
  amount = -0.50
  currency = "CHF"
```

**Vérification de l'équilibre** :
- EUR: 100.00 = 100.00 ✓
- CHF: -95.00 + 0.50 - 0.50 = -95.00 (équivalent de 100 EUR @ 0.95) ✓

### Transaction d'ouverture

```toml
[[transaction]]
id = "txn_004"
date = "2025-01-01"
description = "Solde d'ouverture PostFinance"
tags = ["opening"]

  [[transaction.posting]]
  accountId = "acc_001"
  amount = 5000.00
  currency = "CHF"

  [[transaction.posting]]
  accountId = "acc_006"
  amount = -5000.00
  currency = "CHF"
```

### Propriétés de transaction

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `txn_XXX`) |
| `date` | date | Oui | Date de la transaction (YYYY-MM-DD) |
| `description` | string | Oui | Description de la transaction |
| `payee` | string | Non | Bénéficiaire/payeur |
| `tags` | array[string] | Non | Étiquettes pour catégorisation |
| `posting` | array | Oui | Liste des écritures (min 2) |
| `metadata` | table | Non | Métadonnées supplémentaires |

### Propriétés de posting (écriture)

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `accountId` | string | Oui | ID du compte concerné |
| `amount` | float | Oui | Montant (positif = débit, négatif = crédit) |
| `currency` | string | Oui | Code de devise |
| `exchangeRate` | table | Non | Taux de change si conversion |
| `comment` | string | Non | Commentaire sur cette écriture |

### Propriétés de taux de change dans posting

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `rate` | float | Oui | Taux de change appliqué |
| `baseCurrency` | string | Oui | Devise de base |
| `quoteCurrency` | string | Oui | Devise cotée |
| `equivalentAmount` | float | Oui | Montant équivalent dans la devise de base |

### Règles de validation des transactions

1. **Équilibre** : La somme de tous les postings doit être 0 dans chaque devise
2. **Minimum de postings** : Au moins 2 postings par transaction
3. **Cohérence des devises** : Chaque posting doit utiliser la devise de son compte
4. **Taux de change** : Obligatoire si conversion entre devises
5. **Dates valides** : La date doit être >= date d'ouverture des comptes

## 6. Budgets

Définition des budgets par catégorie.

```toml
# Budget mensuel pour l'alimentation
[[budget]]
id = "bud_001"
name = "Alimentation mensuelle"
accountPattern = "Expenses:Food:*"
period = "monthly"
amount = 800.00
currency = "CHF"
startDate = "2025-01-01"

  [budget.alerts]
  warningThreshold = 0.80
  criticalThreshold = 0.95

# Budget annuel pour le transport
[[budget]]
id = "bud_002"
name = "Transport annuel"
accountPattern = "Expenses:Transport:*"
period = "yearly"
amount = 3000.00
currency = "CHF"
startDate = "2025-01-01"
endDate = "2025-12-31"
```

### Propriétés de budget

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `bud_XXX`) |
| `name` | string | Oui | Nom du budget |
| `accountPattern` | string | Oui | Pattern de compte (supporte `*` wildcard) |
| `period` | string | Oui | Période: `daily`, `weekly`, `monthly`, `quarterly`, `yearly` |
| `amount` | float | Oui | Montant alloué |
| `currency` | string | Oui | Code de devise |
| `startDate` | date | Oui | Date de début (YYYY-MM-DD) |
| `endDate` | date | Non | Date de fin (absente = indéfini) |
| `alerts` | table | Non | Seuils d'alerte |

## 7. Transactions récurrentes

Modèles de transactions qui se répètent automatiquement.

```toml
# Salaire mensuel
[[recurring]]
id = "rec_001"
name = "Salaire mensuel"
frequency = "monthly"
dayOfMonth = 25
startDate = "2025-01-25"
enabled = true

  [recurring.template]
  description = "Salaire {{month}} {{year}}"
  payee = "Employeur SA"
  tags = ["salary", "income"]

    [[recurring.template.posting]]
    accountId = "acc_001"
    amount = 5500.00
    currency = "CHF"

    [[recurring.template.posting]]
    accountId = "acc_004"
    amount = -5500.00
    currency = "CHF"

# Loyer mensuel
[[recurring]]
id = "rec_002"
name = "Loyer mensuel"
frequency = "monthly"
dayOfMonth = 1
startDate = "2024-01-01"
enabled = true

  [recurring.template]
  description = "Loyer {{month}} {{year}}"
  payee = "Régie immobilière"
  tags = ["rent", "housing"]

    [[recurring.template.posting]]
    accountId = "acc_008"
    amount = 1500.00
    currency = "CHF"

    [[recurring.template.posting]]
    accountId = "acc_001"
    amount = -1500.00
    currency = "CHF"

# Abonnement hebdomadaire
[[recurring]]
id = "rec_003"
name = "Cours de yoga"
frequency = "weekly"
dayOfWeek = 3  # Mercredi (ISO 8601: 1=Lundi, 2=Mardi, 3=Mercredi, ..., 7=Dimanche)
startDate = "2025-01-08"
endDate = "2025-06-30"
enabled = true

  [recurring.template]
  description = "Cours de yoga"
  payee = "Studio Yoga"
  tags = ["sport", "health"]

    [[recurring.template.posting]]
    accountId = "acc_009"
    amount = 25.00
    currency = "CHF"

    [[recurring.template.posting]]
    accountId = "acc_001"
    amount = -25.00
    currency = "CHF"
```

**IMPORTANT - Convention dayOfWeek** : Ce système utilise ISO 8601
- 1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi, 6 = Samedi, 7 = Dimanche
- ⚠️ **Différent de JavaScript** (0=Dimanche) et Python (0=Lundi)

### Propriétés de transaction récurrente

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `rec_XXX`) |
| `name` | string | Oui | Nom de la récurrence |
| `frequency` | string | Oui | Fréquence: `daily`, `weekly`, `monthly`, `yearly` |
| `dayOfMonth` | integer | Conditionnel | Jour du mois (1-31) si monthly |
| `dayOfWeek` | integer | Conditionnel | Jour de semaine (0-6, 0=Lundi) si weekly |
| `dayOfYear` | string | Conditionnel | MM-DD si yearly |
| `startDate` | date | Oui | Date de début (YYYY-MM-DD) |
| `endDate` | date | Non | Date de fin (absente = indéfini) |
| `enabled` | boolean | Oui | Active/désactive la récurrence |
| `template` | table | Oui | Modèle de transaction |

### Variables de template

Les descriptions peuvent contenir des variables:
- `{{date}}` : Date au format YYYY-MM-DD
- `{{day}}` : Jour
- `{{month}}` : Mois
- `{{year}}` : Année
- `{{monthName}}` : Nom du mois

## 8. Exemple complet de fichier

```toml
version = "1.0.0"

[metadata]
created = "2025-01-01T00:00:00Z"
lastModified = "2025-01-15T14:30:00Z"
defaultCurrency = "CHF"
owner = "John Doe"

# Devises
[[currency]]
code = "CHF"
name = "Swiss Franc"
symbol = "CHF"
decimalPlaces = 2
isDefault = true

[[currency]]
code = "EUR"
name = "Euro"
symbol = "€"
decimalPlaces = 2

  [[currency.exchangeRate]]
  date = "2025-01-15"
  rate = 0.95
  source = "manual"

# Comptes
[[account]]
id = "acc_001"
name = "Assets:Bank:CHF:PostFinance"
type = "Assets"
currency = "CHF"
opened = "2024-01-01"
description = "Compte bancaire principal"

[[account]]
id = "acc_002"
name = "Expenses:Food:Groceries"
type = "Expenses"
currency = "CHF"
opened = "2024-01-01"

[[account]]
id = "acc_003"
name = "Equity:OpeningBalances"
type = "Equity"
currency = "CHF"
opened = "2024-01-01"

# Transactions
[[transaction]]
id = "txn_001"
date = "2025-01-01"
description = "Solde d'ouverture"

  [[transaction.posting]]
  accountId = "acc_001"
  amount = 5000.00
  currency = "CHF"

  [[transaction.posting]]
  accountId = "acc_003"
  amount = -5000.00
  currency = "CHF"

[[transaction]]
id = "txn_002"
date = "2025-01-15"
description = "Courses"
payee = "Migros"
tags = ["groceries"]

  [[transaction.posting]]
  accountId = "acc_002"
  amount = 120.50
  currency = "CHF"

  [[transaction.posting]]
  accountId = "acc_001"
  amount = -120.50
  currency = "CHF"

# Budgets
[[budget]]
id = "bud_001"
name = "Alimentation mensuelle"
accountPattern = "Expenses:Food:*"
period = "monthly"
amount = 600.00
currency = "CHF"
startDate = "2025-01-01"

# Transactions récurrentes
[[recurring]]
id = "rec_001"
name = "Salaire mensuel"
frequency = "monthly"
dayOfMonth = 25
startDate = "2025-01-25"
enabled = true

  [recurring.template]
  description = "Salaire {{month}} {{year}}"
  payee = "Employeur SA"
  tags = ["salary"]

    [[recurring.template.posting]]
    accountId = "acc_001"
    amount = 5500.00
    currency = "CHF"

    [[recurring.template.posting]]
    accountId = "acc_004"
    amount = -5500.00
    currency = "CHF"
```

## 9. Validation du format TOML

### 9.1 Syntaxe TOML

Le fichier doit respecter la spécification TOML v1.0.0:
- [Spécification TOML](https://toml.io/en/v1.0.0)

### 9.2 Parsers recommandés (2025)

**JavaScript/TypeScript** (recommandé pour ce projet) :
- **`smol-toml`** ⭐ (Recommandé) - Moderne, léger, maintenu activement
  - NPM: `npm install smol-toml`
  - Taille: ~6KB minified
  - Supporte TOML v1.0.0

- **`@ltd/j-toml`** (Alternative solide)
  - NPM: `npm install @ltd/j-toml`
  - Feature-complete, bien maintenu
  - Supporte TOML v1.0.0

- ~~`@iarna/toml`~~ ❌ **DÉPRÉCIÉ** - Archivé depuis 2020, ne plus utiliser

**Autres langages** :
- **Python** : `tomli` (lecture), `tomli-w` (écriture) - Standard depuis Python 3.11
- **Rust** : `toml` crate (officiel)
- **Go** : `github.com/BurntSushi/toml` (officiel)

**Note importante** : Toujours vérifier que le parser supporte la **spécification TOML v1.0.0** complète.

### 9.3 Validation du schéma

Un schéma de validation sera fourni pour vérifier:
- Structure des sections
- Types de données
- Contraintes de valeurs
- Relations entre entités

## 10. Avantages de TOML

### 10.1 Lisibilité

```toml
# TOML - Clair et lisible
[[transaction]]
id = "txn_001"
date = "2025-01-15"
description = "Courses"
tags = ["groceries", "food"]
```

vs.

```json
// JSON - Moins lisible, pas de commentaires
{
  "id": "txn_001",
  "date": "2025-01-15",
  "description": "Courses",
  "tags": ["groceries", "food"]
}
```

### 10.2 Commentaires

TOML supporte les commentaires, ce qui permet d'annoter les données:

```toml
# Budget alimentaire ajusté après analyse des 6 derniers mois
[[budget]]
id = "bud_001"
name = "Alimentation mensuelle"
amount = 800.00  # Augmenté de 600 -> 800 en février
```

### 10.3 Édition manuelle

- Syntaxe plus naturelle pour l'édition manuelle
- Pas de virgules à gérer
- Pas de guillemets systématiques
- Structure en sections claires

### 10.4 Versionning Git

- Format texte diff-friendly
- Commentaires pour documenter les changements
- Chaque section sur plusieurs lignes

## 11. Notes techniques

### 11.1 Identifiants

Tous les identifiants suivent le format: `{type}_{number}`
- Comptes: `acc_001`, `acc_002`, ...
- Transactions: `txn_001`, `txn_002`, ...
- Budgets: `bud_001`, `bud_002`, ...
- Récurrences: `rec_001`, `rec_002`, ...

Les numéros doivent être uniques et croissants.

### 11.2 Dates et timestamps

- **Dates simples** : `YYYY-MM-DD` (ex: `2025-01-15`)
- **Timestamps** : RFC 3339 / ISO 8601 (ex: `2025-01-15T14:30:00Z`)

### 11.3 Montants

- Type: `float` (nombre décimal)
- Précision: selon `decimalPlaces` de la devise
- Convention de signe:
  - Positif = débit (augmente Assets/Expenses)
  - Négatif = crédit (augmente Liabilities/Income/Equity)

### 11.4 Devises

- Codes: ISO 4217 (3 lettres majuscules)
- Exemples: CHF, EUR, USD, GBP, JPY

### 11.5 Encodage

- UTF-8 obligatoire
- Indentation: 2 espaces recommandés
- Pas de BOM (Byte Order Mark)

### 11.6 Arrays de tables

TOML utilise `[[section]]` pour définir des arrays d'objets:

```toml
# Premier élément du array
[[transaction]]
id = "txn_001"
# ...

# Deuxième élément du array
[[transaction]]
id = "txn_002"
# ...
```

### 11.7 Tables imbriquées

Pour les sous-objets, utiliser la notation pointée:

```toml
[[transaction]]
id = "txn_001"

  # Table imbriquée
  [transaction.metadata]
  location = "Lausanne"

  # Array de tables imbriqué
  [[transaction.posting]]
  accountId = "acc_001"
  amount = 100.00
```
