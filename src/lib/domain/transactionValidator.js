/**
 * Transaction Validator pour Cashflow Chronicles
 *
 * Implémente EPIC-004 : Gestion des Transactions Simples
 * Règles de validation : V-TXN-*, V-POST-*, V-BAL-*, V-FX-*
 */

import { ValidationSeverity } from './validator.js';

/**
 * Codes d'erreur pour la validation des transactions
 */
export const TransactionValidationCode = {
	TXN_001: 'V-TXN-001',
	TXN_002: 'V-TXN-002',
	TXN_003: 'V-TXN-003',
	TXN_004: 'V-TXN-004',
	TXN_005: 'V-TXN-005',
	TXN_006: 'V-TXN-006',
	POST_001: 'V-POST-001',
	POST_002: 'V-POST-002',
	POST_003: 'V-POST-003',
	POST_004: 'V-POST-004',
	POST_005: 'V-POST-005',
	POST_006: 'V-POST-006',
	POST_007: 'V-POST-007',
	BAL_001: 'V-BAL-001',
	BAL_002: 'V-BAL-002',
	BAL_003: 'V-BAL-003',
	FX_001: 'V-FX-001',
	FX_002: 'V-FX-002',
	FX_003: 'V-FX-003',
	FX_004: 'V-FX-004',
	FX_005: 'V-FX-005'
};

/**
 * Valide une liste de transactions
 *
 * @param {Array} transactions - Liste des transactions
 * @param {Array} accounts - Liste des comptes disponibles
 * @param {Array} currencies - Liste des devises disponibles
 * @returns {Array} Liste des erreurs de validation
 */
export function validateTransactions(transactions, accounts = [], currencies = []) {
	const errors = [];

	if (!Array.isArray(transactions)) {
		return errors; // Pas d'erreur si pas de transactions (optionnel)
	}

	// Vérifier chaque transaction individuellement
	transactions.forEach((transaction, index) => {
		const txErrors = validateSingleTransaction(transaction, index, accounts, currencies);
		errors.push(...txErrors);
	});

	// V-TXN-002 : Vérifier l'unicité des IDs
	const idErrors = validateTransactionIdUniqueness(transactions);
	errors.push(...idErrors);

	return errors;
}

/**
 * Valide une transaction individuelle
 *
 * @param {Object} transaction - Transaction à valider
 * @param {number} index - Index dans la liste
 * @param {Array} accounts - Liste des comptes disponibles
 * @param {Array} currencies - Liste des devises disponibles
 * @returns {Array} Liste des erreurs
 */
function validateSingleTransaction(transaction, index, accounts, currencies) {
	const errors = [];
	const txLabel = transaction.id || `#${index + 1}`;

	// V-TXN-001 : ID au format txn_XXX
	if (!transaction.id) {
		errors.push({
			code: TransactionValidationCode.TXN_001,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : L'ID est obligatoire.`,
			suggestion: 'Ajoutez un ID au format txn_XXX (ex: txn_001).'
		});
	} else if (!isValidTransactionId(transaction.id)) {
		errors.push({
			code: TransactionValidationCode.TXN_001,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : Format d'ID invalide "${transaction.id}".`,
			suggestion: 'L\'ID doit suivre le format txn_XXX où XXX est un nombre (ex: txn_001, txn_042).'
		});
	}

	// V-TXN-003 : Date au format YYYY-MM-DD
	if (!transaction.date) {
		errors.push({
			code: TransactionValidationCode.TXN_003,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : La date est obligatoire.`,
			suggestion: 'Ajoutez une date au format YYYY-MM-DD.'
		});
	} else if (!isValidDateFormat(transaction.date)) {
		errors.push({
			code: TransactionValidationCode.TXN_003,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : Format de date invalide "${transaction.date}".`,
			suggestion: 'Utilisez le format YYYY-MM-DD (ex: 2025-01-15).'
		});
	}

	// V-TXN-006 : Date pas dans le futur (avertissement)
	if (transaction.date && isDateInFuture(transaction.date)) {
		errors.push({
			code: TransactionValidationCode.TXN_006,
			severity: ValidationSeverity.WARNING,
			message: `Transaction ${txLabel} : La date est dans le futur (${transaction.date}).`,
			suggestion: 'Vérifiez que cette date est correcte.'
		});
	}

	// V-TXN-004 : Description non vide
	if (!transaction.description || transaction.description.trim() === '') {
		errors.push({
			code: TransactionValidationCode.TXN_004,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : La description est obligatoire.`,
			suggestion: 'Ajoutez une description (ex: "Courses au supermarché").'
		});
	}

	// V-TXN-005 : Au moins 2 postings
	if (!transaction.posting || !Array.isArray(transaction.posting)) {
		errors.push({
			code: TransactionValidationCode.TXN_005,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : Les postings sont obligatoires.`,
			suggestion: 'Ajoutez au moins 2 postings pour équilibrer la transaction.'
		});
	} else if (transaction.posting.length < 2) {
		errors.push({
			code: TransactionValidationCode.TXN_005,
			severity: ValidationSeverity.ERROR,
			message: `Transaction ${txLabel} : Une transaction doit contenir au moins 2 postings.`,
			suggestion: `Vous avez ${transaction.posting.length} posting(s). Ajoutez au moins un posting supplémentaire.`
		});
	} else {
		// Valider chaque posting
		transaction.posting.forEach((posting, postingIndex) => {
			const postingErrors = validatePosting(
				posting,
				postingIndex,
				transaction,
				accounts,
				currencies
			);
			errors.push(...postingErrors);
		});

		// V-BAL-001 : Vérifier l'équilibre de la transaction
		const balanceErrors = validateBalance(transaction, currencies);
		errors.push(...balanceErrors);
	}

	return errors;
}

