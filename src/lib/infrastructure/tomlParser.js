/**
 * TOML Parser pour Cashflow Chronicles
 *
 * Implémente US-001-01 : Charger un fichier TOML valide
 * Implémente US-001-02 : Gérer les erreurs de parsing TOML
 */

import TOML from 'smol-toml';

/**
 * Parse un fichier TOML et retourne les données structurées
 *
 * @param {string} tomlContent - Contenu du fichier TOML
 * @returns {Object} Données parsées
 * @throws {Error} Si le parsing échoue
 */
export function parseTOML(tomlContent) {
	try {
		// Vérifier que le contenu n'est pas vide
		if (!tomlContent || tomlContent.trim() === '') {
			throw new Error('Le fichier TOML est vide');
		}

		// Parser le contenu TOML
		const data = TOML.parse(tomlContent);

		return data;
	} catch (error) {
		// Créer un message d'erreur plus détaillé pour l'utilisateur
		throw createParsingError(error);
	}
}

/**
 * Crée un message d'erreur détaillé pour les erreurs de parsing
 *
 * @param {Error} error - Erreur originale
 * @returns {Error} Erreur enrichie avec contexte
 */
function createParsingError(error) {
	const errorMessage = error.message || 'Erreur inconnue';

	// Extraire les informations de ligne/colonne si disponibles
	const lineMatch = errorMessage.match(/line (\d+)/i);
	const colMatch = errorMessage.match(/column (\d+)/i);

	let userMessage = '❌ Erreur de parsing TOML\n\n';

	if (lineMatch && colMatch) {
		userMessage += `Ligne ${lineMatch[1]}, colonne ${colMatch[1]} :\n`;
	}

	userMessage += `Erreur : ${errorMessage}\n\n`;
	userMessage += 'Suggestion : Vérifiez la syntaxe TOML autour de cette ligne.\n';
	userMessage += 'Référence : https://toml.io/en/v1.0.0';

	const enrichedError = new Error(userMessage);
	enrichedError.originalError = error;
	enrichedError.line = lineMatch ? parseInt(lineMatch[1]) : null;
	enrichedError.column = colMatch ? parseInt(colMatch[1]) : null;

	return enrichedError;
}

/**
 * Convertit les dates TOML en objets Date JavaScript
 *
 * @param {Object} data - Données parsées
 * @returns {Object} Données avec dates converties
 */
export function convertDates(data) {
	if (!data) return data;

	// Parcourir récursivement l'objet pour convertir les dates
	for (const key in data) {
		const value = data[key];

		if (value instanceof Date) {
			// Déjà une date, ne rien faire
			continue;
		} else if (typeof value === 'string' && isISODate(value)) {
			// Convertir la chaîne ISO en Date
			data[key] = new Date(value);
		} else if (typeof value === 'object' && value !== null) {
			// Récursion pour les objets imbriqués
			data[key] = convertDates(value);
		} else if (Array.isArray(value)) {
			// Récursion pour les tableaux
			data[key] = value.map(item =>
				typeof item === 'object' ? convertDates(item) : item
			);
		}
	}

	return data;
}

/**
 * Vérifie si une chaîne est une date ISO 8601
 *
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean} True si c'est une date ISO
 */
function isISODate(str) {
	// Format ISO 8601 : YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SSZ
	const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
	return isoDatePattern.test(str);
}

/**
 * Charge et parse un fichier TOML
 *
 * @param {string} tomlContent - Contenu du fichier TOML
 * @returns {Object} Structure de données avec métadonnées de chargement
 */
export function loadTOMLFile(tomlContent) {
	const startTime = performance.now();

	try {
		// Parser le contenu
		const data = parseTOML(tomlContent);

		// Convertir les dates
		const dataWithDates = convertDates(data);

		const endTime = performance.now();
		const loadTime = Math.round(endTime - startTime);

		// Compter les entités
		const stats = {
			currencies: Array.isArray(dataWithDates.currency) ? dataWithDates.currency.length : 0,
			accounts: Array.isArray(dataWithDates.account) ? dataWithDates.account.length : 0,
			transactions: Array.isArray(dataWithDates.transaction) ? dataWithDates.transaction.length : 0,
			budgets: Array.isArray(dataWithDates.budget) ? dataWithDates.budget.length : 0,
			recurring: Array.isArray(dataWithDates.recurring) ? dataWithDates.recurring.length : 0
		};

		return {
			success: true,
			data: dataWithDates,
			stats,
			loadTime,
			message: formatSuccessMessage(stats, loadTime)
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
			originalError: error
		};
	}
}

/**
 * Formate le message de succès avec les statistiques
 *
 * @param {Object} stats - Statistiques de chargement
 * @param {number} loadTime - Temps de chargement en ms
 * @returns {string} Message formaté
 */
function formatSuccessMessage(stats, loadTime) {
	let message = '✓ Fichier chargé avec succès\n';
	message += `  - ${stats.currencies} devise(s)\n`;
	message += `  - ${stats.accounts} compte(s)\n`;
	message += `  - ${stats.transactions} transaction(s)\n`;
	message += `  - ${stats.budgets} budget(s)\n`;
	message += `  - ${stats.recurring} récurrence(s)\n`;
	message += `\nTemps de chargement : ${loadTime}ms`;

	return message;
}
