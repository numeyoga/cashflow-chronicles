# 🔧 Todo List de Stabilisation - Cashflow Chronicles

**Créé le :** 2025-11-10
**Statut :** 31 tâches identifiées
**Estimation totale :** 40-52 heures (5-7 jours)

---

## 🔴 PRIORITÉ CRITIQUE - Bloquant pour Production (12 tâches)

### Groupe 1 : Sauvegarde TOML (4-6 heures)

#### ✅ Task 1 : Implémenter fileStorage.js pour sauvegarde TOML
**Fichier :** `src/lib/infrastructure/fileStorage.js`
**Estimation :** 1-2 heures

**Ce qu'il faut faire :**
- Créer le fichier qui est actuellement manquant mais référencé dans le code
- Implémenter les fonctions de base pour manipuler le système de fichiers
- Gérer les permissions et erreurs d'accès
- Prévoir le support du File System Access API (navigateur moderne)

**Critères d'acceptation :**
- [ ] Le fichier existe et exporte les fonctions nécessaires
- [ ] Gestion d'erreurs robuste
- [ ] Compatible navigateur (File System Access API)

---

#### ✅ Task 2 : Implémenter la fonction saveTOMLFile() avec conversion JS→TOML
**Fichier :** `src/lib/infrastructure/fileStorage.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Créer une fonction qui convertit les objets JavaScript en format TOML
- Utiliser une bibliothèque comme `@iarna/toml` ou écrire un sérialiseur manuel
- Gérer la conversion des types (Date → string ISO, nombres, arrays)
- Préserver les commentaires si possible
- Formater le TOML de manière lisible

**Exemple de signature :**
```javascript
/**
 * Sauvegarde les données au format TOML
 * @param {Object} data - Données à sauvegarder
 * @param {FileSystemFileHandle} fileHandle - Handle du fichier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveTOMLFile(data, fileHandle) {
  // 1. Convertir JS → TOML string
  // 2. Écrire dans le fichier
  // 3. Retourner le statut
}
```

**Critères d'acceptation :**
- [ ] Conversion correcte de tous les types (dates, tableaux, objets imbriqués)
- [ ] Fichier TOML valide et conforme à la spec v1.0.0
- [ ] Gestion des erreurs d'écriture
- [ ] Sauvegarde < 500ms (critère EPIC-001)

---

#### ✅ Task 3 : Implémenter la fonction createBackup() pour backups automatiques
**Fichier :** `src/lib/infrastructure/fileStorage.js`
**Estimation :** 0.5-1 heure

**Ce qu'il faut faire :**
- Créer une copie de sauvegarde avant chaque modification
- Format du backup : `{filename}.backup.{timestamp}.toml`
- Limiter le nombre de backups (ex: garder les 10 derniers)
- Gérer le nettoyage automatique des vieux backups

**Exemple de fonction :**
```javascript
/**
 * Crée un backup avant sauvegarde
 * @param {FileSystemFileHandle} fileHandle - Fichier à sauvegarder
 * @returns {Promise<string>} Nom du fichier backup créé
 */
export async function createBackup(fileHandle) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${fileHandle.name}.backup.${timestamp}.toml`;
  // Créer la copie
  return backupName;
}
```

**Critères d'acceptation :**
- [ ] Backup créé avant chaque sauvegarde
- [ ] Format de nom unique et horodaté
- [ ] Gestion automatique des vieux backups
- [ ] Pas d'erreur si le backup échoue (ne bloque pas la sauvegarde)

---

#### ✅ Task 4 : Connecter la sauvegarde au bouton UI et au dataStore
**Fichiers :** `src/lib/stores/dataStore.js`, `src/routes/+page.svelte`
**Estimation :** 1 heure

**Ce qu'il faut faire :**
- Ajouter un bouton "Sauvegarder" dans l'interface (header ou toolbar)
- Connecter le bouton à une fonction du dataStore
- Appeler `saveTOMLFile()` avec les données actuelles
- Afficher un message de succès/erreur
- Mettre à jour `metadata.lastModified` automatiquement

**Exemple d'implémentation :**
```javascript
// Dans dataStore.js
export function saveCurrentFile() {
  if (!currentFileHandle) {
    throw new Error('Aucun fichier chargé');
  }

  // Mettre à jour lastModified
  data.metadata.lastModified = new Date().toISOString();

  // Créer backup
  await createBackup(currentFileHandle);

  // Sauvegarder
  const result = await saveTOMLFile(data, currentFileHandle);

  // Afficher message
  saveMessage.set({
    type: result.success ? 'success' : 'error',
    text: result.success ? '✓ Fichier sauvegardé' : `❌ Erreur: ${result.error}`
  });
}
```

**Critères d'acceptation :**
- [ ] Bouton "Sauvegarder" visible et accessible
- [ ] Message de confirmation après sauvegarde
- [ ] `lastModified` mis à jour automatiquement
- [ ] Tests manuels réussis

---

### Groupe 2 : Tests Unitaires Validators (12-16 heures)

#### ✅ Task 5 : Créer tests unitaires pour currencyValidator.js (V-CUR-001 à V-CUR-012)
**Fichier :** `src/lib/domain/__tests__/currencyValidator.test.js`
**Estimation :** 3-4 heures

**Ce qu'il faut faire :**
- Créer un fichier de test complet avec Vitest
- Tester **TOUTES** les 12 règles de validation des devises
- Couvrir les cas valides et invalides
- Tester les edge cases (devise par défaut, taux de change)

**Structure minimale :**
```javascript
import { describe, it, expect } from 'vitest';
import { validateCurrencies, validateNewCurrency, validateNewExchangeRate } from '../currencyValidator.js';

describe('Currency Validator', () => {
  describe('V-CUR-001: Code ISO 4217', () => {
    it('devrait accepter un code ISO 4217 valide', () => { /* ... */ });
    it('devrait rejeter un code trop court', () => { /* ... */ });
    it('devrait rejeter un code avec minuscules', () => { /* ... */ });
    it('devrait rejeter un code avec chiffres', () => { /* ... */ });
  });

  describe('V-CUR-002: Unicité du code', () => {
    it('devrait rejeter un code en double', () => { /* ... */ });
  });

  // ... pour chaque règle V-CUR-003 à V-CUR-012
});
```

**Règles à tester :**
- V-CUR-001: Code ISO 4217 (3 lettres majuscules)
- V-CUR-002: Code unique
- V-CUR-003: Nom non vide
- V-CUR-004: Symbole non vide
- V-CUR-005: Décimales entre 0 et 8
- V-CUR-006: Une seule devise par défaut
- V-CUR-007: Cohérence avec metadata.defaultCurrency
- V-CUR-008: Date taux format YYYY-MM-DD
- V-CUR-009: Taux > 0
- V-CUR-010: Avertissement si taux = 1.0
- V-CUR-011: Dates de taux uniques
- V-CUR-012: Devise par défaut sans taux

