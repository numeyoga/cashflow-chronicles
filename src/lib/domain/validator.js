/**
 * Validator pour Cashflow Chronicles
 *
 * Implémente US-001-05 : Valider la structure du fichier TOML au chargement
 *
 * Note: Cette implémentation couvre la validation structurelle de base.
 * Les règles de validation métier complètes (102 règles) seront implémentées
 * dans EPIC-006.
 */

/**
 * Codes d'erreur de validation
 */
export const ValidationCode = {
	FILE_001: 'V-FILE-001',
	FILE_002: 'V-FILE-002',
	FILE_003: 'V-FILE-003',
	FILE_004: 'V-FILE-004',
	FILE_005: 'V-FILE-005',
	META_001: 'V-META-001',
	META_002: 'V-META-002',
	CUR_001: 'V-CUR-001',
	ACC_003: 'V-ACC-003'
};

/**
 * Sévérité des erreurs de validation
 */
export const ValidationSeverity = {
	ERROR: 'error',
	WARNING: 'warning',
	INFO: 'info'
};

/**
 * Valide la structure d'un fichier TOML chargé
 *
 * @param {Object} data - Données parsées du fichier TOML
 * @returns {Object} Rapport de validation
 */
export function validateTOMLStructure(data) {
	const errors = [];
	const warnings = [];
	const infos = [];

	// V-FILE-003 : Vérifier la présence de la version
	if (!data.version) {
		errors.push({
			code: ValidationCode.FILE_003,
			severity: ValidationSeverity.ERROR,
			message: 'La propriété \'version\' est obligatoire.',
			suggestion: 'Ajoutez "version = \\"1.0.0\\"" au début du fichier.'
		});
	} else {
		// V-FILE-004 : Vérifier le format semver de la version
		if (!isValidSemver(data.version)) {
			errors.push({
				code: ValidationCode.FILE_004,
				severity: ValidationSeverity.ERROR,
				message: `La version doit suivre le format semver (X.Y.Z). Trouvé : "${data.version}"`,
				suggestion: 'Modifiez la version au format X.Y.Z (ex: 1.0.0, 2.1.3).'
			});
		}
	}

	// V-FILE-005 : Vérifier les sections obligatoires
	const requiredSections = ['metadata', 'currency'];
	const missingSections = requiredSections.filter(section => !data[section]);

	if (missingSections.length > 0) {
		errors.push({
			code: ValidationCode.FILE_005,
			severity: ValidationSeverity.ERROR,
			message: `Sections obligatoires manquantes : ${missingSections.join(', ')}`,
			suggestion: 'Ajoutez les sections manquantes selon la documentation.'
		});
	}

	// Valider la section metadata
	if (data.metadata) {
		const metadataErrors = validateMetadata(data.metadata);
		errors.push(...metadataErrors);
	}

	// Valider les devises
	if (data.currency) {
		const currencyErrors = validateCurrencies(data.currency, data.metadata);
		errors.push(...currencyErrors);
	}

	// Valider les comptes
	if (data.account) {
		const accountErrors = validateAccounts(data.account);
		errors.push(...accountErrors);
	}

	// Compter les entités
	const stats = {
		currencies: Array.isArray(data.currency) ? data.currency.length : 0,
		accounts: Array.isArray(data.account) ? data.account.length : 0,
		transactions: Array.isArray(data.transaction) ? data.transaction.length : 0,
		budgets: Array.isArray(data.budget) ? data.budget.length : 0,
		recurring: Array.isArray(data.recurring) ? data.recurring.length : 0
	};

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		infos,
		stats,
		report: generateValidationReport(data, errors, warnings, infos, stats)
	};
}

/**
 * Valide la section metadata
 *
 * @param {Object} metadata - Section metadata
 * @returns {Array} Liste des erreurs
 */
function validateMetadata(metadata) {
	const errors = [];

	// V-META-001 : Valider la date de création
	if (!metadata.created) {
		errors.push({
			code: ValidationCode.META_001,
			severity: ValidationSeverity.ERROR,
			message: 'La propriété \'metadata.created\' est obligatoire.',
			suggestion: 'Ajoutez une date de création au format ISO 8601.'
		});
	} else if (!isValidISODate(metadata.created)) {
		errors.push({
			code: ValidationCode.META_001,
			severity: ValidationSeverity.ERROR,
			message: `Format de date invalide pour 'created' : "${metadata.created}". Les dates doivent suivre le format ISO 8601.`,
			suggestion: 'Utilisez le format ISO 8601 (ex: 2025-01-01T00:00:00Z).'
		});
	}

	// V-META-002 : Valider la date de dernière modification
	if (!metadata.lastModified) {
		errors.push({
			code: ValidationCode.META_002,
			severity: ValidationSeverity.ERROR,
			message: 'La propriété \'metadata.lastModified\' est obligatoire.',
			suggestion: 'Ajoutez une date de dernière modification au format ISO 8601.'
		});
	} else if (!isValidISODate(metadata.lastModified)) {
		errors.push({
			code: ValidationCode.META_002,
			severity: ValidationSeverity.ERROR,
			message: `Format de date invalide pour 'lastModified' : "${metadata.lastModified}"`,
			suggestion: 'Utilisez le format ISO 8601 (ex: 2025-01-01T14:30:00Z).'
		});
	}

	return errors;
}

