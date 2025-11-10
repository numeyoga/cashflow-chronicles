/**
 * Account Store pour Cashflow Chronicles
 *
 * Implémente EPIC-003 : Gestion des Comptes
 * Implémente US-003-01 : Créer un compte bancaire (Assets)
 */

import { derived } from 'svelte/store';
import { dataStore } from './dataStore.js';
import { currencies } from './currencyStore.js';
import { validateNewAccount, createAccount, generateAccountId } from '../domain/accountValidator.js';

/**
 * Store dérivé pour les comptes
 */
export const accounts = derived(dataStore, $dataStore => {
	if (!$dataStore.data || !$dataStore.data.account) {
		return [];
	}
	return $dataStore.data.account;
});

/**
 * Store dérivé pour les comptes actifs (non clôturés)
 */
export const activeAccounts = derived(accounts, $accounts => {
	return $accounts.filter(a => !a.closed);
});

/**
 * Store dérivé pour les comptes clôturés
 */
export const closedAccounts = derived(accounts, $accounts => {
	return $accounts.filter(a => a.closed);
});

/**
 * Store dérivé pour les comptes par type
 */
export const accountsByType = derived(accounts, $accounts => {
	const byType = {
		Assets: [],
		Liabilities: [],
		Income: [],
		Expenses: [],
		Equity: []
	};

	$accounts.forEach(account => {
		if (byType[account.type]) {
			byType[account.type].push(account);
		}
	});

	// Trier chaque type par nom hiérarchique
	Object.keys(byType).forEach(type => {
		byType[type].sort((a, b) => a.name.localeCompare(b.name));
	});

	return byType;
});

/**
 * Store dérivé pour les comptes organisés en hiérarchie
 */
export const accountHierarchy = derived(accounts, $accounts => {
	return buildAccountHierarchy($accounts);
});

/**
 * Construit une structure hiérarchique des comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @returns {Object} Structure hiérarchique
 */
function buildAccountHierarchy(accounts) {
	const hierarchy = {
		Assets: {},
		Liabilities: {},
		Income: {},
		Expenses: {},
		Equity: {}
	};

	accounts.forEach(account => {
		if (!account.name || !account.type) return;

		const segments = account.name.split(':');
		if (segments.length < 2) return;

		const type = segments[0];
		if (!hierarchy[type]) return;

		// Construire le chemin hiérarchique
		let current = hierarchy[type];
		for (let i = 1; i < segments.length; i++) {
			const segment = segments[i];
			if (!current[segment]) {
				current[segment] = {
					_accounts: [],
					_children: {}
				};
			}

			// Si c'est le dernier segment, ajouter le compte
			if (i === segments.length - 1) {
				current[segment]._accounts.push(account);
			}

			current = current[segment]._children || current[segment];
		}
	});

	return hierarchy;
}

/**
 * Ajoute un nouveau compte
 *
 * @param {Object} accountData - Données du compte
 * @returns {Object} Résultat { success, errors, account }
 */
export function addAccount(accountData) {
	let currentAccounts = [];
	let currentCurrencies = [];

	const unsubscribeAccounts = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribeAccounts();

	const unsubscribeCurrencies = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribeCurrencies();

	// Valider le compte
	const validation = validateNewAccount(accountData, currentAccounts, currentCurrencies);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Créer le compte avec un ID généré
	const newAccount = createAccount(accountData, currentAccounts);

	// Ajouter au store
	dataStore.updateData(data => {
		if (!data.account) {
			data.account = [];
		}

		data.account.push(newAccount);

		// Trier par nom
		data.account.sort((a, b) => a.name.localeCompare(b.name));

		return data;
	});

	return {
		success: true,
		account: newAccount
	};
}

/**
 * Met à jour un compte existant
 *
 * @param {string} id - ID du compte à modifier
 * @param {Object} updates - Modifications à apporter
 * @returns {Object} Résultat { success, errors }
 */
