/**
 * Data Store pour Cashflow Chronicles
 *
 * Implémente US-001-06 : Sauvegarder automatiquement après chaque modification
 *
 * Store Svelte centralisé pour gérer l'état de l'application avec auto-save
 */

import { writable, derived } from 'svelte/store';
import { saveToFile, saveToLocalStorage } from '../infrastructure/fileStorage.js';
import { validateTOMLStructure } from '../domain/validator.js';

/**
 * Configuration de l'auto-save
 */
const AUTO_SAVE_CONFIG = {
	enabled: true,
	debounceDelay: 2000, // 2 secondes
	showNotification: true,
	notificationDuration: 3000 // 3 secondes
};

/**
 * État de l'application
 */
function createDataStore() {
	const initialState = {
		data: null,
		fileHandle: null,
		isModified: false,
		isSaving: false,
		lastSaveTime: null,
		validationReport: null,
		saveMessage: null
	};

	const { subscribe, set, update } = writable(initialState);

	let saveTimeout = null;

	/**
	 * Charge les données depuis le contenu TOML
	 *
	 * @param {Object} parsedData - Données parsées
	 * @param {FileSystemFileHandle} fileHandle - Handle du fichier
	 */
	function loadData(parsedData, fileHandle = null) {
		// Valider la structure
		const validation = validateTOMLStructure(parsedData);

		if (!validation.valid) {
			update(state => ({
				...state,
				validationReport: validation,
				saveMessage: {
					type: 'error',
					text: 'Erreurs de validation détectées'
				}
			}));
			return false;
		}

		// Sauvegarder dans localStorage (remplace le fichier précédent)
		const fileName = fileHandle?.name || 'budget.toml';
		saveToLocalStorage(parsedData, fileName);

		update(state => ({
			...state,
			data: parsedData,
			fileHandle,
			isModified: false,
			validationReport: validation,
			saveMessage: {
				type: 'success',
				text: validation.report
			}
		}));

		return true;
	}

	/**
	 * Met à jour les données et déclenche l'auto-save
	 *
	 * @param {Function} updateFn - Fonction de mise à jour
	 */
	function updateData(updateFn) {
		update(state => {
			if (!state.data) return state;

			const newData = updateFn(state.data);

			// Marquer comme modifié
			const newState = {
				...state,
				data: newData,
				isModified: true
			};

			// Déclencher l'auto-save avec debounce
			if (AUTO_SAVE_CONFIG.enabled) {
				triggerAutoSave(newState);
			}

			return newState;
		});
	}

	/**
	 * Déclenche l'auto-save avec debounce
	 *
	 * @param {Object} state - État actuel
	 */
	function triggerAutoSave(state) {
		// Annuler le timer précédent
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Démarrer un nouveau timer
		saveTimeout = setTimeout(async () => {
			await performSave(state);
		}, AUTO_SAVE_CONFIG.debounceDelay);
	}

	/**
	 * Effectue la sauvegarde
	 *
	 * @param {Object} state - État actuel
	 */
	async function performSave(state) {
		if (!state.data || !state.fileHandle) {
			return;
		}

		// Indiquer que la sauvegarde est en cours
		update(s => ({ ...s, isSaving: true }));

		try {
			const result = await saveToFile(state.data, state.fileHandle);

			if (result.success) {
				update(s => ({
					...s,
					isSaving: false,
					isModified: false,
					lastSaveTime: new Date(),
					saveMessage: {
						type: 'success',
						text: result.message
					}
				}));

				// Masquer le message après 3 secondes
				if (AUTO_SAVE_CONFIG.showNotification) {
					setTimeout(() => {
						update(s => ({ ...s, saveMessage: null }));
					}, AUTO_SAVE_CONFIG.notificationDuration);
				}
			} else {
				update(s => ({
					...s,
					isSaving: false,
					saveMessage: {
						type: 'error',
						text: result.error
					}
				}));
			}
		} catch (error) {
			update(s => ({
				...s,
				isSaving: false,
				saveMessage: {
					type: 'error',
					text: `Erreur de sauvegarde : ${error.message}`
				}
			}));
		}
	}

	/**
	 * Sauvegarde manuelle (Ctrl+S)
	 */
	async function save() {
		let currentState;
		const unsubscribe = subscribe(state => {
			currentState = state;
		});
		unsubscribe();

		await performSave(currentState);
	}

	/**
	 * Réinitialise le store
	 */
	function reset() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		set(initialState);
	}

	return {
		subscribe,
		loadData,
		updateData,
		save,
		reset
	};
}

/**
 * Store principal des données
 */
export const dataStore = createDataStore();

/**
 * Store dérivé pour les statistiques
 */
export const stats = derived(dataStore, $dataStore => {
	if (!$dataStore.data) {
		return {
			currencies: 0,
			accounts: 0,
			transactions: 0,
			budgets: 0,
			recurring: 0
		};
	}

	return {
		currencies: Array.isArray($dataStore.data.currency) ? $dataStore.data.currency.length : 0,
		accounts: Array.isArray($dataStore.data.account) ? $dataStore.data.account.length : 0,
		transactions: Array.isArray($dataStore.data.transaction)
			? $dataStore.data.transaction.length
			: 0,
		budgets: Array.isArray($dataStore.data.budget) ? $dataStore.data.budget.length : 0,
		recurring: Array.isArray($dataStore.data.recurring) ? $dataStore.data.recurring.length : 0
	};
});

/**
 * Store dérivé pour l'état de modification
 */
export const isModified = derived(dataStore, $dataStore => $dataStore.isModified);

/**
 * Store dérivé pour l'état de sauvegarde
 */
export const isSaving = derived(dataStore, $dataStore => $dataStore.isSaving);

/**
 * Store dérivé pour le message de sauvegarde
 */
export const saveMessage = derived(dataStore, $dataStore => $dataStore.saveMessage);
