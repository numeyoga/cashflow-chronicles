/**
 * Bulk Transaction Helpers
 * Utilitaires pour la gestion en masse des transactions
 */

/**
 * Formate une transaction pour l'affichage dans le tableau
 * @param {Object} transaction - Transaction à formater
 * @param {Array} accounts - Liste des comptes
 * @param {Array} currencies - Liste des devises
 * @returns {Object} Transaction formatée avec données d'affichage
 */
export function formatTransactionForDisplay(transaction, accounts, currencies) {
	const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));
	const summary = calculateTransactionSummary(transaction, accountMap);

	return {
		...transaction,
		accountNames: transaction.posting
			.map((p) => accountMap.get(p.accountId)?.name || 'Compte inconnu')
			.join(', '),
		accountCount: transaction.posting.length,
		summary
	};
}

/**
 * Calcule le résumé d'une transaction
 * @param {Object} transaction - Transaction
 * @param {Map} accountMap - Map des comptes par ID (optionnel)
 * @returns {Object} { totalByCurrency, isBalanced, currencies, balanceErrors }
 */
export function calculateTransactionSummary(transaction, accountMap = null) {
	const totalByCurrency = {};

	// Calculer les totaux par devise
	transaction.posting.forEach((posting) => {
		const currency = posting.currency;
		if (!currency) return;

		if (!totalByCurrency[currency]) {
			totalByCurrency[currency] = 0;
		}
		totalByCurrency[currency] += parseFloat(posting.amount) || 0;
	});

	// Vérifier l'équilibre (avec tolérance pour erreurs d'arrondi)
	const balanceErrors = [];
	const isBalanced = Object.entries(totalByCurrency).every(([currency, total]) => {
		const balanced = Math.abs(total) < 0.01; // Tolérance de 0.01
		if (!balanced) {
			balanceErrors.push(`${currency}: ${total.toFixed(2)}`);
		}
		return balanced;
	});

	return {
		totalByCurrency,
		isBalanced,
		currencies: Object.keys(totalByCurrency),
		balanceErrors: balanceErrors.join(', '),
		formattedTotals: Object.entries(totalByCurrency)
			.map(([curr, amt]) => `${amt.toFixed(2)} ${curr}`)
			.join(', ')
	};
}

/**
 * Filtre les transactions selon les critères
 * @param {Array} transactions - Liste des transactions
 * @param {Object} filters - Critères de filtrage
 * @returns {Array} Transactions filtrées
 */
export function filterTransactions(transactions, filters) {
	if (!transactions) return [];

	return transactions.filter((txn) => {
		// Filtre recherche texte (description, payee, tags)
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const matchesDescription = txn.description?.toLowerCase().includes(searchLower);
			const matchesPayee = txn.payee?.toLowerCase().includes(searchLower);
			const matchesTags = txn.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

			if (!matchesDescription && !matchesPayee && !matchesTags) {
				return false;
			}
		}

		// Filtre date de début
		if (filters.dateFrom) {
			const txnDate = new Date(txn.date);
			const fromDate = new Date(filters.dateFrom);
			if (txnDate < fromDate) return false;
		}

		// Filtre date de fin
		if (filters.dateTo) {
			const txnDate = new Date(txn.date);
			const toDate = new Date(filters.dateTo);
			if (txnDate > toDate) return false;
		}

		// Filtre comptes
		if (filters.accounts && filters.accounts.length > 0) {
			const hasAccount = txn.posting.some((p) => filters.accounts.includes(p.accountId));
			if (!hasAccount) return false;
		}

		// Filtre tags
		if (filters.tags && filters.tags.length > 0) {
			const hasTags = filters.tags.some((tag) => txn.tags?.includes(tag));
			if (!hasTags) return false;
		}

		// Filtre état de balance
		if (filters.balanceStatus && filters.balanceStatus !== 'all') {
			const summary = calculateTransactionSummary(txn);
			if (filters.balanceStatus === 'balanced' && !summary.isBalanced) return false;
			if (filters.balanceStatus === 'unbalanced' && summary.isBalanced) return false;
		}

		return true;
	});
}

