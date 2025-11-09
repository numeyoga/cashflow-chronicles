# Architecture Logicielle - Cashflow Chronicles

## 1. Vue d'ensemble

**Cashflow Chronicles** est une application web de gestion de budget personnel multi-devises construite sur les principes de **Plain Text Accounting** et de la **comptabilité en partie double**.

### 1.1 Caractéristiques architecturales

- **Type d'application** : Single Page Application (SPA) progressive
- **Paradigme** : Client-side avec stockage local (File-based)
- **Architecture** : Clean Architecture / Hexagonal Architecture adaptée
- **Modèle de données** : Event Sourcing léger (via transactions TOML)
- **Pattern principal** : Repository Pattern avec TOML comme persistence

### 1.2 Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework UI** | SvelteKit | Réactivité, SSG/SPA, performance |
| **Langage** | TypeScript | Type safety, maintenabilité |
| **Stockage** | TOML v1.0.0 | Lisibilité, Git-friendly, commentaires |
| **Tests unitaires** | Vitest | Rapide, ESM natif |
| **Tests E2E** | Playwright | Multi-navigateur, fiable |
| **Build** | Vite | Performance, HMR |

### 1.3 Principes architecturaux

1. **Separation of Concerns** : Séparation stricte domaine/infrastructure/présentation
2. **Dependency Inversion** : Les couches métier ne dépendent pas de l'infrastructure
3. **Single Source of Truth** : Le fichier TOML est l'unique source de vérité
4. **Immutabilité** : Les données domaine sont immutables
5. **Validation First** : Validation stricte à tous les niveaux
6. **Performance by Design** : Optimisation dès la conception

---

## 2. Architecture en couches

L'application suit une architecture en couches inspirée de **Clean Architecture** :

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Svelte     │  │   Svelte     │  │   Svelte     │      │
│  │  Components  │  │    Pages     │  │    Stores    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Use Cases   │  │   Services   │  │  View Models │      │
│  │  (Commands)  │  │  (Queries)   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Entities   │  │   Value      │  │   Domain     │      │
│  │   (Models)   │  │   Objects    │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Validation  │  │  Business    │                        │
│  │    Engine    │  │    Rules     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repositories │  │ TOML Parser  │  │    File I/O  │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Cache     │  │   Indexing   │  │    Backup    │      │
│  │   Manager    │  │    Engine    │  │    Manager   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Presentation Layer (Interface utilisateur)

**Responsabilité** : Interaction avec l'utilisateur, affichage des données

**Composants principaux** :
- **Pages (Routes)** : Composants SvelteKit pour chaque route
- **Components** : Composants UI réutilisables
- **Stores** : État global réactif (Svelte stores)
- **View Models** : Transformation des données domaine pour l'affichage

**Technologies** : SvelteKit, Svelte components, Svelte stores

**Règles** :
- Ne contient aucune logique métier
- Utilise uniquement les Use Cases de la couche Application
- Gère uniquement l'affichage et les interactions utilisateur
- Reste agnostique du format de stockage (TOML)

### 2.2 Application Layer (Couche applicative)

**Responsabilité** : Orchestration des use cases et coordination

**Composants principaux** :

#### Use Cases (Commandes)
Opérations qui modifient l'état :
- `CreateAccountUseCase`
- `CreateTransactionUseCase`
- `UpdateBudgetUseCase`
- `DeleteRecurringTransactionUseCase`
- etc.

#### Services (Queries)
Opérations de lecture :
- `AccountQueryService`
- `TransactionQueryService`
- `BalanceCalculationService`
- `ReportGenerationService`
- etc.

**Patterns** :
- **Command Pattern** : Pour les opérations d'écriture
- **Query Pattern (CQRS léger)** : Séparation lecture/écriture
- **Dependency Injection** : Injection des repositories

**Règles** :
- Coordonne les entités du domaine
- Appelle le ValidationEngine avant toute modification
- Délègue la persistence aux Repositories
- Ne contient pas de logique métier complexe

### 2.3 Domain Layer (Cœur métier)

**Responsabilité** : Modèles métier, règles métier, validation

**Composants principaux** :

#### Entities (Entités)
```typescript
class Account {
  id: AccountId
  name: AccountName
  type: AccountType
  currency: Currency
  opened: Date
  closed?: Date
  // ... méthodes métier
}

class Transaction {
  id: TransactionId
  date: Date
  description: string
  postings: Posting[]       // IMPORTANT: Tableau en TypeScript
  // ... méthodes métier
  isBalanced(): boolean
}
```

**⚠️ Note importante - Conventions de nommage TypeScript vs TOML** :
- **TypeScript** : Utilise le pluriel pour les tableaux (ex: `postings: Posting[]`, `exchangeRates: ExchangeRateHistory[]`)
- **TOML** : Utilise le singulier pour les array of tables (ex: `[[transaction.posting]]`, `[[currency.exchangeRate]]`)
- Cette différence est normale et due aux conventions de chaque format.
- Les enums TypeScript utilisent PascalCase, les valeurs TOML correspondantes sont en lowercase (ex: `Daily = 'daily'`)

#### Value Objects
```typescript
class Money {
  amount: number
  currency: Currency
  // ... méthodes de conversion, comparaison
}

class AccountName {
  value: string
  segments: string[]
  // ... validation hiérarchie
}

class ExchangeRate {
  rate: number
  baseCurrency: Currency
  quoteCurrency: Currency
  date: Date
}
```

#### Domain Services
- `BalanceCalculator` : Calcul des soldes de comptes
- `TransactionValidator` : Validation des transactions
- `ExchangeRateCalculator` : Conversions multi-devises
- `AccountingEquationChecker` : Vérification équation comptable

#### Validation Engine
- **ValidationEngine** : Moteur principal de validation
- **ValidationRules** : Toutes les règles V-XXX-YYY
- **ValidationReport** : Rapport de validation avec erreurs/warnings