/**
 * Valide un posting individuel
 *
 * @param {Object} posting - Posting à valider
 * @param {number} index - Index du posting
 * @param {Object} transaction - Transaction parente
 * @param {Array} accounts - Liste des comptes
 * @param {Array} currencies - Liste des devises
 * @returns {Array} Liste des erreurs
 */
function validatePosting(posting, index, transaction, accounts, currencies) {
	const errors = [];
	const postingLabel = `Posting #${index + 1}`;
	const txLabel = transaction.id || 'Transaction';

	// V-POST-001 : accountId doit exister
	if (!posting.accountId) {
		errors.push({
			code: TransactionValidationCode.POST_001,
			severity: ValidationSeverity.ERROR,
			message: `${txLabel} - ${postingLabel} : Le compte est obligatoire.`,
			suggestion: 'Sélectionnez un compte existant.'
		});
	} else {
		const account = accounts.find(a => a.id === posting.accountId);
		if (!account) {
			errors.push({
				code: TransactionValidationCode.POST_001,
				severity: ValidationSeverity.ERROR,
				message: `${txLabel} - ${postingLabel} : Le compte "${posting.accountId}" n'existe pas.`,
				suggestion: 'Utilisez un compte existant ou créez-le d\'abord.'
			});
		} else {
			// V-POST-003 : La devise doit correspondre au compte
			if (posting.currency !== account.currency) {
				errors.push({
					code: TransactionValidationCode.POST_003,
					severity: ValidationSeverity.ERROR,
					message: `${txLabel} - ${postingLabel} : La devise "${posting.currency}" ne correspond pas à celle du compte "${account.name}" (${account.currency}).`,
					suggestion: `Utilisez la devise ${account.currency} ou changez de compte.`
				});
			}

			// V-POST-004 : Date >= date d'ouverture du compte
			if (account.opened && transaction.date) {
				const txDate = new Date(transaction.date);
				const openDate = new Date(account.opened);
				if (txDate < openDate) {
					errors.push({
						code: TransactionValidationCode.POST_004,
						severity: ValidationSeverity.ERROR,
						message: `${txLabel} - ${postingLabel} : La date de transaction (${transaction.date}) est antérieure à la date d'ouverture du compte "${account.name}" (${account.opened}).`,
						suggestion: `Modifiez la date de la transaction pour qu'elle soit >= ${account.opened}.`
					});
				}
			}

			// V-POST-005 : Date <= date de fermeture du compte (si fermé)
			if (account.closed && account.closedDate && transaction.date) {
				const txDate = new Date(transaction.date);
				const closeDate = new Date(account.closedDate);
				if (txDate > closeDate) {
					errors.push({
						code: TransactionValidationCode.POST_005,
						severity: ValidationSeverity.ERROR,
						message: `${txLabel} - ${postingLabel} : La date de transaction (${transaction.date}) est postérieure à la date de fermeture du compte "${account.name}" (${account.closedDate}).`,
						suggestion: `Modifiez la date de la transaction ou réouvrez le compte.`
					});
				}
			}
		}
	}

	// V-POST-002 : Amount ne peut pas être 0
	if (posting.amount === 0 || posting.amount === '0' || posting.amount === null || posting.amount === undefined) {
		errors.push({
			code: TransactionValidationCode.POST_002,
			severity: ValidationSeverity.ERROR,
			message: `${txLabel} - ${postingLabel} : Le montant ne peut pas être 0.`,
			suggestion: 'Entrez un montant positif (débit) ou négatif (crédit).'
		});
	}

	// V-POST-007 : Précision décimale
	if (posting.amount && posting.currency) {
		const currency = currencies.find(c => c.code === posting.currency);
		if (currency) {
			const decimalPlaces = currency.decimalPlaces || 2;
			const amountStr = posting.amount.toString();
			const decimalPart = amountStr.split('.')[1];
			if (decimalPart && decimalPart.length > decimalPlaces) {
				errors.push({
					code: TransactionValidationCode.POST_007,
					severity: ValidationSeverity.ERROR,
					message: `${txLabel} - ${postingLabel} : Le montant a trop de décimales (${decimalPart.length}) pour la devise ${posting.currency} (max: ${decimalPlaces}).`,
					suggestion: `Arrondissez le montant à ${decimalPlaces} décimale(s).`
				});
			}
		}
	}

	// Valider les taux de change si présents
	if (posting.exchangeRate) {
		const fxErrors = validateExchangeRate(posting, transaction, currencies);
		errors.push(...fxErrors);
	}

	return errors;
}

