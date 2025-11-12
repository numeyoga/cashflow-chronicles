/**
 * Migration Helper pour Cashflow Chronicles
 *
 * Gère la migration automatique des données de localStorage vers IndexedDB
 */

import {
	initDatabase,
	saveToIndexedDB,
	getFromIndexedDB,
	saveBackupsToIndexedDB,
	getBackupsFromIndexedDB,
	isIndexedDBAvailable
} from './indexedDbStorage.js';

// Clés localStorage
const MIGRATION_FLAG_KEY = 'cashflow-migrated-to-indexeddb';
const CURRENT_FILE_KEY = 'cashflow-current-file';
const BACKUPS_KEY = 'cashflow-backups';

/**
 * Vérifie si la migration a déjà été effectuée
 *
 * @returns {boolean} True si déjà migré
 */
export function isMigrationCompleted() {
	try {
		return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
	} catch (error) {
		console.error('Erreur lors de la vérification du statut de migration:', error);
		return false;
	}
}

/**
 * Marque la migration comme complétée
 */
function markMigrationCompleted() {
	try {
		localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
	} catch (error) {
		console.error('Erreur lors du marquage de la migration:', error);
	}
}

/**
 * Vérifie si des données existent dans localStorage
 *
 * @returns {boolean} True si des données existent
 */
export function hasLocalStorageData() {
	try {
		const currentFile = localStorage.getItem(CURRENT_FILE_KEY);
		const backups = localStorage.getItem(BACKUPS_KEY);
		return !!(currentFile || backups);
	} catch (error) {
		console.error('Erreur lors de la vérification des données localStorage:', error);
		return false;
	}
}

/**
 * Migre les données de localStorage vers IndexedDB
 *
 * @returns {Promise<Object>} Résultat de la migration
 */