**Règles** :
- Aucune dépendance vers les autres couches
- Immutabilité des entités (création de nouvelles instances)
- Validation stricte avant tout changement d'état
- Encapsulation des règles métier

### 2.4 Infrastructure Layer (Infrastructure)

**Responsabilité** : Persistence, I/O, services techniques

**Composants principaux** :

#### Repositories (Pattern Repository)
```typescript
interface AccountRepository {
  findAll(): Promise<Account[]>
  findById(id: AccountId): Promise<Account | null>
  save(account: Account): Promise<void>
  delete(id: AccountId): Promise<void>
}

interface TransactionRepository {
  findAll(): Promise<Transaction[]>
  findByDateRange(start: Date, end: Date): Promise<Transaction[]>
  save(transaction: Transaction): Promise<void>
  // ...
}
```

**Implémentations** :
- `TomlAccountRepository`
- `TomlTransactionRepository`
- `TomlBudgetRepository`
- etc.

#### TOML Parser & Serializer
- **TomlParser** : Parsing du fichier TOML → entités domaine
- **TomlSerializer** : Entités domaine → fichier TOML
- **SchemaValidator** : Validation du schéma TOML

#### Cache Manager
- **CacheManager** : Gestion du cache en mémoire
- **BalanceCache** : Cache des soldes calculés
- **IndexCache** : Index pour recherche rapide

#### File I/O Manager
- **FileManager** : Lecture/écriture fichier
- **BackupManager** : Gestion des backups
- **AutoSaveManager** : Sauvegarde automatique

**Règles** :
- Implémente les interfaces définies dans le domaine
- Gère les aspects techniques (I/O, cache, etc.)
- Peut dépendre de bibliothèques externes (TOML parser)
- Convertit entre format TOML et entités domaine

---

## 3. Modèles de données (Domain Model)

### 3.1 Entités principales

#### Account (Compte)
```typescript
interface Account {
  id: string                    // Format: acc_XXX
  name: string                  // Hiérarchique: Type:Cat:SubCat
  type: AccountType             // Assets, Liabilities, Income, Expenses, Equity
  currency: string              // Code ISO 4217
  opened: Date
  closed?: Date
  description?: string
  metadata?: Record<string, any>
}

enum AccountType {
  Assets = 'Assets',
  Liabilities = 'Liabilities',
  Income = 'Income',
  Expenses = 'Expenses',
  Equity = 'Equity'
}
```

#### Transaction
```typescript
interface Transaction {
  id: string                    // Format: txn_XXX
  date: Date
  description: string
  payee?: string
  tags?: string[]
  postings: Posting[]           // Min 2 postings
  metadata?: Record<string, any>
}

interface Posting {
  accountId: string
  amount: number
  currency: string
  exchangeRate?: ExchangeRate
  comment?: string
}

interface ExchangeRate {
  rate: number
  baseCurrency: string
  quoteCurrency: string
  equivalentAmount: number
}
```

#### Currency (Devise)
```typescript
interface Currency {
  code: string                  // ISO 4217
  name: string
  symbol: string
  decimalPlaces: number
  isDefault: boolean
  exchangeRates?: ExchangeRateHistory[]
}

interface ExchangeRateHistory {
  date: Date
  rate: number
  source?: string
}
```

#### Budget
```typescript
interface Budget {
  id: string                    // Format: bud_XXX
  name: string
  accountPattern: string        // Support wildcards: Expenses:Food:*
  period: BudgetPeriod
  amount: number
  currency: string
  startDate: Date
  endDate?: Date
  alerts?: {
    warningThreshold: number    // 0.0 - 1.0
    criticalThreshold: number   // 0.0 - 1.0
  }
}

enum BudgetPeriod {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly'
}
```

#### RecurringTransaction
```typescript
interface RecurringTransaction {
  id: string                    // Format: rec_XXX
  name: string
  frequency: Frequency
  dayOfMonth?: number           // 1-31 si monthly
  dayOfWeek?: number            // 0-6 si weekly
  dayOfYear?: string            // MM-DD si yearly
  startDate: Date
  endDate?: Date
  enabled: boolean
  template: TransactionTemplate
}

interface TransactionTemplate {
  description: string           // Peut contenir {{variables}}
  payee?: string
  tags?: string[]
  postings: Posting[]
}

enum Frequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Yearly = 'yearly'
}
```

### 3.2 Value Objects

#### Money
```typescript
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {}

  add(other: Money): Money
  subtract(other: Money): Money
  multiply(factor: number): Money
  convertTo(targetCurrency: Currency, rate: number): Money
  equals(other: Money): boolean
  isPositive(): boolean
  isNegative(): boolean
  isZero(): boolean
}
```

#### AccountName (avec hiérarchie)
```typescript
class AccountName {
  constructor(public readonly value: string) {
    this.validate()
  }

  get segments(): string[]
  get type(): AccountType
  get category(): string
  get parent(): AccountName | null

  isChildOf(other: AccountName): boolean
  private validate(): void
}
```

#### DateRange
```typescript
class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {}

  contains(date: Date): boolean
  overlaps(other: DateRange): boolean
  duration(): number
}
```

### 3.3 Agrégats (Aggregates)

#### AccountBalance (Agrégat calculé)
```typescript
interface AccountBalance {
  account: Account
  balance: Money
  balanceHistory: BalanceHistoryEntry[]
  lastUpdated: Date
}

interface BalanceHistoryEntry {
  date: Date
  balance: Money
  transaction: Transaction
}
```

#### BudgetStatus (Agrégat calculé)
```typescript
interface BudgetStatus {
  budget: Budget
  spent: Money
  remaining: Money
  percentage: number            // 0.0 - 1.0+
  status: 'normal' | 'warning' | 'critical' | 'exceeded'
  transactions: Transaction[]
}
```

---

## 4. Architecture des modules

### 4.1 Structure des dossiers