**Critères d'acceptation :**
- [ ] Au moins 40 tests (3-4 par règle)
- [ ] Couverture >90% de currencyValidator.js
- [ ] Tous les tests passent
- [ ] Tests documentés avec des descriptions claires

---

#### ✅ Task 6 : Créer tests unitaires pour accountValidator.js (V-ACC-001 à V-ACC-013)
**Fichier :** `src/lib/domain/__tests__/accountValidator.test.js`
**Estimation :** 4-5 heures

**Ce qu'il faut faire :**
- Créer un fichier de test complet pour les comptes
- Tester **TOUTES** les 13 règles de validation des comptes
- Tester la validation hiérarchique (segments, cohérence parent/enfant)
- Tester la génération d'ID automatique

**Règles à tester :**
- V-ACC-001: ID format acc_XXX
- V-ACC-002: ID unique
- V-ACC-003: Nom non vide
- V-ACC-004: Nom unique
- V-ACC-005: Type valide (Assets, Liabilities, Income, Expenses, Equity)
- V-ACC-006: Devise existante
- V-ACC-007: Date d'ouverture YYYY-MM-DD
- V-ACC-008: Date de clôture >= date d'ouverture
- V-ACC-009: Au moins 2 segments
- V-ACC-010: Premier segment = type
- V-ACC-011: Aucun segment vide
- V-ACC-012: Segments avec caractères valides
- V-ACC-013: Cohérence hiérarchique

**Tests importants :**
```javascript
describe('V-ACC-009 à V-ACC-011: Validation hiérarchique', () => {
  it('devrait accepter Assets:Bank:CHF:PostFinance', () => {
    const account = {
      name: 'Assets:Bank:CHF:PostFinance',
      type: 'Assets'
    };
    const result = validateNewAccount(account, [], []);
    expect(result.valid).toBe(true);
  });

  it('devrait rejeter Assets:PostFinance (seulement 2 segments)', () => {
    // V-ACC-009: minimum 2 segments
  });

  it('devrait rejeter Expenses:Bank:CHF avec type=Assets', () => {
    // V-ACC-010: premier segment doit = type
  });

  it('devrait rejeter Assets::Bank::CHF (segments vides)', () => {
    // V-ACC-011: pas de segments vides
  });
});
```

**Critères d'acceptation :**
- [ ] Au moins 45 tests (3-4 par règle)
- [ ] Couverture >90% de accountValidator.js
- [ ] Tests de la fonction generateAccountId()
- [ ] Tous les tests passent

---

#### ✅ Task 7 : Créer tests unitaires pour transactionValidator.js (V-TXN, V-POST, V-BAL, V-FX)
**Fichier :** `src/lib/domain/__tests__/transactionValidator.test.js`
**Estimation :** 5-7 heures

**Ce qu'il faut faire :**
- Créer un fichier de test complet pour les transactions
- Tester **TOUTES** les règles : V-TXN-* (6), V-POST-* (7), V-BAL-* (3), V-FX-* (5)
- Tester l'équilibre des transactions (règle d'or)
- Tester les helpers : calculateBalance(), isBalanced(), getTransactionAmount()

**Règles à tester :**

**V-TXN (Transactions) :**
- V-TXN-001: ID format txn_XXX
- V-TXN-002: ID unique
- V-TXN-003: Date YYYY-MM-DD
- V-TXN-004: Description non vide
- V-TXN-005: Au moins 2 postings
- V-TXN-006: Date pas dans le futur (warning)

**V-POST (Postings) :**
- V-POST-001: accountId existe
- V-POST-002: amount ≠ 0
- V-POST-003: currency correspond au compte
- V-POST-004: date >= date d'ouverture compte
- V-POST-005: date <= date de fermeture compte
- V-POST-006: Pas de transactions après fermeture
- V-POST-007: Précision décimale conforme

**V-BAL (Équilibre) :**
- V-BAL-001: Somme = 0 pour chaque devise (tolérance ±0.01)
- V-BAL-002: Multi-devises nécessite taux de change
- V-BAL-003: Conversions équilibrées dans toutes devises

**V-FX (Taux de change) :**
- V-FX-001: rate > 0
- V-FX-002 à V-FX-005: Validation des conversions

**Tests critiques :**
```javascript
describe('V-BAL-001: Équilibre de la transaction', () => {
  it('devrait accepter une transaction équilibrée simple (2 postings)', () => {
    const transaction = {
      id: 'txn_001',
      date: '2025-01-15',
      description: 'Test',
      posting: [
        { accountId: 'acc_001', amount: 100.00, currency: 'CHF' },
        { accountId: 'acc_002', amount: -100.00, currency: 'CHF' }
      ]
    };
    expect(isBalanced(transaction)).toBe(true);
  });

  it('devrait accepter une transaction multi-postings équilibrée', () => {
    const transaction = {
      posting: [
        { amount: 100, currency: 'CHF' },
        { amount: -60, currency: 'CHF' },
        { amount: -40, currency: 'CHF' }
      ]
    };
    expect(isBalanced(transaction)).toBe(true);
  });

  it('devrait rejeter une transaction non équilibrée', () => {
    const transaction = {
      posting: [
        { amount: 100, currency: 'CHF' },
        { amount: -90, currency: 'CHF' }
      ]
    };
    expect(isBalanced(transaction)).toBe(false);
  });

  it('devrait accepter avec tolérance de ±0.01', () => {
    const transaction = {
      posting: [
        { amount: 100.005, currency: 'CHF' },
        { amount: -100.00, currency: 'CHF' }
      ]
    };
    expect(isBalanced(transaction)).toBe(true);
  });
});
```

**Critères d'acceptation :**
- [ ] Au moins 60 tests (environ 3 par règle)
- [ ] Couverture >90% de transactionValidator.js
- [ ] Tests des helpers (calculateBalance, isBalanced)
- [ ] Tests de la fonction generateTransactionId()
- [ ] Tous les tests passent

---

### Groupe 3 : Tests E2E User Stories (8-12 heures)

#### ✅ Task 8 : Créer test E2E pour US-001-01 (Charger un fichier TOML valide)
**Fichier :** `tests/e2e/us-001-01-load-toml.spec.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Créer un test Playwright qui simule le parcours utilisateur complet
- Tester le chargement d'un fichier TOML valide
- Vérifier l'affichage des statistiques
- Vérifier le message de succès

**Scénario à tester (selon US-001-01) :**
```javascript
import { test, expect } from '@playwright/test';

