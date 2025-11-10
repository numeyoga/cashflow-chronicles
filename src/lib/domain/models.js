/**
 * Models pour Cashflow Chronicles
 *
 * Définitions des structures de données utilisées dans l'application
 * Implémente EPIC-002 : Gestion des Devises et Taux de Change
 */

/**
 * @typedef {Object} Currency
 * @property {string} code - Code ISO 4217 (3 lettres majuscules)
 * @property {string} name - Nom complet de la devise
 * @property {string} symbol - Symbole de la devise (€, $, etc.)
 * @property {number} decimalPlaces - Nombre de décimales (0-8)
 * @property {boolean} [isDefault] - Indique si c'est la devise par défaut
 * @property {ExchangeRate[]} [exchangeRate] - Historique des taux de change
 */

/**
 * @typedef {Object} ExchangeRate
 * @property {string|Date} date - Date du taux (format ISO 8601)
 * @property {number} rate - Taux de change par rapport à la devise par défaut
 * @property {string} [source] - Source du taux (ex: "Banque PostFinance", "manuel")
 */

/**
 * @typedef {Object} Account
 * @property {string} id - Identifiant unique du compte
 * @property {string} name - Nom hiérarchique du compte (ex: "Assets.Bank.PostFinance")
 * @property {string} type - Type de compte (Assets, Liabilities, Income, Expenses, Equity)
 * @property {string} currency - Code devise du compte
 * @property {string} [description] - Description optionnelle
 * @property {boolean} [closed] - Compte clôturé ou non
 * @property {string|Date} [closedDate] - Date de clôture
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - Identifiant unique de la transaction
 * @property {string|Date} date - Date de la transaction
 * @property {string} description - Description de la transaction
 * @property {string} [payee] - Bénéficiaire/émetteur
 * @property {string[]} [tags] - Tags pour catégoriser
 * @property {Posting[]} posting - Liste des écritures (postings)
 */

/**
 * @typedef {Object} Posting
 * @property {string} accountId - ID du compte affecté
 * @property {number} amount - Montant (peut être négatif)
 * @property {string} currency - Code devise
 * @property {ExchangeRateInfo} [exchangeRate] - Info de taux si multi-devises
 */

/**
 * @typedef {Object} ExchangeRateInfo
 * @property {number} rate - Taux de change utilisé
 * @property {number} equivalentAmount - Montant équivalent dans devise de base
 */

/**
 * @typedef {Object} Metadata
 * @property {string|Date} created - Date de création du fichier
 * @property {string|Date} lastModified - Dernière modification
 * @property {string} defaultCurrency - Code de la devise par défaut
 * @property {string} [owner] - Propriétaire du fichier
 * @property {string} [description] - Description du fichier
 */

/**
 * Crée une nouvelle devise
 *
 * @param {Object} data - Données de la devise
 * @returns {Currency} Devise créée
 */
export function createCurrency(data) {
	return {
		code: data.code.toUpperCase(),
		name: data.name,
		symbol: data.symbol || data.code,
		decimalPlaces: data.decimalPlaces ?? 2,
		isDefault: data.isDefault ?? false,
		exchangeRate: data.exchangeRate || []
	};
}

/**
 * Crée un nouveau taux de change
 *
 * @param {Object} data - Données du taux
 * @returns {ExchangeRate} Taux de change créé
 */
export function createExchangeRate(data) {
	return {
		date: data.date,
		rate: data.rate,
		source: data.source || 'manuel'
	};
}

/**
 * Liste des devises ISO 4217 les plus courantes
 * Utilisé pour l'auto-complétion
 */
export const ISO_4217_CURRENCIES = [
	{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
	{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
	{ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
	{ code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
	{ code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
	{ code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2 },
	{ code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
	{ code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
	{ code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
	{ code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
	{ code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2 },
	{ code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2 },
	{ code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2 },
	{ code: 'PLN', name: 'Polish Złoty', symbol: 'zł', decimalPlaces: 2 },
	{ code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2 },
	{ code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 2 },
	{ code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimalPlaces: 2 },
	{ code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimalPlaces: 2 },
	{ code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', decimalPlaces: 2 },
	{ code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2 },
	{ code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimalPlaces: 2 },
	{ code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimalPlaces: 2 },
	{ code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2 },
	{ code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
	{ code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2 },
	{ code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
	{ code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2 },
	{ code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2 },
	{ code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
	{ code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 }
];

/**
 * Recherche une devise dans la liste ISO 4217
 *
 * @param {string} query - Terme de recherche
 * @returns {Array} Liste des devises correspondantes
 */
export function searchCurrency(query) {
	const q = query.toLowerCase();
	return ISO_4217_CURRENCIES.filter(
		c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
	);
}
