# Format de fichier JSON - Cashflow Chronicles

## 1. Structure générale

Le fichier JSON contient toutes les données de l'application dans un objet racine avec les propriétés suivantes:

```json
{
  "version": "1.0.0",
  "metadata": { ... },
  "currencies": [ ... ],
  "accounts": [ ... ],
  "transactions": [ ... ],
  "budgets": [ ... ],
  "recurringTransactions": [ ... ]
}
```

## 2. Métadonnées (metadata)

Informations générales sur le fichier de données.

```json
{
  "metadata": {
    "created": "2025-01-01T00:00:00.000Z",
    "lastModified": "2025-01-15T14:30:00.000Z",
    "defaultCurrency": "CHF",
    "owner": "John Doe",
    "description": "Budget personnel 2025"
  }
}
```

### Propriétés

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `created` | string (ISO 8601) | Oui | Date de création du fichier |
| `lastModified` | string (ISO 8601) | Oui | Dernière modification |
| `defaultCurrency` | string | Oui | Devise de référence (code ISO 4217) |
| `owner` | string | Non | Nom du propriétaire |
| `description` | string | Non | Description du fichier |

## 3. Devises (currencies)

Liste des devises utilisées dans l'application avec leurs taux de change historiques.

```json
{
  "currencies": [
    {
      "code": "CHF",
      "name": "Swiss Franc",
      "symbol": "CHF",
      "decimalPlaces": 2,
      "isDefault": true
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "decimalPlaces": 2,
      "exchangeRates": [
        {
          "date": "2025-01-15",
          "rate": 0.95,
          "source": "manual"
        }
      ]
    },
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "decimalPlaces": 2,
      "exchangeRates": [
        {
          "date": "2025-01-15",
          "rate": 0.88,
          "source": "manual"
        }
      ]
    }
  ]
}
```

### Propriétés de devise

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `code` | string | Oui | Code ISO 4217 (CHF, EUR, USD, etc.) |
| `name` | string | Oui | Nom complet de la devise |
| `symbol` | string | Oui | Symbole de la devise |
| `decimalPlaces` | number | Oui | Nombre de décimales (généralement 2) |
| `isDefault` | boolean | Non | True si c'est la devise de référence |
| `exchangeRates` | array | Non | Historique des taux de change |

### Propriétés de taux de change

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `date` | string (YYYY-MM-DD) | Oui | Date du taux |
| `rate` | number | Oui | Taux de change vers la devise par défaut |
| `source` | string | Non | Source du taux (manual, api, etc.) |

## 4. Comptes (accounts)

Tous les comptes organisés par type selon les principes de comptabilité en partie double.

```json
{
  "accounts": [
    {
      "id": "acc_001",
      "name": "Assets:Bank:CHF:PostFinance",
      "type": "Assets",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Compte bancaire principal PostFinance",
      "metadata": {
        "iban": "CH93 0076 2011 6238 5295 7",
        "institution": "PostFinance"
      }
    },
    {
      "id": "acc_002",
      "name": "Assets:Bank:EUR:Revolut",
      "type": "Assets",
      "currency": "EUR",
      "opened": "2024-06-15",
      "closed": null,
      "description": "Compte Revolut en euros"
    },
    {
      "id": "acc_003",
      "name": "Expenses:Food:Groceries",
      "type": "Expenses",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Courses alimentaires"
    },
    {
      "id": "acc_004",
      "name": "Income:Salary:NetPay",
      "type": "Income",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Salaire net"
    },
    {
      "id": "acc_005",
      "name": "Liabilities:CreditCard:Visa",
      "type": "Liabilities",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Carte de crédit Visa"
    },
    {
      "id": "acc_006",
      "name": "Equity:OpeningBalances",
      "type": "Equity",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Soldes d'ouverture"
    }
  ]
}
```

### Propriétés de compte

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `acc_XXX`) |
| `name` | string | Oui | Nom hiérarchique unique (séparé par `:`) |
| `type` | string | Oui | Type: `Assets`, `Liabilities`, `Income`, `Expenses`, `Equity` |
| `currency` | string | Oui | Code de devise ISO 4217 |
| `opened` | string (YYYY-MM-DD) | Oui | Date d'ouverture |
| `closed` | string (YYYY-MM-DD) | Non | Date de clôture (null si actif) |
| `description` | string | Non | Description du compte |
| `metadata` | object | Non | Métadonnées supplémentaires |

### Règles de nommage des comptes

- Format hiérarchique avec `:` comme séparateur
- Structure: `Type:Category:Subcategory:...:Name`
- Exemples:
  - `Assets:Bank:CHF:PostFinance`
  - `Expenses:Food:Restaurants:FastFood`
  - `Income:Salary:NetPay`

## 5. Transactions

Enregistrements de toutes les opérations financières.