test.describe('US-001-01: Charger un fichier TOML valide', () => {
  test('devrait charger un fichier TOML et afficher les statistiques', async ({ page }) => {
    // 1. Aller sur la page d'accueil
    await page.goto('/');

    // 2. Vérifier que le bouton "Ouvrir un fichier" est visible
    const openButton = page.locator('button:has-text("Ouvrir un fichier")');
    await expect(openButton).toBeVisible();

    // 3. Simuler la sélection d'un fichier TOML
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-valid-minimal.toml');

    // 4. Attendre le chargement
    await page.waitForSelector('.dashboard', { timeout: 5000 });

    // 5. Vérifier que les statistiques sont affichées
    await expect(page.locator('.stat-card:has-text("Comptes")')).toContainText('2');
    await expect(page.locator('.stat-card:has-text("Transactions")')).toContainText('1');

    // 6. Vérifier le message de succès (si affiché)
    // await expect(page.locator('.alert-success')).toContainText('✓ Fichier chargé avec succès');

    // 7. Vérifier que les liens rapides sont actifs
    await expect(page.locator('a[href="/currencies"]')).toBeVisible();
    await expect(page.locator('a[href="/accounts"]')).toBeVisible();
  });

  test('devrait charger en moins de 1 seconde (critère US-001-01)', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-10k-transactions.toml');
    await page.waitForSelector('.dashboard');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(1000); // < 1 seconde
  });
});
```

**Fichiers de test nécessaires :**
- Créer `tests/fixtures/test-valid-minimal.toml` (fichier de test minimal)
- Créer `tests/fixtures/test-10k-transactions.toml` (test de performance)

**Critères d'acceptation :**
- [ ] Test du scénario nominal complet
- [ ] Test de la performance (< 1s pour 10k transactions)
- [ ] Test de l'affichage des statistiques
- [ ] Tous les tests passent

---

#### ✅ Task 9 : Créer test E2E pour US-001-03 (Sauvegarder les données en TOML)
**Fichier :** `tests/e2e/us-001-03-save-toml.spec.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Tester le scénario de sauvegarde complet
- Vérifier la création du backup
- Vérifier le message de confirmation
- Vérifier que le fichier sauvegardé est valide

**Scénario selon US-001-03 :**
```javascript
test('devrait sauvegarder le fichier avec backup', async ({ page }) => {
  // 1. Charger un fichier
  await page.goto('/');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/test-valid.toml');
  await page.waitForSelector('.dashboard');

  // 2. Faire une modification (ajouter une devise)
  await page.goto('/currencies');
  await page.click('button:has-text("Ajouter une devise")');
  await page.fill('input[name="code"]', 'EUR');
  await page.fill('input[name="name"]', 'Euro');
  await page.fill('input[name="symbol"]', '€');
  await page.fill('input[name="decimalPlaces"]', '2');
  await page.click('button[type="submit"]');

  // 3. Cliquer sur Sauvegarder
  await page.click('button:has-text("Sauvegarder")');

  // 4. Vérifier le message de succès
  await expect(page.locator('.alert-success')).toContainText('✓ Fichier sauvegardé');

  // 5. Vérifier que lastModified a été mis à jour
  // (nécessite accès au dataStore ou inspection du fichier)
});

test('devrait sauvegarder en moins de 500ms (critère EPIC-001)', async ({ page }) => {
  // Test de performance de sauvegarde
  // < 500ms selon critère EPIC-001
});
```

**Critères d'acceptation :**
- [ ] Test du scénario de sauvegarde complet
- [ ] Vérification de la création du backup
- [ ] Test de performance (< 500ms)
- [ ] Tous les tests passent

---

#### ✅ Task 10 : Créer test E2E pour US-002-01 (Ajouter une nouvelle devise)
**Fichier :** `tests/e2e/us-002-01-add-currency.spec.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Tester le formulaire d'ajout de devise
- Tester les validations (code ISO, unicité, etc.)
- Vérifier l'affichage dans la liste
- Tester les cas d'erreur

**Scénario selon US-002-01 :**
```javascript
test.describe('US-002-01: Ajouter une nouvelle devise', () => {
  test.beforeEach(async ({ page }) => {
    // Charger un fichier avec CHF par défaut
    await page.goto('/');
    await page.click('button:has-text("Créer un nouveau budget")');
    await page.goto('/currencies');
  });

  test('devrait ajouter EUR avec succès', async ({ page }) => {
    // 1. Cliquer sur "Ajouter une devise"
    await page.click('button:has-text("Ajouter une devise")');

    // 2. Remplir le formulaire
    await page.fill('input[name="code"]', 'EUR');
    await page.fill('input[name="name"]', 'Euro');
    await page.fill('input[name="symbol"]', '€');
    await page.fill('input[name="decimalPlaces"]', '2');

    // 3. Soumettre
    await page.click('button[type="submit"]');

    // 4. Vérifier le message de succès
    await expect(page.locator('.alert-success')).toContainText('✓ Devise EUR ajoutée');

    // 5. Vérifier que EUR apparaît dans la liste
    await expect(page.locator('.currency-card:has-text("EUR")')).toBeVisible();
    await expect(page.locator('.currency-card:has-text("Euro")')).toBeVisible();
  });

  test('devrait rejeter un code invalide (non ISO 4217)', async ({ page }) => {
    await page.click('button:has-text("Ajouter une devise")');
    await page.fill('input[name="code"]', 'EURO'); // Invalide: 4 lettres
    await page.fill('input[name="name"]', 'Euro');
    await page.fill('input[name="symbol"]', '€');
    await page.click('button[type="submit"]');

    // Vérifier le message d'erreur V-CUR-001
    await expect(page.locator('.error-message')).toContainText('3 lettres majuscules');
  });

  test('devrait rejeter un code en double', async ({ page }) => {
    // Ajouter EUR une première fois
    await page.click('button:has-text("Ajouter une devise")');
    await page.fill('input[name="code"]', 'EUR');
    // ... remplir les autres champs
    await page.click('button[type="submit"]');

    // Essayer d'ajouter EUR à nouveau
    await page.click('button:has-text("Ajouter une devise")');
    await page.fill('input[name="code"]', 'EUR');
    await page.click('button[type="submit"]');

    // Vérifier l'erreur V-CUR-002
    await expect(page.locator('.error-message')).toContainText('existe déjà');
  });

  test('devrait trier les devises par code alphabétique', async ({ page }) => {
    // Ajouter USD puis EUR
    // Vérifier que l'affichage est CHF, EUR, USD
  });
});
```

**Critères d'acceptation :**
- [ ] Test du scénario nominal (ajout réussi)
- [ ] Test des validations (V-CUR-001, V-CUR-002, etc.)
- [ ] Test du tri alphabétique
- [ ] Test de l'affichage immédiat dans la liste
- [ ] Tous les tests passent

---

#### ✅ Task 11 : Créer test E2E pour US-003-01 (Créer un compte bancaire)
**Fichier :** `tests/e2e/us-003-01-create-account.spec.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Tester le formulaire de création de compte
- Tester la validation hiérarchique
- Vérifier la génération d'ID automatique
- Tester l'affichage dans la hiérarchie

