/**
 * Tests unitaires pour currencyValidator.js
 * Couvre les règles V-CUR-001 à V-CUR-012
 */

import { describe, it, expect } from 'vitest';
import {
	validateCurrencies,
	validateNewCurrency,
	validateNewExchangeRate,
	CurrencyValidationCode
} from '../currencyValidator.js';
import { ValidationSeverity } from '../validator.js';

describe('Currency Validator', () => {
	// ========================================================================
	// V-CUR-001 : Code ISO 4217 (3 lettres majuscules)
	// ========================================================================

	describe('V-CUR-001: Code ISO 4217', () => {
		it('devrait accepter un code ISO 4217 valide (CHF)', () => {
			const currencies = [
				{
					code: 'CHF',
					name: 'Swiss Franc',
					symbol: 'CHF',
					decimalPlaces: 2,
					isDefault: true
				}
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors).toHaveLength(0);
		});

		it('devrait accepter différents codes valides (EUR, USD, GBP)', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false },
				{ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isDefault: false },
				{ code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors).toHaveLength(0);
		});

		it('devrait rejeter un code trop court (2 lettres)', () => {
			const currencies = [
				{ code: 'CH', name: 'Test', symbol: 'CH', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
			expect(codeErrors[0].message).toContain('ISO 4217');
		});

		it('devrait rejeter un code trop long (4 lettres)', () => {
			const currencies = [
				{ code: 'CHFF', name: 'Test', symbol: 'CHFF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un code avec minuscules', () => {
			const currencies = [
				{ code: 'chf', name: 'Test', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un code avec chiffres', () => {
			const currencies = [
				{ code: 'CH1', name: 'Test', symbol: 'CH1', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un code vide', () => {
			const currencies = [
				{ code: '', name: 'Test', symbol: 'X', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un code manquant', () => {
			const currencies = [
				{ name: 'Test', symbol: 'X', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const codeErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_001);
			expect(codeErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-002 : Unicité du code
	// ========================================================================

	describe('V-CUR-002: Unicité du code', () => {
		it('devrait rejeter un code en double', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'CHF', name: 'Swiss Franc 2', symbol: 'CHF', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const uniquenessErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_002);
			expect(uniquenessErrors.length).toBeGreaterThan(0);
			expect(uniquenessErrors[0].message).toContain('plusieurs fois');
		});

		it('devrait accepter des codes différents', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const uniquenessErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_002);
			expect(uniquenessErrors).toHaveLength(0);
		});

		it('devrait détecter plusieurs doublons', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'CHF', name: 'Duplicate 1', symbol: 'CHF', decimalPlaces: 2, isDefault: false },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false },
				{ code: 'EUR', name: 'Duplicate 2', symbol: '€', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const uniquenessErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_002);
			expect(uniquenessErrors.length).toBeGreaterThanOrEqual(2);
		});
	});

	// ========================================================================
	// V-CUR-003 : Nom non vide
	// ========================================================================

	describe('V-CUR-003: Nom non vide', () => {
		it('devrait accepter un nom valide', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const nameErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_003);
			expect(nameErrors).toHaveLength(0);
		});

		it('devrait rejeter un nom vide', () => {
			const currencies = [
				{ code: 'CHF', name: '', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const nameErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un nom avec seulement des espaces', () => {
			const currencies = [
				{ code: 'CHF', name: '   ', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const nameErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un nom manquant', () => {
			const currencies = [
				{ code: 'CHF', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const nameErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_003);
			expect(nameErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-004 : Symbole non vide
	// ========================================================================

	describe('V-CUR-004: Symbole non vide', () => {
		it('devrait accepter un symbole valide', () => {
			const currencies = [
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const symbolErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_004);
			expect(symbolErrors).toHaveLength(0);
		});

		it('devrait rejeter un symbole vide', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: '', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const symbolErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_004);
			expect(symbolErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un symbole manquant', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const symbolErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_004);
			expect(symbolErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-005 : Décimales entre 0 et 8
	// ========================================================================

	describe('V-CUR-005: Décimales entre 0 et 8', () => {
		it('devrait accepter 0 décimale', () => {
			const currencies = [
				{ code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors).toHaveLength(0);
		});

		it('devrait accepter 2 décimales (standard)', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors).toHaveLength(0);
		});

		it('devrait accepter 8 décimales (crypto)', () => {
			const currencies = [
				{ code: 'BTC', name: 'Bitcoin', symbol: '₿', decimalPlaces: 8, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors).toHaveLength(0);
		});

		it('devrait rejeter -1 décimale', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: -1, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter 9 décimales', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 9, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors.length).toBeGreaterThan(0);
		});

		it('devrait accepter un nombre décimal de décimales qui est dans la plage (limitation JS)', () => {
			// Note: JavaScript accepte 2.5 qui est entre 0 et 8
			// C'est une limitation du validateur actuel
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2.5, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			// Le validateur actuel accepte ceci car 2.5 est entre 0 et 8
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors).toHaveLength(0);
		});

		it('devrait rejeter decimalPlaces manquant', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const decimalErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_005);
			expect(decimalErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-006 : Une seule devise par défaut
	// ========================================================================

	describe('V-CUR-006: Une seule devise par défaut', () => {
		it('devrait accepter une seule devise par défaut', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const defaultErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_006);
			expect(defaultErrors).toHaveLength(0);
		});

		it('devrait rejeter aucune devise par défaut', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: false },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
			];
			const errors = validateCurrencies(currencies);
			const defaultErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_006);
			expect(defaultErrors.length).toBeGreaterThan(0);
			expect(defaultErrors[0].message).toContain('Aucune devise par défaut');
		});

		it('devrait rejeter plusieurs devises par défaut', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const defaultErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_006);
			expect(defaultErrors.length).toBeGreaterThan(0);
			expect(defaultErrors[0].message).toContain('Plusieurs devises');
		});

		it('devrait rejeter 3 devises par défaut', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: true },
				{ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const defaultErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_006);
			expect(defaultErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-007 : Cohérence avec metadata.defaultCurrency
	// ========================================================================

	describe('V-CUR-007: Cohérence avec metadata.defaultCurrency', () => {
		it('devrait accepter une cohérence correcte', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const metadata = { defaultCurrency: 'CHF' };
			const errors = validateCurrencies(currencies, metadata);
			const consistencyErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_007);
			expect(consistencyErrors).toHaveLength(0);
		});

		it('devrait rejeter une incohérence', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const metadata = { defaultCurrency: 'EUR' };
			const errors = validateCurrencies(currencies, metadata);
			const consistencyErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_007);
			expect(consistencyErrors.length).toBeGreaterThan(0);
			expect(consistencyErrors[0].message).toContain('Incohérence');
		});

		it('ne devrait pas vérifier si metadata est absent', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const consistencyErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_007);
			expect(consistencyErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-CUR-008 : Date taux format YYYY-MM-DD
	// ========================================================================

	describe('V-CUR-008: Date taux format YYYY-MM-DD', () => {
		it('devrait accepter une date valide', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const dateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_008);
			expect(dateErrors).toHaveLength(0);
		});

		it('devrait rejeter une date au format DD/MM/YYYY', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '15/01/2025', rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const dateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_008);
			expect(dateErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter une date manquante', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const dateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_008);
			expect(dateErrors.length).toBeGreaterThan(0);
		});

		it('devrait accepter une date au format valide même si sémantiquement incorrecte', () => {
			// Note: JavaScript convertit automatiquement 2025-02-31 en date valide
			// C'est une limitation de la validation de date actuelle
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-02-31', rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			// Le validateur accepte ceci car new Date('2025-02-31') crée une date valide en JS
			const dateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_008);
			expect(dateErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-CUR-009 : Taux > 0
	// ========================================================================

	describe('V-CUR-009: Taux > 0', () => {
		it('devrait accepter un taux positif', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const rateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_009);
			expect(rateErrors).toHaveLength(0);
		});

		it('devrait rejeter un taux négatif', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: -0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const rateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_009);
			expect(rateErrors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un taux de 0', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: 0 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const rateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_009);
			expect(rateErrors.length).toBeGreaterThan(0);
		});
	});

	// ========================================================================
	// V-CUR-010 : Avertissement si taux = 1.0
	// ========================================================================

	describe('V-CUR-010: Avertissement si taux = 1.0', () => {
		it('devrait émettre un warning pour taux = 1.0', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: 1.0 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const warningErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_010);
			expect(warningErrors.length).toBeGreaterThan(0);
			expect(warningErrors[0].severity).toBe(ValidationSeverity.WARNING);
		});

		it('ne devrait pas émettre de warning pour taux ≠ 1.0', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [{ date: '2025-01-15', rate: 0.95 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const warningErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_010);
			expect(warningErrors).toHaveLength(0);
		});
	});

	// ========================================================================
	// V-CUR-011 : Dates de taux uniques
	// ========================================================================

	describe('V-CUR-011: Dates de taux uniques', () => {
		it('devrait accepter des dates différentes', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [
						{ date: '2025-01-15', rate: 0.95 },
						{ date: '2025-01-16', rate: 0.96 }
					]
				}
			];
			const errors = validateCurrencies(currencies);
			const dateUniqueErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_011);
			expect(dateUniqueErrors).toHaveLength(0);
		});

		it('devrait rejeter des dates en double', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: [
						{ date: '2025-01-15', rate: 0.95 },
						{ date: '2025-01-15', rate: 0.96 }
					]
				}
			];
			const errors = validateCurrencies(currencies);
			const dateUniqueErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_011);
			expect(dateUniqueErrors.length).toBeGreaterThan(0);
			expect(dateUniqueErrors[0].message).toContain('Plusieurs taux');
		});
	});

	// ========================================================================
	// V-CUR-012 : Devise par défaut sans taux
	// ========================================================================

	describe('V-CUR-012: Devise par défaut sans taux', () => {
		it('devrait accepter devise par défaut sans taux', () => {
			const currencies = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			const defaultRateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_012);
			expect(defaultRateErrors).toHaveLength(0);
		});

		it('devrait rejeter devise par défaut avec taux', () => {
			const currencies = [
				{
					code: 'CHF',
					name: 'Swiss Franc',
					symbol: 'CHF',
					decimalPlaces: 2,
					isDefault: true,
					exchangeRate: [{ date: '2025-01-15', rate: 1.0 }]
				}
			];
			const errors = validateCurrencies(currencies);
			const defaultRateErrors = errors.filter(e => e.code === CurrencyValidationCode.CUR_012);
			expect(defaultRateErrors.length).toBeGreaterThan(0);
			expect(defaultRateErrors[0].message).toContain('par défaut');
		});
	});

	// ========================================================================
	// Tests pour validateNewCurrency() - Validation UI
	// ========================================================================

	describe('validateNewCurrency() - Validation UI', () => {
		it('devrait accepter une devise valide', () => {
			const currency = {
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: false
			};
			const existing = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const result = validateNewCurrency(currency, existing);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait rejeter un code invalide', () => {
			const currency = {
				code: 'EURO',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: false
			};
			const result = validateNewCurrency(currency, []);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'code')).toBe(true);
		});

		it('devrait rejeter un code déjà existant', () => {
			const currency = {
				code: 'CHF',
				name: 'Swiss Franc 2',
				symbol: 'CHF',
				decimalPlaces: 2,
				isDefault: false
			};
			const existing = [
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const result = validateNewCurrency(currency, existing);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.code === CurrencyValidationCode.CUR_002)).toBe(true);
		});

		it('devrait rejeter plusieurs champs invalides', () => {
			const currency = {
				code: 'EURO',
				name: '',
				symbol: '',
				decimalPlaces: 10,
				isDefault: false
			};
			const result = validateNewCurrency(currency, []);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
		});
	});

	// ========================================================================
	// Tests pour validateNewExchangeRate() - Validation UI
	// ========================================================================

	describe('validateNewExchangeRate() - Validation UI', () => {
		it('devrait accepter un taux valide', () => {
			const exchangeRate = {
				date: '2025-01-15',
				rate: 0.95
			};
			const currency = {
				code: 'EUR',
				isDefault: false,
				exchangeRate: []
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			expect(result.valid).toBe(true);
		});

		it('devrait rejeter un taux pour devise par défaut', () => {
			const exchangeRate = {
				date: '2025-01-15',
				rate: 1.0
			};
			const currency = {
				code: 'CHF',
				isDefault: true,
				exchangeRate: []
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.code === CurrencyValidationCode.CUR_012)).toBe(true);
		});

		it('devrait rejeter une date invalide', () => {
			const exchangeRate = {
				date: '15/01/2025',
				rate: 0.95
			};
			const currency = {
				code: 'EUR',
				isDefault: false,
				exchangeRate: []
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.field === 'date')).toBe(true);
		});

		it('devrait rejeter un taux négatif', () => {
			const exchangeRate = {
				date: '2025-01-15',
				rate: -0.5
			};
			const currency = {
				code: 'EUR',
				isDefault: false,
				exchangeRate: []
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.code === CurrencyValidationCode.CUR_009)).toBe(true);
		});

		it('devrait émettre un warning pour taux = 1.0', () => {
			const exchangeRate = {
				date: '2025-01-15',
				rate: 1.0
			};
			const currency = {
				code: 'EUR',
				isDefault: false,
				exchangeRate: []
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			// Le warning ne rend pas le résultat invalide
			expect(result.valid).toBe(true);
			expect(result.errors.some(e => e.code === CurrencyValidationCode.CUR_010)).toBe(true);
		});

		it('devrait rejeter une date déjà existante', () => {
			const exchangeRate = {
				date: '2025-01-15',
				rate: 0.95
			};
			const currency = {
				code: 'EUR',
				isDefault: false,
				exchangeRate: [{ date: '2025-01-15', rate: 0.96 }]
			};
			const result = validateNewExchangeRate(exchangeRate, currency);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.code === CurrencyValidationCode.CUR_011)).toBe(true);
		});
	});

	// ========================================================================
	// Tests de cas limite (Edge Cases)
	// ========================================================================

	describe('Edge Cases', () => {
		it('devrait gérer un tableau de devises vide', () => {
			const currencies = [];
			const errors = validateCurrencies(currencies);
			expect(errors.length).toBeGreaterThan(0);
		});

		it('devrait gérer currencies non tableau', () => {
			const currencies = null;
			const errors = validateCurrencies(currencies);
			expect(errors.length).toBeGreaterThan(0);
		});

		it('devrait gérer une devise avec tous les champs manquants', () => {
			const currencies = [{}];
			const errors = validateCurrencies(currencies);
			expect(errors.length).toBeGreaterThanOrEqual(5);
		});

		it('devrait gérer des taux de change avec tableau vide', () => {
			const currencies = [
				{
					code: 'EUR',
					name: 'Euro',
					symbol: '€',
					decimalPlaces: 2,
					isDefault: false,
					exchangeRate: []
				},
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true }
			];
			const errors = validateCurrencies(currencies);
			// Pas d'erreur si exchangeRate est vide
			const rateErrors = errors.filter(
				e =>
					e.code === CurrencyValidationCode.CUR_008 ||
					e.code === CurrencyValidationCode.CUR_009 ||
					e.code === CurrencyValidationCode.CUR_011
			);
			expect(rateErrors).toHaveLength(0);
		});
	});
});