/**
 * Valide l'équilibre d'une transaction
 *
 * @param {Object} transaction - Transaction à valider
 * @param {Array} currencies - Liste des devises
 * @returns {Array} Liste des erreurs
 */
function validateBalance(transaction, currencies) {
	const errors = [];
	const txLabel = transaction.id || 'Transaction';

	// Calculer la somme par devise
	const balanceByCurrency = {};
	let hasMultipleCurrencies = false;

	transaction.posting.forEach(posting => {
		const currency = posting.currency;
		if (!balanceByCurrency[currency]) {
			balanceByCurrency[currency] = 0;
		}
		balanceByCurrency[currency] += parseFloat(posting.amount || 0);
	});

	const currenciesInTransaction = Object.keys(balanceByCurrency);
	hasMultipleCurrencies = currenciesInTransaction.length > 1;

	// V-BAL-001 : Pour chaque devise, la somme doit être 0 (tolérance ±0.01)
	const tolerance = 0.01;
	const unbalancedCurrencies = [];

	Object.entries(balanceByCurrency).forEach(([currency, balance]) => {
		if (Math.abs(balance) > tolerance) {
			unbalancedCurrencies.push({ currency, balance });
		}
	});

	if (unbalancedCurrencies.length > 0) {
		const details = unbalancedCurrencies
			.map(({ currency, balance }) => `${currency}: ${balance.toFixed(2)}`)
			.join(', ');

		errors.push({
			code: TransactionValidationCode.BAL_001,
			severity: ValidationSeverity.ERROR,
			message: `${txLabel} : Transaction non équilibrée. Somme: ${details}`,
			suggestion: 'La somme de tous les montants doit être 0 pour chaque devise. Ajustez les montants.',
			details: {
				balances: balanceByCurrency,
				unbalanced: unbalancedCurrencies
			}
		});
	}

	// V-BAL-002 : Si plusieurs devises, vérifier les taux de change
	if (hasMultipleCurrencies) {
		const hasExchangeRates = transaction.posting.some(p => p.exchangeRate);
		if (!hasExchangeRates) {
			errors.push({
				code: TransactionValidationCode.BAL_002,
				severity: ValidationSeverity.ERROR,
				message: `${txLabel} : Transaction multi-devises sans taux de change.`,
				suggestion: 'Ajoutez des informations de taux de change pour les conversions entre devises.'
			});
		}
	}

	return errors;
}

/**
 * Valide un taux de change
 *
 * @param {Object} posting - Posting avec taux de change
 * @param {Object} transaction - Transaction parente
 * @param {Array} currencies - Liste des devises
 * @returns {Array} Liste des erreurs
 */
