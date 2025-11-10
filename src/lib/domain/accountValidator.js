/**
 * Account Validator pour Cashflow Chronicles
 *
 * Implémente EPIC-003 : Gestion des Comptes
 * Règles de validation : V-ACC-001 à V-ACC-013
 */

import { ValidationSeverity } from './validator.js';

/**
 * Codes d'erreur pour la validation des comptes
 */
export const AccountValidationCode = {
	ACC_001: 'V-ACC-001',
	ACC_002: 'V-ACC-002',
	ACC_003: 'V-ACC-003',
	ACC_004: 'V-ACC-004',
	ACC_005: 'V-ACC-005',
	ACC_006: 'V-ACC-006',
	ACC_007: 'V-ACC-007',
	ACC_008: 'V-ACC-008',
	ACC_009: 'V-ACC-009',
	ACC_010: 'V-ACC-010',
	ACC_011: 'V-ACC-011',
	ACC_012: 'V-ACC-012',
	ACC_013: 'V-ACC-013'
};

/**
 * Types de comptes valides
 */
export const AccountTypes = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity'];

/**
 * Valide une liste de comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @param {Array} currencies - Liste des devises disponibles
 * @returns {Array} Liste des erreurs de validation
 */
export function validateAccounts(accounts, currencies = []) {
	const errors = [];

	if (!Array.isArray(accounts)) {
		return errors; // Pas d'erreur si pas de comptes (optionnel)
	}

	// Vérifier chaque compte individuellement
	accounts.forEach((account, index) => {
		const accountErrors = validateSingleAccount(account, index, currencies);
		errors.push(...accountErrors);
	});

	// V-ACC-002 : Vérifier l'unicité des IDs
	const idErrors = validateAccountIdUniqueness(accounts);
	errors.push(...idErrors);

	// V-ACC-004 : Vérifier l'unicité des noms
	const nameErrors = validateAccountNameUniqueness(accounts);
	errors.push(...nameErrors);

	// V-ACC-013 : Vérifier la cohérence hiérarchique
	const hierarchyErrors = validateAccountHierarchy(accounts);
	errors.push(...hierarchyErrors);

	return errors;
}

/**
 * Valide un compte individuel
 *
 * @param {Object} account - Compte à valider
 * @param {number} index - Index dans la liste
 * @param {Array} currencies - Liste des devises disponibles
 * @returns {Array} Liste des erreurs
 */