**Scénario selon US-003-01 :**
```javascript
test.describe('US-003-01: Créer un compte bancaire (Assets)', () => {
  test('devrait créer Assets:Bank:CHF:PostFinance avec succès', async ({ page }) => {
    // Setup
    await page.goto('/');
    await page.click('button:has-text("Créer un nouveau budget")');
    await page.goto('/accounts');

    // 1. Cliquer sur "Nouveau compte"
    await page.click('button:has-text("Nouveau compte")');

    // 2. Remplir le formulaire
    await page.selectOption('select[name="type"]', 'Assets');
    await page.fill('input[name="name"]', 'Assets:Bank:CHF:PostFinance');
    await page.selectOption('select[name="currency"]', 'CHF');
    await page.fill('input[name="opened"]', '2025-01-01');
    await page.fill('textarea[name="description"]', 'Compte bancaire principal');

    // 3. Soumettre
    await page.click('button[type="submit"]');

    // 4. Vérifier le message de succès
    await expect(page.locator('.alert-success')).toContainText('✓ Compte');
    await expect(page.locator('.alert-success')).toContainText('PostFinance');

    // 5. Vérifier que le compte apparaît dans la liste
    await expect(page.locator('.account-item:has-text("PostFinance")')).toBeVisible();

    // 6. Vérifier que l'ID a été généré (acc_001)
    // (vérifier dans les détails ou l'export)
  });

  test('devrait rejeter un nom avec moins de 2 segments (V-ACC-009)', async ({ page }) => {
    await page.goto('/accounts');
    await page.click('button:has-text("Nouveau compte")');
    await page.fill('input[name="name"]', 'Assets'); // 1 segment seulement
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('au moins 2 segments');
  });

  test('devrait rejeter incohérence type/nom (V-ACC-010)', async ({ page }) => {
    await page.goto('/accounts');
    await page.click('button:has-text("Nouveau compte")');
    await page.selectOption('select[name="type"]', 'Assets');
    await page.fill('input[name="name"]', 'Expenses:Food:Restaurants'); // Incohérent!
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('premier segment doit');
  });
});
```

**Critères d'acceptation :**
- [ ] Test du scénario nominal (création réussie)
- [ ] Test de la validation hiérarchique (V-ACC-009, V-ACC-010, V-ACC-011)
- [ ] Test de la génération d'ID automatique
- [ ] Test de l'affichage dans la hiérarchie
- [ ] Tous les tests passent

---

#### ✅ Task 12 : Créer test E2E pour US-004-01 (Enregistrer une dépense simple)
**Fichier :** `tests/e2e/us-004-01-create-transaction.spec.js`
**Estimation :** 2-3 heures

**Ce qu'il faut faire :**
- Tester le formulaire de transaction
- Tester la validation de l'équilibre
- Vérifier l'indicateur d'équilibre en temps réel
- Tester la mise à jour des soldes

**Scénario selon US-004-01 :**
```javascript
test.describe('US-004-01: Enregistrer une dépense simple', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: créer un fichier avec 2 comptes
    await page.goto('/');
    await page.click('button:has-text("Créer un nouveau budget")');

    // Créer compte Assets
    await page.goto('/accounts');
    await page.click('button:has-text("Nouveau compte")');
    await page.selectOption('select[name="type"]', 'Assets');
    await page.fill('input[name="name"]', 'Assets:Bank:CHF:PostFinance');
    await page.selectOption('select[name="currency"]', 'CHF');
    await page.fill('input[name="opened"]', '2025-01-01');
    await page.click('button[type="submit"]');

    // Créer compte Expenses
    await page.click('button:has-text("Nouveau compte")');
    await page.selectOption('select[name="type"]', 'Expenses');
    await page.fill('input[name="name"]', 'Expenses:Food:Groceries');
    await page.selectOption('select[name="currency"]', 'CHF');
    await page.fill('input[name="opened"]', '2025-01-01');
    await page.click('button[type="submit"]');
  });

  test('devrait créer une dépense simple équilibrée', async ({ page }) => {
    await page.goto('/transactions');

    // 1. Cliquer sur "Nouvelle transaction"
    await page.click('button:has-text("Nouvelle transaction")');

    // 2. Remplir le formulaire
    await page.fill('input[name="date"]', '2025-01-15');
    await page.fill('input[name="description"]', 'Courses au supermarché Migros');
    await page.fill('input[name="payee"]', 'Migros');

    // 3. Ajouter posting 1 (Expenses)
    await page.selectOption('select[name="posting[0].accountId"]', 'acc_002'); // Expenses
    await page.fill('input[name="posting[0].amount"]', '120.50');

    // 4. Ajouter posting 2 (Assets)
    await page.selectOption('select[name="posting[1].accountId"]', 'acc_001'); // Assets
    await page.fill('input[name="posting[1].amount"]', '-120.50');

    // 5. Vérifier l'indicateur d'équilibre
    await expect(page.locator('.balance-indicator')).toContainText('✓');
    await expect(page.locator('.balance-indicator')).toContainText('0.00 CHF');

    // 6. Soumettre
    await page.click('button[type="submit"]');

    // 7. Vérifier le message de succès
    await expect(page.locator('.alert-success')).toContainText('✓ Transaction enregistrée');

    // 8. Vérifier que la transaction apparaît dans la liste
    await expect(page.locator('.transaction-item:has-text("Migros")')).toBeVisible();
    await expect(page.locator('.transaction-item:has-text("120.50")')).toBeVisible();
  });

  test('devrait rejeter une transaction non équilibrée (V-BAL-001)', async ({ page }) => {
    await page.goto('/transactions');
    await page.click('button:has-text("Nouvelle transaction")');

    await page.fill('input[name="date"]', '2025-01-15');
    await page.fill('input[name="description"]', 'Test');
    await page.fill('input[name="posting[0].amount"]', '100.00');
    await page.fill('input[name="posting[1].amount"]', '-90.00'); // Non équilibré!

    // Vérifier l'indicateur d'équilibre
    await expect(page.locator('.balance-indicator')).toContainText('⚠️');
    await expect(page.locator('.balance-indicator')).toContainText('-10.00');

    // Essayer de soumettre
    await page.click('button[type="submit"]');

    // Vérifier l'erreur
    await expect(page.locator('.error-message')).toContainText('non équilibrée');
  });

  test('devrait afficher l\'indicateur d\'équilibre en temps réel', async ({ page }) => {
    // Tester que l'indicateur se met à jour à chaque modification de montant
  });
});
```

**Critères d'acceptation :**
- [ ] Test du scénario nominal (création réussie)
- [ ] Test de la validation d'équilibre (V-BAL-001)
- [ ] Test de l'indicateur d'équilibre en temps réel
- [ ] Test de l'affichage dans la liste
- [ ] Tous les tests passent