function validateExchangeRate(posting, transaction, currencies) {
	const errors = [];
	const txLabel = transaction.id || 'Transaction';
	const fx = posting.exchangeRate;

	// V-FX-001 : rate > 0
	if (!fx.rate || fx.rate <= 0) {
		errors.push({
			code: TransactionValidationCode.FX_001,
			severity: ValidationSeverity.ERROR,
			message: `${txLabel} : Le taux de change doit être > 0.`,
			suggestion: 'Entrez un taux de change valide.'
		});
	}

	// V-FX-004 : equivalentAmount = amount × rate (tolérance ±0.01)
	if (fx.equivalentAmount && fx.rate && posting.amount) {
		const expectedEquivalent = posting.amount * fx.rate;
		const diff = Math.abs(fx.equivalentAmount - expectedEquivalent);
		if (diff > 0.01) {
			errors.push({
				code: TransactionValidationCode.FX_004,
				severity: ValidationSeverity.ERROR,
				message: `${txLabel} : Le montant équivalent (${fx.equivalentAmount}) ne correspond pas au calcul (${posting.amount} × ${fx.rate} = ${expectedEquivalent.toFixed(2)}).`,
				suggestion: `Utilisez ${expectedEquivalent.toFixed(2)} comme montant équivalent.`
			});
		}
	}

	return errors;
}

/**
 * Valide l'unicité des IDs de transactions
 *
 * @param {Array} transactions - Liste des transactions
 * @returns {Array} Liste des erreurs
 */
function validateTransactionIdUniqueness(transactions) {
	const errors = [];
	const ids = new Map();

	transactions.forEach((transaction, index) => {
		if (!transaction.id) return;

		if (ids.has(transaction.id)) {
			errors.push({
				code: TransactionValidationCode.TXN_002,
				severity: ValidationSeverity.ERROR,
				message: `ID "${transaction.id}" est défini plusieurs fois (positions ${ids.get(transaction.id) + 1} et ${index + 1}).`,
				suggestion: 'Chaque ID doit être unique. Modifiez l\'un des IDs.'
			});
		} else {
			ids.set(transaction.id, index);
		}
	});

	return errors;
}

/**
 * Vérifie si un ID de transaction est valide
 *
 * @param {string} id - ID de la transaction
 * @returns {boolean} True si valide
 */
function isValidTransactionId(id) {
	// Format : txn_XXX où XXX est un nombre
	const transactionIdPattern = /^txn_\d+$/;
	return transactionIdPattern.test(id);
}

/**
 * Vérifie si une date est au format YYYY-MM-DD
 *
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} True si valide
 */
function isValidDateFormat(date) {
	if (date instanceof Date) {
		return !isNaN(date.getTime());
	}

	if (typeof date !== 'string') {
		return false;
	}

	// Format YYYY-MM-DD
	const datePattern = /^\d{4}-\d{2}-\d{2}$/;
	if (!datePattern.test(date)) {
		return false;
	}

	// Vérifier que la date est valide
	const d = new Date(date);
	return !isNaN(d.getTime());
}

/**
 * Vérifie si une date est dans le futur
 *
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} True si dans le futur
 */
function isDateInFuture(date) {
	const d = new Date(date);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return d > today;
}

/**
 * Valide une nouvelle transaction avant ajout
 * Utilisé dans l'UI pour validation côté client
 *
 * @param {Object} transaction - Transaction à valider
 * @param {Array} existingTransactions - Transactions existantes
 * @param {Array} accounts - Comptes disponibles
 * @param {Array} currencies - Devises disponibles
 * @returns {Object} Résultat de validation { valid, errors }
 */