/**
 * Valide les devises
 *
 * @param {Array} currencies - Liste des devises
 * @param {Object} metadata - Métadonnées du fichier
 * @returns {Array} Liste des erreurs
 */
function validateCurrencies(currencies, metadata = null) {
	// Utiliser le module de validation complet des devises
	// Import dynamique pour éviter les dépendances circulaires
	// La validation complète sera effectuée par currencyValidator.js
	const errors = [];

	if (!Array.isArray(currencies)) {
		errors.push({
			code: ValidationCode.CUR_001,
			severity: ValidationSeverity.ERROR,
			message: 'La section currency doit être un tableau.',
			suggestion: 'Utilisez [[currency]] pour définir les devises.'
		});
		return errors;
	}

	currencies.forEach((currency, index) => {
		// V-CUR-001 : Valider le code devise ISO 4217
		if (!currency.code) {
			errors.push({
				code: ValidationCode.CUR_001,
				severity: ValidationSeverity.ERROR,
				message: `Devise #${index + 1} : Le code est obligatoire.`,
				suggestion: 'Ajoutez un code ISO 4217 (ex: CHF, EUR, USD).'
			});
		} else if (!isValidCurrencyCode(currency.code)) {
			errors.push({
				code: ValidationCode.CUR_001,
				severity: ValidationSeverity.ERROR,
				message: `Code devise invalide : "${currency.code}"`,
				suggestion: 'Les codes de devises doivent suivre la norme ISO 4217 (3 lettres majuscules).'
			});
		}
	});

	return errors;
}

/**
 * Valide les comptes
 *
 * @param {Array} accounts - Liste des comptes
 * @returns {Array} Liste des erreurs
 */
function validateAccounts(accounts) {
	const errors = [];

	if (!Array.isArray(accounts)) {
		return errors;
	}

	accounts.forEach((account, index) => {
		// V-ACC-003 : Valider que le nom n'est pas vide
		if (!account.name || account.name.trim() === '') {
			errors.push({
				code: ValidationCode.ACC_003,
				severity: ValidationSeverity.ERROR,
				message: `Compte #${index + 1} : Le nom est obligatoire.`,
				suggestion: 'Ajoutez un nom de compte non vide.'
			});
		}
	});

	return errors;
}

/**
 * Vérifie si une version suit le format semver (X.Y.Z)
 *
 * @param {string} version - Version à vérifier
 * @returns {boolean} True si valide
 */
function isValidSemver(version) {
	const semverPattern = /^\d+\.\d+\.\d+$/;
	return semverPattern.test(version);
}

/**
 * Vérifie si une chaîne est une date ISO 8601 valide
 *
 * @param {string|Date} dateStr - Date à vérifier
 * @returns {boolean} True si valide
 */
function isValidISODate(dateStr) {
	if (dateStr instanceof Date) {
		return !isNaN(dateStr.getTime());
	}

	if (typeof dateStr !== 'string') {
		return false;
	}

	// Format ISO 8601
	const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
	if (!isoPattern.test(dateStr)) {
		return false;
	}

	// Vérifier que la date est valide
	const date = new Date(dateStr);
	return !isNaN(date.getTime());
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
 * Génère un rapport de validation formaté
 *
 * @param {Object} data - Données validées
 * @param {Array} errors - Erreurs
 * @param {Array} warnings - Avertissements
 * @param {Array} infos - Informations
 * @param {Object} stats - Statistiques
 * @returns {string} Rapport formaté
 */
function generateValidationReport(data, errors, warnings, infos, stats) {
	let report = '📋 Rapport de validation\n\n';

	report += `Version : ${data.version || 'N/A'}\n`;
	report += `Taille : ${JSON.stringify(data).length} octets\n\n`;

	if (errors.length === 0) {
		report += '✓ Structure TOML valide\n';
		report += '✓ Version correcte\n';
		report += '✓ Toutes les sections présentes\n';
		report += `✓ ${stats.currencies} devise(s)\n`;
		report += `✓ ${stats.accounts} compte(s)\n`;
		report += `✓ ${stats.transactions} transaction(s)\n`;
		report += `✓ ${stats.budgets} budget(s)\n`;
		report += `✓ ${stats.recurring} récurrence(s)\n`;
	} else {
		report += `❌ Erreurs critiques (${errors.length})\n`;
		errors.forEach(err => {
			report += `  [${err.code}] ${err.message}\n`;
		});
	}

	if (warnings.length > 0) {
		report += `\n⚠️  Avertissements (${warnings.length})\n`;
		warnings.forEach(warn => {
			report += `  [${warn.code}] ${warn.message}\n`;
		});
	}

	if (infos.length > 0) {
		report += `\nℹ️  Informations (${infos.length})\n`;
		infos.forEach(info => {
			report += `  [${info.code}] ${info.message}\n`;
		});
	}

	if (errors.length > 0) {
		report += `\n❌ Le fichier ne peut pas être chargé en raison de ${errors.length} erreur(s) critique(s).`;
	} else {
		report += '\n✓ Le fichier est valide et prêt à être chargé.';
	}

	return report;
}