export async function migrateFromLocalStorageToIndexedDB() {
	// Vérifier si IndexedDB est disponible
	if (!isIndexedDBAvailable()) {
		return {
			success: false,
			error: 'IndexedDB non disponible',
			reason: 'indexeddb-unavailable'
		};
	}

	// Vérifier si la migration a déjà été effectuée
	if (isMigrationCompleted()) {
		return {
			success: true,
			alreadyMigrated: true,
			message: 'Migration déjà effectuée'
		};
	}

	// Vérifier si des données existent dans localStorage
	if (!hasLocalStorageData()) {
		// Pas de données à migrer, marquer comme migré quand même
		markMigrationCompleted();
		return {
			success: true,
			noData: true,
			message: 'Aucune donnée à migrer'
		};
	}

	try {
		// Initialiser la base de données
		await initDatabase();

		const migrationResult = {
			success: true,
			migratedFile: false,
			migratedBackups: false,
			backupsCount: 0,
			errors: []
		};

		// 1. Migrer le fichier actuel
		try {
			const currentFileJSON = localStorage.getItem(CURRENT_FILE_KEY);
			if (currentFileJSON) {
				const currentFile = JSON.parse(currentFileJSON);

				// Vérifier l'intégrité des données
				if (currentFile.content && currentFile.fileName) {
					await saveToIndexedDB(currentFile.data || {}, currentFile.fileName);
					migrationResult.migratedFile = true;
				}
			}
		} catch (error) {
			console.error('Erreur lors de la migration du fichier actuel:', error);
			migrationResult.errors.push({
				type: 'current-file',
				message: error.message
			});
		}

		// 2. Migrer les backups
		try {
			const backupsJSON = localStorage.getItem(BACKUPS_KEY);
			if (backupsJSON) {
				const backups = JSON.parse(backupsJSON);

				// Vérifier que c'est bien un tableau
				if (Array.isArray(backups) && backups.length > 0) {
					await saveBackupsToIndexedDB(backups);
					migrationResult.migratedBackups = true;
					migrationResult.backupsCount = backups.length;
				}
			}
		} catch (error) {
			console.error('Erreur lors de la migration des backups:', error);
			migrationResult.errors.push({
				type: 'backups',
				message: error.message
			});
		}

		// 3. Vérifier l'intégrité des données migrées
		const verificationResult = await verifyMigration();

		if (!verificationResult.valid) {
			return {
				success: false,
				error: 'Échec de la vérification de la migration',
				details: verificationResult
			};
		}

		// 4. Marquer la migration comme complétée
		markMigrationCompleted();

		// 5. Ne pas supprimer les données de localStorage immédiatement
		// On les garde comme backup temporaire pendant quelques jours
		// L'utilisateur pourra les supprimer manuellement plus tard

		return {
			...migrationResult,
			message: 'Migration réussie',
			verification: verificationResult
		};
	} catch (error) {
		console.error('Erreur lors de la migration:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Vérifie l'intégrité des données après migration
 *
 * @returns {Promise<Object>} Résultat de la vérification
 */
async function verifyMigration() {
	try {
		// Lire depuis localStorage
		const localStorageCurrentFile = localStorage.getItem(CURRENT_FILE_KEY);
		const localStorageBackups = localStorage.getItem(BACKUPS_KEY);

		// Lire depuis IndexedDB
		const indexedDBCurrentFile = await getFromIndexedDB();
		const indexedDBBackups = await getBackupsFromIndexedDB();

		const verification = {
			valid: true,
			checks: []
		};

		// Vérifier le fichier actuel
		if (localStorageCurrentFile) {
			const localFile = JSON.parse(localStorageCurrentFile);
			const fileMatch = !!indexedDBCurrentFile;

			verification.checks.push({
				type: 'current-file',
				passed: fileMatch,
				message: fileMatch
					? 'Fichier actuel migré avec succès'
					: 'Fichier actuel non trouvé dans IndexedDB'
			});

			if (!fileMatch) {
				verification.valid = false;
			}
		}

		// Vérifier les backups
		if (localStorageBackups) {
			const localBackups = JSON.parse(localStorageBackups);
			const backupsMatch = indexedDBBackups.length === localBackups.length;

			verification.checks.push({
				type: 'backups',
				passed: backupsMatch,
				message: backupsMatch
					? `${localBackups.length} backups migrés avec succès`
					: `Nombre de backups différent (localStorage: ${localBackups.length}, IndexedDB: ${indexedDBBackups.length})`
			});

			if (!backupsMatch) {
				verification.valid = false;
			}
		}

		return verification;
	} catch (error) {
		console.error('Erreur lors de la vérification de la migration:', error);
		return {
			valid: false,
			error: error.message
		};
	}
}

/**
 * Nettoie les données de localStorage après migration réussie
 * (À utiliser manuellement ou après un délai)
 *
 * @returns {Object} Résultat du nettoyage
 */
export function cleanupLocalStorage() {
	try {
		// Ne supprimer que si la migration est complétée
		if (!isMigrationCompleted()) {
			return {
				success: false,
				error: 'Migration non complétée, nettoyage impossible'
			};
		}

		// Supprimer les données
		localStorage.removeItem(CURRENT_FILE_KEY);
		localStorage.removeItem(BACKUPS_KEY);

		return {
			success: true,
			message: 'Données localStorage nettoyées'
		};
	} catch (error) {
		console.error('Erreur lors du nettoyage de localStorage:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Réinitialise le flag de migration (pour tests ou rollback)
 */
export function resetMigrationFlag() {
	try {
		localStorage.removeItem(MIGRATION_FLAG_KEY);
		return {
			success: true,
			message: 'Flag de migration réinitialisé'
		};
	} catch (error) {
		console.error('Erreur lors de la réinitialisation du flag:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Obtient le statut de la migration
 *
 * @returns {Promise<Object>} Statut détaillé
 */
export async function getMigrationStatus() {
	const status = {
		migrationCompleted: isMigrationCompleted(),
		hasLocalStorageData: hasLocalStorageData(),
		indexedDBAvailable: isIndexedDBAvailable(),
		indexedDBHasData: false,
		localStorageSize: 0,
		indexedDBSize: 0
	};

	// Calculer la taille des données localStorage
	try {
		const currentFile = localStorage.getItem(CURRENT_FILE_KEY);
		const backups = localStorage.getItem(BACKUPS_KEY);
		status.localStorageSize =
			(currentFile ? currentFile.length : 0) + (backups ? backups.length : 0);
	} catch (error) {
		console.error('Erreur lors du calcul de la taille localStorage:', error);
	}

	// Vérifier si IndexedDB a des données
	if (status.indexedDBAvailable) {
		try {
			const currentFile = await getFromIndexedDB();
			const backups = await getBackupsFromIndexedDB();

			status.indexedDBHasData = !!(currentFile || backups.length > 0);

			if (currentFile) {
				status.indexedDBSize += currentFile.size || 0;
			}

			backups.forEach((backup) => {
				status.indexedDBSize += backup.size || 0;
			});
		} catch (error) {
			console.error('Erreur lors de la vérification des données IndexedDB:', error);
		}
	}

	return status;
}