/**
 * Trie les transactions selon la configuration
 * @param {Array} transactions - Liste des transactions
 * @param {Object} sortConfig - Configuration du tri { field, direction }
 * @returns {Array} Transactions triées
 */
export function sortTransactions(transactions, sortConfig) {
	if (!transactions || !sortConfig) return transactions;

	const { field, direction } = sortConfig;
	const multiplier = direction === 'asc' ? 1 : -1;

	return [...transactions].sort((a, b) => {
		let aVal, bVal;

		switch (field) {
			case 'date':
				aVal = new Date(a.date);
				bVal = new Date(b.date);
				return (aVal - bVal) * multiplier;

			case 'description':
				aVal = (a.description || '').toLowerCase();
				bVal = (b.description || '').toLowerCase();
				return aVal.localeCompare(bVal) * multiplier;

			case 'payee':
				aVal = (a.payee || '').toLowerCase();
				bVal = (b.payee || '').toLowerCase();
				return aVal.localeCompare(bVal) * multiplier;

			case 'amount':
				// Trier par le montant du premier posting
				aVal = Math.abs(parseFloat(a.posting[0]?.amount) || 0);
				bVal = Math.abs(parseFloat(b.posting[0]?.amount) || 0);
				return (aVal - bVal) * multiplier;

			default:
				return 0;
		}
	});
}

/**
 * Valide une transaction pour l'édition inline
 * @param {Object} transaction - Transaction à valider
 * @returns {Object} { isValid, errors }
 */
export function validateInlineEdit(transaction) {
	const errors = {};

	// Validation de base
	if (!transaction.date) {
		errors.date = 'Date requise';
	}

	if (!transaction.description || transaction.description.trim() === '') {
		errors.description = 'Description requise';
	}

	if (!transaction.posting || transaction.posting.length < 2) {
		errors.posting = 'Minimum 2 postings requis';
	}

	// Validation des postings
	transaction.posting?.forEach((posting, index) => {
		if (!posting.accountId) {
			errors[`posting_${index}_account`] = 'Compte requis';
		}
		if (posting.amount === null || posting.amount === undefined || posting.amount === '') {
			errors[`posting_${index}_amount`] = 'Montant requis';
		}
		if (!posting.currency) {
			errors[`posting_${index}_currency`] = 'Devise requise';
		}
	});

	// Validation du balance
	const summary = calculateTransactionSummary(transaction);
	if (!summary.isBalanced) {
		errors.balance = `Transaction déséquilibrée: ${summary.balanceErrors}`;
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}

/**
 * Crée une transaction vide avec structure par défaut
 * @param {string} defaultCurrency - Devise par défaut
 * @returns {Object} Transaction vide
 */
export function createEmptyTransaction(defaultCurrency = 'EUR') {
	return {
		id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		date: new Date().toISOString().split('T')[0],
		description: '',
		payee: '',
		tags: [],
		posting: [
			{ accountId: '', amount: '', currency: defaultCurrency },
			{ accountId: '', amount: '', currency: defaultCurrency }
		]
	};
}

/**
 * Duplique une transaction avec un nouvel ID et optionnellement une nouvelle date
 * @param {Object} transaction - Transaction à dupliquer
 * @param {string} newDate - Nouvelle date (optionnel)
 * @returns {Object} Transaction dupliquée
 */
export function duplicateTransaction(transaction, newDate = null) {
	return {
		...transaction,
		id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		date: newDate || transaction.date,
		posting: transaction.posting.map((p) => ({ ...p })) // Clone profond des postings
	};
}

/**
 * Obtient les options d'auto-complétion pour un champ
 * @param {string} field - Nom du champ (payee, description, tags)
 * @param {Array} transactions - Liste des transactions
 * @returns {Array} Options uniques triées
 */
export function getAutoCompleteOptions(field, transactions) {
	if (!transactions) return [];

	const options = new Set();

	transactions.forEach((txn) => {
		if (field === 'payee' && txn.payee) {
			options.add(txn.payee);
		} else if (field === 'description' && txn.description) {
			options.add(txn.description);
		} else if (field === 'tags' && txn.tags) {
			txn.tags.forEach((tag) => options.add(tag));
		}
	});

	return Array.from(options).sort();
}

/**
 * Pagine une liste de transactions
 * @param {Array} transactions - Liste des transactions
 * @param {number} currentPage - Page actuelle (1-based)
 * @param {number} itemsPerPage - Nombre d'items par page
 * @returns {Object} { items, totalPages, startIndex, endIndex }
 */
export function paginateTransactions(transactions, currentPage = 1, itemsPerPage = 50) {
	if (!transactions || transactions.length === 0) {
		return { items: [], totalPages: 0, startIndex: 0, endIndex: 0 };
	}

	const totalPages = Math.ceil(transactions.length / itemsPerPage);
	const validPage = Math.max(1, Math.min(currentPage, totalPages));
	const startIndex = (validPage - 1) * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, transactions.length);
	const items = transactions.slice(startIndex, endIndex);

	return {
		items,
		totalPages,
		startIndex,
		endIndex,
		currentPage: validPage
	};
}