```json
{
  "transactions": [
    {
      "id": "txn_001",
      "date": "2025-01-15",
      "description": "Courses au supermarché Migros",
      "payee": "Migros",
      "tags": ["groceries", "food"],
      "postings": [
        {
          "accountId": "acc_003",
          "amount": 120.50,
          "currency": "CHF"
        },
        {
          "accountId": "acc_001",
          "amount": -120.50,
          "currency": "CHF"
        }
      ],
      "metadata": {
        "location": "Lausanne",
        "receiptId": "REC_2025_001"
      }
    },
    {
      "id": "txn_002",
      "date": "2025-01-25",
      "description": "Transfert CHF vers EUR",
      "payee": null,
      "tags": ["transfer", "fx"],
      "postings": [
        {
          "accountId": "acc_002",
          "amount": 100.00,
          "currency": "EUR",
          "exchangeRate": {
            "rate": 0.95,
            "baseCurrency": "CHF",
            "quoteCurrency": "EUR",
            "equivalentAmount": 95.00
          }
        },
        {
          "accountId": "acc_001",
          "amount": -95.00,
          "currency": "CHF"
        },
        {
          "accountId": "acc_007",
          "amount": -0.50,
          "currency": "CHF",
          "comment": "Frais de change"
        }
      ]
    },
    {
      "id": "txn_003",
      "date": "2025-01-01",
      "description": "Solde d'ouverture PostFinance",
      "payee": null,
      "tags": ["opening"],
      "postings": [
        {
          "accountId": "acc_001",
          "amount": 5000.00,
          "currency": "CHF"
        },
        {
          "accountId": "acc_006",
          "amount": -5000.00,
          "currency": "CHF"
        }
      ]
    }
  ]
}
```

### Propriétés de transaction

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `txn_XXX`) |
| `date` | string (YYYY-MM-DD) | Oui | Date de la transaction |
| `description` | string | Oui | Description de la transaction |
| `payee` | string | Non | Bénéficiaire/payeur |
| `tags` | array[string] | Non | Étiquettes pour catégorisation |
| `postings` | array[Posting] | Oui | Liste des écritures (min 2) |
| `metadata` | object | Non | Métadonnées supplémentaires |

### Propriétés de posting (écriture)

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `accountId` | string | Oui | ID du compte concerné |
| `amount` | number | Oui | Montant (positif = débit, négatif = crédit) |
| `currency` | string | Oui | Code de devise |
| `exchangeRate` | object | Non | Taux de change si conversion |
| `comment` | string | Non | Commentaire sur cette écriture |

### Propriétés de taux de change dans posting

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `rate` | number | Oui | Taux de change appliqué |
| `baseCurrency` | string | Oui | Devise de base |
| `quoteCurrency` | string | Oui | Devise cotée |
| `equivalentAmount` | number | Oui | Montant équivalent dans la devise de base |

### Règles de validation des transactions

1. **Équilibre** : La somme de tous les postings doit être 0 dans chaque devise
2. **Minimum de postings** : Au moins 2 postings par transaction
3. **Cohérence des devises** : Chaque posting doit utiliser la devise de son compte
4. **Taux de change** : Obligatoire si conversion entre devises
5. **Dates valides** : La date doit être >= date d'ouverture des comptes

## 6. Budgets

Définition des budgets par catégorie.

```json
{
  "budgets": [
    {
      "id": "bud_001",
      "name": "Alimentation mensuelle",
      "accountPattern": "Expenses:Food:*",
      "period": "monthly",
      "amount": 800.00,
      "currency": "CHF",
      "startDate": "2025-01-01",
      "endDate": null,
      "alerts": {
        "warningThreshold": 0.80,
        "criticalThreshold": 0.95
      }
    },
    {
      "id": "bud_002",
      "name": "Transport annuel",
      "accountPattern": "Expenses:Transport:*",
      "period": "yearly",
      "amount": 3000.00,
      "currency": "CHF",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    }
  ]
}
```

### Propriétés de budget

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `bud_XXX`) |
| `name` | string | Oui | Nom du budget |
| `accountPattern` | string | Oui | Pattern de compte (supporte `*` wildcard) |
| `period` | string | Oui | Période: `daily`, `weekly`, `monthly`, `quarterly`, `yearly` |
| `amount` | number | Oui | Montant alloué |
| `currency` | string | Oui | Code de devise |
| `startDate` | string (YYYY-MM-DD) | Oui | Date de début |
| `endDate` | string (YYYY-MM-DD) | Non | Date de fin (null = indéfini) |
| `alerts` | object | Non | Seuils d'alerte |

## 7. Transactions récurrentes

Modèles de transactions qui se répètent automatiquement.

