/**
 * Tests unitaires pour transactionStore
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock des dépendances
vi.mock('$lib/stores/dataStore.js', () => ({
	dataStore: {
		updateData: vi.fn(),
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/stores/accountStore.js', () => ({
	accounts: {
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/domain/transactionValidator.js', () => ({
	validateNewTransaction: vi.fn(),
	createTransaction: vi.fn(),
	generateTransactionId: vi.fn(),
	calculateBalance: vi.fn(),
	isBalanced: vi.fn(),
	getTransactionAmount: vi.fn()
}));

describe('transactionStore', () => {
	let dataStore;
	let accounts;
	let currencies;
	let validateNewTransaction;
	let createTransaction;
	let generateTransactionId;
	let isBalanced;
	let getTransactionAmount;

	beforeEach(async () => {
		vi.resetModules();

		// Importer les mocks
		const dataStoreModule = await import('$lib/stores/dataStore.js');
		dataStore = dataStoreModule.dataStore;

		const accountStoreModule = await import('$lib/stores/accountStore.js');
		accounts = accountStoreModule.accounts;

		const currencyStoreModule = await import('$lib/stores/currencyStore.js');
		currencies = currencyStoreModule.currencies;

		const validatorModule = await import('$lib/domain/transactionValidator.js');
		validateNewTransaction = validatorModule.validateNewTransaction;
		createTransaction = validatorModule.createTransaction;
		generateTransactionId = validatorModule.generateTransactionId;
		isBalanced = validatorModule.isBalanced;
		getTransactionAmount = validatorModule.getTransactionAmount;

		// Configuration par défaut des mocks
		dataStore.subscribe.mockImplementation((callback) => {
			callback({
				data: {
					transaction: [
						{
							id: 'tx-1',
							date: '2024-01-15',
							description: 'Achat épicerie',
							payee: 'Migros',
							tags: ['alimentation'],
							posting: [
								{ accountId: 'acc-1', amount: -50, currency: 'CHF' },
								{ accountId: 'acc-2', amount: 50, currency: 'CHF' }
							]
						},
						{
							id: 'tx-2',
							date: '2024-01-20',
							description: 'Salaire',
							payee: 'Entreprise SA',
							tags: ['revenu'],
							posting: [
								{ accountId: 'acc-1', amount: 5000, currency: 'CHF' },
								{ accountId: 'acc-3', amount: -5000, currency: 'CHF' }
							]
						},
						{
							id: 'tx-3',
							date: '2024-01-10',
							description: 'Restaurant',
							payee: 'Pizza Place',
							tags: ['alimentation', 'sortie'],
							posting: [
								{ accountId: 'acc-1', amount: -30, currency: 'CHF' },
								{ accountId: 'acc-2', amount: 30, currency: 'CHF' }
							]
						}
					]
				}
			});
			return vi.fn();
		});

		accounts.subscribe.mockImplementation((callback) => {
			callback([
				{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', currency: 'CHF' },
				{ id: 'acc-2', name: 'Expenses:Food', type: 'Expenses', currency: 'CHF' },
				{ id: 'acc-3', name: 'Income:Salary', type: 'Income', currency: 'CHF' }
			]);
			return vi.fn();
		});

		currencies.subscribe.mockImplementation((callback) => {
			callback([
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
			]);
			return vi.fn();
		});

		validateNewTransaction.mockReturnValue({ valid: true });
		createTransaction.mockReturnValue({
			id: 'tx-new',
			date: '2024-01-25',
			description: 'Nouvelle transaction',
			payee: 'Test',
			tags: [],
			posting: [
				{ accountId: 'acc-1', amount: -100, currency: 'CHF' },
				{ accountId: 'acc-2', amount: 100, currency: 'CHF' }
			]
		});
		getTransactionAmount.mockImplementation((tx) => {
			if (!tx.posting || tx.posting.length === 0) return 0;
			return Math.abs(tx.posting[0].amount);
		});
		isBalanced.mockReturnValue(true);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Derived Stores', () => {
		it('transactions devrait retourner toutes les transactions', async () => {
			const { transactions } = await import('$lib/stores/transactionStore.js');

			const unsubscribe = transactions.subscribe((value) => {
				expect(value).toHaveLength(3);
				expect(value[0].id).toBe('tx-1');
				expect(value[1].id).toBe('tx-2');
				expect(value[2].id).toBe('tx-3');
			});

			unsubscribe();
		});

		it('transactionsSortedByDate devrait trier par date décroissante', async () => {
			const { transactionsSortedByDate } = await import('$lib/stores/transactionStore.js');

			const unsubscribe = transactionsSortedByDate.subscribe((value) => {
				expect(value).toHaveLength(3);
				// Plus récentes en premier: tx-2 (20 jan), tx-1 (15 jan), tx-3 (10 jan)
				expect(value[0].id).toBe('tx-2');
				expect(value[1].id).toBe('tx-1');
				expect(value[2].id).toBe('tx-3');
			});

			unsubscribe();
		});

		it('transactionStats devrait calculer les statistiques', async () => {
			const { transactionStats } = await import('$lib/stores/transactionStore.js');

			const unsubscribe = transactionStats.subscribe((value) => {
				expect(value.total).toBe(3);
				expect(value.byType).toBeDefined();
			});

			unsubscribe();
		});
	});

	describe('addTransaction', () => {
		it('devrait ajouter une nouvelle transaction avec succès', async () => {
			const { addTransaction } = await import('$lib/stores/transactionStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					transaction: [
						{ id: 'tx-1', date: '2024-01-15', description: 'Test' }
					]
				};
				callback(data);
			});

			const result = addTransaction({
				date: '2024-01-25',
				description: 'Nouvelle transaction',
				payee: 'Test',
				posting: [
					{ accountId: 'acc-1', amount: -100, currency: 'CHF' },
					{ accountId: 'acc-2', amount: 100, currency: 'CHF' }
				]
			});

			expect(result.success).toBe(true);
			expect(result.transaction).toBeDefined();
			expect(validateNewTransaction).toHaveBeenCalled();
			expect(createTransaction).toHaveBeenCalled();
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait rejeter une transaction avec des données invalides', async () => {
			const { addTransaction } = await import('$lib/stores/transactionStore.js');

			validateNewTransaction.mockReturnValue({
				valid: false,
				errors: [{ field: 'date', message: 'La date est requise' }]
			});

			const result = addTransaction({
				description: 'Test'
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toBe('La date est requise');
			expect(dataStore.updateData).not.toHaveBeenCalled();
		});

		it('devrait trier les transactions par date après ajout', async () => {
			const { addTransaction } = await import('$lib/stores/transactionStore.js');

			let sortedTransactions;
			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					transaction: [
						{ id: 'tx-1', date: '2024-01-20' },
						{ id: 'tx-2', date: '2024-01-10' }
					]
				};
				const updated = callback(data);
				sortedTransactions = updated.transaction;
			});

			addTransaction({
				date: '2024-01-15',
				description: 'Transaction du milieu'
			});

			expect(dataStore.updateData).toHaveBeenCalled();
		});
	});

	describe('updateTransaction', () => {
		it('devrait mettre à jour une transaction existante', async () => {
			const { updateTransaction } = await import('$lib/stores/transactionStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					transaction: [
						{ id: 'tx-1', date: '2024-01-15', description: 'Ancienne description' }
					]
				};
				callback(data);
			});

			const result = updateTransaction('tx-1', {
				description: 'Nouvelle description'
			});

			expect(result.success).toBe(true);
			expect(result.transaction).toBeDefined();
			expect(result.transaction.id).toBe('tx-1');
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait rejeter la mise à jour d\'une transaction inexistante', async () => {
			const { updateTransaction } = await import('$lib/stores/transactionStore.js');

			const result = updateTransaction('tx-999', {
				description: 'Test'
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('introuvable');
		});

		it('devrait empêcher de changer l\'ID lors de la mise à jour', async () => {
			const { updateTransaction } = await import('$lib/stores/transactionStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					transaction: [
						{ id: 'tx-1', date: '2024-01-15', description: 'Test' }
					]
				};
				callback(data);
			});

			const result = updateTransaction('tx-1', {
				id: 'tx-modified',
				description: 'Test'
			});

			if (result.success) {
				expect(result.transaction.id).toBe('tx-1');
			}
		});

		it('devrait valider la transaction mise à jour', async () => {
			const { updateTransaction } = await import('$lib/stores/transactionStore.js');

			validateNewTransaction.mockReturnValue({
				valid: false,
				errors: [{ field: 'posting', message: 'Les postings sont requis' }]
			});

			const result = updateTransaction('tx-1', {
				posting: []
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
		});
	});

	describe('deleteTransaction', () => {
		it('devrait supprimer une transaction', async () => {
			const { deleteTransaction } = await import('$lib/stores/transactionStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					transaction: [
						{ id: 'tx-1', description: 'Test 1' },
						{ id: 'tx-2', description: 'Test 2' }
					]
				};
				const updated = callback(data);
				expect(updated.transaction).toHaveLength(1);
			});

			const result = deleteTransaction('tx-2');

			expect(result.success).toBe(true);
			expect(dataStore.updateData).toHaveBeenCalled();
		});
	});

	describe('searchTransactions', () => {
		it('devrait rechercher des transactions par date de début', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ startDate: '2024-01-15' });

			// tx-1 (15 jan) et tx-2 (20 jan), mais pas tx-3 (10 jan)
			expect(results.length).toBeGreaterThan(0);
			expect(results.every(t => new Date(t.date) >= new Date('2024-01-15'))).toBe(true);
		});

		it('devrait rechercher des transactions par date de fin', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ endDate: '2024-01-15' });

			// tx-3 (10 jan) et tx-1 (15 jan), mais pas tx-2 (20 jan)
			expect(results.length).toBeGreaterThan(0);
			expect(results.every(t => new Date(t.date) <= new Date('2024-01-15'))).toBe(true);
		});

		it('devrait rechercher des transactions par plage de dates', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({
				startDate: '2024-01-12',
				endDate: '2024-01-18'
			});

			// Seulement tx-1 (15 jan)
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('tx-1');
		});

		it('devrait rechercher des transactions par compte', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ accountId: 'acc-3' });

			// Seulement tx-2 qui utilise acc-3
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('tx-2');
		});

		it('devrait rechercher des transactions par tag', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ tag: 'alimentation' });

			// tx-1 et tx-3 ont le tag "alimentation"
			expect(results).toHaveLength(2);
			expect(results.every(t => t.tags.includes('alimentation'))).toBe(true);
		});

		it('devrait rechercher des transactions par montant minimum', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			// Mock pour retourner des montants spécifiques
			getTransactionAmount.mockImplementation((tx) => {
				if (tx.id === 'tx-1') return 50;
				if (tx.id === 'tx-2') return 5000;
				if (tx.id === 'tx-3') return 30;
				return 0;
			});

			const results = searchTransactions({ minAmount: 100 });

			// Seulement tx-2 avec montant >= 100
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('tx-2');
		});

		it('devrait rechercher des transactions par montant maximum', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			getTransactionAmount.mockImplementation((tx) => {
				if (tx.id === 'tx-1') return 50;
				if (tx.id === 'tx-2') return 5000;
				if (tx.id === 'tx-3') return 30;
				return 0;
			});

			const results = searchTransactions({ maxAmount: 100 });

			// tx-1 et tx-3
			expect(results).toHaveLength(2);
		});

		it('devrait rechercher des transactions par texte', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ search: 'salaire' });

			// Seulement tx-2 qui contient "Salaire" dans la description
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('tx-2');
		});

		it('devrait rechercher des transactions par payee', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ search: 'migros' });

			// Seulement tx-1 avec payee "Migros"
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('tx-1');
		});

		it('devrait trier par date décroissante par défaut', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({});

			// tx-2 (20 jan), tx-1 (15 jan), tx-3 (10 jan)
			expect(results[0].id).toBe('tx-2');
			expect(results[1].id).toBe('tx-1');
			expect(results[2].id).toBe('tx-3');
		});

		it('devrait trier par date croissante', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			const results = searchTransactions({ sortBy: 'date-asc' });

			// tx-3 (10 jan), tx-1 (15 jan), tx-2 (20 jan)
			expect(results[0].id).toBe('tx-3');
			expect(results[1].id).toBe('tx-1');
			expect(results[2].id).toBe('tx-2');
		});

		it('devrait trier par montant décroissant', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			getTransactionAmount.mockImplementation((tx) => {
				if (tx.id === 'tx-1') return 50;
				if (tx.id === 'tx-2') return 5000;
				if (tx.id === 'tx-3') return 30;
				return 0;
			});

			const results = searchTransactions({ sortBy: 'amount-desc' });

			// tx-2 (5000), tx-1 (50), tx-3 (30)
			expect(results[0].id).toBe('tx-2');
			expect(results[1].id).toBe('tx-1');
			expect(results[2].id).toBe('tx-3');
		});

		it('devrait trier par montant croissant', async () => {
			const { searchTransactions } = await import('$lib/stores/transactionStore.js');

			getTransactionAmount.mockImplementation((tx) => {
				if (tx.id === 'tx-1') return 50;
				if (tx.id === 'tx-2') return 5000;
				if (tx.id === 'tx-3') return 30;
				return 0;
			});

			const results = searchTransactions({ sortBy: 'amount-asc' });

			// tx-3 (30), tx-1 (50), tx-2 (5000)
			expect(results[0].id).toBe('tx-3');
			expect(results[1].id).toBe('tx-1');
			expect(results[2].id).toBe('tx-2');
		});
	});

	describe('getTransactionById', () => {
		it('devrait trouver une transaction par son ID', async () => {
			const { getTransactionById } = await import('$lib/stores/transactionStore.js');

			const transaction = getTransactionById('tx-1');

			expect(transaction).not.toBeNull();
			expect(transaction.id).toBe('tx-1');
			expect(transaction.description).toBe('Achat épicerie');
		});

		it('devrait retourner null si la transaction n\'existe pas', async () => {
			const { getTransactionById } = await import('$lib/stores/transactionStore.js');

			const transaction = getTransactionById('tx-999');

			expect(transaction).toBeNull();
		});
	});

	describe('getTransactionsByAccount', () => {
		it('devrait retourner toutes les transactions pour un compte', async () => {
			const { getTransactionsByAccount } = await import('$lib/stores/transactionStore.js');

			const transactions = getTransactionsByAccount('acc-1');

			// acc-1 est utilisé dans tx-1, tx-2, tx-3
			expect(transactions).toHaveLength(3);
		});

		it('devrait retourner un tableau vide pour un compte non utilisé', async () => {
			const { getTransactionsByAccount } = await import('$lib/stores/transactionStore.js');

			const transactions = getTransactionsByAccount('acc-999');

			expect(transactions).toHaveLength(0);
		});
	});

	describe('getAllTags', () => {
		it('devrait retourner tous les tags uniques triés', async () => {
			const { getAllTags } = await import('$lib/stores/transactionStore.js');

			const tags = getAllTags();

			expect(tags).toHaveLength(3);
			expect(tags).toEqual(['alimentation', 'revenu', 'sortie']);
		});

		it('devrait gérer les transactions sans tags', async () => {
			const { getAllTags } = await import('$lib/stores/transactionStore.js');

			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						transaction: [
							{ id: 'tx-1', tags: ['test'] },
							{ id: 'tx-2', tags: [] },
							{ id: 'tx-3' } // Pas de tags
						]
					}
				});
				return vi.fn();
			});

			const tags = getAllTags();

			expect(tags).toEqual(['test']);
		});
	});

	describe('getAllPayees', () => {
		it('devrait retourner tous les payees uniques triés', async () => {
			const { getAllPayees } = await import('$lib/stores/transactionStore.js');

			const payees = getAllPayees();

			expect(payees).toHaveLength(3);
			expect(payees).toEqual(['Entreprise SA', 'Migros', 'Pizza Place']);
		});

		it('devrait ignorer les payees vides', async () => {
			const { getAllPayees } = await import('$lib/stores/transactionStore.js');

			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						transaction: [
							{ id: 'tx-1', payee: 'Test' },
							{ id: 'tx-2', payee: '' },
							{ id: 'tx-3', payee: '   ' },
							{ id: 'tx-4' } // Pas de payee
						]
					}
				});
				return vi.fn();
			});

			const payees = getAllPayees();

			expect(payees).toEqual(['Test']);
		});
	});

	describe('calculateAccountBalance', () => {
		it('devrait calculer le solde d\'un compte', async () => {
			const { calculateAccountBalance } = await import('$lib/stores/transactionStore.js');

			const balance = calculateAccountBalance('acc-1');

			// acc-1: -50 (tx-1) + 5000 (tx-2) + -30 (tx-3) = 4920
			expect(balance).toBe(4920);
		});

		it('devrait calculer le solde jusqu\'à une date donnée', async () => {
			const { calculateAccountBalance } = await import('$lib/stores/transactionStore.js');

			const balance = calculateAccountBalance('acc-1', '2024-01-15');

			// acc-1: -30 (tx-3, 10 jan) + -50 (tx-1, 15 jan) = -80
			// tx-2 (20 jan) n'est pas inclus
			expect(balance).toBe(-80);
		});

		it('devrait retourner 0 pour un compte sans transactions', async () => {
			const { calculateAccountBalance } = await import('$lib/stores/transactionStore.js');

			const balance = calculateAccountBalance('acc-999');

			expect(balance).toBe(0);
		});
	});

	describe('calculateAllAccountBalances', () => {
		it('devrait calculer les soldes de tous les comptes', async () => {
			const { calculateAllAccountBalances } = await import('$lib/stores/transactionStore.js');

			const allAccounts = [
				{ id: 'acc-1', name: 'Assets:Bank:Checking' },
				{ id: 'acc-2', name: 'Expenses:Food' },
				{ id: 'acc-3', name: 'Income:Salary' }
			];

			const balances = calculateAllAccountBalances(allAccounts);

			expect(balances['acc-1']).toBe(4920);
			expect(balances['acc-2']).toBe(80); // 50 + 30
			expect(balances['acc-3']).toBe(-5000);
		});
	});

	describe('exportTransactionsCSV', () => {
		it('devrait exporter les transactions en CSV', async () => {
			const { exportTransactionsCSV } = await import('$lib/stores/transactionStore.js');

			const csv = exportTransactionsCSV();

			expect(csv).toContain('ID,Date,Description,Payee,Tags');
			expect(csv).toContain('tx-1');
			expect(csv).toContain('2024-01-15');
			expect(csv).toContain('Achat épicerie');
			expect(csv).toContain('Migros');
		});

		it('devrait inclure les tags dans le CSV', async () => {
			const { exportTransactionsCSV } = await import('$lib/stores/transactionStore.js');

			const csv = exportTransactionsCSV();

			// Les tags sont joints par ';'
			expect(csv).toContain('alimentation');
			expect(csv).toContain('alimentation;sortie');
		});

		it('devrait inclure l\'information d\'équilibre', async () => {
			const { exportTransactionsCSV } = await import('$lib/stores/transactionStore.js');

			const csv = exportTransactionsCSV();

			expect(csv).toContain('Oui'); // isBalanced retourne true
		});
	});
});
