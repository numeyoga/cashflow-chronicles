/**
 * Currency Validator pour Cashflow Chronicles
 *
 * Implémente EPIC-002 : Gestion des Devises et Taux de Change
 * Règles de validation : V-CUR-001 à V-CUR-012
 */

import { ValidationSeverity } from './validator.js';

/**
 * Codes d'erreur pour la validation des devises
 */
export const CurrencyValidationCode = {
	CUR_001: 'V-CUR-001',
	CUR_002: 'V-CUR-002',
	CUR_003: 'V-CUR-003',
	CUR_004: 'V-CUR-004',
	CUR_005: 'V-CUR-005',
	CUR_006: 'V-CUR-006',
	CUR_007: 'V-CUR-007',
	CUR_008: 'V-CUR-008',
	CUR_009: 'V-CUR-009',
	CUR_010: 'V-CUR-010',
	CUR_011: 'V-CUR-011',
	CUR_012: 'V-CUR-012'
};

/**
 * Valide une liste de devises
 *
 * @param {Array} currencies - Liste des devises
 * @param {Object} metadata - Métadonnées du fichier
 * @returns {Array} Liste des erreurs de validation
 */
export function validateCurrencies(currencies, metadata = null) {
	const errors = [];

	if (!Array.isArray(currencies)) {
		errors.push({
			code: CurrencyValidationCode.CUR_001,
			severity: ValidationSeverity.ERROR,
			message: 'La section currency doit être un tableau.',
			suggestion: 'Utilisez [[currency]] pour définir les devises.'
		});
		return errors;
	}

	if (currencies.length === 0) {
		errors.push({
			code: CurrencyValidationCode.CUR_001,
			severity: ValidationSeverity.ERROR,
			message: 'Au moins une devise doit être définie.',
			suggestion: 'Ajoutez une devise par défaut (ex: CHF).'
		});
		return errors;
	}

	// Vérifier chaque devise individuellement
	currencies.forEach((currency, index) => {
		const currencyErrors = validateSingleCurrency(currency, index);
		errors.push(...currencyErrors);
	});

	// V-CUR-002 : Vérifier l'unicité des codes
	const uniquenessErrors = validateCurrencyUniqueness(currencies);
	errors.push(...uniquenessErrors);

	// V-CUR-006 : Vérifier qu'une seule devise est par défaut
	const defaultErrors = validateDefaultCurrency(currencies);
	errors.push(...defaultErrors);

	// V-CUR-007 : Vérifier la cohérence avec metadata.defaultCurrency
	if (metadata && metadata.defaultCurrency) {
		const metadataErrors = validateMetadataConsistency(currencies, metadata);
		errors.push(...metadataErrors);
	}

	return errors;
}

/**
 * Valide une devise individuelle
 *
 * @param {Object} currency - Devise à valider
 * @param {number} index - Index dans la liste
 * @returns {Array} Liste des erreurs
 */