export function updateAccount(id, updates) {
	let currentAccounts = [];
	let currentCurrencies = [];

	const unsubscribeAccounts = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribeAccounts();

	const unsubscribeCurrencies = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribeCurrencies();

	// Trouver le compte existant
	const existingAccount = currentAccounts.find(a => a.id === id);
	if (!existingAccount) {
		return {
			success: false,
			errors: [{ message: 'Compte introuvable.' }]
		};
	}

	// Créer le compte mis à jour
	const updatedAccount = {
		...existingAccount,
		...updates,
		id: existingAccount.id // Ne pas permettre de changer l'ID
	};

	// Valider le compte mis à jour
	// Exclure le compte actuel de la validation d'unicité
	const otherAccounts = currentAccounts.filter(a => a.id !== id);
	const validation = validateNewAccount(updatedAccount, otherAccounts, currentCurrencies);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Mettre à jour dans le store
	dataStore.updateData(data => {
		if (!data.account) {
			return data;
		}

		const index = data.account.findIndex(a => a.id === id);
		if (index === -1) {
			return data;
		}

		data.account[index] = updatedAccount;

		// Trier par nom
		data.account.sort((a, b) => a.name.localeCompare(b.name));

		return data;
	});

	return {
		success: true,
		account: updatedAccount
	};
}

/**
 * Clôture un compte
 *
 * @param {string} id - ID du compte à clôturer
 * @param {string} closedDate - Date de clôture au format YYYY-MM-DD
 * @returns {Object} Résultat { success, error }
 */
export function closeAccount(id, closedDate = null) {
	// Vérifier si le compte est utilisé dans des transactions non clôturées
	const usage = isAccountUsedInTransactions(id);
	if (usage.hasOpenTransactions) {
		return {
			success: false,
			error: `Impossible de clôturer ce compte. Il a ${usage.openTransactionCount} transaction(s) active(s).`,
			details: {
				type: 'transactions',
				count: usage.openTransactionCount
			}
		};
	}

	// Date de clôture par défaut = aujourd'hui
	const closeDate = closedDate || new Date().toISOString().split('T')[0];

	return updateAccount(id, {
		closed: true,
		closedDate: closeDate
	});
}

/**
 * Réouvre un compte clôturé
 *
 * @param {string} id - ID du compte à réouvrir
 * @returns {Object} Résultat { success, error }
 */
export function reopenAccount(id) {
	return updateAccount(id, {
		closed: false,
		closedDate: null
	});
}

/**
 * Vérifie si un compte est utilisé dans des transactions
 *
 * @param {string} id - ID du compte
 * @returns {Object} { used: boolean, count: number, hasOpenTransactions: boolean, openTransactionCount: number }
 */
function isAccountUsedInTransactions(id) {
	let totalCount = 0;
	let openTransactionCount = 0;

	const unsubscribe = dataStore.subscribe(state => {
		if (state.data && state.data.transaction) {
			state.data.transaction.forEach(tx => {
				if (tx.posting) {
					const hasAccount = tx.posting.some(p => p.accountId === id);
					if (hasAccount) {
						totalCount++;
						// Considérer comme "ouverte" si pas de flag de clôture ou autre logique métier
						// Pour l'instant, on suppose que toutes les transactions existantes sont "ouvertes"
						openTransactionCount++;
					}
				}
			});
		}
	});
	unsubscribe();

	return {
		used: totalCount > 0,
		count: totalCount,
		hasOpenTransactions: openTransactionCount > 0,
		openTransactionCount
	};
}

/**
 * Supprime un compte
 *
 * @param {string} id - ID du compte à supprimer
 * @returns {Object} Résultat { success, error, details }
 */
export function deleteAccount(id) {
	// Vérifier si le compte est utilisé dans des transactions
	const usage = isAccountUsedInTransactions(id);
	if (usage.used) {
		return {
			success: false,
			error: `Impossible de supprimer ce compte. Il est utilisé dans ${usage.count} transaction(s).`,
			details: {
				type: 'transactions',
				count: usage.count
			}
		};
	}

	dataStore.updateData(data => {
		if (!data.account) {
			return data;
		}

		data.account = data.account.filter(a => a.id !== id);
		return data;
	});

	return { success: true };
}