---

## 🟠 PRIORITÉ HAUTE - Qualité du Code (11 tâches)

### Groupe 4 : Tests Unitaires Stores (6-8 heures)

#### ✅ Task 13 : Créer tests unitaires pour dataStore.js
**Fichier :** `src/lib/stores/__tests__/dataStore.test.js`
**Estimation :** 2 heures

**Ce qu'il faut faire :**
- Tester les fonctions du store principal
- Tester `loadData()`, `clearData()`
- Tester les stores dérivés (`stats`)
- Vérifier la réactivité des stores

**Tests à créer :**
```javascript
describe('dataStore', () => {
  it('devrait charger des données valides', () => {
    const testData = {
      version: '1.0.0',
      metadata: { /* ... */ },
      currency: [],
      account: [],
      transaction: []
    };

    dataStore.loadData(testData, { name: 'test.toml' });

    const store = get(dataStore);
    expect(store.data).toBeDefined();
    expect(store.fileName).toBe('test.toml');
  });

  it('devrait calculer les statistiques correctement', () => {
    const testData = {
      currency: [{ code: 'CHF' }, { code: 'EUR' }],
      account: [{ id: 'acc_001' }],
      transaction: [{ id: 'txn_001' }, { id: 'txn_002' }]
    };

    dataStore.loadData(testData, { name: 'test.toml' });

    const statistics = get(stats);
    expect(statistics.currencies).toBe(2);
    expect(statistics.accounts).toBe(1);
    expect(statistics.transactions).toBe(2);
  });

  it('devrait vider les données', () => {
    dataStore.loadData({ /* ... */ }, { name: 'test.toml' });
    dataStore.clearData();

    const store = get(dataStore);
    expect(store.data).toBeNull();
    expect(store.fileName).toBeNull();
  });
});
```

**Critères d'acceptation :**
- [ ] Au moins 15 tests
- [ ] Couverture >80% de dataStore.js
- [ ] Tests de réactivité Svelte
- [ ] Tous les tests passent

---

#### ✅ Task 14 : Créer tests unitaires pour currencyStore.js
**Fichier :** `src/lib/stores/__tests__/currencyStore.test.js`
**Estimation :** 1.5 heures

**Ce qu'il faut faire :**
- Tester `addCurrency()`, `updateCurrency()`, `deleteCurrency()`
- Tester `addExchangeRate()`, `deleteExchangeRate()`
- Tester les fonctions d'export CSV
- Vérifier que les modifications mettent à jour le dataStore

**Tests à créer :**
```javascript
describe('currencyStore', () => {
  beforeEach(() => {
    // Initialiser dataStore avec données de test
    dataStore.loadData({
      version: '1.0.0',
      metadata: { defaultCurrency: 'CHF' },
      currency: [
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
      ]
    }, { name: 'test.toml' });
  });

  it('devrait ajouter une devise', () => {
    const newCurrency = {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalPlaces: 2,
      isDefault: false
    };

    addCurrency(newCurrency);

    const currencies = get(currencyStore);
    expect(currencies).toHaveLength(2);
    expect(currencies.find(c => c.code === 'EUR')).toBeDefined();
  });

  it('devrait exporter les devises en CSV', () => {
    const csv = exportCurrenciesCSV();
    expect(csv).toContain('code,name,symbol,decimalPlaces,isDefault');
    expect(csv).toContain('CHF,Swiss Franc,CHF,2,true');
  });
});
```

**Critères d'acceptation :**
- [ ] Au moins 10 tests
- [ ] Couverture >80%
- [ ] Tous les tests passent

---

#### ✅ Task 15 : Créer tests unitaires pour accountStore.js
**Fichier :** `src/lib/stores/__tests__/accountStore.test.js`
**Estimation :** 1.5 heures

**Ce qu'il faut faire :**
- Tester `addAccount()`, `updateAccount()`, `deleteAccount()`
- Tester `calculateAccountBalance()`
- Tester les fonctions d'export CSV
- Tester le tri et la hiérarchie

**Critères d'acceptation :**
- [ ] Au moins 10 tests
- [ ] Couverture >80%
- [ ] Tous les tests passent

---

#### ✅ Task 16 : Créer tests unitaires pour transactionStore.js
**Fichier :** `src/lib/stores/__tests__/transactionStore.test.js`
**Estimation :** 1.5 heures

**Ce qu'il faut faire :**
- Tester `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
- Tester les filtres et le tri
- Vérifier la mise à jour des soldes de comptes
- Tester les fonctions d'export

**Critères d'acceptation :**
- [ ] Au moins 12 tests
- [ ] Couverture >80%
- [ ] Tests de mise à jour des soldes
- [ ] Tous les tests passent

---

### Groupe 5 : Tests Composants Svelte (10-14 heures)

#### ✅ Task 17 : Créer tests Svelte pour CurrencyForm et CurrencyList
**Fichiers :** `src/lib/components/currencies/__tests__/CurrencyForm.test.js`, `CurrencyList.test.js`
**Estimation :** 3-4 heures

**Ce qu'il faut faire :**
- Installer `@testing-library/svelte` si nécessaire
- Tester le rendu des composants
- Tester les interactions utilisateur (click, input, submit)
- Tester les validations côté client
- Tester l'émission d'événements

**Exemple de tests :**
```javascript
import { render, fireEvent, screen } from '@testing-library/svelte';
import CurrencyForm from '../CurrencyForm.svelte';

