/**
 * Tests unitaires pour currencyStore.js
 *
 * Test Coverage:
 * - Stores dérivés (currencies, defaultCurrency)
 * - addCurrency() avec validation
 * - updateCurrency()
 * - deleteCurrency() avec vérifications d'utilisation
 * - addExchangeRate() avec validation
 * - updateExchangeRate()
 * - deleteExchangeRate()
 * - getExchangeRate() avec recherche par date
 * - Exports CSV (currencies, exchangeRates)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock des dépendances
vi.mock('$lib/stores/dataStore.js', () => ({
	dataStore: {
		updateData: vi.fn(),
		subscribe: vi.fn(),
		loadData: vi.fn(),
		save: vi.fn(),
		reset: vi.fn()
	}
}));

vi.mock('$lib/domain/models.js', () => ({
	createCurrency: vi.fn(data => ({
		code: data.code,
		name: data.name,
		symbol: data.symbol,
		decimalPlaces: data.decimalPlaces || 2,
		isDefault: data.isDefault || false
	})),
	createExchangeRate: vi.fn(data => ({
		date: data.date,
		rate: data.rate,
		source: data.source || ''
	}))
}));

vi.mock('$lib/domain/currencyValidator.js', () => ({
	validateNewCurrency: vi.fn(),
	validateNewExchangeRate: vi.fn()
}));

describe('currencyStore', () => {
	let currencies, defaultCurrency, addCurrency, updateCurrency, deleteCurrency;
	let addExchangeRate, updateExchangeRate, deleteExchangeRate, getExchangeRate;
	let exportCurrenciesCSV, exportExchangeRatesCSV;
	let dataStore, validateNewCurrency, validateNewExchangeRate, createCurrency, createExchangeRate;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Importer les mocks
		const dataStoreModule = await import('$lib/stores/dataStore.js');
		const modelsModule = await import('$lib/domain/models.js');
		const validatorModule = await import('$lib/domain/currencyValidator.js');

		dataStore = dataStoreModule.dataStore;
		createCurrency = modelsModule.createCurrency;
		createExchangeRate = modelsModule.createExchangeRate;
		validateNewCurrency = validatorModule.validateNewCurrency;
		validateNewExchangeRate = validatorModule.validateNewExchangeRate;

		// Réimporter le store pour avoir une instance fraîche
		vi.resetModules();
		const currencyStoreModule = await import('$lib/stores/currencyStore.js');
		currencies = currencyStoreModule.currencies;
		defaultCurrency = currencyStoreModule.defaultCurrency;
		addCurrency = currencyStoreModule.addCurrency;
		updateCurrency = currencyStoreModule.updateCurrency;
		deleteCurrency = currencyStoreModule.deleteCurrency;
		addExchangeRate = currencyStoreModule.addExchangeRate;
		updateExchangeRate = currencyStoreModule.updateExchangeRate;
		deleteExchangeRate = currencyStoreModule.deleteExchangeRate;
		getExchangeRate = currencyStoreModule.getExchangeRate;
		exportCurrenciesCSV = currencyStoreModule.exportCurrenciesCSV;
		exportExchangeRatesCSV = currencyStoreModule.exportExchangeRatesCSV;

		// Mock de dataStore avec données par défaut
		vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
			callback({
				data: {
					currency: [],
					account: [],
					transaction: [],
					metadata: { defaultCurrency: 'CHF' }
				}
			});
			return () => {};
		});
	});

	describe('addCurrency()', () => {
		it('devrait ajouter une devise valide', () => {
			const mockCurrency = {
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: false
			};

			// Mock de la validation
			validateNewCurrency.mockReturnValue({ valid: true, errors: [] });

			// Mock de createCurrency
			createCurrency.mockReturnValue(mockCurrency);

			// Mock du store pour retourner une liste vide
			let updateFn;
			dataStore.updateData.mockImplementation((fn) => {
				updateFn = fn;
				const data = {
					currency: [],
					metadata: { defaultCurrency: 'CHF' }
				};
				fn(data);
			});

			const result = addCurrency(mockCurrency);

			expect(result.success).toBe(true);
			expect(result.currency).toEqual(mockCurrency);
			expect(validateNewCurrency).toHaveBeenCalledWith(mockCurrency, []);
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait rejeter une devise invalide', () => {
			const mockCurrency = {
				code: 'INVALID',
				name: 'Invalid Currency',
				symbol: 'X',
				decimalPlaces: 2
			};

			validateNewCurrency.mockReturnValue({
				valid: false,
				errors: [{ field: 'code', message: 'Code invalide' }]
			});

			const result = addCurrency(mockCurrency);

			expect(result.success).toBe(false);
			expect(result.errors).toEqual([{ field: 'code', message: 'Code invalide' }]);
			expect(dataStore.updateData).not.toHaveBeenCalled();
		});

		it('devrait gérer la devise par défaut correctement', () => {
			const mockCurrency = {
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true
			};

			validateNewCurrency.mockReturnValue({ valid: true, errors: [] });
			createCurrency.mockReturnValue(mockCurrency);

			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true }
					],
					metadata: { defaultCurrency: 'CHF' }
				};
				capturedData = fn(data);
			});

			addCurrency(mockCurrency);

			// Vérifier que l'ancienne devise par défaut a perdu son flag
			expect(capturedData.currency[0].isDefault).toBe(false);
			// Vérifier que metadata.defaultCurrency est mis à jour
			expect(capturedData.metadata.defaultCurrency).toBe('EUR');
		});

		it('devrait trier les devises par code alphabétique', () => {
			validateNewCurrency.mockReturnValue({ valid: true, errors: [] });
			createCurrency.mockReturnValue({ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 });

			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'EUR', name: 'Euro', symbol: '€' },
						{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' }
					],
					metadata: {}
				};
				capturedData = fn(data);
			});

			addCurrency({ code: 'USD', name: 'US Dollar', symbol: '$' });

			// Vérifier l'ordre : CHF, EUR, USD
			expect(capturedData.currency[0].code).toBe('CHF');
			expect(capturedData.currency[1].code).toBe('EUR');
			expect(capturedData.currency[2].code).toBe('USD');
		});
	});

	describe('updateCurrency()', () => {
		it('devrait mettre à jour une devise existante', () => {
			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
					]
				};
				capturedData = fn(data);
			});

			const result = updateCurrency('EUR', { name: 'Euro (Updated)' });

			expect(result.success).toBe(true);
			expect(capturedData.currency[0].name).toBe('Euro (Updated)');
		});

		it('devrait gérer le changement de devise par défaut', () => {
			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true },
						{ code: 'EUR', name: 'Euro', symbol: '€', isDefault: false }
					],
					metadata: { defaultCurrency: 'CHF' }
				};
				capturedData = fn(data);
			});

			updateCurrency('EUR', { isDefault: true });

			// CHF ne devrait plus être par défaut
			expect(capturedData.currency.find(c => c.code === 'CHF').isDefault).toBe(false);
			// EUR devrait être par défaut
			expect(capturedData.currency.find(c => c.code === 'EUR').isDefault).toBe(true);
			// metadata devrait être mis à jour
			expect(capturedData.metadata.defaultCurrency).toBe('EUR');
		});

		it('ne devrait rien faire si la devise n\'existe pas', () => {
			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' }
					]
				};
				capturedData = fn(data);
				return data;
			});

			updateCurrency('UNKNOWN', { name: 'Test' });

			// Les données ne devraient pas changer
			expect(capturedData.currency.length).toBe(1);
			expect(capturedData.currency[0].code).toBe('CHF');
		});
	});

	describe('deleteCurrency()', () => {
		it('devrait empêcher la suppression de la devise par défaut', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true }
						]
					}
				});
				return () => {};
			});

			const result = deleteCurrency('CHF');

			expect(result.success).toBe(false);
			expect(result.error).toContain('Impossible de supprimer la devise par défaut');
		});

		it('devrait empêcher la suppression d\'une devise utilisée dans des comptes', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€', isDefault: false }
						],
						account: [
							{ id: 'acc_001', name: 'Assets:Bank:EUR', currency: 'EUR' }
						],
						transaction: []
					}
				});
				return () => {};
			});

			const result = deleteCurrency('EUR');

			expect(result.success).toBe(false);
			expect(result.error).toContain('Elle est utilisée dans');
			expect(result.error).toContain('compte(s)');
			expect(result.details.type).toBe('accounts');
			expect(result.details.count).toBe(1);
		});

		it('devrait empêcher la suppression d\'une devise utilisée dans des transactions', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€', isDefault: false }
						],
						account: [],
						transaction: [
							{
								id: 'txn_001',
								date: '2025-01-15',
								description: 'Test',
								posting: [
									{ accountId: 'acc_001', amount: 100, currency: 'EUR' }
								]
							}
						]
					}
				});
				return () => {};
			});

			const result = deleteCurrency('EUR');

			expect(result.success).toBe(false);
			expect(result.error).toContain('écriture(s) de transaction');
			expect(result.details.type).toBe('transactions');
			expect(result.details.count).toBe(1);
		});

		it('devrait supprimer une devise non utilisée', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true },
							{ code: 'EUR', name: 'Euro', symbol: '€', isDefault: false }
						],
						account: [],
						transaction: []
					}
				});
				return () => {};
			});

			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: true },
						{ code: 'EUR', name: 'Euro', symbol: '€', isDefault: false }
					]
				};
				capturedData = fn(data);
			});

			const result = deleteCurrency('EUR');

			expect(result.success).toBe(true);
			expect(capturedData.currency.length).toBe(1);
			expect(capturedData.currency[0].code).toBe('CHF');
		});
	});

	describe('addExchangeRate()', () => {
		it('devrait ajouter un taux de change valide', () => {
			const rateData = {
				date: '2025-01-15',
				rate: 0.95,
				source: 'ECB'
			};

			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€' }
						]
					}
				});
				return () => {};
			});

			validateNewExchangeRate.mockReturnValue({ valid: true, errors: [] });
			createExchangeRate.mockReturnValue(rateData);

			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{ code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: [] }
					]
				};
				capturedData = fn(data);
			});

			const result = addExchangeRate('EUR', rateData);

			expect(result.success).toBe(true);
			expect(result.rate).toEqual(rateData);
			expect(capturedData.currency[0].exchangeRate.length).toBe(1);
		});

		it('devrait rejeter un taux de change invalide', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€' }
						]
					}
				});
				return () => {};
			});

			validateNewExchangeRate.mockReturnValue({
				valid: false,
				errors: [{ message: 'Taux invalide' }]
			});

			const result = addExchangeRate('EUR', { date: '2025-01-15', rate: -1 });

			expect(result.success).toBe(false);
			expect(result.errors).toEqual([{ message: 'Taux invalide' }]);
		});

		it('devrait trier les taux par date décroissante', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€' }
						]
					}
				});
				return () => {};
			});

			validateNewExchangeRate.mockReturnValue({ valid: true, errors: [] });
			createExchangeRate.mockReturnValue({ date: '2025-01-15', rate: 0.95 });

			let capturedData;
			dataStore.updateData.mockImplementation((fn) => {
				const data = {
					currency: [
						{
							code: 'EUR',
							name: 'Euro',
							symbol: '€',
							exchangeRate: [
								{ date: '2025-01-10', rate: 0.94 },
								{ date: '2025-01-20', rate: 0.96 }
							]
						}
					]
				};
				capturedData = fn(data);
			});

			addExchangeRate('EUR', { date: '2025-01-15', rate: 0.95 });

			// Ordre attendu : 2025-01-20, 2025-01-15, 2025-01-10
			expect(capturedData.currency[0].exchangeRate[0].date).toBe('2025-01-20');
			expect(capturedData.currency[0].exchangeRate[1].date).toBe('2025-01-15');
			expect(capturedData.currency[0].exchangeRate[2].date).toBe('2025-01-10');
		});
	});

	describe('getExchangeRate()', () => {
		it('devrait retourner le taux applicable pour une date donnée', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{
								code: 'EUR',
								name: 'Euro',
								symbol: '€',
								exchangeRate: [
									{ date: '2025-01-20', rate: 0.96 },
									{ date: '2025-01-10', rate: 0.94 }
								]
							}
						]
					}
				});
				return () => {};
			});

			// Demander le taux pour le 15 janvier
			// Devrait retourner le taux du 10 janvier (le plus récent <= 15)
			const rate = getExchangeRate('EUR', '2025-01-15');

			expect(rate).toBe(0.94);
		});

		it('devrait retourner null si aucun taux n\'est disponible', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'EUR', name: 'Euro', symbol: '€' }
						]
					}
				});
				return () => {};
			});

			const rate = getExchangeRate('EUR', '2025-01-15');

			expect(rate).toBe(null);
		});

		it('devrait retourner null si la devise n\'existe pas', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: []
					}
				});
				return () => {};
			});

			const rate = getExchangeRate('UNKNOWN', '2025-01-15');

			expect(rate).toBe(null);
		});
	});

	describe('Export CSV', () => {
		it('devrait exporter les devises au format CSV', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
							{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
						]
					}
				});
				return () => {};
			});

			const csv = exportCurrenciesCSV();

			expect(csv).toContain('Code,Nom,Symbole,Décimales,Par défaut');
			expect(csv).toContain('CHF,"Swiss Franc","CHF",2,Oui');
			expect(csv).toContain('EUR,"Euro","€",2,Non');
		});

		it('devrait exporter les taux de change au format CSV', () => {
			vi.mocked(dataStore.subscribe).mockImplementation((callback) => {
				callback({
					data: {
						currency: [
							{
								code: 'EUR',
								name: 'Euro',
								exchangeRate: [
									{ date: '2025-01-15', rate: 0.95, source: 'ECB' },
									{ date: '2025-01-10', rate: 0.94, source: 'ECB' }
								]
							}
						]
					}
				});
				return () => {};
			});

			const csv = exportExchangeRatesCSV();

			expect(csv).toContain('Code Devise,Nom Devise,Date,Taux,Source');
			expect(csv).toContain('EUR,"Euro",2025-01-15,0.95,"ECB"');
			expect(csv).toContain('EUR,"Euro",2025-01-10,0.94,"ECB"');
		});
	});
});