/**
 * Recherche des comptes par critères
 *
 * @param {Object} criteria - Critères de recherche
 * @returns {Array} Liste des comptes correspondants
 */
export function searchAccounts(criteria = {}) {
	let currentAccounts = [];
	const unsubscribe = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribe();

	let results = [...currentAccounts];

	// Filtrer par type
	if (criteria.type) {
		results = results.filter(a => a.type === criteria.type);
	}

	// Filtrer par devise
	if (criteria.currency) {
		results = results.filter(a => a.currency === criteria.currency);
	}

	// Filtrer par statut
	if (criteria.status === 'active') {
		results = results.filter(a => !a.closed);
	} else if (criteria.status === 'closed') {
		results = results.filter(a => a.closed);
	}

	// Recherche textuelle
	if (criteria.search) {
		const searchLower = criteria.search.toLowerCase();
		results = results.filter(
			a =>
				a.name.toLowerCase().includes(searchLower) ||
				(a.description && a.description.toLowerCase().includes(searchLower))
		);
	}

	return results;
}

/**
 * Obtient un compte par son ID
 *
 * @param {string} id - ID du compte
 * @returns {Object|null} Compte trouvé ou null
 */
export function getAccountById(id) {
	let currentAccounts = [];
	const unsubscribe = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribe();

	return currentAccounts.find(a => a.id === id) || null;
}

/**
 * Obtient un compte par son nom
 *
 * @param {string} name - Nom du compte
 * @returns {Object|null} Compte trouvé ou null
 */
export function getAccountByName(name) {
	let currentAccounts = [];
	const unsubscribe = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribe();

	return currentAccounts.find(a => a.name === name) || null;
}

/**
 * Calcule le solde d'un compte
 * Note : Pour le MVP, on retourne 0. Le calcul réel sera implémenté avec EPIC-004 (Transactions)
 *
 * @param {string} id - ID du compte
 * @returns {number} Solde du compte
 */
export function getAccountBalance(id) {
	// TODO: Implémenter le calcul réel avec les transactions (EPIC-004)
	return 0;
}

/**
 * Obtient tous les comptes enfants d'un compte parent
 *
 * @param {string} parentName - Nom du compte parent
 * @returns {Array} Liste des comptes enfants
 */
export function getChildAccounts(parentName) {
	let currentAccounts = [];
	const unsubscribe = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribe();

	return currentAccounts.filter(
		a => a.name.startsWith(parentName + ':') && a.name !== parentName
	);
}

/**
 * Obtient le compte parent d'un compte
 *
 * @param {string} accountName - Nom du compte
 * @returns {Object|null} Compte parent ou null
 */
export function getParentAccount(accountName) {
	const segments = accountName.split(':');
	if (segments.length <= 2) {
		return null; // Pas de parent (compte de niveau 2)
	}

	const parentName = segments.slice(0, -1).join(':');
	return getAccountByName(parentName);
}

/**
 * Exporte les comptes au format CSV
 *
 * @returns {string} Contenu CSV
 */
export function exportAccountsCSV() {
	let currentAccounts = [];
	const unsubscribe = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribe();

	// En-têtes
	const headers = ['ID', 'Nom', 'Type', 'Devise', 'Date Ouverture', 'Clôturé', 'Date Clôture', 'Description'];
	let csv = headers.join(',') + '\n';

	// Données
	currentAccounts.forEach(account => {
		const row = [
			account.id,
			`"${account.name}"`,
			account.type,
			account.currency,
			account.opened || '',
			account.closed ? 'Oui' : 'Non',
			account.closedDate || '',
			account.description ? `"${account.description.replace(/"/g, '""')}"` : ''
		];
		csv += row.join(',') + '\n';
	});

	return csv;
}

/**
 * Télécharge un fichier CSV
 *
 * @param {string} content - Contenu CSV
 * @param {string} filename - Nom du fichier
 */
export function downloadCSV(content, filename) {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}
