# Cashflow Chronicles

Une application moderne de gestion de budget personnel multi-devises, construite avec SvelteKit et inspirée des principes de **Plain Text Accounting**.

## 📊 Vue d'ensemble

**Cashflow Chronicles** vous permet de gérer votre budget personnel avec plusieurs comptes dans différentes devises (CHF, EUR, USD, etc.) en utilisant les principes éprouvés de la comptabilité en partie double.

### Caractéristiques principales

- 💰 **Multi-devises** : Support natif de plusieurs devises avec gestion des taux de change
- 📈 **Comptabilité en partie double** : Garantie de cohérence et d'exactitude des données
- 📊 **Budgets et rapports** : Suivi de vos dépenses et génération de rapports détaillés
- 🔄 **Transactions récurrentes** : Automatisation des opérations répétitives
- 📱 **Interface moderne** : Application web responsive construite avec SvelteKit
- 💾 **Données locales** : Vos données financières restent sur votre machine (fichier JSON)

### Inspiré par Plain Text Accounting

L'application s'inspire des meilleurs outils de Plain Text Accounting (Beancount, Ledger, hledger) :
- Comptabilité rigoureuse et vérifiable
- Format de données simple et lisible (JSON)
- Validation stricte de l'intégrité des données
- Traçabilité complète de toutes les opérations

## 📚 Documentation

La documentation complète du projet se trouve dans le dossier [`docs/`](./docs/):

- **[Spécification fonctionnelle](./docs/SPECIFICATION.md)** : Vue d'ensemble, concepts et fonctionnalités
- **[Format de fichier JSON](./docs/JSON-FORMAT.md)** : Structure détaillée des données
- **[Règles de validation](./docs/VALIDATION-RULES.md)** : Contrôles d'intégrité et validation
- **[JSON Schema](./docs/cashflow-schema.json)** : Schéma pour validation automatique

👉 **Commencez par lire le [README de la documentation](./docs/README.md)**

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm

### Installation

```sh
# Cloner le projet
git clone https://github.com/numeyoga/cashflow-chronicles.git
cd cashflow-chronicles

# Installer les dépendances
npm install
```

### Développement

```sh
# Démarrer le serveur de développement
npm run dev

# Ou ouvrir directement dans le navigateur
npm run dev -- --open
```

L'application sera accessible sur `http://localhost:5173`

### Build de production

```sh
# Créer le build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 🏗️ État du projet

**Phase actuelle : Planification et spécification** ✅

- [x] Spécification fonctionnelle complète
- [x] Format de fichier JSON défini
- [x] Règles de validation documentées
- [x] JSON Schema créé
- [ ] Implémentation du stockage de données
- [ ] Interface utilisateur
- [ ] Validation et tests
- [ ] Support multi-devises complet

## 🛠️ Stack technique

- **Frontend** : SvelteKit, TypeScript
- **Stockage** : Fichier JSON local
- **Validation** : JSON Schema
- **Tests** : Vitest (unit), Playwright (e2e)
- **Code quality** : ESLint, Prettier

## 📖 Concepts clés

### Types de comptes

| Type | Description | Exemples |
|------|-------------|----------|
| **Assets** | Ce que vous possédez | Comptes bancaires, espèces |
| **Liabilities** | Ce que vous devez | Cartes de crédit, prêts |
| **Income** | Vos revenus | Salaire, bonus |
| **Expenses** | Vos dépenses | Alimentation, transport |
| **Equity** | Capitaux propres | Soldes d'ouverture |

### Comptabilité en partie double

Chaque transaction affecte au moins deux comptes. Par exemple :

```
Achat de courses (120.50 CHF) :
  + Expenses:Food:Groceries     120.50 CHF (débit)
  - Assets:Bank:PostFinance    -120.50 CHF (crédit)
```

**Règle d'or** : La somme des montants doit toujours être 0.

### Multi-devises

Les transferts entre devises sont gérés avec des taux de change :

```
Transfert CHF → EUR :
  + Assets:Bank:EUR:Revolut      100.00 EUR @ 0.95 CHF/EUR
  - Assets:Bank:CHF:PostFinance  -95.00 CHF
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Lire la [documentation](./docs/README.md)
2. Créer une issue pour discuter des changements
3. Fork le projet
4. Créer une branche pour votre fonctionnalité
5. Soumettre une pull request

## 📄 Licence

MIT

## 🔗 Ressources

- [Plain Text Accounting](https://plaintextaccounting.org)
- [Beancount](https://beancount.github.io/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Double-entry bookkeeping](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)
