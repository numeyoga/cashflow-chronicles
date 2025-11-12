/**
 * IndexedDB Storage pour Cashflow Chronicles
 *
 * Migration de localStorage vers IndexedDB pour :
 * - Augmenter la capacité de stockage (5-10 MB → plusieurs centaines de MB)
 * - API asynchrone (pas de blocage UI)
 * - Support des transactions ACID
 * - Support des index pour requêtes rapides
 */

const DB_NAME = 'cashflow-chronicles';
const DB_VERSION = 1;

// Object stores
const STORE_CURRENT_FILE = 'currentFile';
const STORE_BACKUPS = 'backups';

/**
 * Initialise la base de données IndexedDB
 *
 * @returns {Promise<IDBDatabase>} Base de données initialisée
 */
export function initDatabase() {
	return new Promise((resolve, reject) => {
		// Vérifier si IndexedDB est disponible
		if (!('indexedDB' in window)) {
			reject(new Error('IndexedDB non disponible dans ce navigateur'));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			reject(new Error(`Erreur d'ouverture de la base de données : ${request.error}`));
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = event.target.result;

			// Créer l'object store pour le fichier actuel
			if (!db.objectStoreNames.contains(STORE_CURRENT_FILE)) {
				const currentFileStore = db.createObjectStore(STORE_CURRENT_FILE, { keyPath: 'id' });
				currentFileStore.createIndex('fileName', 'fileName', { unique: false });
				currentFileStore.createIndex('lastModified', 'lastModified', { unique: false });
			}

			// Créer l'object store pour les backups
			if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
				const backupsStore = db.createObjectStore(STORE_BACKUPS, {
					keyPath: 'id',
					autoIncrement: true
				});
				backupsStore.createIndex('name', 'name', { unique: false });
				backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
	});
}

/**
 * Obtient une connexion à la base de données
 *
 * @returns {Promise<IDBDatabase>}
 */
async function getDatabase() {
	return await initDatabase();
}

/**
 * Sauvegarde le fichier TOML actuel dans IndexedDB
 *
 * @param {Object} data - Données à sauvegarder
 * @param {string} fileName - Nom du fichier
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveToIndexedDB(data, fileName = 'budget.toml') {
	try {
		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_CURRENT_FILE], 'readwrite');
			const store = transaction.objectStore(STORE_CURRENT_FILE);

			// Sérialiser les données
			const tomlData = {
				id: 'current', // ID fixe pour le fichier actuel
				fileName,
				data,
				lastModified: new Date().toISOString(),
				size: JSON.stringify(data).length
			};

			const request = store.put(tomlData);

			request.onsuccess = () => {
				resolve({
					success: true,
					message: 'Fichier sauvegardé dans IndexedDB'
				});
			};

			request.onerror = () => {
				reject(new Error(`Erreur de sauvegarde : ${request.error}`));
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la sauvegarde dans IndexedDB:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Récupère le fichier TOML actuel depuis IndexedDB
 *
 * @returns {Promise<Object|null>} Données du fichier ou null
 */
export async function getFromIndexedDB() {
	try {
		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_CURRENT_FILE], 'readonly');
			const store = transaction.objectStore(STORE_CURRENT_FILE);
			const request = store.get('current');

			request.onsuccess = () => {
				resolve(request.result || null);
			};

			request.onerror = () => {
				reject(new Error(`Erreur de récupération : ${request.error}`));
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la récupération depuis IndexedDB:', error);
		return null;
	}
}

/**
 * Supprime le fichier TOML actuel de IndexedDB
 *
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function clearFromIndexedDB() {
	try {
		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_CURRENT_FILE], 'readwrite');
			const store = transaction.objectStore(STORE_CURRENT_FILE);
			const request = store.delete('current');

			request.onsuccess = () => {
				resolve({
					success: true,
					message: 'Fichier supprimé de IndexedDB'
				});
			};

			request.onerror = () => {
				reject(new Error(`Erreur de suppression : ${request.error}`));
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la suppression depuis IndexedDB:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Sauvegarde les backups dans IndexedDB
 *
 * @param {Array} backups - Liste des backups à sauvegarder
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveBackupsToIndexedDB(backups) {
	try {
		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_BACKUPS], 'readwrite');
			const store = transaction.objectStore(STORE_BACKUPS);

			// Supprimer tous les backups existants d'abord
			const clearRequest = store.clear();

			clearRequest.onsuccess = () => {
				// Ajouter les nouveaux backups
				let successCount = 0;
				let errorCount = 0;

				if (backups.length === 0) {
					resolve({
						success: true,
						message: 'Backups vidés',
						count: 0
					});
					return;
				}

				backups.forEach((backup) => {
					const addRequest = store.add(backup);

					addRequest.onsuccess = () => {
						successCount++;
						if (successCount + errorCount === backups.length) {
							resolve({
								success: true,
								message: `${successCount} backups sauvegardés`,
								count: successCount
							});
						}
					};

					addRequest.onerror = () => {
						errorCount++;
						console.error('Erreur lors de l\'ajout d\'un backup:', addRequest.error);
						if (successCount + errorCount === backups.length) {
							resolve({
								success: true,
								message: `${successCount} backups sauvegardés (${errorCount} erreurs)`,
								count: successCount
							});
						}
					};
				});
			};

			clearRequest.onerror = () => {
				reject(new Error(`Erreur lors de la suppression des backups existants : ${clearRequest.error}`));
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la sauvegarde des backups dans IndexedDB:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Récupère tous les backups depuis IndexedDB
 *
 * @returns {Promise<Array>} Liste des backups
 */
