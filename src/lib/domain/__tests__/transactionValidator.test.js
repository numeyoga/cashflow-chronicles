/**
 * Tests unitaires pour transactionValidator.js
 * Couvre les règles V-TXN-*, V-POST-*, V-BAL-*, V-FX-*
 */

import { describe, it, expect } from 'vitest';
import {
	validateTransactions,
	validateNewTransaction,
	generateTransactionId,
	createTransaction,
	calculateBalance,
	isBalanced,
	getTransactionAmount,
	TransactionValidationCode
} from '../transactionValidator.js';
import { ValidationSeverity } from '../validator.js';

describe('Transaction Validator', () => {
	// Données de test communes
	const validAccounts = [
		{
			id: 'acc_001',
			name: 'Assets:Bank:CHF',
			type: 'Assets',
			currency: 'CHF',
			opened: '2025-01-01'
		},
		{
			id: 'acc_002',
			name: 'Expenses:Food:Groceries',
			type: 'Expenses',
			currency: 'CHF',
			opened: '2025-01-01'
		},
		{
			id: 'acc_003',
			name: 'Assets:Bank:EUR',
			type: 'Assets',
			currency: 'EUR',
			opened: '2025-01-01'
		}
	];

	const validCurrencies = [
		{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
		{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
	];

	// ========================================================================
	// V-TXN-001 : ID au format txn_XXX
	// ========================================================================

	describe('V-TXN-001: ID format txn_XXX', () => {
		it('devrait accepter un ID valide (txn_001)', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_001);
			expect(idErrors).toHaveLength(0);
		});

		it('devrait rejeter un ID invalide (transaction_001)', () => {
			const transactions = [
				{
					id: 'transaction_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un ID manquant', () => {
			const transactions = [
				{
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-TXN-002 : ID unique
	// ========================================================================

	describe('V-TXN-002: ID unique', () => {
		it('devrait rejeter des IDs en double', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test 1',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				},
				{
					id: 'txn_001',
					date: '2025-01-16',
					description: 'Test 2',
					posting: [
						{ accountId: 'acc_001', amount: 50, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -50, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const uniqueErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_002);
			expect(uniqueErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-TXN-003 : Date au format YYYY-MM-DD
	// ========================================================================

	describe('V-TXN-003: Date format YYYY-MM-DD', () => {
		it('devrait accepter une date valide', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_003);
			expect(dateErrors).toHaveLength(0);
		});

		it('devrait rejeter une date au format DD/MM/YYYY', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '15/01/2025',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_003);
			expect(dateErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une date manquante', () => {
			const transactions = [
				{
					id: 'txn_001',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_003);
			expect(dateErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-TXN-004 : Description non vide
	// ========================================================================

	describe('V-TXN-004: Description non vide', () => {
		it('devrait accepter une description valide', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Courses au supermarché',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const descErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_004);
			expect(descErrors).toHaveLength(0);
		});

		it('devrait rejeter une description vide', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: '',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const descErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_004);
			expect(descErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une description manquante', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const descErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_004);
			expect(descErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-TXN-005 : Au moins 2 postings
	// ========================================================================

	describe('V-TXN-005: Au moins 2 postings', () => {
		it('devrait accepter 2 postings', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const postingErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_005);
			expect(postingErrors).toHaveLength(0);
		});

		it('devrait accepter 3 postings', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -60, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -40, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const postingErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_005);
			expect(postingErrors).toHaveLength(0);
		});

		it('devrait rejeter 1 posting seulement', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [{ accountId: 'acc_001', amount: 100, currency: 'CHF' }]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const postingErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_005);
			expect(postingErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter postings manquants', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test'
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const postingErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_005);
			expect(postingErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-TXN-006 : Date pas dans le futur (warning)
	// ========================================================================

	describe('V-TXN-006: Date pas dans le futur', () => {
		it('devrait émettre un warning pour date future', () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 1);
			const dateStr = futureDate.toISOString().split('T')[0];

			const transactions = [
				{
					id: 'txn_001',
					date: dateStr,
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const futureErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_006);
			expect(futureErrors.length).toBeGreaterThan(0);
			expect(futureErrors[0].severity).toBe(ValidationSeverity.WARNING);
		});

		it('ne devrait pas émettre de warning pour date passée', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2024-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const futureErrors = errors.filter(e => e.code === TransactionValidationCode.TXN_006);
			expect(futureErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-POST-001 : accountId doit exister
	// ========================================================================

	describe('V-POST-001: accountId doit exister', () => {
		it('devrait accepter un accountId existant', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const accountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_001);
			expect(accountErrors).toHaveLength(0);
		});

		it('devrait rejeter un accountId inexistant', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_999', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const accountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_001);
			expect(accountErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un accountId manquant', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const accountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_001);
			expect(accountErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-POST-002 : Amount ne peut pas être 0
	// ========================================================================

	describe('V-POST-002: Amount ne peut pas être 0', () => {
		it('devrait accepter amount positif', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const amountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_002);
			expect(amountErrors).toHaveLength(0);
		});

		it('devrait accepter amount négatif', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: -100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: 100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const amountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_002);
			expect(amountErrors).toHaveLength(0);
		});

		it('devrait rejeter amount = 0', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 0, currency: 'CHF' },
						{ accountId: 'acc_002', amount: 100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const amountErrors = errors.filter(e => e.code === TransactionValidationCode.POST_002);
			expect(amountErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-POST-003 : Currency doit correspondre au compte
	// ========================================================================

	describe('V-POST-003: Currency doit correspondre au compte', () => {
		it('devrait accepter la devise correcte', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const currencyErrors = errors.filter(e => e.code === TransactionValidationCode.POST_003);
			expect(currencyErrors).toHaveLength(0);
		});

		it('devrait rejeter une devise non correspondante', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'EUR' }, // acc_001 utilise CHF
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const currencyErrors = errors.filter(e => e.code === TransactionValidationCode.POST_003);
			expect(currencyErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-POST-004 : Date >= date d'ouverture compte
	// ========================================================================

	describe('V-POST-004: Date >= date d\'ouverture compte', () => {
		it('devrait accepter une date après ouverture', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-02-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === TransactionValidationCode.POST_004);
			expect(dateErrors).toHaveLength(0);
		});

		it('devrait rejeter une date avant ouverture', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2024-12-31', // avant 2025-01-01
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === TransactionValidationCode.POST_004);
			expect(dateErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-BAL-001 : Équilibre de la transaction (somme = 0)
	// ========================================================================

	describe('V-BAL-001: Équilibre de la transaction', () => {
		it('devrait accepter une transaction équilibrée (2 postings)', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const balanceErrors = errors.filter(e => e.code === TransactionValidationCode.BAL_001);
			expect(balanceErrors).toHaveLength(0);
		});

		it('devrait accepter une transaction multi-postings équilibrée', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -60, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -40, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const balanceErrors = errors.filter(e => e.code === TransactionValidationCode.BAL_001);
			expect(balanceErrors).toHaveLength(0);
		});

		it('devrait rejeter une transaction non équilibrée', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -90, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const balanceErrors = errors.filter(e => e.code === TransactionValidationCode.BAL_001);
			expect(balanceErrors.length).toBeGreaterThan(0);
		});

		it('devrait accepter avec tolérance de ±0.01', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 100.005, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -100.0, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const balanceErrors = errors.filter(e => e.code === TransactionValidationCode.BAL_001);
			expect(balanceErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// Tests pour les helpers : calculateBalance, isBalanced, getTransactionAmount
	// ========================================================================

	describe('Helpers: calculateBalance', () => {
		it('devrait calculer le solde pour une transaction simple', () => {
			const transaction = {
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
				]
			};
			const balance = calculateBalance(transaction);
			expect(balance.CHF).toBeCloseTo(0, 2);
		});

		it('devrait calculer le solde pour multi-devises', () => {
			const transaction = {
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_003', amount: -95, currency: 'EUR' }
				]
			};
			const balance = calculateBalance(transaction);
			expect(balance.CHF).toBe(100);
			expect(balance.EUR).toBe(-95);
		});

		it('devrait gérer plusieurs postings même devise', () => {
			const transaction = {
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -60, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -40, currency: 'CHF' }
				]
			};
			const balance = calculateBalance(transaction);
			expect(balance.CHF).toBeCloseTo(0, 2);
		});
	});

	describe('Helpers: isBalanced', () => {
		it('devrait retourner true pour transaction équilibrée', () => {
			const transaction = {
				posting: [
					{ amount: 100, currency: 'CHF' },
					{ amount: -100, currency: 'CHF' }
				]
			};
			expect(isBalanced(transaction)).toBe(true);
		});

		it('devrait retourner false pour transaction non équilibrée', () => {
			const transaction = {
				posting: [
					{ amount: 100, currency: 'CHF' },
					{ amount: -90, currency: 'CHF' }
				]
			};
			expect(isBalanced(transaction)).toBe(false);
		});

		it('devrait accepter avec tolérance ±0.01', () => {
			const transaction = {
				posting: [
					{ amount: 100.005, currency: 'CHF' },
					{ amount: -100.0, currency: 'CHF' }
				]
			};
			expect(isBalanced(transaction)).toBe(true);
		});
	});

	describe('Helpers: getTransactionAmount', () => {
		it('devrait retourner la somme des montants positifs', () => {
			const transaction = {
				posting: [
					{ amount: 100, currency: 'CHF' },
					{ amount: -100, currency: 'CHF' }
				]
			};
			expect(getTransactionAmount(transaction)).toBe(100);
		});

		it('devrait gérer plusieurs postings positifs', () => {
			const transaction = {
				posting: [
					{ amount: 60, currency: 'CHF' },
					{ amount: 40, currency: 'CHF' },
					{ amount: -100, currency: 'CHF' }
				]
			};
			expect(getTransactionAmount(transaction)).toBe(100);
		});
	});

	// ========================================================================
	// Tests pour generateTransactionId()
	// ========================================================================

	describe('generateTransactionId()', () => {
		it('devrait générer txn_001 pour liste vide', () => {
			const id = generateTransactionId([]);
			expect(id).toBe('txn_001');
		});

		it('devrait générer txn_002 après txn_001', () => {
			const existing = [{ id: 'txn_001' }];
			const id = generateTransactionId(existing);
			expect(id).toBe('txn_002');
		});

		it('devrait gérer des IDs non séquentiels', () => {
			const existing = [{ id: 'txn_001' }, { id: 'txn_005' }, { id: 'txn_003' }];
			const id = generateTransactionId(existing);
			expect(id).toBe('txn_006');
		});
	});

	// ========================================================================
	// Tests pour createTransaction()
	// ========================================================================

	describe('createTransaction()', () => {
		it('devrait créer une transaction avec toutes les données', () => {
			const data = {
				date: '2025-01-15',
				description: 'Test',
				payee: 'Migros',
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
				]
			};
			const tx = createTransaction(data, []);
			expect(tx.id).toBe('txn_001');
			expect(tx.date).toBe(data.date);
			expect(tx.description).toBe(data.description);
			expect(tx.payee).toBe(data.payee);
		});

		it('devrait générer un ID si non fourni', () => {
			const data = {
				date: '2025-01-15',
				description: 'Test',
				posting: []
			};
			const existing = [{ id: 'txn_001' }];
			const tx = createTransaction(data, existing);
			expect(tx.id).toBe('txn_002');
		});
	});

	// ========================================================================
	// Tests pour validateNewTransaction() - Validation UI
	// ========================================================================

	describe('validateNewTransaction() - Validation UI', () => {
		it('devrait accepter une transaction valide', () => {
			const transaction = {
				date: '2025-01-15',
				description: 'Test transaction',
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -100, currency: 'CHF' }
				]
			};
			const result = validateNewTransaction(transaction, [], validAccounts, validCurrencies);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait rejeter une transaction non équilibrée', () => {
			const transaction = {
				date: '2025-01-15',
				description: 'Test',
				posting: [
					{ accountId: 'acc_001', amount: 100, currency: 'CHF' },
					{ accountId: 'acc_002', amount: -90, currency: 'CHF' }
				]
			};
			const result = validateNewTransaction(transaction, [], validAccounts, validCurrencies);
			expect(result.valid).toBe(false);
		});

		it('devrait rejeter transaction avec moins de 2 postings', () => {
			const transaction = {
				date: '2025-01-15',
				description: 'Test',
				posting: [{ accountId: 'acc_001', amount: 100, currency: 'CHF' }]
			};
			const result = validateNewTransaction(transaction, [], validAccounts, validCurrencies);
			expect(result.valid).toBe(false);
		});
	});

	// ========================================================================
	// Tests de cas limite (Edge Cases)
	// ========================================================================

	describe('Edge Cases', () => {
		it('devrait gérer un tableau vide', () => {
			const transactions = [];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			expect(errors).toHaveLength(0);
		});

		it('devrait gérer transactions non tableau', () => {
			const transactions = null;
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			expect(errors).toHaveLength(0);
		});

		it('devrait gérer transaction avec tous les champs manquants', () => {
			const transactions = [{}];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			expect(errors.length).toBeGreaterThanOrEqual(4);
		});

		it('devrait gérer montants décimaux', () => {
			const transactions = [
				{
					id: 'txn_001',
					date: '2025-01-15',
					description: 'Test',
					posting: [
						{ accountId: 'acc_001', amount: 123.45, currency: 'CHF' },
						{ accountId: 'acc_002', amount: -123.45, currency: 'CHF' }
					]
				}
			];
			const errors = validateTransactions(transactions, validAccounts, validCurrencies);
			const balanceErrors = errors.filter(e => e.code === TransactionValidationCode.BAL_001);
			expect(balanceErrors).toHaveLength(0);
		});
	});
});