```json
{
  "recurringTransactions": [
    {
      "id": "rec_001",
      "name": "Salaire mensuel",
      "frequency": "monthly",
      "dayOfMonth": 25,
      "startDate": "2024-01-25",
      "endDate": null,
      "enabled": true,
      "template": {
        "description": "Salaire {{month}} {{year}}",
        "payee": "Employeur SA",
        "tags": ["salary", "income"],
        "postings": [
          {
            "accountId": "acc_001",
            "amount": 5500.00,
            "currency": "CHF"
          },
          {
            "accountId": "acc_004",
            "amount": -5500.00,
            "currency": "CHF"
          }
        ]
      }
    },
    {
      "id": "rec_002",
      "name": "Loyer mensuel",
      "frequency": "monthly",
      "dayOfMonth": 1,
      "startDate": "2024-01-01",
      "endDate": null,
      "enabled": true,
      "template": {
        "description": "Loyer {{month}} {{year}}",
        "payee": "Régie immobilière",
        "tags": ["rent", "housing"],
        "postings": [
          {
            "accountId": "acc_008",
            "amount": 1500.00,
            "currency": "CHF"
          },
          {
            "accountId": "acc_001",
            "amount": -1500.00,
            "currency": "CHF"
          }
        ]
      }
    }
  ]
}
```

### Propriétés de transaction récurrente

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | string | Oui | Identifiant unique (format: `rec_XXX`) |
| `name` | string | Oui | Nom de la récurrence |
| `frequency` | string | Oui | Fréquence: `daily`, `weekly`, `monthly`, `yearly` |
| `dayOfMonth` | number | Conditonnel | Jour du mois (1-31) si monthly |
| `dayOfWeek` | number | Conditionnel | Jour de semaine (0-6) si weekly |
| `dayOfYear` | string | Conditionnel | MM-DD si yearly |
| `startDate` | string (YYYY-MM-DD) | Oui | Date de début |
| `endDate` | string (YYYY-MM-DD) | Non | Date de fin (null = indéfini) |
| `enabled` | boolean | Oui | Active/désactive la récurrence |
| `template` | object | Oui | Modèle de transaction |

### Variables de template

Les descriptions peuvent contenir des variables:
- `{{date}}` : Date au format YYYY-MM-DD
- `{{day}}` : Jour
- `{{month}}` : Mois
- `{{year}}` : Année
- `{{monthName}}` : Nom du mois

## 8. Exemple complet de fichier

```json
{
  "version": "1.0.0",
  "metadata": {
    "created": "2025-01-01T00:00:00.000Z",
    "lastModified": "2025-01-15T14:30:00.000Z",
    "defaultCurrency": "CHF",
    "owner": "John Doe"
  },
  "currencies": [
    {
      "code": "CHF",
      "name": "Swiss Franc",
      "symbol": "CHF",
      "decimalPlaces": 2,
      "isDefault": true
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "decimalPlaces": 2,
      "exchangeRates": [
        {
          "date": "2025-01-15",
          "rate": 0.95,
          "source": "manual"
        }
      ]
    }
  ],
  "accounts": [
    {
      "id": "acc_001",
      "name": "Assets:Bank:CHF:PostFinance",
      "type": "Assets",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null,
      "description": "Compte bancaire principal"
    },
    {
      "id": "acc_002",
      "name": "Expenses:Food:Groceries",
      "type": "Expenses",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null
    },
    {
      "id": "acc_003",
      "name": "Equity:OpeningBalances",
      "type": "Equity",
      "currency": "CHF",
      "opened": "2024-01-01",
      "closed": null
    }
  ],
  "transactions": [
    {
      "id": "txn_001",
      "date": "2025-01-01",
      "description": "Solde d'ouverture",
      "postings": [
        {
          "accountId": "acc_001",
          "amount": 5000.00,
          "currency": "CHF"
        },
        {
          "accountId": "acc_003",
          "amount": -5000.00,
          "currency": "CHF"
        }
      ]
    },
    {
      "id": "txn_002",
      "date": "2025-01-15",
      "description": "Courses",
      "payee": "Migros",
      "tags": ["groceries"],
      "postings": [
        {
          "accountId": "acc_002",
          "amount": 120.50,
          "currency": "CHF"
        },
        {
          "accountId": "acc_001",
          "amount": -120.50,
          "currency": "CHF"
        }
      ]
    }
  ],
  "budgets": [],
  "recurringTransactions": []
}
```

## 9. Schéma de validation JSON Schema

Un schéma JSON Schema sera fourni séparément pour valider la structure du fichier de données.

## 10. Notes techniques

### 10.1 Identifiants

Tous les identifiants suivent le format: `{type}_{number}`
- Comptes: `acc_001`, `acc_002`, ...
- Transactions: `txn_001`, `txn_002`, ...
- Budgets: `bud_001`, `bud_002`, ...
- Récurrences: `rec_001`, `rec_002`, ...

Les numéros doivent être uniques et croissants.

### 10.2 Dates

- Format: ISO 8601 pour les timestamps (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Format: `YYYY-MM-DD` pour les dates simples

### 10.3 Montants

- Type: `number` (floating point)
- Précision: selon `decimalPlaces` de la devise
- Convention de signe:
  - Positif = débit (augmente Assets/Expenses)
  - Négatif = crédit (augmente Liabilities/Income/Equity)

### 10.4 Devises

- Codes: ISO 4217 (3 lettres majuscules)
- Exemples: CHF, EUR, USD, GBP, JPY

### 10.5 Encodage

- UTF-8 obligatoire
- Indentation: 2 espaces recommandés
- Pas de BOM (Byte Order Mark)