/**
 * Calcule le montant automatique pour équilibrer une transaction
 * @param {Array} postings - Liste des postings
 * @param {number} targetIndex - Index du posting à calculer
 * @returns {number} Montant calculé
 */
export function calculateAutoBalance(postings, targetIndex) {
	const targetCurrency = postings[targetIndex]?.currency;
	if (!targetCurrency) return 0;

	let total = 0;
	postings.forEach((posting, index) => {
		if (index !== targetIndex && posting.currency === targetCurrency) {
			total += parseFloat(posting.amount) || 0;
		}
	});

	return -total;
}

/**
 * Exporte des transactions en format CSV
 * @param {Array} transactions - Transactions à exporter
 * @param {Object} accounts - Map des comptes
 * @param {string} format - 'compact' ou 'detailed'
 * @returns {string} Contenu CSV
 */
export function exportToCSV(transactions, accounts, format = 'compact') {
	if (!transactions || transactions.length === 0) return '';

	const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));
	const lines = [];

	if (format === 'compact') {
		// Format compact : 1 ligne par transaction
		lines.push('Date,Description,Payee,Tags,Accounts,Amounts,Balance');

		transactions.forEach((txn) => {
			const summary = calculateTransactionSummary(txn);
			const accountNames = txn.posting
				.map((p) => accountMap.get(p.accountId)?.name || p.accountId)
				.join('; ');
			const amounts = txn.posting.map((p) => `${p.amount} ${p.currency}`).join('; ');

			lines.push(
				[
					txn.date,
					`"${txn.description || ''}"`,
					`"${txn.payee || ''}"`,
					`"${txn.tags?.join(', ') || ''}"`,
					`"${accountNames}"`,
					`"${amounts}"`,
					summary.isBalanced ? 'OK' : 'UNBALANCED'
				].join(',')
			);
		});
	} else {
		// Format détaillé : 1 ligne par posting
		lines.push('Date,Description,Payee,Tags,Account,Amount,Currency,TransactionBalance');

		transactions.forEach((txn) => {
			const summary = calculateTransactionSummary(txn);
			const balanceStatus = summary.isBalanced ? 'OK' : 'UNBALANCED';

			txn.posting.forEach((posting) => {
				lines.push(
					[
						txn.date,
						`"${txn.description || ''}"`,
						`"${txn.payee || ''}"`,
						`"${txn.tags?.join(', ') || ''}"`,
						`"${accountMap.get(posting.accountId)?.name || posting.accountId}"`,
						posting.amount,
						posting.currency,
						balanceStatus
					].join(',')
				);
			});
		});
	}

	return lines.join('\n');
}