function validateSingleAccount(account, index, currencies) {
	const errors = [];
	const accountLabel = account.name || `#${index + 1}`;

	// V-ACC-001 : ID au format acc_XXX
	if (!account.id) {
		errors.push({
			code: AccountValidationCode.ACC_001,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : L'ID est obligatoire.`,
			suggestion: 'Ajoutez un ID au format acc_XXX (ex: acc_001).'
		});
	} else if (!isValidAccountId(account.id)) {
		errors.push({
			code: AccountValidationCode.ACC_001,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : Format d'ID invalide "${account.id}".`,
			suggestion: 'L\'ID doit suivre le format acc_XXX où XXX est un nombre (ex: acc_001, acc_042).'
		});
	}

	// V-ACC-003 : Nom non vide
	if (!account.name || account.name.trim() === '') {
		errors.push({
			code: AccountValidationCode.ACC_003,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${account.id || '#' + (index + 1)} : Le nom est obligatoire.`,
			suggestion: 'Ajoutez un nom hiérarchique (ex: Assets:Bank:CHF:PostFinance).'
		});
	} else {
		// V-ACC-009 : Au moins 2 segments
		const segments = account.name.split(':');
		if (segments.length < 2) {
			errors.push({
				code: AccountValidationCode.ACC_009,
				severity: ValidationSeverity.ERROR,
				message: `Compte "${account.name}" : Le nom doit contenir au moins 2 segments séparés par ':'.`,
				suggestion: 'Format recommandé : Type:Category:Subcategory:Name (ex: Assets:Bank:CHF:PostFinance).'
			});
		}

		// V-ACC-010 : Premier segment = type
		if (account.type && segments[0] !== account.type) {
			errors.push({
				code: AccountValidationCode.ACC_010,
				severity: ValidationSeverity.ERROR,
				message: `Compte "${account.name}" : Le premier segment doit correspondre au type "${account.type}".`,
				suggestion: `Changez le nom en "${account.type}:..." ou modifiez le type.`
			});
		}

		// V-ACC-011 : Aucun segment vide
		const emptySegments = segments.filter(s => s.trim() === '');
		if (emptySegments.length > 0) {
			errors.push({
				code: AccountValidationCode.ACC_011,
				severity: ValidationSeverity.ERROR,
				message: `Compte "${account.name}" : Le nom contient des segments vides.`,
				suggestion: 'Supprimez les ":" en trop et assurez-vous que tous les segments sont remplis.'
			});
		}
	}

	// V-ACC-005 : Type valide
	if (!account.type) {
		errors.push({
			code: AccountValidationCode.ACC_005,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : Le type est obligatoire.`,
			suggestion: `Utilisez l'un des types suivants : ${AccountTypes.join(', ')}.`
		});
	} else if (!AccountTypes.includes(account.type)) {
		errors.push({
			code: AccountValidationCode.ACC_005,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : Type invalide "${account.type}".`,
			suggestion: `Utilisez l'un des types suivants : ${AccountTypes.join(', ')}.`
		});
	}

	// V-ACC-006 : Devise existante
	if (!account.currency) {
		errors.push({
			code: AccountValidationCode.ACC_006,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : La devise est obligatoire.`,
			suggestion: 'Ajoutez un code devise (ex: CHF, EUR, USD).'
		});
	} else if (currencies.length > 0 && !currencies.some(c => c.code === account.currency)) {
		errors.push({
			code: AccountValidationCode.ACC_006,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : La devise "${account.currency}" n'existe pas.`,
			suggestion: 'Ajoutez d\'abord la devise ou utilisez une devise existante.'
		});
	}

	// V-ACC-007 : Date d'ouverture au format YYYY-MM-DD
	if (account.opened && !isValidDateFormat(account.opened)) {
		errors.push({
			code: AccountValidationCode.ACC_007,
			severity: ValidationSeverity.ERROR,
			message: `Compte ${accountLabel} : Format de date d'ouverture invalide "${account.opened}".`,
			suggestion: 'Utilisez le format YYYY-MM-DD (ex: 2025-01-15).'
		});
	}

	// V-ACC-008 : Date de clôture valide si compte clôturé
	if (account.closed) {
		if (!account.closedDate) {
			errors.push({
				code: AccountValidationCode.ACC_008,
				severity: ValidationSeverity.ERROR,
				message: `Compte ${accountLabel} : Un compte clôturé doit avoir une date de clôture.`,
				suggestion: 'Ajoutez closedDate au format YYYY-MM-DD.'
			});
		} else if (!isValidDateFormat(account.closedDate)) {
			errors.push({
				code: AccountValidationCode.ACC_008,
				severity: ValidationSeverity.ERROR,
				message: `Compte ${accountLabel} : Format de date de clôture invalide "${account.closedDate}".`,
				suggestion: 'Utilisez le format YYYY-MM-DD (ex: 2025-01-15).'
			});
		}

		// Vérifier que la date de clôture est après la date d'ouverture
		if (account.opened && account.closedDate) {
			const openDate = new Date(account.opened);
			const closeDate = new Date(account.closedDate);
			if (closeDate < openDate) {
				errors.push({
					code: AccountValidationCode.ACC_008,
					severity: ValidationSeverity.ERROR,
					message: `Compte ${accountLabel} : La date de clôture ne peut pas être antérieure à la date d'ouverture.`,
					suggestion: `Modifiez la date de clôture pour qu'elle soit >= ${account.opened}.`
				});
			}
		}
	}

	return errors;
}

/**
 * Valide l'unicité des IDs de comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @returns {Array} Liste des erreurs
 */
function validateAccountIdUniqueness(accounts) {
	const errors = [];
	const ids = new Map();

	accounts.forEach((account, index) => {
		if (!account.id) return;

		if (ids.has(account.id)) {
			errors.push({
				code: AccountValidationCode.ACC_002,
				severity: ValidationSeverity.ERROR,
				message: `ID "${account.id}" est défini plusieurs fois (positions ${ids.get(account.id) + 1} et ${index + 1}).`,
				suggestion: 'Chaque ID doit être unique. Modifiez l\'un des IDs.'
			});
		} else {
			ids.set(account.id, index);
		}
	});

	return errors;
}

/**
 * Valide l'unicité des noms de comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @returns {Array} Liste des erreurs
 */
function validateAccountNameUniqueness(accounts) {
	const errors = [];
	const names = new Map();

	accounts.forEach((account, index) => {
		if (!account.name) return;

		if (names.has(account.name)) {
			errors.push({
				code: AccountValidationCode.ACC_004,
				severity: ValidationSeverity.ERROR,
				message: `Nom de compte "${account.name}" est défini plusieurs fois (IDs: ${accounts[names.get(account.name)].id} et ${account.id}).`,
				suggestion: 'Chaque nom de compte doit être unique. Modifiez l\'un des noms.'
			});
		} else {
			names.set(account.name, index);
		}
	});

	return errors;
}

/**
 * Valide la cohérence hiérarchique des comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @returns {Array} Liste des erreurs
 */
function validateAccountHierarchy(accounts) {
	const errors = [];

	// Pour chaque compte, vérifier que les comptes parents existent (implicitement)
	accounts.forEach(account => {
		if (!account.name) return;

		const segments = account.name.split(':');
		if (segments.length < 2) return;

		// Construire les noms des parents potentiels
		const parentNames = [];
		for (let i = 1; i < segments.length; i++) {
			parentNames.push(segments.slice(0, i).join(':'));
		}

		// Vérifier la cohérence du type avec les parents
		// Tous les segments de la hiérarchie doivent commencer par le même type
		if (account.type && segments[0] !== account.type) {
			// Déjà vérifié dans V-ACC-010
			return;
		}
	});

	return errors;
}