function validateSingleCurrency(currency, index) {
	const errors = [];

	// V-CUR-001 : Code ISO 4217
	if (!currency.code) {
		errors.push({
			code: CurrencyValidationCode.CUR_001,
			severity: ValidationSeverity.ERROR,
			message: `Devise #${index + 1} : Le code est obligatoire.`,
			suggestion: 'Ajoutez un code ISO 4217 (ex: CHF, EUR, USD).'
		});
	} else if (!isValidCurrencyCode(currency.code)) {
		errors.push({
			code: CurrencyValidationCode.CUR_001,
			severity: ValidationSeverity.ERROR,
			message: `Code devise invalide : "${currency.code}". Les codes doivent suivre la norme ISO 4217 (3 lettres majuscules).`,
			suggestion: 'Utilisez un code ISO 4217 valide (ex: CHF, EUR, USD, GBP).'
		});
	}

	// V-CUR-003 : Nom non vide
	if (!currency.name || currency.name.trim() === '') {
		errors.push({
			code: CurrencyValidationCode.CUR_003,
			severity: ValidationSeverity.ERROR,
			message: `Devise "${currency.code || '#' + (index + 1)}" : Le nom est obligatoire.`,
			suggestion: 'Ajoutez un nom descriptif (ex: "Swiss Franc", "Euro").'
		});
	}

	// V-CUR-004 : Symbole non vide
	if (!currency.symbol || currency.symbol.trim() === '') {
		errors.push({
			code: CurrencyValidationCode.CUR_004,
			severity: ValidationSeverity.ERROR,
			message: `Devise "${currency.code || '#' + (index + 1)}" : Le symbole est obligatoire.`,
			suggestion: 'Ajoutez un symbole (ex: "CHF", "€", "$").'
		});
	}

	// V-CUR-005 : Décimales entre 0 et 8
	if (currency.decimalPlaces === undefined || currency.decimalPlaces === null) {
		errors.push({
			code: CurrencyValidationCode.CUR_005,
			severity: ValidationSeverity.ERROR,
			message: `Devise "${currency.code || '#' + (index + 1)}" : La propriété decimalPlaces est obligatoire.`,
			suggestion: 'Ajoutez un nombre de décimales (généralement 2).'
		});
	} else if (currency.decimalPlaces < 0 || currency.decimalPlaces > 8) {
		errors.push({
			code: CurrencyValidationCode.CUR_005,
			severity: ValidationSeverity.ERROR,
			message: `Devise "${currency.code}" : Le nombre de décimales doit être entre 0 et 8. Trouvé : ${currency.decimalPlaces}`,
			suggestion: 'Utilisez une valeur entre 0 et 8 (2 pour la plupart des devises).'
		});
	}

	// Valider les taux de change si présents
	if (currency.exchangeRate && Array.isArray(currency.exchangeRate)) {
		const rateErrors = validateExchangeRates(currency);
		errors.push(...rateErrors);
	}

	return errors;
}

/**
 * Valide les taux de change d'une devise
 *
 * @param {Object} currency - Devise avec taux de change
 * @returns {Array} Liste des erreurs
 */
function validateExchangeRates(currency) {
	const errors = [];

	// V-CUR-012 : La devise par défaut ne doit pas avoir de taux
	if (currency.isDefault && currency.exchangeRate.length > 0) {
		errors.push({
			code: CurrencyValidationCode.CUR_012,
			severity: ValidationSeverity.ERROR,
			message: `La devise par défaut "${currency.code}" ne peut pas avoir de taux de change.`,
			suggestion: 'Supprimez les taux de change ou retirez isDefault.'
		});
	}

	const dates = new Set();

	currency.exchangeRate.forEach((rate, index) => {
		// V-CUR-008 : Date au format YYYY-MM-DD
		if (!rate.date) {
			errors.push({
				code: CurrencyValidationCode.CUR_008,
				severity: ValidationSeverity.ERROR,
				message: `Devise "${currency.code}", taux #${index + 1} : La date est obligatoire.`,
				suggestion: 'Ajoutez une date au format YYYY-MM-DD.'
			});
		} else if (!isValidDateFormat(rate.date)) {
			errors.push({
				code: CurrencyValidationCode.CUR_008,
				severity: ValidationSeverity.ERROR,
				message: `Devise "${currency.code}", taux #${index + 1} : Format de date invalide "${rate.date}".`,
				suggestion: 'Utilisez le format YYYY-MM-DD (ex: 2025-01-15).'
			});
		}

		// V-CUR-009 : Taux > 0
		if (!rate.rate || rate.rate <= 0) {
			errors.push({
				code: CurrencyValidationCode.CUR_009,
				severity: ValidationSeverity.ERROR,
				message: `Devise "${currency.code}", taux du ${rate.date || 'N/A'} : Le taux doit être > 0. Trouvé : ${rate.rate}`,
				suggestion: 'Utilisez un taux positif (ex: 0.95 pour 1 EUR = 0.95 CHF).'
			});
		}

		// V-CUR-010 : Avertissement si taux = 1.0
		if (rate.rate === 1.0) {
			errors.push({
				code: CurrencyValidationCode.CUR_010,
				severity: ValidationSeverity.WARNING,
				message: `Devise "${currency.code}", taux du ${rate.date} : Le taux est égal à 1.0.`,
				suggestion: 'Si la devise a la même valeur que la devise par défaut, envisagez de la définir comme devise par défaut.'
			});
		}

		// V-CUR-011 : Dates uniques
		const dateStr = rate.date ? rate.date.toString() : '';
		if (dates.has(dateStr)) {
			errors.push({
				code: CurrencyValidationCode.CUR_011,
				severity: ValidationSeverity.ERROR,
				message: `Devise "${currency.code}" : Plusieurs taux définis pour la date ${dateStr}.`,
				suggestion: 'Une seule valeur de taux par jour est autorisée. Modifiez ou supprimez les doublons.'
			});
		}
		dates.add(dateStr);
	});

	return errors;
}

