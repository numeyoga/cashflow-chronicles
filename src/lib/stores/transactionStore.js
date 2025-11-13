/**
 * Transaction Store pour Cashflow Chronicles
 *
 * Implémente EPIC-004 : Gestion des Transactions Simples
 * Implémente US-004-01 à US-004-16
 */

import { derived } from 'svelte/store';
import { dataStore } from './dataStore.js';
import { accounts } from './accountStore.js';
import { currencies } from './currencyStore.js';
import {
	validateNewTransaction,
	createTransaction,
	generateTransactionId,
	calculateBalance,
	isBalanced,
	getTransactionAmount
} from '../domain/transactionValidator.js';

/**
 * Store dérivé pour les transactions
 */
export const transactions = derived(dataStore, $dataStore => {
	if (!$dataStore.data || !$dataStore.data.transaction) {
		return [];
	}
	return $dataStore.data.transaction;
});

/**
 * Store dérivé pour les transactions triées par date (plus récentes en premier)
 */
export const transactionsSortedByDate = derived(transactions, $transactions => {
	return [...$transactions].sort((a, b) => {
		const dateA = new Date(a.date);
		const dateB = new Date(b.date);
		return dateB - dateA; // Plus récentes en premier
	});
});

/**
 * Store dérivé pour les statistiques de transactions
 */
export const transactionStats = derived(transactions, $transactions => {
	const stats = {
		total: $transactions.length,
		byType: {
			expense: 0,
			income: 0,
			transfer: 0
		},
		totalAmount: 0
	};

	$transactions.forEach(tx => {
		// Déterminer le type de transaction basé sur les comptes
		// TODO: Implémenter la logique de détection du type
		stats.totalAmount += getTransactionAmount(tx);
	});

	return stats;
});

/**
 * Ajoute une nouvelle transaction
 *
 * @param {Object} transactionData - Données de la transaction
 * @returns {Object} Résultat { success, errors, transaction }
 */
export function addTransaction(transactionData) {
	let currentTransactions = [];
	let currentAccounts = [];
	let currentCurrencies = [];

	const unsubscribeTransactions = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribeTransactions();

	const unsubscribeAccounts = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribeAccounts();

	const unsubscribeCurrencies = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribeCurrencies();

	// Valider la transaction
	const validation = validateNewTransaction(
		transactionData,
		currentTransactions,
		currentAccounts,
		currentCurrencies
	);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Créer la transaction avec un ID généré
	const newTransaction = createTransaction(transactionData, currentTransactions);

	// Ajouter au store
	dataStore.updateData(data => {
		if (!data.transaction) {
			data.transaction = [];
		}

		data.transaction.push(newTransaction);

		// Trier par date (plus anciennes en premier dans le fichier)
		data.transaction.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA - dateB;
		});

		return data;
	});

	return {
		success: true,
		transaction: newTransaction
	};
}

/**
 * Met à jour une transaction existante
 *
 * @param {string} id - ID de la transaction à modifier
 * @param {Object} updates - Modifications à apporter
 * @returns {Object} Résultat { success, errors }
 */
export function updateTransaction(id, updates) {
	let currentTransactions = [];
	let currentAccounts = [];
	let currentCurrencies = [];

	const unsubscribeTransactions = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribeTransactions();

	const unsubscribeAccounts = accounts.subscribe(value => {
		currentAccounts = value;
	});
	unsubscribeAccounts();

	const unsubscribeCurrencies = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribeCurrencies();

	// Trouver la transaction existante
	const existingTransaction = currentTransactions.find(t => t.id === id);
	if (!existingTransaction) {
		return {
			success: false,
			errors: [{ message: 'Transaction introuvable.' }]
		};
	}

	// Créer la transaction mise à jour
	const updatedTransaction = {
		...existingTransaction,
		...updates,
		id: existingTransaction.id // Ne pas permettre de changer l'ID
	};

	// Valider la transaction mise à jour
	// Exclure la transaction actuelle de la validation d'unicité
	const otherTransactions = currentTransactions.filter(t => t.id !== id);
	const validation = validateNewTransaction(
		updatedTransaction,
		otherTransactions,
		currentAccounts,
		currentCurrencies
	);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Mettre à jour dans le store
	dataStore.updateData(data => {
		if (!data.transaction) {
			return data;
		}

		const index = data.transaction.findIndex(t => t.id === id);
		if (index === -1) {
			return data;
		}

		data.transaction[index] = updatedTransaction;

		// Trier par date
		data.transaction.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA - dateB;
		});

		return data;
	});

	return {
		success: true,
		transaction: updatedTransaction
	};
}