```
src/
├── lib/
│   ├── domain/                     # Domaine (logique métier)
│   │   ├── entities/
│   │   │   ├── Account.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── Currency.ts
│   │   │   ├── Budget.ts
│   │   │   └── RecurringTransaction.ts
│   │   ├── value-objects/
│   │   │   ├── Money.ts
│   │   │   ├── AccountName.ts
│   │   │   ├── ExchangeRate.ts
│   │   │   └── DateRange.ts
│   │   ├── services/
│   │   │   ├── BalanceCalculator.ts
│   │   │   ├── ExchangeRateCalculator.ts
│   │   │   └── AccountingEquationChecker.ts
│   │   ├── validation/
│   │   │   ├── ValidationEngine.ts
│   │   │   ├── ValidationRule.ts
│   │   │   ├── ValidationReport.ts
│   │   │   └── rules/
│   │   │       ├── account-rules.ts      # V-ACC-*
│   │   │       ├── transaction-rules.ts  # V-TXN-*, V-BAL-*
│   │   │       ├── currency-rules.ts     # V-CUR-*
│   │   │       ├── budget-rules.ts       # V-BUD-*
│   │   │       └── ...
│   │   └── types/
│   │       ├── AccountType.ts
│   │       ├── TransactionType.ts
│   │       └── ...
│   │
│   ├── application/                # Couche application
│   │   ├── use-cases/
│   │   │   ├── account/
│   │   │   │   ├── CreateAccountUseCase.ts
│   │   │   │   ├── UpdateAccountUseCase.ts
│   │   │   │   ├── DeleteAccountUseCase.ts
│   │   │   │   └── CloseAccountUseCase.ts
│   │   │   ├── transaction/
│   │   │   │   ├── CreateTransactionUseCase.ts
│   │   │   │   ├── UpdateTransactionUseCase.ts
│   │   │   │   └── DeleteTransactionUseCase.ts
│   │   │   ├── budget/
│   │   │   └── ...
│   │   ├── queries/
│   │   │   ├── AccountQueryService.ts
│   │   │   ├── TransactionQueryService.ts
│   │   │   ├── BudgetQueryService.ts
│   │   │   └── ReportQueryService.ts
│   │   └── services/
│   │       ├── ImportService.ts
│   │       └── ExportService.ts
│   │
│   ├── infrastructure/             # Infrastructure
│   │   ├── repositories/
│   │   │   ├── TomlAccountRepository.ts
│   │   │   ├── TomlTransactionRepository.ts
│   │   │   ├── TomlBudgetRepository.ts
│   │   │   └── ...
│   │   ├── storage/
│   │   │   ├── TomlParser.ts
│   │   │   ├── TomlSerializer.ts
│   │   │   ├── FileManager.ts
│   │   │   ├── BackupManager.ts
│   │   │   └── AutoSaveManager.ts
│   │   ├── cache/
│   │   │   ├── CacheManager.ts
│   │   │   ├── BalanceCache.ts
│   │   │   └── IndexManager.ts
│   │   └── adapters/
│   │       ├── CsvImportAdapter.ts
│   │       └── CsvExportAdapter.ts
│   │
│   ├── presentation/               # Présentation (UI)
│   │   ├── stores/
│   │   │   ├── accounts.store.ts
│   │   │   ├── transactions.store.ts
│   │   │   ├── budgets.store.ts
│   │   │   ├── currencies.store.ts
│   │   │   └── ui.store.ts
│   │   ├── view-models/
│   │   │   ├── AccountViewModel.ts
│   │   │   ├── TransactionViewModel.ts
│   │   │   ├── DashboardViewModel.ts
│   │   │   └── ...
│   │   └── components/
│   │       ├── accounts/
│   │       │   ├── AccountList.svelte
│   │       │   ├── AccountForm.svelte
│   │       │   ├── AccountTreeView.svelte
│   │       │   └── ...
│   │       ├── transactions/
│   │       │   ├── TransactionList.svelte
│   │       │   ├── TransactionForm.svelte
│   │       │   ├── PostingEditor.svelte
│   │       │   └── ...
│   │       ├── budgets/
│   │       ├── reports/
│   │       ├── shared/
│   │       │   ├── Button.svelte
│   │       │   ├── Input.svelte
│   │       │   ├── DatePicker.svelte
│   │       │   └── ...
│   │       └── layout/
│   │           ├── Header.svelte
│   │           ├── Navigation.svelte
│   │           └── ...
│   │
│   └── shared/                     # Utilitaires partagés
│       ├── utils/
│       │   ├── date-utils.ts
│       │   ├── currency-utils.ts
│       │   └── format-utils.ts
│       ├── constants/
│       │   ├── currencies.ts
│       │   └── validation-messages.ts
│       └── types/
│           └── common.ts
│
└── routes/                         # Pages SvelteKit
    ├── +layout.svelte
    ├── +page.svelte                # Dashboard
    ├── accounts/
    │   ├── +page.svelte
    │   └── [id]/
    │       └── +page.svelte
    ├── transactions/
    │   ├── +page.svelte
    │   └── [id]/
    │       └── +page.svelte
    ├── budgets/
    ├── reports/
    └── settings/
```

### 4.2 Modules principaux

#### Module Domain
- **Responsabilité** : Entités, règles métier, validation
- **Dépendances** : Aucune (cœur indépendant)
- **Exports** : Entities, Value Objects, Domain Services, Validation Rules

#### Module Application
- **Responsabilité** : Use cases, orchestration
- **Dépendances** : Domain
- **Exports** : Use Cases, Query Services

#### Module Infrastructure
- **Responsabilité** : Persistence, cache, I/O
- **Dépendances** : Domain (interfaces), Application
- **Exports** : Repository implémentations, Storage services

#### Module Presentation
- **Responsabilité** : UI, stores, composants
- **Dépendances** : Application, Domain (types seulement)
- **Exports** : Composants Svelte, Stores, View Models

---

## 5. Patterns et principes de conception

### 5.1 Patterns utilisés

