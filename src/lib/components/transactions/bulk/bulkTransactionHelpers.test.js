/**
 * Tests pour bulkTransactionHelpers
 */
import { describe, it, expect } from 'vitest';
import {
	filterTransactions,
	sortTransactions,
	validateInlineEdit,
	calculateTransactionSummary,
	paginateTransactions,
	createEmptyTransaction,
	duplicateTransaction,
	getAutoCompleteOptions,
	calculateAutoBalance,
	exportToCSV
} from './bulkTransactionHelpers.js';

// Données de test
const mockTransactions = [
	{
		id: 'txn_1',
		date: '2025-01-15',
		description: 'Courses alimentaires',
		payee: 'Auchan',
		tags: ['food', 'shopping'],
		posting: [
			{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
			{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
		]
	},
	{
		id: 'txn_2',
		date: '2025-01-10',
		description: 'Restaurant',
		payee: 'La Bonne Table',
		tags: ['food', 'restaurant'],
		posting: [
			{ accountId: 'acc_1', amount: -35, currency: 'EUR' },
			{ accountId: 'acc_3', amount: 35, currency: 'EUR' }
		]
	},
	{
		id: 'txn_3',
		date: '2025-01-20',
		description: 'Salaire',
		payee: 'Entreprise XYZ',
		tags: ['income'],
		posting: [
			{ accountId: 'acc_1', amount: 2500, currency: 'EUR' },
			{ accountId: 'acc_4', amount: -2500, currency: 'EUR' }
		]
	}
];

const mockAccounts = [
	{ id: 'acc_1', name: 'Compte Courant', currency: 'EUR' },
	{ id: 'acc_2', name: 'Dépenses:Alimentation', currency: 'EUR' },
	{ id: 'acc_3', name: 'Dépenses:Restaurant', currency: 'EUR' },
	{ id: 'acc_4', name: 'Revenus:Salaire', currency: 'EUR' }
];

describe('filterTransactions', () => {
	it('devrait retourner toutes les transactions sans filtre', () => {
		const filters = {
			search: '',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(3);
	});

	it('devrait filtrer par recherche textuelle (description)', () => {
		const filters = {
			search: 'courses',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_1');
	});

	it('devrait filtrer par recherche textuelle (payee)', () => {
		const filters = {
			search: 'auchan',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_1');
	});

	it('devrait filtrer par recherche textuelle (tags)', () => {
		const filters = {
			search: 'restaurant',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_2');
	});

	it('devrait filtrer par date de début', () => {
		const filters = {
			search: '',
			dateFrom: '2025-01-12',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(2); // txn_1 et txn_3
	});

	it('devrait filtrer par date de fin', () => {
		const filters = {
			search: '',
			dateFrom: '',
			dateTo: '2025-01-12',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1); // txn_2
	});

	it('devrait filtrer par plage de dates', () => {
		const filters = {
			search: '',
			dateFrom: '2025-01-10',
			dateTo: '2025-01-16',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(2); // txn_1 et txn_2
	});

	it('devrait filtrer par comptes', () => {
		const filters = {
			search: '',
			dateFrom: '',
			dateTo: '',
			accounts: ['acc_3'],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_2');
	});

	it('devrait filtrer par tags', () => {
		const filters = {
			search: '',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: ['income'],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_3');
	});

	it('devrait combiner plusieurs filtres', () => {
		const filters = {
			search: 'food',
			dateFrom: '2025-01-11',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		};

		const result = filterTransactions(mockTransactions, filters);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('txn_1');
	});

	it('devrait gérer une liste vide', () => {
		const filters = { search: '', dateFrom: '', dateTo: '', accounts: [], tags: [], balanceStatus: 'all' };
		const result = filterTransactions([], filters);
		expect(result).toEqual([]);
	});
});

describe('sortTransactions', () => {
	it('devrait trier par date (ascendant)', () => {
		const sortConfig = { field: 'date', direction: 'asc' };
		const result = sortTransactions(mockTransactions, sortConfig);

		expect(result[0].id).toBe('txn_2'); // 2025-01-10
		expect(result[1].id).toBe('txn_1'); // 2025-01-15
		expect(result[2].id).toBe('txn_3'); // 2025-01-20
	});

	it('devrait trier par date (descendant)', () => {
		const sortConfig = { field: 'date', direction: 'desc' };
		const result = sortTransactions(mockTransactions, sortConfig);

		expect(result[0].id).toBe('txn_3'); // 2025-01-20
		expect(result[1].id).toBe('txn_1'); // 2025-01-15
		expect(result[2].id).toBe('txn_2'); // 2025-01-10
	});

	it('devrait trier par description (ascendant)', () => {
		const sortConfig = { field: 'description', direction: 'asc' };
		const result = sortTransactions(mockTransactions, sortConfig);

		expect(result[0].description).toBe('Courses alimentaires');
		expect(result[1].description).toBe('Restaurant');
		expect(result[2].description).toBe('Salaire');
	});

	it('devrait trier par payee (ascendant)', () => {
		const sortConfig = { field: 'payee', direction: 'asc' };
		const result = sortTransactions(mockTransactions, sortConfig);

		expect(result[0].payee).toBe('Auchan');
		expect(result[1].payee).toBe('Entreprise XYZ');
		expect(result[2].payee).toBe('La Bonne Table');
	});

	it('devrait trier par montant (ascendant)', () => {
		const sortConfig = { field: 'amount', direction: 'asc' };
		const result = sortTransactions(mockTransactions, sortConfig);

		expect(result[0].id).toBe('txn_2'); // 35
		expect(result[1].id).toBe('txn_1'); // 50
		expect(result[2].id).toBe('txn_3'); // 2500
	});

	it('ne devrait pas modifier le tableau original', () => {
		const original = [...mockTransactions];
		const sortConfig = { field: 'date', direction: 'asc' };
		sortTransactions(mockTransactions, sortConfig);

		expect(mockTransactions).toEqual(original);
	});
});

describe('validateInlineEdit', () => {
	it('devrait valider une transaction correcte', () => {
		const validTransaction = {
			date: '2025-01-15',
			description: 'Test',
			payee: 'Test Payee',
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(validTransaction);
		expect(result.isValid).toBe(true);
		expect(Object.keys(result.errors)).toHaveLength(0);
	});

	it('devrait détecter une date manquante', () => {
		const invalidTransaction = {
			date: '',
			description: 'Test',
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.date).toBeDefined();
	});

	it('devrait détecter une description manquante', () => {
		const invalidTransaction = {
			date: '2025-01-15',
			description: '',
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.description).toBeDefined();
	});

	it('devrait détecter moins de 2 postings', () => {
		const invalidTransaction = {
			date: '2025-01-15',
			description: 'Test',
			posting: [{ accountId: 'acc_1', amount: -50, currency: 'EUR' }]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.posting).toBeDefined();
	});

	it('devrait détecter une transaction déséquilibrée', () => {
		const invalidTransaction = {
			date: '2025-01-15',
			description: 'Test',
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 30, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.balance).toBeDefined();
	});

	it('devrait détecter un compte manquant dans un posting', () => {
		const invalidTransaction = {
			date: '2025-01-15',
			description: 'Test',
			posting: [
				{ accountId: '', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.posting_0_account).toBeDefined();
	});

	it('devrait détecter un montant manquant dans un posting', () => {
		const invalidTransaction = {
			date: '2025-01-15',
			description: 'Test',
			posting: [
				{ accountId: 'acc_1', amount: '', currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = validateInlineEdit(invalidTransaction);
		expect(result.isValid).toBe(false);
		expect(result.errors.posting_0_amount).toBeDefined();
	});
});

describe('calculateTransactionSummary', () => {
	it('devrait calculer le résumé d\'une transaction équilibrée', () => {
		const transaction = {
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' }
			]
		};

		const result = calculateTransactionSummary(transaction);
		expect(result.isBalanced).toBe(true);
		expect(result.currencies).toEqual(['EUR']);
		expect(result.totalByCurrency.EUR).toBeCloseTo(0, 2);
	});

	it('devrait calculer le résumé d\'une transaction déséquilibrée', () => {
		const transaction = {
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 30, currency: 'EUR' }
			]
		};

		const result = calculateTransactionSummary(transaction);
		expect(result.isBalanced).toBe(false);
		expect(result.balanceErrors).toContain('EUR: -20.00');
	});

	it('devrait gérer les transactions multi-devises', () => {
		const transaction = {
			posting: [
				{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
				{ accountId: 'acc_2', amount: 50, currency: 'EUR' },
				{ accountId: 'acc_3', amount: -10, currency: 'USD' },
				{ accountId: 'acc_4', amount: 10, currency: 'USD' }
			]
		};

		const result = calculateTransactionSummary(transaction);
		expect(result.isBalanced).toBe(true);
		expect(result.currencies).toContain('EUR');
		expect(result.currencies).toContain('USD');
	});
});

describe('paginateTransactions', () => {
	it('devrait paginer correctement', () => {
		const transactions = Array.from({ length: 100 }, (_, i) => ({
			id: `txn_${i}`,
			date: '2025-01-01'
		}));

		const result = paginateTransactions(transactions, 1, 25);
		expect(result.items).toHaveLength(25);
		expect(result.totalPages).toBe(4);
		expect(result.startIndex).toBe(0);
		expect(result.endIndex).toBe(25);
	});

	it('devrait gérer la dernière page partiellement remplie', () => {
		const transactions = Array.from({ length: 48 }, (_, i) => ({
			id: `txn_${i}`,
			date: '2025-01-01'
		}));

		const result = paginateTransactions(transactions, 2, 25);
		expect(result.items).toHaveLength(23); // 48 - 25 = 23
		expect(result.totalPages).toBe(2);
	});

	it('devrait gérer une page vide', () => {
		const result = paginateTransactions([], 1, 25);
		expect(result.items).toHaveLength(0);
		expect(result.totalPages).toBe(0);
	});

	it('devrait corriger une page invalide (trop élevée)', () => {
		const transactions = Array.from({ length: 50 }, (_, i) => ({
			id: `txn_${i}`,
			date: '2025-01-01'
		}));

		const result = paginateTransactions(transactions, 10, 25);
		expect(result.currentPage).toBe(2); // Corrigé à la dernière page
	});
});

describe('createEmptyTransaction', () => {
	it('devrait créer une transaction vide avec la devise par défaut', () => {
		const result = createEmptyTransaction('USD');

		expect(result.id).toMatch(/^txn_/);
		expect(result.date).toBeDefined();
		expect(result.description).toBe('');
		expect(result.payee).toBe('');
		expect(result.tags).toEqual([]);
		expect(result.posting).toHaveLength(2);
		expect(result.posting[0].currency).toBe('USD');
		expect(result.posting[1].currency).toBe('USD');
	});
});

describe('duplicateTransaction', () => {
	it('devrait dupliquer une transaction avec un nouvel ID', () => {
		const original = mockTransactions[0];
		const duplicate = duplicateTransaction(original);

		expect(duplicate.id).not.toBe(original.id);
		expect(duplicate.id).toMatch(/^txn_/);
		expect(duplicate.description).toBe(original.description);
		expect(duplicate.payee).toBe(original.payee);
		expect(duplicate.posting).toEqual(original.posting);
	});

	it('devrait dupliquer avec une nouvelle date', () => {
		const original = mockTransactions[0];
		const duplicate = duplicateTransaction(original, '2025-02-01');

		expect(duplicate.date).toBe('2025-02-01');
	});
});

describe('getAutoCompleteOptions', () => {
	it('devrait extraire les payees uniques', () => {
		const result = getAutoCompleteOptions('payee', mockTransactions);

		expect(result).toContain('Auchan');
		expect(result).toContain('La Bonne Table');
		expect(result).toContain('Entreprise XYZ');
		expect(result).toHaveLength(3);
	});

	it('devrait extraire les descriptions uniques', () => {
		const result = getAutoCompleteOptions('description', mockTransactions);

		expect(result).toContain('Courses alimentaires');
		expect(result).toContain('Restaurant');
		expect(result).toContain('Salaire');
		expect(result).toHaveLength(3);
	});

	it('devrait extraire les tags uniques', () => {
		const result = getAutoCompleteOptions('tags', mockTransactions);

		expect(result).toContain('food');
		expect(result).toContain('shopping');
		expect(result).toContain('restaurant');
		expect(result).toContain('income');
		expect(result).toHaveLength(4);
	});

	it('devrait retourner un tableau trié', () => {
		const result = getAutoCompleteOptions('payee', mockTransactions);
		const sorted = [...result].sort();
		expect(result).toEqual(sorted);
	});
});

describe('calculateAutoBalance', () => {
	it('devrait calculer le montant pour équilibrer', () => {
		const postings = [
			{ accountId: 'acc_1', amount: -50, currency: 'EUR' },
			{ accountId: 'acc_2', amount: 0, currency: 'EUR' }
		];

		const result = calculateAutoBalance(postings, 1);
		expect(result).toBe(50);
	});

	it('devrait gérer plusieurs postings', () => {
		const postings = [
			{ accountId: 'acc_1', amount: -30, currency: 'EUR' },
			{ accountId: 'acc_2', amount: -20, currency: 'EUR' },
			{ accountId: 'acc_3', amount: 0, currency: 'EUR' }
		];

		const result = calculateAutoBalance(postings, 2);
		expect(result).toBe(50);
	});
});

describe('exportToCSV', () => {
	it('devrait exporter en format compact', () => {
		const result = exportToCSV(mockTransactions, mockAccounts, 'compact');

		expect(result).toContain('Date,Description,Payee,Tags,Accounts,Amounts,Balance');
		expect(result).toContain('Courses alimentaires');
		expect(result).toContain('Auchan');
	});

	it('devrait exporter en format détaillé', () => {
		const result = exportToCSV(mockTransactions, mockAccounts, 'detailed');

		expect(result).toContain('Date,Description,Payee,Tags,Account,Amount,Currency,TransactionBalance');
		expect(result).toContain('Compte Courant');
	});

	it('devrait gérer une liste vide', () => {
		const result = exportToCSV([], mockAccounts, 'compact');
		expect(result).toBe('');
	});
});