export async function getBackupsFromIndexedDB() {
	try {
		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_BACKUPS], 'readonly');
			const store = transaction.objectStore(STORE_BACKUPS);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result || []);
			};

			request.onerror = () => {
				reject(new Error(`Erreur de récupération des backups : ${request.error}`));
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des backups depuis IndexedDB:', error);
		return [];
	}
}

/**
 * Supprime un backup spécifique de IndexedDB
 *
 * @param {string} backupName - Nom du backup à supprimer
 * @returns {Promise<boolean>} True si supprimé avec succès
 */
export async function deleteBackupFromIndexedDB(backupName) {
	try {
		const backups = await getBackupsFromIndexedDB();
		const backup = backups.find((b) => b.name === backupName);

		if (!backup) {
			return false;
		}

		const db = await getDatabase();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_BACKUPS], 'readwrite');
			const store = transaction.objectStore(STORE_BACKUPS);
			const request = store.delete(backup.id);

			request.onsuccess = () => {
				resolve(true);
			};

			request.onerror = () => {
				console.error('Erreur lors de la suppression du backup:', request.error);
				reject(false);
			};

			transaction.oncomplete = () => {
				db.close();
			};
		});
	} catch (error) {
		console.error('Erreur lors de la suppression du backup depuis IndexedDB:', error);
		return false;
	}
}

/**
 * Nettoie les anciens backups et garde seulement les N plus récents
 *
 * @param {number} maxBackups - Nombre maximum de backups à conserver
 * @returns {Promise<number>} Nombre de backups supprimés
 */
export async function cleanupOldBackupsFromIndexedDB(maxBackups = 10) {
	try {
		const backups = await getBackupsFromIndexedDB();

		if (backups.length <= maxBackups) {
			return 0;
		}

		// Trier par date (plus récent en premier)
		backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

		// Garder seulement les N plus récents
		const keptBackups = backups.slice(0, maxBackups);

		// Sauvegarder les backups filtrés
		await saveBackupsToIndexedDB(keptBackups);

		return backups.length - keptBackups.length;
	} catch (error) {
		console.error('Erreur lors du nettoyage des backups depuis IndexedDB:', error);
		return 0;
	}
}

/**
 * Obtient des statistiques sur l'utilisation d'IndexedDB
 *
 * @returns {Promise<Object>} Statistiques d'utilisation
 */
export async function getDatabaseStats() {
	try {
		const currentFile = await getFromIndexedDB();
		const backups = await getBackupsFromIndexedDB();

		const currentFileSize = currentFile ? currentFile.size : 0;
		const backupsSize = backups.reduce((total, backup) => total + (backup.size || 0), 0);

		return {
			currentFile: {
				exists: !!currentFile,
				fileName: currentFile?.fileName || null,
				size: currentFileSize,
				lastModified: currentFile?.lastModified || null
			},
			backups: {
				count: backups.length,
				totalSize: backupsSize,
				oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
				newestBackup: backups.length > 0 ? backups[0].timestamp : null
			},
			totalSize: currentFileSize + backupsSize
		};
	} catch (error) {
		console.error('Erreur lors de la récupération des statistiques:', error);
		return {
			currentFile: { exists: false },
			backups: { count: 0, totalSize: 0 },
			totalSize: 0
		};
	}
}

/**
 * Vérifie si IndexedDB est disponible dans le navigateur
 *
 * @returns {boolean} True si disponible
 */
export function isIndexedDBAvailable() {
	return 'indexedDB' in window;
}