#### Repository Pattern
```typescript
// Interface (Domain)
interface TransactionRepository {
  findAll(): Promise<Transaction[]>
  findById(id: string): Promise<Transaction | null>
  save(transaction: Transaction): Promise<void>
  delete(id: string): Promise<void>
}

// Implémentation (Infrastructure)
class TomlTransactionRepository implements TransactionRepository {
  constructor(
    private parser: TomlParser,
    private serializer: TomlSerializer,
    private fileManager: FileManager
  ) {}

  async findAll(): Promise<Transaction[]> {
    const data = await this.fileManager.read()
    return this.parser.parseTransactions(data)
  }
  // ...
}
```

#### Command Pattern (Use Cases)
```typescript
interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>
}

class CreateTransactionUseCase implements UseCase<CreateTransactionInput, Transaction> {
  constructor(
    private transactionRepo: TransactionRepository,
    private accountRepo: AccountRepository,
    private validator: ValidationEngine
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    // 1. Créer l'entité
    const transaction = Transaction.create(input)

    // 2. Valider
    const report = await this.validator.validate(transaction)
    if (report.hasErrors()) {
      throw new ValidationError(report)
    }

    // 3. Sauvegarder
    await this.transactionRepo.save(transaction)

    return transaction
  }
}
```

#### Strategy Pattern (Validation)
```typescript
interface ValidationRule<T> {
  code: string
  severity: 'error' | 'warning' | 'info'
  validate(entity: T): ValidationResult
}

class TransactionBalanceRule implements ValidationRule<Transaction> {
  code = 'V-BAL-001'
  severity = 'error'

  validate(transaction: Transaction): ValidationResult {
    const isBalanced = transaction.isBalanced()
    return {
      passed: isBalanced,
      message: isBalanced ? '' : 'Transaction is not balanced'
    }
  }
}
```

#### Factory Pattern (Entity Creation)
```typescript
class TransactionFactory {
  static create(input: CreateTransactionInput): Transaction {
    // Validation de base
    // Construction de l'entité
    // Retour de l'instance
  }

  static fromToml(data: TomlTransaction): Transaction {
    // Conversion TOML → Entity
  }
}
```

#### Observer Pattern (Stores Svelte)
```typescript
// Store réactif pour les transactions
const transactionsStore = writable<Transaction[]>([])

// Observers réagissent aux changements
transactionsStore.subscribe(transactions => {
  // Recalculer les soldes
  // Mettre à jour les budgets
  // etc.
})
```

#### Singleton Pattern (Validation Engine)
```typescript
class ValidationEngine {
  private static instance: ValidationEngine
  private rules: ValidationRule<any>[] = []

  static getInstance(): ValidationEngine {
    if (!ValidationEngine.instance) {
      ValidationEngine.instance = new ValidationEngine()
    }
    return ValidationEngine.instance
  }

  registerRule(rule: ValidationRule<any>): void {
    this.rules.push(rule)
  }

  validate<T>(entity: T): ValidationReport {
    // Exécuter toutes les règles applicables
  }
}
```

### 5.2 Principes SOLID

#### Single Responsibility Principle
- Chaque classe a une seule responsabilité
- Exemple : `BalanceCalculator` ne fait que calculer les soldes

#### Open/Closed Principle
- Ouvert à l'extension, fermé à la modification
- Nouveau type de validation → nouvelle `ValidationRule`
- Nouveau format d'export → nouveau `ExportAdapter`

#### Liskov Substitution Principle
- Toutes les implémentations de `Repository` sont interchangeables
- Possible de remplacer `TomlRepository` par `JsonRepository` sans changer le code

#### Interface Segregation Principle
- Interfaces fines et spécifiques
- `AccountQueryService` séparé de `AccountCommandService`

#### Dependency Inversion Principle
- Les couches hautes ne dépendent pas des couches basses
- `CreateTransactionUseCase` dépend de `TransactionRepository` (interface), pas de `TomlTransactionRepository`

### 5.3 Autres principes

#### DRY (Don't Repeat Yourself)
- Utilitaires partagés pour formatage, conversion
- Value Objects pour logique réutilisable (Money, AccountName)

#### KISS (Keep It Simple, Stupid)
- Architecture simple et compréhensible
- Pas de sur-ingénierie

#### YAGNI (You Aren't Gonna Need It)
- Implémentation progressive selon les Epics
- Pas de fonctionnalités anticipées

---

## 6. Flux de données

### 6.1 Flux de lecture (Query)

```
User Action
    ↓
Svelte Component
    ↓
Query Service (Application Layer)
    ↓
Repository (Infrastructure)
    ↓
TOML File → Parse → Cache
    ↓
Domain Entities
    ↓
View Model (transformation)
    ↓
Svelte Store (reactive)
    ↓
UI Update
```

**Exemple concret : Afficher la liste des comptes**

```typescript
// 1. Component
<script lang="ts">
  import { accountsStore } from '$lib/presentation/stores/accounts.store'
  import { onMount } from 'svelte'

  onMount(async () => {
    await accountsStore.load()
  })
</script>

{#each $accountsStore as account}
  <AccountCard {account} />
{/each}

// 2. Store
import { writable } from 'svelte/store'
import { AccountQueryService } from '$lib/application/queries/AccountQueryService'

const accountQueryService = new AccountQueryService(/* deps */)

export const accountsStore = writable<Account[]>([])

export async function load() {
  const accounts = await accountQueryService.getAllAccounts()
  accountsStore.set(accounts)
}

// 3. Query Service
class AccountQueryService {
  constructor(private accountRepo: AccountRepository) {}

  async getAllAccounts(): Promise<Account[]> {
    return await this.accountRepo.findAll()
  }
}

// 4. Repository
class TomlAccountRepository {
  async findAll(): Promise<Account[]> {
    // Check cache first
    if (this.cache.has('accounts')) {
      return this.cache.get('accounts')
    }

    // Load from file
    const data = await this.fileManager.read()
    const accounts = this.parser.parseAccounts(data)

    // Cache result
    this.cache.set('accounts', accounts)

    return accounts
  }
}
```

### 6.2 Flux d'écriture (Command)