describe('CurrencyForm', () => {
  it('devrait afficher le formulaire', () => {
    render(CurrencyForm);
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByLabelText('Symbole')).toBeInTheDocument();
  });

  it('devrait valider le code devise', async () => {
    render(CurrencyForm);

    const codeInput = screen.getByLabelText('Code');
    await fireEvent.input(codeInput, { target: { value: 'EURO' } });

    const submitButton = screen.getByRole('button', { name: /ajouter/i });
    await fireEvent.click(submitButton);

    expect(screen.getByText(/3 lettres majuscules/i)).toBeInTheDocument();
  });

  it('devrait émettre l\'événement onSuccess après soumission valide', async () => {
    const onSuccess = vi.fn();
    render(CurrencyForm, { props: { onSuccess } });

    // Remplir le formulaire
    await fireEvent.input(screen.getByLabelText('Code'), { target: { value: 'EUR' } });
    await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Euro' } });
    // ...

    await fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    expect(onSuccess).toHaveBeenCalled();
  });
});
```

**Critères d'acceptation :**
- [ ] Au moins 20 tests (CurrencyForm + CurrencyList)
- [ ] Tests du rendu
- [ ] Tests des interactions
- [ ] Tests de validation
- [ ] Tous les tests passent

---

#### ✅ Task 18 : Créer tests Svelte pour AccountForm et AccountList
**Estimation :** 3-4 heures

**Ce qu'il faut faire :**
- Tester le formulaire de compte (validation hiérarchique)
- Tester la liste hiérarchique
- Tester les actions (modifier, supprimer)

**Critères d'acceptation :**
- [ ] Au moins 20 tests
- [ ] Tous les tests passent

---

#### ✅ Task 19 : Créer tests Svelte pour TransactionForm et TransactionList
**Estimation :** 4-5 heures

**Ce qu'il faut faire :**
- Tester le formulaire de transaction (le plus complexe)
- Tester l'ajout/suppression de postings
- Tester l'indicateur d'équilibre en temps réel
- Tester la liste de transactions

**Tests importants :**
```javascript
it('devrait mettre à jour l\'indicateur d\'équilibre en temps réel', async () => {
  render(TransactionForm);

  const amount1 = screen.getByLabelText('Posting 1 - Montant');
  const amount2 = screen.getByLabelText('Posting 2 - Montant');

  await fireEvent.input(amount1, { target: { value: '100' } });
  await fireEvent.input(amount2, { target: { value: '-100' } });

  const indicator = screen.getByTestId('balance-indicator');
  expect(indicator).toContainText('✓');
  expect(indicator).toContainText('0.00');
});

it('devrait permettre d\'ajouter un 3ème posting', async () => {
  render(TransactionForm);

  const addButton = screen.getByRole('button', { name: /ajouter un posting/i });
  await fireEvent.click(addButton);

  const postings = screen.getAllByLabelText(/Posting \d - Compte/);
  expect(postings).toHaveLength(3);
});
```

**Critères d'acceptation :**
- [ ] Au moins 25 tests
- [ ] Test de l'indicateur d'équilibre
- [ ] Test de l'ajout/suppression de postings
- [ ] Tous les tests passent

---

#### ✅ Task 20 : Créer tests Svelte pour ExchangeRateForm
**Estimation :** 1-2 heures

**Ce qu'il faut faire :**
- Tester le formulaire de taux de change
- Tester la validation (date, rate > 0)
- Tester l'affichage dans CurrencyList

**Critères d'acceptation :**
- [ ] Au moins 8 tests
- [ ] Tous les tests passent

---

### Groupe 6 : Configuration et Infrastructure (2-3 heures)

#### ✅ Task 21 : Installer et configurer Vitest correctement (npm install)
**Estimation :** 0.5 heure

**Ce qu'il faut faire :**
- Exécuter `npm install` pour installer toutes les dépendances
- Vérifier que Vitest fonctionne : `npm test`
- Vérifier que Playwright fonctionne : `npm run test:e2e`
- Corriger les erreurs de dépendances si nécessaire

**Commandes :**
```bash
cd /home/user/cashflow-chronicles
npm install
npm test -- --run
npm run test:e2e -- --ui
```

**Critères d'acceptation :**
- [ ] `npm test` fonctionne
- [ ] `npm run test:e2e` fonctionne
- [ ] Aucune erreur de dépendances manquantes

---

#### ✅ Task 22 : Configurer la couverture de tests à >80% minimum
**Fichier :** `vitest.config.js`
**Estimation :** 1 heure

**Ce qu'il faut faire :**
- Configurer Vitest pour générer un rapport de couverture
- Définir les seuils minimums (80% lignes, 80% branches, 80% fonctions)
- Exclure les fichiers de test et les fichiers générés
- Créer un script npm pour vérifier la couverture

**Configuration :**
```javascript
// vitest.config.js
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        '.svelte-kit/',
        'build/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
};
```

**Scripts npm à ajouter :**
```json
{
  "scripts": {
    "test:coverage": "vitest --coverage",
    "test:coverage:ui": "vitest --coverage --ui"
  }
}
```

**Critères d'acceptation :**
- [ ] `npm run test:coverage` génère un rapport HTML
- [ ] Seuils configurés à 80% minimum
- [ ] Rapport lisible et exploitable
- [ ] CI échoue si couverture < 80%

---

## 🟡 PRIORITÉ MOYENNE - UX et Cohérence (5 tâches)

#### ✅ Task 23 : Activer le lien Transactions dans la page d'accueil
**Fichier :** `src/routes/+page.svelte`
**Estimation :** 0.25 heure (15 min)

**Ce qu'il faut faire :**
- Ligne 122-125 : Remplacer `<div class="quick-link disabled">` par `<a href="/transactions" class="quick-link">`
- Retirer la classe `disabled`
- Vérifier que le lien fonctionne

**Code actuel (lignes 122-125) :**
```svelte
<div class="quick-link disabled">
    <span class="icon">📝</span>
    <span class="link-text">Transactions</span>
</div>
```

**Code corrigé :**
```svelte
<a href="/transactions" class="quick-link">
    <span class="icon">📝</span>
    <span class="link-text">Transactions</span>
</a>
```

**Critères d'acceptation :**
- [ ] Le lien est cliquable
- [ ] Redirige vers `/transactions`
- [ ] Style cohérent avec les autres liens actifs

---

#### ✅ Task 24 : Vérifier que toutes les fonctionnalités implémentées sont accessibles dans l'UI
**Estimation :** 0.5 heure

**Ce qu'il faut faire :**
- Parcourir toutes les pages
- Vérifier que tous les liens fonctionnent
- Vérifier que tous les boutons sont accessibles
- Tester le parcours utilisateur de bout en bout

**Checklist :**
- [ ] Page d'accueil → Charger fichier ✓
- [ ] Page d'accueil → Créer nouveau fichier ✓
- [ ] Page d'accueil → Lien vers Devises ✓
- [ ] Page d'accueil → Lien vers Comptes ✓
- [ ] Page d'accueil → Lien vers Transactions (à corriger)
- [ ] Page Devises → Formulaire accessible ✓
- [ ] Page Devises → Export CSV ✓
- [ ] Page Comptes → Formulaire accessible ✓
- [ ] Page Comptes → Export CSV ✓
- [ ] Page Transactions → Formulaire accessible ✓
- [ ] Navigation retour (breadcrumbs ou bouton retour) ?

**Critères d'acceptation :**
- [ ] Toutes les fonctionnalités implémentées sont accessibles
- [ ] Pas de liens morts
- [ ] Navigation fluide

---

#### ✅ Task 25 : Ajouter indicateurs visuels pour fonctionnalités en développement
**Estimation :** 0.5 heure

**Ce qu'il faut faire :**
- Si certaines fonctionnalités sont en cours de développement, ajouter un badge "Beta" ou "En développement"
- Documenter les fonctionnalités manquantes dans l'UI
- Afficher un message informatif si l'utilisateur clique sur une fonctionnalité non disponible

**Exemple :**
```svelte
<div class="quick-link disabled" title="Fonctionnalité en cours de développement">
    <span class="icon">📊</span>
    <span class="link-text">Rapports</span>
    <span class="badge badge-dev">Bientôt</span>