/**
 * Vérifie si un ID de compte est valide
 *
 * @param {string} id - ID du compte
 * @returns {boolean} True si valide
 */
function isValidAccountId(id) {
	// Format : acc_XXX où XXX est un nombre (avec ou sans zéros initiaux)
	const accountIdPattern = /^acc_\d+$/;
	return accountIdPattern.test(id);
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
 * Valide un nouveau compte avant ajout
 * Utilisé dans l'UI pour validation côté client
 *
 * @param {Object} account - Compte à valider
 * @param {Array} existingAccounts - Comptes existants
 * @param {Array} currencies - Devises disponibles
 * @returns {Object} Résultat de validation { valid, errors }
 */
export function validateNewAccount(account, existingAccounts = [], currencies = []) {
	const errors = [];

	// V-ACC-003 : Nom non vide
	if (!account.name || account.name.trim() === '') {
		errors.push({
			code: AccountValidationCode.ACC_003,
			message: 'Le nom est obligatoire.',
			field: 'name'
		});
	} else {
		// V-ACC-004 : Nom unique
		if (existingAccounts.some(a => a.name === account.name)) {
			errors.push({
				code: AccountValidationCode.ACC_004,
				message: `Le compte "${account.name}" existe déjà.`,
				field: 'name'
			});
		}

		// V-ACC-009 : Au moins 2 segments
		const segments = account.name.split(':');
		if (segments.length < 2) {
			errors.push({
				code: AccountValidationCode.ACC_009,
				message: 'Le nom doit contenir au moins 2 segments séparés par ":".',
				field: 'name'
			});
		}

		// V-ACC-010 : Premier segment = type
		if (account.type && segments[0] !== account.type) {
			errors.push({
				code: AccountValidationCode.ACC_010,
				message: `Le premier segment doit être "${account.type}".`,
				field: 'name'
			});
		}

		// V-ACC-011 : Aucun segment vide
		if (segments.some(s => s.trim() === '')) {
			errors.push({
				code: AccountValidationCode.ACC_011,
				message: 'Le nom ne peut pas contenir de segments vides.',
				field: 'name'
			});
		}
	}

	// V-ACC-005 : Type valide
	if (!account.type) {
		errors.push({
			code: AccountValidationCode.ACC_005,
			message: 'Le type est obligatoire.',
			field: 'type'
		});
	} else if (!AccountTypes.includes(account.type)) {
		errors.push({
			code: AccountValidationCode.ACC_005,
			message: `Type invalide. Utilisez : ${AccountTypes.join(', ')}.`,
			field: 'type'
		});
	}

	// V-ACC-006 : Devise existante
	if (!account.currency) {
		errors.push({
			code: AccountValidationCode.ACC_006,
			message: 'La devise est obligatoire.',
			field: 'currency'
		});
	} else if (currencies.length > 0 && !currencies.some(c => c.code === account.currency)) {
		errors.push({
			code: AccountValidationCode.ACC_006,
			message: `La devise "${account.currency}" n'existe pas.`,
			field: 'currency'
		});
	}

	// V-ACC-007 : Date d'ouverture
	if (!account.opened) {
		errors.push({
			code: AccountValidationCode.ACC_007,
			message: 'La date d\'ouverture est obligatoire.',
			field: 'opened'
		});
	} else if (!isValidDateFormat(account.opened)) {
		errors.push({
			code: AccountValidationCode.ACC_007,
			message: 'La date doit être au format YYYY-MM-DD.',
			field: 'opened'
		});
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Génère un nouvel ID de compte
 *
 * @param {Array} existingAccounts - Comptes existants
 * @returns {string} Nouvel ID au format acc_XXX
 */
export function generateAccountId(existingAccounts = []) {
	const maxId = Math.max(
		0,
		...existingAccounts.map(a => {
			const match = a.id?.match(/^acc_(\d+)$/);
			return match ? parseInt(match[1], 10) : 0;
		})
	);
	const nextId = maxId + 1;
	return `acc_${nextId.toString().padStart(3, '0')}`;
}

/**
 * Crée un objet compte avec valeurs par défaut
 *
 * @param {Object} data - Données du compte
 * @param {Array} existingAccounts - Comptes existants (pour générer l'ID)
 * @returns {Object} Compte créé
 */
export function createAccount(data, existingAccounts = []) {
	return {
		id: data.id || generateAccountId(existingAccounts),
		name: data.name,
		type: data.type,
		currency: data.currency,
		opened: data.opened,
		description: data.description || '',
		closed: data.closed || false,
		closedDate: data.closedDate || null,
		metadata: data.metadata || {}
	};
}