```
User Action
    ↓
Svelte Component (event)
    ↓
Use Case (Application Layer)
    ↓
    ├─> Validation Engine (Domain)
    │       ↓
    │   Apply all rules (V-XXX-YYY)
    │       ↓
    │   Return ValidationReport
    ↓
Repository.save() (Infrastructure)
    ↓
    ├─> Backup Manager (create backup)
    ├─> Serialize to TOML
    ├─> Write to file
    └─> Invalidate cache
    ↓
Emit event / Update stores
    ↓
UI Update (reactive)
```

**Exemple concret : Créer une transaction**

```typescript
// 1. Component
<script lang="ts">
  import { CreateTransactionUseCase } from '$lib/application/use-cases/transaction/CreateTransactionUseCase'

  async function handleSubmit(data: CreateTransactionInput) {
    try {
      const transaction = await createTransactionUseCase.execute(data)
      // Success notification
      goto('/transactions')
    } catch (error) {
      if (error instanceof ValidationError) {
        // Display validation errors
        validationErrors = error.report.errors
      }
    }
  }
</script>

// 2. Use Case
class CreateTransactionUseCase {
  async execute(input: CreateTransactionInput): Promise<Transaction> {
    // 1. Create entity
    const transaction = TransactionFactory.create(input)

    // 2. Validate
    const report = await this.validator.validateTransaction(transaction)
    if (report.hasErrors()) {
      throw new ValidationError(report)
    }

    // 3. Check all accounts exist
    for (const posting of transaction.postings) {
      const account = await this.accountRepo.findById(posting.accountId)
      if (!account) {
        throw new Error(`Account ${posting.accountId} not found`)
      }
    }

    // 4. Save
    await this.transactionRepo.save(transaction)

    // 5. Invalidate balance cache
    await this.cacheManager.invalidate('balances')

    return transaction
  }
}

// 3. Validation
const report = await validationEngine.validate(transaction, [
  new TransactionDateRule(),
  new TransactionBalanceRule(),
  new TransactionPostingsRule(),
  // ... all V-TXN-* rules
])

// 4. Repository
class TomlTransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    // 1. Create backup
    await this.backupManager.createBackup()

    // 2. Load current data
    const data = await this.fileManager.read()

    // 3. Update/add transaction
    const tomlData = this.serializer.serializeTransaction(transaction)
    data.transactions = [...data.transactions, tomlData]

    // 4. Write to file
    await this.fileManager.write(data)

    // 5. Invalidate cache
    this.cache.invalidate('transactions')
  }
}
```

### 6.3 Flux de validation

```
Entity (to validate)
    ↓
ValidationEngine
    ↓
    ├─> Structural Rules (V-FILE-*, V-META-*)
    ├─> Business Rules (V-TXN-*, V-ACC-*, V-CUR-*, V-BUD-*)
    ├─> Integrity Rules (V-REF-*, V-TIME-*, V-SOL-*, V-EQ-*)
    └─> Custom Rules
    ↓
Collect all ValidationResults
    ↓
Build ValidationReport
    ↓
    ├─> Errors (blocking)
    ├─> Warnings (non-blocking)
    └─> Infos
    ↓
Return to caller
```

---

## 7. Gestion de l'état

### 7.1 State Management avec Svelte Stores

#### Stores principaux

```typescript
// accounts.store.ts
export const accountsStore = writable<Account[]>([])
export const selectedAccountStore = writable<Account | null>(null)
export const accountsLoadingStore = writable<boolean>(false)

// transactions.store.ts
export const transactionsStore = writable<Transaction[]>([])
export const transactionFiltersStore = writable<TransactionFilters>({
  dateRange: null,
  accountIds: [],
  minAmount: null,
  maxAmount: null
})

// budgets.store.ts
export const budgetsStore = writable<Budget[]>([])
export const budgetStatusStore = derived(
  [budgetsStore, transactionsStore],
  ([$budgets, $transactions]) => {
    // Calculate budget status for each budget
    return $budgets.map(budget =>
      calculateBudgetStatus(budget, $transactions)
    )
  }
)

// currencies.store.ts
export const currenciesStore = writable<Currency[]>([])
export const defaultCurrencyStore = derived(
  currenciesStore,
  $currencies => $currencies.find(c => c.isDefault)
)

// ui.store.ts (état UI global)
export const sidebarOpenStore = writable<boolean>(true)
export const themeStore = writable<'light' | 'dark'>('light')
export const validationReportStore = writable<ValidationReport | null>(null)
```

#### Derived Stores (Stores calculés)

```typescript
// Balances calculés automatiquement
export const accountBalancesStore = derived(
  [accountsStore, transactionsStore],
  ([$accounts, $transactions]) => {
    return $accounts.map(account => ({
      account,
      balance: BalanceCalculator.calculate(account, $transactions)
    }))
  }
)

// Net worth (valeur nette)
export const netWorthStore = derived(
  accountBalancesStore,
  $balances => {
    const assets = sumBalances($balances, AccountType.Assets)
    const liabilities = sumBalances($balances, AccountType.Liabilities)
    return assets.subtract(liabilities)
  }
)
```

### 7.2 Cache Strategy

#### Multi-level Cache

```typescript
class CacheManager {
  private memoryCache: Map<string, any> = new Map()
  private indexCache: Map<string, Index> = new Map()

  // Niveau 1: Cache mémoire (chaud)
  get<T>(key: string): T | null {
    return this.memoryCache.get(key) || null
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.memoryCache.set(key, value)
    if (ttl) {
      setTimeout(() => this.memoryCache.delete(key), ttl)
    }
  }

  // Niveau 2: Index pour recherche rapide
  buildIndex(key: string, data: any[]): void {
    const index = this.createIndex(data)
    this.indexCache.set(key, index)
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key)
    this.indexCache.delete(key)
  }

  invalidateAll(): void {
    this.memoryCache.clear()
    this.indexCache.clear()
  }
}
```

#### Stratégies de cache