/**
 * Supprime une transaction
 *
 * @param {string} id - ID de la transaction à supprimer
 * @returns {Object} Résultat { success, error }
 */
export function deleteTransaction(id) {
	dataStore.updateData(data => {
		if (!data.transaction) {
			return data;
		}

		data.transaction = data.transaction.filter(t => t.id !== id);
		return data;
	});

	return { success: true };
}

/**
 * Recherche des transactions par critères
 *
 * @param {Object} criteria - Critères de recherche
 * @returns {Array} Liste des transactions correspondantes
 */
export function searchTransactions(criteria = {}) {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	let results = [...currentTransactions];

	// Filtrer par plage de dates
	if (criteria.startDate) {
		const startDate = new Date(criteria.startDate);
		results = results.filter(t => new Date(t.date) >= startDate);
	}
	if (criteria.endDate) {
		const endDate = new Date(criteria.endDate);
		results = results.filter(t => new Date(t.date) <= endDate);
	}

	// Filtrer par compte
	if (criteria.accountId) {
		results = results.filter(t =>
			t.posting && t.posting.some(p => p.accountId === criteria.accountId)
		);
	}

	// Filtrer par tag
	if (criteria.tag) {
		results = results.filter(t => t.tags && t.tags.includes(criteria.tag));
	}

	// Filtrer par montant
	if (criteria.minAmount !== undefined) {
		results = results.filter(t => getTransactionAmount(t) >= criteria.minAmount);
	}
	if (criteria.maxAmount !== undefined) {
		results = results.filter(t => getTransactionAmount(t) <= criteria.maxAmount);
	}

	// Recherche textuelle sur description et payee
	if (criteria.search) {
		const searchLower = criteria.search.toLowerCase();
		results = results.filter(
			t =>
				(t.description && t.description.toLowerCase().includes(searchLower)) ||
				(t.payee && t.payee.toLowerCase().includes(searchLower))
		);
	}

	// Trier les résultats
	if (criteria.sortBy) {
		switch (criteria.sortBy) {
			case 'date-desc':
				results.sort((a, b) => new Date(b.date) - new Date(a.date));
				break;
			case 'date-asc':
				results.sort((a, b) => new Date(a.date) - new Date(b.date));
				break;
			case 'amount-desc':
				results.sort((a, b) => getTransactionAmount(b) - getTransactionAmount(a));
				break;
			case 'amount-asc':
				results.sort((a, b) => getTransactionAmount(a) - getTransactionAmount(b));
				break;
			default:
				// Par défaut, trier par date décroissante
				results.sort((a, b) => new Date(b.date) - new Date(a.date));
		}
	} else {
		// Par défaut, trier par date décroissante
		results.sort((a, b) => new Date(b.date) - new Date(a.date));
	}

	return results;
}

/**
 * Obtient une transaction par son ID
 *
 * @param {string} id - ID de la transaction
 * @returns {Object|null} Transaction trouvée ou null
 */
export function getTransactionById(id) {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	return currentTransactions.find(t => t.id === id) || null;
}

/**
 * Obtient toutes les transactions pour un compte donné
 *
 * @param {string} accountId - ID du compte
 * @returns {Array} Liste des transactions
 */
export function getTransactionsByAccount(accountId) {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	return currentTransactions.filter(
		t => t.posting && t.posting.some(p => p.accountId === accountId)
	);
}

/**
 * Obtient tous les tags uniques des transactions
 *
 * @returns {Array} Liste des tags uniques
 */
export function getAllTags() {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	const tagsSet = new Set();
	currentTransactions.forEach(t => {
		if (t.tags && Array.isArray(t.tags)) {
			t.tags.forEach(tag => tagsSet.add(tag));
		}
	});

	return Array.from(tagsSet).sort();
}

/**
 * Obtient tous les payees uniques
 *
 * @returns {Array} Liste des payees uniques
 */
export function getAllPayees() {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	const payeesSet = new Set();
	currentTransactions.forEach(t => {
		if (t.payee && t.payee.trim()) {
			payeesSet.add(t.payee);
		}
	});

	return Array.from(payeesSet).sort();
}