export function validateNewTransaction(transaction, existingTransactions = [], accounts = [], currencies = []) {
	const errors = [];

	// V-TXN-003 : Date obligatoire
	if (!transaction.date || transaction.date.trim() === '') {
		errors.push({
			code: TransactionValidationCode.TXN_003,
			message: 'La date est obligatoire.',
			field: 'date'
		});
	} else if (!isValidDateFormat(transaction.date)) {
		errors.push({
			code: TransactionValidationCode.TXN_003,
			message: 'La date doit être au format YYYY-MM-DD.',
			field: 'date'
		});
	}

	// V-TXN-004 : Description obligatoire
	if (!transaction.description || transaction.description.trim() === '') {
		errors.push({
			code: TransactionValidationCode.TXN_004,
			message: 'La description est obligatoire.',
			field: 'description'
		});
	}

	// V-TXN-005 : Au moins 2 postings
	if (!transaction.posting || transaction.posting.length < 2) {
		errors.push({
			code: TransactionValidationCode.TXN_005,
			message: 'Une transaction doit contenir au moins 2 postings.',
			field: 'posting'
		});
	} else {
		// Valider chaque posting
		transaction.posting.forEach((posting, index) => {
			// V-POST-001 : Compte obligatoire
			if (!posting.accountId) {
				errors.push({
					code: TransactionValidationCode.POST_001,
					message: `Posting #${index + 1} : Le compte est obligatoire.`,
					field: `posting[${index}].accountId`
				});
			} else {
				const account = accounts.find(a => a.id === posting.accountId);
				if (!account) {
					errors.push({
						code: TransactionValidationCode.POST_001,
						message: `Posting #${index + 1} : Le compte n'existe pas.`,
						field: `posting[${index}].accountId`
					});
				}
			}

			// V-POST-002 : Montant non nul
			if (!posting.amount || posting.amount === 0) {
				errors.push({
					code: TransactionValidationCode.POST_002,
					message: `Posting #${index + 1} : Le montant ne peut pas être 0.`,
					field: `posting[${index}].amount`
				});
			}

			// Devise obligatoire
			if (!posting.currency) {
				errors.push({
					code: TransactionValidationCode.POST_003,
					message: `Posting #${index + 1} : La devise est obligatoire.`,
					field: `posting[${index}].currency`
				});
			}
		});

		// V-BAL-001 : Vérifier l'équilibre
		const balanceErrors = validateBalance(transaction, currencies);
		errors.push(...balanceErrors.map(e => ({ ...e, field: 'posting' })));
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Génère un nouvel ID de transaction
 *
 * @param {Array} existingTransactions - Transactions existantes
 * @returns {string} Nouvel ID au format txn_XXX
 */
export function generateTransactionId(existingTransactions = []) {
	const maxId = Math.max(
		0,
		...existingTransactions.map(t => {
			const match = t.id?.match(/^txn_(\d+)$/);
			return match ? parseInt(match[1], 10) : 0;
		})
	);
	const nextId = maxId + 1;
	return `txn_${nextId.toString().padStart(3, '0')}`;
}

/**
 * Crée un objet transaction avec valeurs par défaut
 *
 * @param {Object} data - Données de la transaction
 * @param {Array} existingTransactions - Transactions existantes (pour générer l'ID)
 * @returns {Object} Transaction créée
 */
export function createTransaction(data, existingTransactions = []) {
	return {
		id: data.id || generateTransactionId(existingTransactions),
		date: data.date,
		description: data.description,
		payee: data.payee || '',
		tags: data.tags || [],
		posting: data.posting || [],
		metadata: data.metadata || {}
	};
}

/**
 * Calcule l'équilibre d'une transaction par devise
 *
 * @param {Object} transaction - Transaction
 * @returns {Object} Équilibre par devise { currency: balance }
 */
export function calculateBalance(transaction) {
	const balanceByCurrency = {};

	if (!transaction.posting || !Array.isArray(transaction.posting)) {
		return balanceByCurrency;
	}

	transaction.posting.forEach(posting => {
		const currency = posting.currency;
		if (!balanceByCurrency[currency]) {
			balanceByCurrency[currency] = 0;
		}
		balanceByCurrency[currency] += parseFloat(posting.amount || 0);
	});

	return balanceByCurrency;
}

/**
 * Vérifie si une transaction est équilibrée
 *
 * @param {Object} transaction - Transaction
 * @returns {boolean} True si équilibrée
 */
export function isBalanced(transaction) {
	const tolerance = 0.01;
	const balances = calculateBalance(transaction);

	return Object.values(balances).every(balance => Math.abs(balance) <= tolerance);
}

/**
 * Calcule le montant total d'une transaction (valeur absolue du débit ou crédit)
 *
 * @param {Object} transaction - Transaction
 * @returns {number} Montant total
 */
export function getTransactionAmount(transaction) {
	if (!transaction.posting || transaction.posting.length === 0) {
		return 0;
	}

	// Prendre la somme des montants positifs (débits)
	const total = transaction.posting
		.filter(p => p.amount > 0)
		.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

	return total;
}