1. **Cache-Aside** : Vérifie le cache d'abord, charge depuis le fichier si absent
2. **Write-Through** : Écrit dans le cache ET le fichier simultanément
3. **Cache Invalidation** : Invalide le cache lors des modifications

```typescript
class BalanceCache {
  private cache = new Map<string, Money>()
  private lastCalculated = new Map<string, Date>()

  getBalance(accountId: string): Money | null {
    const cached = this.cache.get(accountId)
    if (!cached) return null

    // Vérifier fraîcheur (5 minutes)
    const lastCalc = this.lastCalculated.get(accountId)
    if (lastCalc && Date.now() - lastCalc.getTime() < 5 * 60 * 1000) {
      return cached
    }

    return null
  }

  setBalance(accountId: string, balance: Money): void {
    this.cache.set(accountId, balance)
    this.lastCalculated.set(accountId, new Date())
  }

  invalidate(accountId?: string): void {
    if (accountId) {
      this.cache.delete(accountId)
      this.lastCalculated.delete(accountId)
    } else {
      this.cache.clear()
      this.lastCalculated.clear()
    }
  }
}
```

---

## 8. Stratégies de performance

### 8.1 Objectifs de performance

| Opération | Objectif | Critique |
|-----------|----------|----------|
| Chargement initial fichier | < 1s (10k tx) | Oui |
| Sauvegarde | < 500ms | Oui |
| Validation complète | < 100ms (1k tx) | Oui |
| Validation incrémentale | < 10ms | Oui |
| Calcul soldes | < 100ms | Oui |
| Recherche | < 100ms | Oui |
| Rendu graphiques | < 500ms | Non |

### 8.2 Optimisations

#### Lazy Loading
```typescript
// Charger les données par chunks
class LazyTransactionLoader {
  private chunkSize = 100

  async *loadChunks(): AsyncGenerator<Transaction[]> {
    const total = await this.getTotalCount()

    for (let offset = 0; offset < total; offset += this.chunkSize) {
      yield await this.loadChunk(offset, this.chunkSize)
    }
  }
}
```

#### Virtual Scrolling
```svelte
<!-- Afficher seulement les éléments visibles -->
<script>
  import VirtualList from '@sveltejs/svelte-virtual-list'
</script>

<VirtualList items={transactions} let:item>
  <TransactionRow transaction={item} />
</VirtualList>
```

#### Debouncing
```typescript
// Recherche avec debounce
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchService.search(query)
  resultsStore.set(results)
}, 300)
```

#### Memoization
```typescript
// Memoize calculs coûteux
const memoizedBalance = memoize(
  (accountId: string, transactions: Transaction[]) => {
    return BalanceCalculator.calculate(accountId, transactions)
  },
  // Cache key function
  (accountId, transactions) => `${accountId}-${transactions.length}`
)
```

#### Web Workers
```typescript
// Calculs lourds dans un Worker
class BalanceWorker {
  private worker: Worker

  async calculateAllBalances(
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<Map<string, Money>> {
    return new Promise((resolve) => {
      this.worker.postMessage({ accounts, transactions })
      this.worker.onmessage = (e) => resolve(e.data)
    })
  }
}
```

#### Indexing
```typescript
// Index pour recherche rapide
class TransactionIndex {
  private byAccount = new Map<string, Transaction[]>()
  private byDate = new Map<string, Transaction[]>()
  private byTag = new Map<string, Transaction[]>()

  build(transactions: Transaction[]): void {
    for (const tx of transactions) {
      // Index by account
      for (const posting of tx.postings) {
        const accountTxs = this.byAccount.get(posting.accountId) || []
        accountTxs.push(tx)
        this.byAccount.set(posting.accountId, accountTxs)
      }

      // Index by date
      const dateKey = tx.date.toISOString().split('T')[0]
      const dateTxs = this.byDate.get(dateKey) || []
      dateTxs.push(tx)
      this.byDate.set(dateKey, dateTxs)

      // Index by tag
      for (const tag of tx.tags || []) {
        const tagTxs = this.byTag.get(tag) || []
        tagTxs.push(tx)
        this.byTag.set(tag, tagTxs)
      }
    }
  }

  findByAccount(accountId: string): Transaction[] {
    return this.byAccount.get(accountId) || []
  }
}
```

### 8.3 Stratégie de chargement

```
Chargement initial:
1. Parse TOML (streaming si possible)
2. Créer les entités essentielles (Accounts, Currencies)
3. Créer index pour Transactions
4. Charger Transactions par chunks
5. Calculer soldes (cache)
6. Afficher UI progressivement
```

---

## 9. Sécurité et intégrité

### 9.1 Validation multi-niveaux

```
Niveau 1: UI (instant feedback)
    ↓
Niveau 2: Use Case (business rules)
    ↓
Niveau 3: Domain (entity invariants)
    ↓
Niveau 4: Repository (persistence constraints)
```

### 9.2 Backup Strategy

```typescript
class BackupManager {
  private maxBackups = 10
  private backupDir = '.backups'

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString()
    const backupPath = `${this.backupDir}/data-${timestamp}.toml`

    await this.copyFile('data.toml', backupPath)
    await this.cleanOldBackups()

    return backupPath
  }

  async restore(backupPath: string): Promise<void> {
    // Valider le backup avant de restaurer
    const isValid = await this.validateBackup(backupPath)
    if (!isValid) {
      throw new Error('Invalid backup file')
    }

    await this.copyFile(backupPath, 'data.toml')
  }

  private async cleanOldBackups(): Promise<void> {
    const backups = await this.listBackups()
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups)
      for (const backup of toDelete) {
        await this.deleteFile(backup)
      }
    }
  }
}
```

### 9.3 Transaction Safety