/**
 * Valide l'unicité des codes devise
 *
 * @param {Array} currencies - Liste des devises
 * @returns {Array} Liste des erreurs
 */
function validateCurrencyUniqueness(currencies) {
	const errors = [];
	const codes = new Map();

	currencies.forEach((currency, index) => {
		if (!currency.code) return;

		if (codes.has(currency.code)) {
			errors.push({
				code: CurrencyValidationCode.CUR_002,
				severity: ValidationSeverity.ERROR,
				message: `Code devise "${currency.code}" est défini plusieurs fois (positions ${codes.get(currency.code) + 1} et ${index + 1}).`,
				suggestion: 'Chaque code devise doit être unique. Supprimez ou modifiez les doublons.'
			});
		} else {
			codes.set(currency.code, index);
		}
	});

	return errors;
}

/**
 * Valide qu'une seule devise est marquée par défaut
 *
 * @param {Array} currencies - Liste des devises
 * @returns {Array} Liste des erreurs
 */
function validateDefaultCurrency(currencies) {
	const errors = [];
	const defaultCurrencies = currencies.filter(c => c.isDefault === true);

	if (defaultCurrencies.length === 0) {
		errors.push({
			code: CurrencyValidationCode.CUR_006,
			severity: ValidationSeverity.ERROR,
			message: 'Aucune devise par défaut définie. Une devise doit avoir isDefault = true.',
			suggestion: 'Marquez une devise comme par défaut (ex: isDefault = true pour CHF).'
		});
	} else if (defaultCurrencies.length > 1) {
		const codes = defaultCurrencies.map(c => c.code).join(', ');
		errors.push({
			code: CurrencyValidationCode.CUR_006,
			severity: ValidationSeverity.ERROR,
			message: `Plusieurs devises marquées par défaut : ${codes}. Une seule devise peut être par défaut.`,
			suggestion: 'Retirez isDefault de toutes les devises sauf une.'
		});
	}

	return errors;
}

/**
 * Valide la cohérence avec metadata.defaultCurrency
 *
 * @param {Array} currencies - Liste des devises
 * @param {Object} metadata - Métadonnées du fichier
 * @returns {Array} Liste des erreurs
 */
function validateMetadataConsistency(currencies, metadata) {
	const errors = [];
	const defaultCurrency = currencies.find(c => c.isDefault === true);

	if (!defaultCurrency) {
		// Déjà géré par V-CUR-006
		return errors;
	}

	if (defaultCurrency.code !== metadata.defaultCurrency) {
		errors.push({
			code: CurrencyValidationCode.CUR_007,
			severity: ValidationSeverity.ERROR,
			message: `Incohérence : La devise par défaut "${defaultCurrency.code}" ne correspond pas à metadata.defaultCurrency = "${metadata.defaultCurrency}".`,
			suggestion: `Mettez à jour metadata.defaultCurrency = "${defaultCurrency.code}" ou changez la devise par défaut.`
		});
	}

	return errors;
}

/**
 * Vérifie si un code devise est valide selon ISO 4217
 *
 * @param {string} code - Code devise
 * @returns {boolean} True si valide
 */