/**
 * Calcule le solde d'un compte basé sur les transactions
 *
 * @param {string} accountId - ID du compte
 * @param {string} [upToDate] - Date limite (optionnel, format YYYY-MM-DD)
 * @returns {number} Solde du compte
 */
export function calculateAccountBalance(accountId, upToDate = null) {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	let balance = 0;
	const limitDate = upToDate ? new Date(upToDate) : null;

	currentTransactions.forEach(tx => {
		// Filtrer par date si nécessaire
		if (limitDate) {
			const txDate = new Date(tx.date);
			if (txDate > limitDate) {
				return;
			}
		}

		// Sommer les montants pour ce compte
		if (tx.posting) {
			tx.posting.forEach(p => {
				if (p.accountId === accountId) {
					balance += parseFloat(p.amount || 0);
				}
			});
		}
	});

	return balance;
}

/**
 * Obtient les soldes de tous les comptes
 *
 * @param {Array} allAccounts - Liste de tous les comptes
 * @returns {Object} Soldes par compte { accountId: balance }
 */
export function calculateAllAccountBalances(allAccounts) {
	const balances = {};

	allAccounts.forEach(account => {
		balances[account.id] = calculateAccountBalance(account.id);
	});

	return balances;
}

/**
 * Exporte les transactions au format CSV
 *
 * @returns {string} Contenu CSV
 */
export function exportTransactionsCSV() {
	let currentTransactions = [];
	const unsubscribe = transactions.subscribe(value => {
		currentTransactions = value;
	});
	unsubscribe();

	// En-têtes
	const headers = ['ID', 'Date', 'Description', 'Payee', 'Tags', 'Montant', 'Devise', 'Équilibré'];
	let csv = headers.join(',') + '\n';

	// Données
	currentTransactions.forEach(tx => {
		const amount = getTransactionAmount(tx);
		const currency = tx.posting && tx.posting.length > 0 ? tx.posting[0].currency : '';
		const balanced = isBalanced(tx) ? 'Oui' : 'Non';
		const tags = tx.tags ? tx.tags.join(';') : '';

		const row = [
			tx.id,
			tx.date,
			`"${tx.description}"`,
			tx.payee ? `"${tx.payee}"` : '',
			tags ? `"${tags}"` : '',
			amount.toFixed(2),
			currency,
			balanced
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

/**
 * Réorganise les transactions dans un ordre personnalisé
 * Utile pour le drag & drop dans l'interface de saisie en masse
 *
 * @param {string} fromId - ID de la transaction à déplacer
 * @param {string} toId - ID de la transaction cible
 * @param {string} position - Position relative ('before' ou 'after')
 * @returns {Object} Résultat { success, message }
 */
export function reorderTransactions(fromId, toId, position = 'after') {
	let currentTransactions = [];

	const unsubscribe = transactions.subscribe((value) => {
		currentTransactions = [...value];
	});
	unsubscribe();

	// Trouver les indices
	const fromIndex = currentTransactions.findIndex((tx) => tx.id === fromId);
	const toIndex = currentTransactions.findIndex((tx) => tx.id === toId);

	if (fromIndex === -1 || toIndex === -1) {
		return {
			success: false,
			message: 'Transaction non trouvée'
		};
	}

	// Ne rien faire si on essaie de déplacer au même endroit
	if (fromIndex === toIndex) {
		return { success: true, message: 'Aucun changement' };
	}

	// Retirer l'élément de sa position actuelle
	const [movedItem] = currentTransactions.splice(fromIndex, 1);

	// Calculer la nouvelle position
	let newIndex = toIndex;
	if (fromIndex < toIndex) {
		// Si on déplace vers le bas, l'index a diminué de 1 après le splice
		newIndex = position === 'after' ? toIndex : toIndex - 1;
	} else {
		// Si on déplace vers le haut
		newIndex = position === 'after' ? toIndex + 1 : toIndex;
	}

	// Insérer à la nouvelle position
	currentTransactions.splice(newIndex, 0, movedItem);

	// Mettre à jour le store
	dataStore.updateData((data) => {
		return {
			...data,
			transaction: currentTransactions
		};
	});

	return {
		success: true,
		message: `Transaction déplacée de ${fromIndex} à ${newIndex}`
	};
}

// Ré-exporter les fonctions utilitaires du validator
export { calculateBalance, isBalanced, getTransactionAmount };