```typescript
// Atomic save with rollback
class AtomicSaveManager {
  async saveWithRollback<T>(
    saveOperation: () => Promise<T>
  ): Promise<T> {
    // 1. Create backup
    const backupPath = await this.backupManager.createBackup()

    try {
      // 2. Perform save
      const result = await saveOperation()

      // 3. Validate result
      const isValid = await this.validate(result)
      if (!isValid) {
        throw new Error('Validation failed after save')
      }

      return result

    } catch (error) {
      // 4. Rollback on error
      await this.backupManager.restore(backupPath)
      throw error
    }
  }
}
```

---

## 10. Testabilité

### 10.1 Architecture testable

#### Tests unitaires (Domain Layer)
```typescript
describe('Transaction', () => {
  it('should calculate balance correctly', () => {
    const transaction = TransactionFactory.create({
      postings: [
        { accountId: 'acc_1', amount: 100, currency: 'CHF' },
        { accountId: 'acc_2', amount: -100, currency: 'CHF' }
      ]
    })

    expect(transaction.isBalanced()).toBe(true)
  })

  it('should detect unbalanced transaction', () => {
    const transaction = TransactionFactory.create({
      postings: [
        { accountId: 'acc_1', amount: 100, currency: 'CHF' },
        { accountId: 'acc_2', amount: -50, currency: 'CHF' }
      ]
    })

    expect(transaction.isBalanced()).toBe(false)
  })
})
```

#### Tests d'intégration (Use Cases)
```typescript
describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase
  let mockRepo: TransactionRepository
  let mockValidator: ValidationEngine

  beforeEach(() => {
    mockRepo = new InMemoryTransactionRepository()
    mockValidator = new ValidationEngine()
    useCase = new CreateTransactionUseCase(mockRepo, mockValidator)
  })

  it('should create valid transaction', async () => {
    const input = {
      date: new Date(),
      description: 'Test',
      postings: [...]
    }

    const result = await useCase.execute(input)

    expect(result.id).toBeDefined()
    expect(await mockRepo.findById(result.id)).toBeDefined()
  })

  it('should reject invalid transaction', async () => {
    const input = { /* invalid data */ }

    await expect(useCase.execute(input))
      .rejects.toThrow(ValidationError)
  })
})
```

#### Tests E2E (UI)
```typescript
test('should create new transaction', async ({ page }) => {
  await page.goto('/transactions/new')

  await page.fill('[name="description"]', 'Test transaction')
  await page.fill('[name="amount"]', '100')
  await page.selectOption('[name="account"]', 'acc_1')

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/transactions')
  await expect(page.locator('text=Test transaction')).toBeVisible()
})
```

### 10.2 Test Fixtures

```typescript
// fixtures/accounts.fixture.ts
export const testAccounts: Account[] = [
  {
    id: 'acc_001',
    name: 'Assets:Bank:CHF:PostFinance',
    type: AccountType.Assets,
    currency: 'CHF',
    opened: new Date('2024-01-01')
  },
  {
    id: 'acc_002',
    name: 'Expenses:Food:Groceries',
    type: AccountType.Expenses,
    currency: 'CHF',
    opened: new Date('2024-01-01')
  }
]

// fixtures/transactions.fixture.ts
export const testTransactions: Transaction[] = [
  {
    id: 'txn_001',
    date: new Date('2025-01-15'),
    description: 'Courses Migros',
    postings: [
      { accountId: 'acc_002', amount: 120.50, currency: 'CHF' },
      { accountId: 'acc_001', amount: -120.50, currency: 'CHF' }
    ]
  }
]
```

---

## 11. Évolutivité et extensibilité

### 11.1 Points d'extension

#### Nouveaux formats de stockage
```typescript
// Ajouter un nouveau format sans changer le code métier
class JsonRepository implements TransactionRepository {
  // Implémentation pour JSON
}

// Configuration
const repository = config.storageFormat === 'json'
  ? new JsonRepository()
  : new TomlRepository()
```

#### Nouvelles règles de validation
```typescript
// Ajouter une règle personnalisée
class CustomBusinessRule implements ValidationRule<Transaction> {
  code = 'V-CUSTOM-001'
  severity = 'warning'

  validate(transaction: Transaction): ValidationResult {
    // Logique personnalisée
  }
}

// Enregistrer
validationEngine.registerRule(new CustomBusinessRule())
```

#### Nouveaux types de rapports
```typescript
interface ReportGenerator {
  generate(data: any): Report
}

class CustomReportGenerator implements ReportGenerator {
  generate(data: any): Report {
    // Génération personnalisée
  }
}
```

### 11.2 Plugins Architecture (Phase future)

```typescript
interface Plugin {
  name: string
  version: string
  install(app: Application): void
}

class PluginManager {
  private plugins: Plugin[] = []

  register(plugin: Plugin): void {
    plugin.install(this.app)
    this.plugins.push(plugin)
  }
}

// Exemple de plugin
class BankImportPlugin implements Plugin {
  name = 'bank-import'
  version = '1.0.0'

  install(app: Application): void {
    app.registerImportAdapter(new BankCsvAdapter())
  }
}
```

---

## 12. Décisions architecturales (ADRs)

### ADR-001: Choix de TOML pour le stockage

**Status**: Accepted

**Context**: Besoin d'un format de fichier lisible, éditable, versionnable

**Decision**: Utiliser TOML v1.0.0

**Consequences**:
- ✅ Fichier lisible et éditable manuellement
- ✅ Support natif des commentaires
- ✅ Git-friendly
- ✅ Validation stricte du schéma
- ⚠️ Performance de parsing à surveiller (10k+ transactions)

### ADR-002: Architecture Clean/Hexagonal

**Status**: Accepted

**Context**: Application complexe avec règles métier strictes

**Decision**: Adopter Clean Architecture avec séparation stricte des couches

**Consequences**:
- ✅ Testabilité maximale
- ✅ Indépendance vis-à-vis du framework
- ✅ Maintenabilité à long terme
- ⚠️ Courbe d'apprentissage pour nouveaux développeurs
- ⚠️ Plus de fichiers et de structure

### ADR-003: SvelteKit pour le frontend

**Status**: Accepted

**Context**: Besoin d'une application web réactive et performante

**Decision**: Utiliser SvelteKit

