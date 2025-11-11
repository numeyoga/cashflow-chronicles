/**
 * Tests unitaires pour accountValidator.js
 * Couvre les règles V-ACC-001 à V-ACC-013
 */

import { describe, it, expect } from 'vitest';
import {
	validateAccounts,
	validateNewAccount,
	generateAccountId,
	createAccount,
	AccountValidationCode,
	AccountTypes
} from '../accountValidator.js';
import { ValidationSeverity } from '../validator.js';

describe('Account Validator', () => {
	// Données de test communes
	const validCurrencies = [
		{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
		{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
	];

	// ========================================================================
	// V-ACC-001 : ID au format acc_XXX
	// ========================================================================

	describe('V-ACC-001: ID format acc_XXX', () => {
		it('devrait accepter un ID valide (acc_001)', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors).toHaveLength(0);
		});

		it('devrait accepter différents formats valides (acc_1, acc_999)', () => {
			const accounts = [
				{
					id: 'acc_1',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				},
				{
					id: 'acc_999',
					name: 'Expenses:Food',
					type: 'Expenses',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors).toHaveLength(0);
		});

		it('devrait rejeter un ID sans préfixe acc_', () => {
			const accounts = [
				{
					id: '001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un ID avec format invalide (account_001)', () => {
			const accounts = [
				{
					id: 'account_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un ID avec lettres après acc_ (acc_ABC)', () => {
			const accounts = [
				{
					id: 'acc_ABC',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un ID manquant', () => {
			const accounts = [
				{
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un ID vide', () => {
			const accounts = [
				{
					id: '',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const idErrors = errors.filter(e => e.code === AccountValidationCode.ACC_001);
			expect(idErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-ACC-002 : ID unique
	// ========================================================================

	describe('V-ACC-002: ID unique', () => {
		it('devrait rejeter des IDs en double', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				},
				{
					id: 'acc_001',
					name: 'Expenses:Food',
					type: 'Expenses',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const uniquenessErrors = errors.filter(e => e.code === AccountValidationCode.ACC_002);
			expect(uniquenessErrors.length).toBeGreaterThan(0);
			expect(uniquenessErrors[0].message).toContain('plusieurs fois');
		});

		it('devrait accepter des IDs différents', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				},
				{
					id: 'acc_002',
					name: 'Expenses:Food',
					type: 'Expenses',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const uniquenessErrors = errors.filter(e => e.code === AccountValidationCode.ACC_002);
			expect(uniquenessErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-ACC-003 : Nom non vide
	// ========================================================================

	describe('V-ACC-003: Nom non vide', () => {
		it('devrait accepter un nom valide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF:PostFinance',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameErrors = errors.filter(e => e.code === AccountValidationCode.ACC_003);
			expect(nameErrors).toHaveLength(0);
		});

		it('devrait rejeter un nom vide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: '',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameErrors = errors.filter(e => e.code === AccountValidationCode.ACC_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un nom avec seulement des espaces', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: '   ',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameErrors = errors.filter(e => e.code === AccountValidationCode.ACC_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un nom manquant', () => {
			const accounts = [
				{
					id: 'acc_001',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameErrors = errors.filter(e => e.code === AccountValidationCode.ACC_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-ACC-004 : Nom unique
	// ========================================================================

	describe('V-ACC-004: Nom unique', () => {
		it('devrait rejeter des noms en double', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				},
				{
					id: 'acc_002',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameUniqueErrors = errors.filter(e => e.code === AccountValidationCode.ACC_004);
			expect(nameUniqueErrors.length).toBeGreaterThan(0);
		});

		it('devrait accepter des noms différents', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				},
				{
					id: 'acc_002',
					name: 'Assets:Bank:EUR',
					type: 'Assets',
					currency: 'EUR',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const nameUniqueErrors = errors.filter(e => e.code === AccountValidationCode.ACC_004);
			expect(nameUniqueErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-ACC-005 : Type valide
	// ========================================================================

	describe('V-ACC-005: Type valide', () => {
		it('devrait accepter tous les types valides', () => {
			const accounts = AccountTypes.map((type, index) => ({
				id: `acc_${index + 1}`,
				name: `${type}:Test`,
				type: type,
				currency: 'CHF',
				opened: '2025-01-01'
			}));
			const errors = validateAccounts(accounts, validCurrencies);
			const typeErrors = errors.filter(e => e.code === AccountValidationCode.ACC_005);
			expect(typeErrors).toHaveLength(0);
		});

		it('devrait rejeter un type invalide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Invalid:Test',
					type: 'Invalid',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeErrors = errors.filter(e => e.code === AccountValidationCode.ACC_005);
			expect(typeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un type manquant', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Test',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeErrors = errors.filter(e => e.code === AccountValidationCode.ACC_005);
			expect(typeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un type en minuscules', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'assets:Test',
					type: 'assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeErrors = errors.filter(e => e.code === AccountValidationCode.ACC_005);
			expect(typeErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-ACC-006 : Devise existante
	// ========================================================================

	describe('V-ACC-006: Devise existante', () => {
		it('devrait accepter une devise existante', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const currencyErrors = errors.filter(e => e.code === AccountValidationCode.ACC_006);
			expect(currencyErrors).toHaveLength(0);
		});

		it('devrait rejeter une devise non existante', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'USD',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const currencyErrors = errors.filter(e => e.code === AccountValidationCode.ACC_006);
			expect(currencyErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une devise manquante', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const currencyErrors = errors.filter(e => e.code === AccountValidationCode.ACC_006);
			expect(currencyErrors.length).toBeGreaterThan(0);
		});

		it('ne devrait pas vérifier si aucune devise fournie', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'USD',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, []);
			// Avec currencies = [], aucune vérification
			const currencyErrors = errors.filter(
				e => e.code === AccountValidationCode.ACC_006 && e.message.includes("n'existe pas")
			);
			expect(currencyErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-ACC-007 : Date d'ouverture YYYY-MM-DD
	// ========================================================================

	describe('V-ACC-007: Date d\'ouverture YYYY-MM-DD', () => {
		it('devrait accepter une date valide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-15'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === AccountValidationCode.ACC_007);
			expect(dateErrors).toHaveLength(0);
		});

		it('devrait rejeter une date au format DD/MM/YYYY', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '15/01/2025'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === AccountValidationCode.ACC_007);
			expect(dateErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une date invalide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: 'invalid-date'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === AccountValidationCode.ACC_007);
			expect(dateErrors.length).toBeGreaterThan(0);
		});

		it('devrait accepter un compte sans date d\'ouverture (optionnel)', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const dateErrors = errors.filter(e => e.code === AccountValidationCode.ACC_007);
			// La date opened est obligatoire uniquement dans validateNewAccount
			expect(dateErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-ACC-008 : Date de clôture >= date d'ouverture
	// ========================================================================

	describe('V-ACC-008: Date de clôture >= date d\'ouverture', () => {
		it('devrait accepter une date de clôture après ouverture', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01',
					closed: true,
					closedDate: '2025-12-31'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const closedErrors = errors.filter(e => e.code === AccountValidationCode.ACC_008);
			expect(closedErrors).toHaveLength(0);
		});

		it('devrait accepter une date de clôture égale à ouverture', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-15',
					closed: true,
					closedDate: '2025-01-15'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const closedErrors = errors.filter(e => e.code === AccountValidationCode.ACC_008);
			expect(closedErrors).toHaveLength(0);
		});

		it('devrait rejeter une date de clôture avant ouverture', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-12-31',
					closed: true,
					closedDate: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const closedErrors = errors.filter(e => e.code === AccountValidationCode.ACC_008);
			expect(closedErrors.length).toBeGreaterThan(0);
			expect(closedErrors[0].message).toContain('antérieure');
		});

		it('devrait rejeter compte clôturé sans date de clôture', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01',
					closed: true
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const closedErrors = errors.filter(e => e.code === AccountValidationCode.ACC_008);
			expect(closedErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une date de clôture au format invalide', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01',
					closed: true,
					closedDate: '31/12/2025'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const closedErrors = errors.filter(e => e.code === AccountValidationCode.ACC_008);
			expect(closedErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-ACC-009 : Au moins 2 segments
	// ========================================================================

	describe('V-ACC-009: Au moins 2 segments', () => {
		it('devrait accepter un nom avec 2 segments', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const segmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_009);
			expect(segmentErrors).toHaveLength(0);
		});

		it('devrait accepter un nom avec 4 segments', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF:PostFinance',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const segmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_009);
			expect(segmentErrors).toHaveLength(0);
		});

		it('devrait rejeter un nom avec 1 segment', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const segmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_009);
			expect(segmentErrors.length).toBeGreaterThan(0);
			expect(segmentErrors[0].message).toContain('au moins 2 segments');
		});
	});

	// ========================================================================
	// V-ACC-010 : Premier segment = type
	// ========================================================================

	describe('V-ACC-010: Premier segment = type', () => {
		it('devrait accepter un nom cohérent avec le type', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeSegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_010);
			expect(typeSegmentErrors).toHaveLength(0);
		});

		it('devrait rejeter une incohérence type/nom', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Expenses:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeSegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_010);
			expect(typeSegmentErrors.length).toBeGreaterThan(0);
			expect(typeSegmentErrors[0].message).toContain('premier segment');
		});

		it('devrait rejeter nom avec type Income et premier segment Expenses', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Expenses:Salary',
					type: 'Income',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const typeSegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_010);
			expect(typeSegmentErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-ACC-011 : Aucun segment vide
	// ========================================================================

	describe('V-ACC-011: Aucun segment vide', () => {
		it('devrait accepter un nom sans segments vides', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const emptySegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_011);
			expect(emptySegmentErrors).toHaveLength(0);
		});

		it('devrait rejeter un nom avec segment vide au milieu', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets::CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const emptySegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_011);
			expect(emptySegmentErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un nom avec segment vide à la fin', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			const emptySegmentErrors = errors.filter(e => e.code === AccountValidationCode.ACC_011);
			expect(emptySegmentErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// Tests pour validateNewAccount() - Validation UI
	// ========================================================================

	describe('validateNewAccount() - Validation UI', () => {
		it('devrait accepter un compte valide', () => {
			const account = {
				name: 'Assets:Bank:CHF:PostFinance',
				type: 'Assets',
				currency: 'CHF',
				opened: '2025-01-15'
			};
			const existing = [];
			const result = validateNewAccount(account, existing, validCurrencies);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait rejeter un compte avec nom existant', () => {
			const account = {
				name: 'Assets:Bank:CHF',
				type: 'Assets',
				currency: 'CHF',
				opened: '2025-01-15'
			};
			const existing = [
				{
					id: 'acc_001',
					name: 'Assets:Bank:CHF',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01'
				}
			];
			const result = validateNewAccount(account, existing, validCurrencies);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.code === AccountValidationCode.ACC_004)).toBe(true);
		});

		it('devrait rejeter un compte avec plusieurs erreurs', () => {
			const account = {
				name: 'Assets',
				type: 'InvalidType',
				currency: 'USD',
				opened: 'invalid-date'
			};
			const result = validateNewAccount(account, [], validCurrencies);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
		});

		it('devrait rejeter un compte sans champs obligatoires', () => {
			const account = {};
			const result = validateNewAccount(account, [], validCurrencies);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
		});
	});

	// ========================================================================
	// Tests pour generateAccountId()
	// ========================================================================

	describe('generateAccountId()', () => {
		it('devrait générer acc_001 pour une liste vide', () => {
			const id = generateAccountId([]);
			expect(id).toBe('acc_001');
		});

		it('devrait générer acc_002 après acc_001', () => {
			const existing = [{ id: 'acc_001' }];
			const id = generateAccountId(existing);
			expect(id).toBe('acc_002');
		});

		it('devrait générer acc_010 après acc_009', () => {
			const existing = Array.from({ length: 9 }, (_, i) => ({
				id: `acc_${String(i + 1).padStart(3, '0')}`
			}));
			const id = generateAccountId(existing);
			expect(id).toBe('acc_010');
		});

		it('devrait gérer des IDs non séquentiels', () => {
			const existing = [{ id: 'acc_001' }, { id: 'acc_005' }, { id: 'acc_003' }];
			const id = generateAccountId(existing);
			expect(id).toBe('acc_006');
		});

		it('devrait ignorer les IDs invalides', () => {
			const existing = [{ id: 'acc_001' }, { id: 'invalid_id' }, { id: 'acc_002' }];
			const id = generateAccountId(existing);
			expect(id).toBe('acc_003');
		});

		it('devrait gérer des comptes sans ID', () => {
			const existing = [{ id: 'acc_001' }, { name: 'Test' }];
			const id = generateAccountId(existing);
			expect(id).toBe('acc_002');
		});
	});

	// ========================================================================
	// Tests pour createAccount()
	// ========================================================================

	describe('createAccount()', () => {
		it('devrait créer un compte avec toutes les données', () => {
			const data = {
				name: 'Assets:Bank:CHF',
				type: 'Assets',
				currency: 'CHF',
				opened: '2025-01-15',
				description: 'Compte bancaire principal'
			};
			const account = createAccount(data, []);
			expect(account.id).toBe('acc_001');
			expect(account.name).toBe(data.name);
			expect(account.type).toBe(data.type);
			expect(account.currency).toBe(data.currency);
			expect(account.opened).toBe(data.opened);
			expect(account.description).toBe(data.description);
			expect(account.closed).toBe(false);
			expect(account.closedDate).toBe(null);
		});

		it('devrait créer un compte avec valeurs par défaut', () => {
			const data = {
				name: 'Expenses:Food',
				type: 'Expenses',
				currency: 'CHF',
				opened: '2025-01-15'
			};
			const account = createAccount(data, []);
			expect(account.description).toBe('');
			expect(account.closed).toBe(false);
			expect(account.closedDate).toBe(null);
			expect(account.metadata).toEqual({});
		});

		it('devrait utiliser l\'ID fourni si présent', () => {
			const data = {
				id: 'acc_999',
				name: 'Assets:Cash',
				type: 'Assets',
				currency: 'CHF',
				opened: '2025-01-15'
			};
			const account = createAccount(data, []);
			expect(account.id).toBe('acc_999');
		});

		it('devrait générer un ID si non fourni', () => {
			const data = {
				name: 'Assets:Cash',
				type: 'Assets',
				currency: 'CHF',
				opened: '2025-01-15'
			};
			const existing = [{ id: 'acc_001' }, { id: 'acc_002' }];
			const account = createAccount(data, existing);
			expect(account.id).toBe('acc_003');
		});
	});

	// ========================================================================
	// Tests de cas limite (Edge Cases)
	// ========================================================================

	describe('Edge Cases', () => {
		it('devrait gérer un tableau de comptes vide', () => {
			const accounts = [];
			const errors = validateAccounts(accounts, validCurrencies);
			expect(errors).toHaveLength(0);
		});

		it('devrait gérer accounts non tableau', () => {
			const accounts = null;
			const errors = validateAccounts(accounts, validCurrencies);
			expect(errors).toHaveLength(0);
		});

		it('devrait gérer un compte avec tous les champs manquants', () => {
			const accounts = [{}];
			const errors = validateAccounts(accounts, validCurrencies);
			expect(errors.length).toBeGreaterThanOrEqual(4);
		});

		it('devrait accepter un compte avec des métadonnées', () => {
			const accounts = [
				{
					id: 'acc_001',
					name: 'Assets:Bank',
					type: 'Assets',
					currency: 'CHF',
					opened: '2025-01-01',
					metadata: { customField: 'value' }
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			// Les métadonnées ne causent pas d'erreur
			expect(errors.filter(e => e.severity === ValidationSeverity.ERROR)).toHaveLength(0);
		});

		it('devrait gérer plusieurs erreurs sur le même compte', () => {
			const accounts = [
				{
					id: 'invalid',
					name: 'X',
					type: 'InvalidType',
					currency: 'INVALID',
					opened: 'bad-date'
				}
			];
			const errors = validateAccounts(accounts, validCurrencies);
			// Devrait avoir plusieurs erreurs
			expect(errors.length).toBeGreaterThanOrEqual(5);
		});
	});
});