function isValidCurrencyCode(code) {
	// ISO 4217 : 3 lettres majuscules
	const iso4217Pattern = /^[A-Z]{3}$/;
	return iso4217Pattern.test(code);
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
 * Valide une nouvelle devise avant ajout
 * Utilisé dans l'UI pour validation côté client
 *
 * @param {Object} currency - Devise à valider
 * @param {Array} existingCurrencies - Devises existantes
 * @returns {Object} Résultat de validation { valid, errors }
 */
export function validateNewCurrency(currency, existingCurrencies = []) {
	const errors = [];

	// V-CUR-001
	if (!currency.code || !isValidCurrencyCode(currency.code)) {
		errors.push({
			code: CurrencyValidationCode.CUR_001,
			message: 'Code invalide. Utilisez 3 lettres majuscules (ISO 4217).',
			field: 'code'
		});
	}

	// V-CUR-002
	if (currency.code && existingCurrencies.some(c => c.code === currency.code)) {
		errors.push({
			code: CurrencyValidationCode.CUR_002,
			message: `La devise ${currency.code} existe déjà.`,
			field: 'code'
		});
	}

	// V-CUR-003
	if (!currency.name || currency.name.trim() === '') {
		errors.push({
			code: CurrencyValidationCode.CUR_003,
			message: 'Le nom est obligatoire.',
			field: 'name'
		});
	}

	// V-CUR-004
	if (!currency.symbol || currency.symbol.trim() === '') {
		errors.push({
			code: CurrencyValidationCode.CUR_004,
			message: 'Le symbole est obligatoire.',
			field: 'symbol'
		});
	}

	// V-CUR-005
	const decimals = currency.decimalPlaces;
	if (decimals === undefined || decimals === null || decimals < 0 || decimals > 8) {
		errors.push({
			code: CurrencyValidationCode.CUR_005,
			message: 'Le nombre de décimales doit être entre 0 et 8.',
			field: 'decimalPlaces'
		});
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Valide un nouveau taux de change avant ajout
 * Utilisé dans l'UI pour validation côté client
 *
 * @param {Object} exchangeRate - Taux à valider
 * @param {Object} currency - Devise associée
 * @returns {Object} Résultat de validation { valid, errors }
 */
export function validateNewExchangeRate(exchangeRate, currency) {
	const errors = [];

	// V-CUR-012 : Pas de taux pour devise par défaut
	if (currency.isDefault) {
		errors.push({
			code: CurrencyValidationCode.CUR_012,
			message: 'Impossible d\'ajouter un taux pour la devise par défaut.',
			field: 'general'
		});
		return { valid: false, errors };
	}

	// V-CUR-008
	if (!exchangeRate.date || !isValidDateFormat(exchangeRate.date)) {
		errors.push({
			code: CurrencyValidationCode.CUR_008,
			message: 'La date doit être au format YYYY-MM-DD.',
			field: 'date'
		});
	}

	// V-CUR-009
	if (!exchangeRate.rate || exchangeRate.rate <= 0) {
		errors.push({
			code: CurrencyValidationCode.CUR_009,
			message: 'Le taux doit être supérieur à 0.',
			field: 'rate'
		});
	}

	// V-CUR-010 (avertissement)
	if (exchangeRate.rate === 1.0) {
		errors.push({
			code: CurrencyValidationCode.CUR_010,
			message: 'Un taux de 1.0 signifie que les devises ont la même valeur.',
			field: 'rate',
			severity: ValidationSeverity.WARNING
		});
	}

	// V-CUR-011
	if (
		currency.exchangeRate &&
		currency.exchangeRate.some(r => r.date.toString() === exchangeRate.date.toString())
	) {
		errors.push({
			code: CurrencyValidationCode.CUR_011,
			message: 'Un taux existe déjà pour cette date.',
			field: 'date'
		});
	}

	return {
		valid: errors.filter(e => e.severity !== ValidationSeverity.WARNING).length === 0,
		errors
	};
}