**Consequences**:
- ✅ Réactivité native
- ✅ Performance excellente
- ✅ Bundle size réduit
- ✅ Support SSR/SSG/SPA
- ⚠️ Écosystème moins mature que React

### ADR-004: Système de validation complet (102 règles)

**Status**: Accepted

**Context**: Intégrité des données financières critique

**Decision**: Implémenter toutes les 102 règles de validation documentées

**Consequences**:
- ✅ Garantie d'intégrité maximale
- ✅ Détection précoce des erreurs
- ✅ Messages d'erreur clairs (codes V-XXX-YYY)
- ✅ Conformité standards (ISO 8601, ISO 4217)
- ⚠️ Complexité de l'implémentation (16 catégories de règles)
- ⚠️ Impact performance (optimisation nécessaire avec caching)

**Détail** : Voir VALIDATION-RULES.md pour le détail complet des 102 règles

### ADR-005: Cache multi-niveaux

**Status**: Accepted

**Context**: Performance critique avec gros volumes de données

**Decision**: Implémenter un système de cache multi-niveaux

**Consequences**:
- ✅ Performance améliorée
- ✅ Scalabilité jusqu'à 10k+ transactions
- ⚠️ Complexité de l'invalidation
- ⚠️ Risque de données obsolètes

---

## 13. Migration et déploiement

### 13.1 Stratégie de déploiement

**Application SPA statique**
```
Build Process:
1. npm run build
2. Génération assets statiques
3. Optimisation (minification, tree-shaking)
4. Déploiement sur CDN ou hosting statique

Hosting options:
- Vercel (recommandé)
- Netlify
- GitHub Pages
- Self-hosted (Nginx)
```

### 13.2 Gestion des versions du fichier TOML

```typescript
interface FileMetadata {
  version: string        // Semver du schéma
  created: Date
  lastModified: Date
  appVersion: string     // Version de l'application
}

class FileVersionManager {
  async migrate(from: string, to: string): Promise<void> {
    const migrations = this.getMigrations(from, to)

    for (const migration of migrations) {
      await migration.apply()
    }
  }

  private getMigrations(from: string, to: string): Migration[] {
    // Retourne les migrations nécessaires
  }
}
```

---

## 14. Monitoring et observabilité

### 14.1 Logging

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  log(level: LogLevel, message: string, context?: any): void {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      context
    }

    // En développement: console
    if (import.meta.env.DEV) {
      console[level](message, context)
    }

    // En production: service externe (optionnel)
    if (import.meta.env.PROD) {
      this.sendToService(entry)
    }
  }
}
```

### 14.2 Error Tracking

```typescript
class ErrorTracker {
  captureException(error: Error, context?: any): void {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Log localement
    console.error(errorReport)

    // Optionnel: Envoyer à Sentry, etc.
  }
}
```

### 14.3 Performance Monitoring

```typescript
class PerformanceMonitor {
  measure(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now()

    return fn().finally(() => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    })
  }

  private recordMetric(name: string, duration: number): void {
    if (duration > this.thresholds[name]) {
      console.warn(`Performance warning: ${name} took ${duration}ms`)
    }
  }
}
```

---

## 15. Documentation et conventions

### 15.1 Conventions de code

#### TypeScript
- **Naming**: PascalCase pour classes, camelCase pour fonctions/variables
- **Types**: Utiliser interfaces pour les contrats publics
- **Null safety**: Utiliser `| null` explicitement, éviter `undefined`

#### Structure des fichiers
```typescript
// 1. Imports
import { ... } from '...'

// 2. Types/Interfaces
interface SomeInterface { }

// 3. Constants
const SOME_CONSTANT = '...'

// 4. Class/Functions
class SomeClass { }

// 5. Exports
export { SomeClass }
```

#### Commentaires
```typescript
/**
 * Calcule le solde d'un compte à une date donnée
 *
 * @param account - Le compte dont on veut le solde
 * @param date - La date à laquelle calculer le solde
 * @param transactions - Toutes les transactions du système
 * @returns Le solde du compte en Money
 *
 * @throws {ValidationError} Si le compte n'existe pas
 *
 * @example
 * const balance = calculateBalance(account, new Date(), transactions)
 */
function calculateBalance(
  account: Account,
  date: Date,
  transactions: Transaction[]
): Money {
  // ...
}
```

### 15.2 Documentation du code

- **README.md** par module si nécessaire
- **JSDoc** pour toutes les fonctions publiques
- **Exemples** dans les commentaires pour les cas complexes
- **ADRs** pour les décisions architecturales importantes

---

## 16. Checklist d'implémentation

### Phase MVP
- [ ] Mettre en place la structure de dossiers
- [ ] Implémenter les entités du domaine
- [ ] Implémenter les Value Objects
- [ ] Créer le ValidationEngine avec toutes les règles
- [ ] Implémenter les Repositories TOML
- [ ] Créer les Use Cases principaux
- [ ] Mettre en place les Stores Svelte
- [ ] Créer les composants UI de base
- [ ] Implémenter le système de cache
- [ ] Tests unitaires pour le domaine
- [ ] Tests d'intégration pour les Use Cases
- [ ] Tests E2E pour les flux principaux

### Phase 2-4
- [ ] Optimisations de performance
- [ ] Import/Export
- [ ] Recherche avancée
- [ ] Rapports et graphiques
- [ ] Documentation utilisateur

---

## Glossaire

- **Entity** : Objet métier avec identité unique
- **Value Object** : Objet immuable sans identité, défini par ses valeurs
- **Aggregate** : Cluster d'entités et value objects traités comme une unité
- **Repository** : Abstraction pour la persistence
- **Use Case** : Opération métier (commande)
- **Query Service** : Service de lecture de données
- **Domain Service** : Service avec logique métier qui ne rentre pas dans une entité
- **Validation Rule** : Règle de validation isolée et testable

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-08
**Auteurs** : Équipe Architecture Cashflow Chronicles
**Licence** : MIT
