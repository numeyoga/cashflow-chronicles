/**
 * Tests unitaires pour dataStore.js
 *
 * Test Coverage:
 * - Initialisation du store
 * - loadData() avec données valides/invalides
 * - updateData() et auto-save
 * - save() manuelle
 * - reset()
 * - Stores dérivés (stats, isModified, isSaving, saveMessage)
 * - Debounce de l'auto-save
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock des dépendances
vi.mock('$lib/infrastructure/fileStorage.js', () => ({
	saveToFile: vi.fn()
}));

vi.mock('$lib/domain/validator.js', () => ({
	validateTOMLStructure: vi.fn()
}));

describe('dataStore', () => {
	let dataStore, stats, isModified, isSaving, saveMessage;
	let saveToFile, validateTOMLStructure;

	beforeEach(async () => {
		// Réinitialiser les mocks
		vi.clearAllMocks();
		vi.clearAllTimers();
		vi.useFakeTimers();

		// Importer les mocks
		const fileStorage = await import('$lib/infrastructure/fileStorage.js');
		const validator = await import('$lib/domain/validator.js');
		saveToFile = fileStorage.saveToFile;
		validateTOMLStructure = validator.validateTOMLStructure;

		// Réimporter le store pour avoir une instance fraîche
		vi.resetModules();
		const storeModule = await import('$lib/stores/dataStore.js');
		dataStore = storeModule.dataStore;
		stats = storeModule.stats;
		isModified = storeModule.isModified;
		isSaving = storeModule.isSaving;
		saveMessage = storeModule.saveMessage;

		// Réinitialiser le store
		dataStore.reset();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe('État initial', () => {
		it('devrait avoir un état initial correct', () => {
			const state = get(dataStore);

			expect(state).toEqual({
				data: null,
				fileHandle: null,
				isModified: false,
				isSaving: false,
				lastSaveTime: null,
				validationReport: null,
				saveMessage: null
			});
		});

		it('devrait avoir des stats à zéro initialement', () => {
			const statsValue = get(stats);

			expect(statsValue).toEqual({
				currencies: 0,
				accounts: 0,
				transactions: 0,
				budgets: 0,
				recurring: 0
			});
		});

		it('devrait indiquer isModified=false initialement', () => {
			expect(get(isModified)).toBe(false);
		});

		it('devrait indiquer isSaving=false initialement', () => {
			expect(get(isSaving)).toBe(false);
		});

		it('devrait avoir saveMessage=null initialement', () => {
			expect(get(saveMessage)).toBe(null);
		});
	});

	describe('loadData()', () => {
		it('devrait charger des données valides avec succès', () => {
			const mockData = {
				version: '1.0.0',
				metadata: { created: '2025-01-01', defaultCurrency: 'CHF' },
				currency: [{ code: 'CHF', name: 'Swiss Franc' }],
				account: [],
				transaction: []
			};

			const mockFileHandle = { name: 'test.toml' };

			validateTOMLStructure.mockReturnValue({
				valid: true,
				errors: [],
				warnings: [],
				report: '✓ Fichier valide : 1 devise, 0 comptes, 0 transactions'
			});

			const result = dataStore.loadData(mockData, mockFileHandle);

			expect(result).toBe(true);

			const state = get(dataStore);
			expect(state.data).toEqual(mockData);
			expect(state.fileHandle).toEqual(mockFileHandle);
			expect(state.isModified).toBe(false);
			expect(state.validationReport).toBeDefined();
			expect(state.saveMessage).toEqual({
				type: 'success',
				text: '✓ Fichier valide : 1 devise, 0 comptes, 0 transactions'
			});
		});

		it('devrait rejeter des données invalides', () => {
			const mockData = { invalid: 'data' };

			validateTOMLStructure.mockReturnValue({
				valid: false,
				errors: [{ rule: 'V-STRUCT-001', message: 'Version manquante' }],
				warnings: [],
				report: '✗ Erreur : Version manquante'
			});

			const result = dataStore.loadData(mockData);

			expect(result).toBe(false);

			const state = get(dataStore);
			expect(state.data).toBe(null); // Les données ne sont pas chargées
			expect(state.saveMessage).toEqual({
				type: 'error',
				text: 'Erreurs de validation détectées'
			});
		});

		it('devrait mettre à jour les stats après chargement', () => {
			const mockData = {
				version: '1.0.0',
				metadata: {},
				currency: [{ code: 'CHF' }, { code: 'EUR' }],
				account: [{ id: 'acc_001' }, { id: 'acc_002' }, { id: 'acc_003' }],
				transaction: [{ id: 'txn_001' }],
				budget: [],
				recurring: []
			};

			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });

			dataStore.loadData(mockData);

			const statsValue = get(stats);
			expect(statsValue).toEqual({
				currencies: 2,
				accounts: 3,
				transactions: 1,
				budgets: 0,
				recurring: 0
			});
		});

		it('devrait gérer le chargement sans fileHandle', () => {
			const mockData = {
				version: '1.0.0',
				metadata: {},
				currency: [],
				account: [],
				transaction: []
			};

			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });

			const result = dataStore.loadData(mockData); // Pas de fileHandle

			expect(result).toBe(true);

			const state = get(dataStore);
			expect(state.data).toEqual(mockData);
			expect(state.fileHandle).toBe(null);
		});
	});

	describe('updateData()', () => {
		beforeEach(() => {
			// Charger des données initiales
			const mockData = {
				version: '1.0.0',
				metadata: {},
				currency: [{ code: 'CHF' }],
				account: [],
				transaction: []
			};

			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });
		});

		it('devrait mettre à jour les données', () => {
			dataStore.updateData(data => ({
				...data,
				currency: [...data.currency, { code: 'EUR' }]
			}));

			const state = get(dataStore);
			expect(state.data.currency.length).toBe(2);
			expect(state.data.currency[1].code).toBe('EUR');
		});

		it('devrait marquer isModified=true après modification', () => {
			expect(get(isModified)).toBe(false);

			dataStore.updateData(data => ({
				...data,
				currency: [...data.currency, { code: 'USD' }]
			}));

			expect(get(isModified)).toBe(true);
		});

		it('ne devrait pas modifier si data est null', () => {
			dataStore.reset();

			dataStore.updateData(data => ({
				...data,
				currency: []
			}));

			const state = get(dataStore);
			expect(state.data).toBe(null);
		});

		it('devrait déclencher auto-save avec debounce', async () => {
			saveToFile.mockResolvedValue({ success: true, message: 'Sauvegardé' });

			dataStore.updateData(data => ({
				...data,
				currency: [...data.currency, { code: 'EUR' }]
			}));

			// Avant le debounce, isSaving devrait être false
			expect(get(isSaving)).toBe(false);

			// Avancer le temps de 2 secondes (debounce)
			await vi.advanceTimersByTimeAsync(2000);

			// Attendre que les promesses se résolvent
			await vi.runAllTimersAsync();

			// Après le debounce, la sauvegarde devrait avoir été effectuée
			expect(saveToFile).toHaveBeenCalled();
			expect(get(isModified)).toBe(false);
		});

		it('devrait annuler le timer précédent si plusieurs modifications rapides', async () => {
			saveToFile.mockResolvedValue({ success: true, message: 'Sauvegardé' });

			// Première modification
			dataStore.updateData(data => ({
				...data,
				currency: [...data.currency, { code: 'EUR' }]
			}));

			// Avancer de 1 seconde (pas assez pour le debounce)
			await vi.advanceTimersByTimeAsync(1000);

			// Deuxième modification
			dataStore.updateData(data => ({
				...data,
				currency: [...data.currency, { code: 'USD' }]
			}));

			// Avancer de 2 secondes (debounce complet depuis la 2e modification)
			await vi.advanceTimersByTimeAsync(2000);
			await vi.runAllTimersAsync();

			// saveToFile ne devrait être appelé qu'une fois
			expect(saveToFile).toHaveBeenCalledTimes(1);
		});
	});

	describe('save() - Sauvegarde manuelle', () => {
		beforeEach(() => {
			const mockData = {
				version: '1.0.0',
				metadata: {},
				currency: [],
				account: [],
				transaction: []
			};

			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });
		});

		it('devrait sauvegarder manuellement avec succès', async () => {
			saveToFile.mockResolvedValue({
				success: true,
				message: 'Fichier sauvegardé à 14:25:33'
			});

			await dataStore.save();
			// Ne pas exécuter TOUS les timers, juste attendre les promesses
			await Promise.resolve();

			expect(saveToFile).toHaveBeenCalled();

			const state = get(dataStore);
			expect(state.isSaving).toBe(false);
			expect(state.lastSaveTime).toBeDefined();
			expect(state.saveMessage).toEqual({
				type: 'success',
				text: 'Fichier sauvegardé à 14:25:33'
			});
		});

		it('devrait gérer les erreurs de sauvegarde', async () => {
			saveToFile.mockResolvedValue({
				success: false,
				error: 'Permission refusée'
			});

			await dataStore.save();
			await vi.runAllTimersAsync();

			const state = get(dataStore);
			expect(state.isSaving).toBe(false);
			expect(state.saveMessage).toEqual({
				type: 'error',
				text: 'Permission refusée'
			});
		});

		it('devrait gérer les exceptions lors de la sauvegarde', async () => {
			saveToFile.mockRejectedValue(new Error('Network error'));

			await dataStore.save();
			await vi.runAllTimersAsync();

			const state = get(dataStore);
			expect(state.isSaving).toBe(false);
			expect(state.saveMessage).toEqual({
				type: 'error',
				text: 'Erreur de sauvegarde : Network error'
			});
		});

		it('ne devrait pas sauvegarder si pas de fileHandle', async () => {
			dataStore.reset();

			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData); // Sans fileHandle

			await dataStore.save();

			expect(saveToFile).not.toHaveBeenCalled();
		});

		it('devrait masquer le message de succès après 3 secondes', async () => {
			saveToFile.mockResolvedValue({ success: true, message: 'Sauvegardé' });

			await dataStore.save();
			await vi.runAllTimersAsync();

			// Message devrait être présent
			expect(get(saveMessage)).toBeDefined();

			// Avancer de 3 secondes
			await vi.advanceTimersByTimeAsync(3000);

			// Message devrait être masqué
			expect(get(saveMessage)).toBe(null);
		});
	});

	describe('reset()', () => {
		it('devrait réinitialiser le store à son état initial', () => {
			// Charger des données
			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });

			// Modifier
			dataStore.updateData(data => ({ ...data, currency: [{ code: 'CHF' }] }));

			// Réinitialiser
			dataStore.reset();

			const state = get(dataStore);
			expect(state).toEqual({
				data: null,
				fileHandle: null,
				isModified: false,
				isSaving: false,
				lastSaveTime: null,
				validationReport: null,
				saveMessage: null
			});
		});

		it('devrait annuler les timers en cours', async () => {
			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });

			saveToFile.mockResolvedValue({ success: true, message: 'Sauvegardé' });

			// Déclencher une modification (qui lance le timer auto-save)
			dataStore.updateData(data => ({ ...data, currency: [{ code: 'CHF' }] }));

			// Réinitialiser avant le debounce
			dataStore.reset();

			// Avancer le temps
			await vi.advanceTimersByTimeAsync(3000);
			await vi.runAllTimersAsync();

			// saveToFile ne devrait pas être appelé
			expect(saveToFile).not.toHaveBeenCalled();
		});
	});

	describe('Stores dérivés', () => {
		it('stats devrait calculer correctement les statistiques', () => {
			const mockData = {
				version: '1.0.0',
				metadata: {},
				currency: [{ code: 'CHF' }, { code: 'EUR' }, { code: 'USD' }],
				account: [{ id: 'acc_001' }, { id: 'acc_002' }],
				transaction: [{ id: 'txn_001' }],
				budget: [{ id: 'bud_001' }, { id: 'bud_002' }],
				recurring: [{ id: 'rec_001' }]
			};

			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData);

			const statsValue = get(stats);
			expect(statsValue).toEqual({
				currencies: 3,
				accounts: 2,
				transactions: 1,
				budgets: 2,
				recurring: 1
			});
		});

		it('isModified devrait refléter l\'état de modification', () => {
			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData);

			expect(get(isModified)).toBe(false);

			dataStore.updateData(data => ({ ...data, currency: [{ code: 'CHF' }] }));

			expect(get(isModified)).toBe(true);
		});

		it('isSaving devrait refléter l\'état de sauvegarde', async () => {
			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });

			expect(get(isSaving)).toBe(false);

			// Créer une promesse qui ne se résout pas immédiatement
			let resolveSave;
			const savePromise = new Promise(resolve => { resolveSave = resolve; });
			saveToFile.mockReturnValue(savePromise);

			// Déclencher la sauvegarde
			const saveTask = dataStore.save();

			// isSaving devrait être true pendant la sauvegarde
			expect(get(isSaving)).toBe(true);

			// Résoudre la promesse
			resolveSave({ success: true, message: 'Sauvegardé' });
			await saveTask;
			await vi.runAllTimersAsync();

			// isSaving devrait redevenir false
			expect(get(isSaving)).toBe(false);
		});

		it('saveMessage devrait refléter le message de sauvegarde', async () => {
			const mockData = { version: '1.0.0', metadata: {}, currency: [], account: [], transaction: [] };
			validateTOMLStructure.mockReturnValue({ valid: true, errors: [], warnings: [], report: '' });
			dataStore.loadData(mockData, { name: 'test.toml' });

			expect(get(saveMessage)).toBeDefined(); // Message de chargement initial

			saveToFile.mockResolvedValue({ success: true, message: 'Fichier sauvegardé' });

			await dataStore.save();
			// Ne pas exécuter TOUS les timers, juste attendre les promesses
			await Promise.resolve();

			expect(get(saveMessage)).toEqual({
				type: 'success',
				text: 'Fichier sauvegardé'
			});
		});
	});
});