</div>
```

**Critères d'acceptation :**
- [ ] Indicateurs clairs pour fonctionnalités en développement
- [ ] Messages informatifs
- [ ] Style cohérent

---

#### ✅ Task 26 : Créer docs/TESTING-STRATEGY.md avec stratégie de tests
**Fichier :** `docs/TESTING-STRATEGY.md`
**Estimation :** 1 heure

**Ce qu'il faut faire :**
- Documenter la stratégie de tests (unitaires, intégration, E2E)
- Lister les outils utilisés (Vitest, Playwright, Testing Library)
- Documenter la pyramide de tests
- Définir les objectifs de couverture
- Lier aux User Stories et règles de validation

**Structure suggérée :**
```markdown
# Stratégie de Tests - Cashflow Chronicles

## Objectifs de Couverture
- Couverture globale : >80%
- Validators : >90%
- Stores : >80%
- Composants : >70%

## Types de Tests

### Tests Unitaires (Vitest)
- Validators (domain/)
- Stores (stores/)
- Helpers et utilitaires

### Tests Composants (Svelte Testing Library)
- Composants UI (components/)
- Rendu, interactions, événements

### Tests E2E (Playwright)
- Parcours utilisateur complets
- User Stories validées

## Mapping Tests → Spécifications
- Chaque règle de validation (V-XXX-YYY) doit avoir au moins 1 test
- Chaque User Story doit avoir au moins 1 test E2E
- ...
```

**Critères d'acceptation :**
- [ ] Document complet et structuré
- [ ] Références aux User Stories
- [ ] Instructions claires pour les développeurs

---

#### ✅ Task 27 : Documenter comment exécuter les tests dans README.md
**Fichier :** `README.md`
**Estimation :** 0.5 heure

**Ce qu'il faut faire :**
- Ajouter une section "Tests" dans le README
- Documenter les commandes npm
- Expliquer comment lire les rapports de couverture
- Ajouter des exemples

**Contenu à ajouter :**
```markdown
## Tests

### Exécuter tous les tests
```bash
npm test
```

### Tests avec interface UI
```bash
npm run test:ui
```

### Tests avec couverture
```bash
npm run test:coverage
```

### Tests E2E
```bash
npm run test:e2e
```

### Tests E2E en mode UI
```bash
npm run test:e2e -- --ui
```

## Rapports de Couverture
Les rapports sont générés dans `coverage/` :
- `coverage/index.html` : Rapport HTML interactif
- `coverage/lcov.info` : Pour intégration CI/CD
```

**Critères d'acceptation :**
- [ ] README mis à jour
- [ ] Exemples clairs
- [ ] Documentation complète

---

#### ✅ Task 28 : Lier chaque test aux User Stories et règles de validation
**Estimation :** 1 heure

**Ce qu'il faut faire :**
- Ajouter des commentaires dans les fichiers de test
- Référencer les User Stories (US-XXX-YY) et règles (V-XXX-YYY)
- Créer une matrice de traçabilité dans `docs/TEST-TRACEABILITY.md`

**Exemple de commentaires dans les tests :**
```javascript
/**
 * Tests pour US-002-01 : Ajouter une nouvelle devise
 * Critères d'acceptation :
 * - Le formulaire d'ajout de devise est accessible
 * - Le code devise accepte uniquement 3 lettres majuscules (ISO 4217)
 * - La validation empêche l'ajout d'un code déjà existant
 */
describe('US-002-01: Ajouter une nouvelle devise', () => {
  // Test V-CUR-001
  it('devrait accepter uniquement des codes ISO 4217', () => { /* ... */ });

  // Test V-CUR-002
  it('devrait rejeter un code en double', () => { /* ... */ });
});
```

**Matrice de traçabilité (exemple) :**
```markdown
# Matrice de Traçabilité Tests ↔ Spécifications

| User Story | Règles de Validation | Tests Unitaires | Tests E2E | Statut |
|------------|---------------------|-----------------|-----------|--------|
| US-001-01  | V-FILE-001 à V-FILE-005 | validator.test.js | us-001-01-load-toml.spec.js | ✅ |
| US-002-01  | V-CUR-001 à V-CUR-007 | currencyValidator.test.js | us-002-01-add-currency.spec.js | ⏳ |
| ...        | ...                 | ...             | ...       | ...    |
```

**Critères d'acceptation :**
- [ ] Tous les tests référencent leurs User Stories
- [ ] Matrice de traçabilité créée
- [ ] Couverture complète documentée

---

## 🟢 PRIORITÉ BASSE - Nice-to-have (3 tâches)

#### ✅ Task 29 : Tester la performance avec 10 000 transactions
**Estimation :** 2 heures

**Ce qu'il faut faire :**
- Créer un fichier TOML de test avec 10 000 transactions
- Générer les données avec un script
- Tester le chargement (critère : < 1 seconde)
- Mesurer le temps de sauvegarde (critère : < 500ms)
- Mesurer le temps de validation

**Script de génération :**
```javascript
// scripts/generate-test-data.js
function generateLargeTomlFile(numTransactions) {
  let toml = 'version = "1.0.0"\n\n';

  // Metadata
  toml += '[metadata]\n';
  toml += 'created = "2025-01-01T00:00:00Z"\n';
  toml += 'lastModified = "2025-01-01T00:00:00Z"\n';
  toml += 'defaultCurrency = "CHF"\n\n';

  // Devises
  toml += '[[currency]]\ncode = "CHF"\nname = "Swiss Franc"\n...\n\n';

  // Comptes
  toml += '[[account]]\nid = "acc_001"\nname = "Assets:Bank:CHF"\n...\n\n';
  toml += '[[account]]\nid = "acc_002"\nname = "Expenses:Food"\n...\n\n';

  // Générer N transactions
  for (let i = 1; i <= numTransactions; i++) {
    toml += `[[transaction]]\n`;
    toml += `id = "txn_${i.toString().padStart(6, '0')}"\n`;
    toml += `date = "2025-01-${(i % 28) + 1}"\n`;
    toml += `description = "Transaction ${i}"\n`;
    toml += `  [[transaction.posting]]\n`;
    toml += `  accountId = "acc_001"\n`;
    toml += `  amount = 100.00\n`;
    toml += `  currency = "CHF"\n`;
    toml += `  [[transaction.posting]]\n`;
    toml += `  accountId = "acc_002"\n`;
    toml += `  amount = -100.00\n`;
    toml += `  currency = "CHF"\n\n`;
  }

  return toml;
}

// Générer et sauvegarder
const fs = require('fs');
const largeFile = generateLargeTomlFile(10000);
fs.writeFileSync('tests/fixtures/test-10k-transactions.toml', largeFile);
```

**Tests de performance :**
```javascript
describe('Performance avec 10 000 transactions', () => {
  it('devrait charger en moins de 1 seconde', async () => {
    const file = await readFile('tests/fixtures/test-10k-transactions.toml');
    const startTime = performance.now();
    const result = loadTOMLFile(file);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(1000); // < 1s
  });

  it('devrait sauvegarder en moins de 500ms', async () => {
    // ...
  });
});
```

**Critères d'acceptation :**
- [ ] Fichier de 10 000 transactions généré
- [ ] Chargement < 1 seconde ✓
- [ ] Sauvegarde < 500ms ✓
- [ ] Tests de performance automatisés

---

#### ✅ Task 30 : Optimiser le chargement si nécessaire (indexation, pagination)
**Estimation :** 3-4 heures

**Ce qu'il faut faire :**
- **SI** les tests de performance échouent, optimiser :
  - Indexation des transactions par date
  - Pagination dans l'affichage des listes
  - Virtualisation des listes longues (svelte-virtual-list)
  - Lazy loading des composants

**Optimisations possibles :**

1. **Indexation :**
```javascript
// Créer un index pour recherche rapide
const transactionIndex = new Map();
transactions.forEach(tx => {
  transactionIndex.set(tx.id, tx);
});

// Recherche O(1) au lieu de O(n)
const tx = transactionIndex.get('txn_001');
```

2. **Pagination :**
```svelte
<script>
  let currentPage = 1;
  let pageSize = 50;

  $: paginatedTransactions = $transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
</script>

<TransactionList transactions={paginatedTransactions} />
<Pagination {currentPage} totalPages={Math.ceil($transactions.length / pageSize)} />
```

3. **Virtualisation :**
```bash
npm install svelte-virtual-list
```

```svelte
<script>
  import VirtualList from 'svelte-virtual-list';
</script>

<VirtualList items={$transactions} let:item>
  <TransactionItem transaction={item} />
</VirtualList>
```

**Critères d'acceptation :**
- [ ] Tests de performance passent
- [ ] Pas de ralentissement visible dans l'UI
- [ ] Pagination fonctionnelle si implémentée

---

#### ✅ Task 31 : Mesurer et reporter les temps de chargement dans les tests
**Estimation :** 1 heure

**Ce qu'il faut faire :**
- Ajouter des métriques de performance dans les tests
- Reporter les temps dans le rapport de test
- Créer un benchmark automatique
- Suivre l'évolution des performances

**Exemple d'implémentation :**
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Performance Benchmarks', () => {
  const metrics = {
    loadTimes: [],
    saveTimes: [],
    validationTimes: []
  };

  afterAll(() => {
    // Reporter les métriques
    console.log('📊 Performance Report:');
    console.log(`  Load time (avg): ${average(metrics.loadTimes)}ms`);
    console.log(`  Save time (avg): ${average(metrics.saveTimes)}ms`);
    console.log(`  Validation time (avg): ${average(metrics.validationTimes)}ms`);

    // Sauvegarder dans un fichier JSON
    writeFileSync('performance-report.json', JSON.stringify(metrics, null, 2));
  });

  it('benchmark: chargement de fichiers de différentes tailles', () => {
    const sizes = [100, 1000, 5000, 10000];

    sizes.forEach(size => {
      const file = generateTestFile(size);
      const startTime = performance.now();
      loadTOMLFile(file);
      const endTime = performance.now();

      metrics.loadTimes.push({
        size,
        time: endTime - startTime
      });
    });
  });
});
```

**Critères d'acceptation :**
- [ ] Métriques collectées automatiquement
- [ ] Rapport généré après tests
- [ ] Suivi des régressions de performance

---

## 📊 Résumé de la Todo List

### Par Priorité

| Priorité | Nombre de Tâches | Estimation |
|----------|------------------|------------|
| 🔴 CRITIQUE | 12 | 24-34 heures |
| 🟠 HAUTE | 11 | 16-22 heures |
| 🟡 MOYENNE | 5 | 3-5 heures |
| 🟢 BASSE | 3 | 6-8 heures |
| **TOTAL** | **31** | **49-69 heures** |

### Par Catégorie

| Catégorie | Tâches | Estimation |
|-----------|--------|------------|
| Sauvegarde TOML | 4 | 4-6 heures |
| Tests Unitaires Validators | 3 | 12-16 heures |
| Tests E2E User Stories | 5 | 8-12 heures |
| Tests Stores | 4 | 6-8 heures |
| Tests Composants | 4 | 10-14 heures |
| Configuration | 2 | 1.5-2 heures |
| Documentation | 3 | 2.5-3.5 heures |
| UX/UI | 3 | 1.25-1.75 heures |
| Performance | 3 | 6-8 heures |

### Ordre de Priorité Recommandé

1. **Phase 1 - Critique** (Semaine 1)
   - Tasks 1-4 : Sauvegarde TOML (1 jour)
   - Tasks 5-7 : Tests validators (2-3 jours)
   - Tasks 8-12 : Tests E2E (2 jours)

2. **Phase 2 - Haute** (Semaine 2)
   - Tasks 13-16 : Tests stores (1.5 jours)
   - Tasks 17-20 : Tests composants (2.5 jours)
   - Tasks 21-22 : Configuration (0.5 jour)

3. **Phase 3 - Moyenne** (Semaine 3)
   - Tasks 23-25 : UX (0.5 jour)
   - Tasks 26-28 : Documentation (0.5 jour)

4. **Phase 4 - Basse** (Si temps disponible)
   - Tasks 29-31 : Performance

---

## 🎯 Indicateurs de Succès

### Critères de Production-Ready

- [ ] **Couverture de tests ≥ 80%**
  - Validators : ≥ 90%
  - Stores : ≥ 80%
  - Composants : ≥ 70%

- [ ] **Tous les tests passent**
  - 0 test en échec
  - 0 warning critique

- [ ] **Fonctionnalités complètes**
  - Sauvegarde TOML fonctionnelle
  - Backup automatique
  - Toutes les User Stories validées

- [ ] **Performance**
  - Chargement < 1s (10k transactions)
  - Sauvegarde < 500ms
  - UI réactive

- [ ] **Documentation**
  - README à jour
  - Stratégie de tests documentée
  - Traçabilité tests ↔ specs

---

## 📝 Notes

- **Estimation totale :** 49-69 heures
- **Temps réaliste avec imprévus :** 7-10 jours
- **Ordre de priorité :** Critique > Haute > Moyenne > Basse
- **Bloquer la production si :** Couverture < 80% OU sauvegarde non fonctionnelle

---

**Créé le :** 2025-11-10
**Auteur :** Claude (Architecte Senior SvelteKit)
**Version :** 1.0
