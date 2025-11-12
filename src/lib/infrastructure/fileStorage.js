/**
 * File Storage pour Cashflow Chronicles
 *
 * Implémente US-001-03 : Sauvegarder les données en fichier TOML
 * Implémente US-001-04 : Créer un backup automatique avant modification
 *
 * Utilise IndexedDB pour le stockage persistant (migration depuis localStorage)
 */

import TOML from 'smol-toml';
import {
	saveToIndexedDB,
	getFromIndexedDB,
	clearFromIndexedDB,
	saveBackupsToIndexedDB,
	getBackupsFromIndexedDB,
	deleteBackupFromIndexedDB,
	cleanupOldBackupsFromIndexedDB
} from './indexedDbStorage.js';

/**
 * Sérialise les données en format TOML
 *
 * @param {Object} data - Données à sérialiser
 * @returns {string} Contenu TOML
 */
export function serializeToTOML(data) {
	try {
		// Mettre à jour le timestamp de dernière modification
		const dataToSave = {
			...data,
			metadata: {
				...data.metadata,
				lastModified: new Date().toISOString()
			}
		};

		// Sérialiser en TOML
		const tomlContent = TOML.stringify(dataToSave);

		return tomlContent;
	} catch (error) {
		throw new Error(`Erreur de sérialisation TOML : ${error.message}`);
	}
}

/**
 * Sauvegarde les données dans un fichier TOML (simulation pour navigateur)
 *
 * Note: Dans un environnement navigateur, on utilise l'API File System Access
 * ou localStorage. Cette implémentation est adaptable.
 *
 * @param {Object} data - Données à sauvegarder
 * @param {FileSystemFileHandle} fileHandle - Handle du fichier (API File System Access)
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveToFile(data, fileHandle) {
	const startTime = performance.now();

	try {
		// Vérifier que fileHandle est valide et a la méthode createWritable
		if (!fileHandle || typeof fileHandle.createWritable !== 'function') {
			// Si le fileHandle n'est pas valide, retourner un message d'erreur
			// au lieu de télécharger automatiquement
			return {
				success: false,
				error: 'Aucun fichier sélectionné. Utilisez "Sauvegarder sous..." pour choisir un emplacement.',
				needsFileHandle: true
			};
		}

		// Sérialiser les données
		const tomlContent = serializeToTOML(data);

		// Créer un backup avant de sauvegarder
		await createBackup(fileHandle, tomlContent);

		// Écrire dans le fichier
		const writable = await fileHandle.createWritable();
		await writable.write(tomlContent);
		await writable.close();

		// Sauvegarder également dans IndexedDB pour persistance
		await saveToIndexedDB(data, fileHandle.name);

		const endTime = performance.now();
		const saveTime = Math.round(endTime - startTime);

		return {
			success: true,
			message: `✓ Enregistré à ${new Date().toLocaleTimeString()}`,
			saveTime
		};
	} catch (error) {
		return {
			success: false,
			error: formatSaveError(error)
		};
	}
}

/**
 * Formate les erreurs de sauvegarde pour l'utilisateur
 *
 * @param {Error} error - Erreur originale
 * @returns {string} Message d'erreur formaté
 */
function formatSaveError(error) {
	let message = '❌ Impossible d\'enregistrer le fichier\n\n';

	if (error.name === 'QuotaExceededError') {
		message += 'Erreur : Espace disque insuffisant\n\n';
		message += 'Suggestion : Libérez de l\'espace sur votre disque et réessayez.';
	} else if (error.name === 'NotAllowedError') {
		message += 'Erreur : Permission refusée\n\n';
		message += 'Suggestion : Vérifiez que vous avez les droits d\'écriture sur ce fichier.';
	} else {
		message += `Erreur : ${error.message}\n\n`;
		message += 'Suggestion : Réessayez ou contactez le support.';
	}

	return message;
}

/**
 * Crée un backup du fichier actuel
 *
 * @param {FileSystemFileHandle} fileHandle - Handle du fichier
 * @param {string} currentContent - Contenu actuel du fichier
 * @returns {Promise<void>}
 */
async function createBackup(fileHandle, currentContent) {
	try {
		// Générer le nom du backup avec timestamp
		const timestamp = formatTimestamp(new Date());
		const fileName = fileHandle.name;
		const backupName = fileName.replace('.toml', `.${timestamp}.backup.toml`);

		// Stocker les backups dans IndexedDB
		const backups = await getBackups();
		backups.push({
			name: backupName,
			timestamp: new Date().toISOString(),
			content: currentContent,
			size: currentContent.length
		});

		// Limiter le nombre de backups (par défaut 10)
		const maxBackups = 10;
		if (backups.length > maxBackups) {
			backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			backups.splice(maxBackups);
		}

		await saveBackups(backups);
	} catch (error) {
		// Si le backup échoue, on log mais on ne bloque pas la sauvegarde
		console.warn('⚠️ Impossible de créer le backup:', error);
	}
}

/**
 * Formate un timestamp pour le nom de fichier backup
 *
 * @param {Date} date - Date à formater
 * @returns {string} Timestamp formaté (YYYYMMDD-HHMMSS)
 */
function formatTimestamp(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Sauvegarde le fichier TOML principal dans le stockage persistant
 * (Utilise IndexedDB)
 *
 * @param {Object} data - Données à sauvegarder
 * @param {string} fileName - Nom du fichier
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveToStorage(data, fileName = 'budget.toml') {
	try {
		const result = await saveToIndexedDB(data, fileName);
		return result;
	} catch (error) {
		console.error('Erreur lors de la sauvegarde dans IndexedDB:', error);
		// Si l'erreur est due à un quota dépassé, nettoyer les anciens backups
		if (error.name === 'QuotaExceededError') {
			await cleanupOldBackups(5); // Garder seulement 5 backups
			try {
				const result = await saveToIndexedDB(data, fileName);
				return result;
			} catch (retryError) {
				console.error('Impossible de sauvegarder dans IndexedDB même après nettoyage:', retryError);
				return {
					success: false,
					error: retryError.message
				};
			}
		}
		return {
			success: false,
			error: error.message
		};
	}
}

// Alias pour compatibilité ascendante
export const saveToLocalStorage = saveToStorage;

/**
 * Récupère le fichier TOML principal depuis le stockage persistant
 * (Utilise IndexedDB)
 *
 * @returns {Promise<Object|null>} Données du fichier ou null
 */
export async function getFromStorage() {
	try {
		const result = await getFromIndexedDB();
		return result;
	} catch (error) {
		console.error('Erreur lors de la récupération depuis IndexedDB:', error);
		return null;
	}
}

// Alias pour compatibilité ascendante
export const getFromLocalStorage = getFromStorage;

/**
 * Supprime le fichier TOML principal du stockage persistant
 * (Utilise IndexedDB)
 *
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function clearFromStorage() {
	try {
		const result = await clearFromIndexedDB();
		return result;
	} catch (error) {
		console.error('Erreur lors de la suppression depuis IndexedDB:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

// Alias pour compatibilité ascendante
export const clearFromLocalStorage = clearFromStorage;

/**
 * Récupère la liste des backups depuis le stockage persistant
 * (Utilise IndexedDB)
 *
 * @returns {Promise<Array>} Liste des backups
 */
export async function getBackups() {
	try {
		const backups = await getBackupsFromIndexedDB();
		return backups;
	} catch (error) {
		console.error('Erreur lors de la récupération des backups:', error);
		return [];
	}
}

/**
 * Sauvegarde la liste des backups dans le stockage persistant
 * (Utilise IndexedDB)
 *
 * @param {Array} backups - Liste des backups
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
async function saveBackups(backups) {
	try {
		const result = await saveBackupsToIndexedDB(backups);
		return result;
	} catch (error) {
		console.error('Erreur lors de la sauvegarde des backups:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Restaure un backup depuis le stockage persistant
 * (Utilise IndexedDB)
 *
 * @param {string} backupName - Nom du backup à restaurer
 * @returns {Promise<Object>} Contenu du backup ou erreur
 */
export async function restoreBackup(backupName) {
	const backups = await getBackups();
	const backup = backups.find((b) => b.name === backupName);

	if (backup) {
		return {
			success: true,
			content: backup.content,
			message: `✓ Fichier restauré depuis le backup du ${new Date(backup.timestamp).toLocaleString()}`
		};
	}

	return {
		success: false,
		error: 'Backup non trouvé'
	};
}

/**
 * Supprime un backup du stockage persistant
 * (Utilise IndexedDB)
 *
 * @param {string} backupName - Nom du backup à supprimer
 * @returns {Promise<boolean>} True si supprimé avec succès
 */
export async function deleteBackup(backupName) {
	try {
		const result = await deleteBackupFromIndexedDB(backupName);
		return result;
	} catch (error) {
		console.error('Erreur lors de la suppression du backup:', error);
		return false;
	}
}

/**
 * Nettoie les anciens backups du stockage persistant
 * (Utilise IndexedDB)
 *
 * @param {number} maxBackups - Nombre maximum de backups à conserver
 * @returns {Promise<number>} Nombre de backups supprimés
 */
export async function cleanupOldBackups(maxBackups = 10) {
	try {
		const deletedCount = await cleanupOldBackupsFromIndexedDB(maxBackups);
		return deletedCount;
	} catch (error) {
		console.error('Erreur lors du nettoyage des backups:', error);
		return 0;
	}
}

/**
 * Télécharge les données en tant que fichier TOML
 * (Fallback pour les navigateurs sans File System Access API)
 *
 * @param {Object} data - Données à télécharger
 * @param {string} fileName - Nom du fichier (par défaut: budget.toml)
 * @returns {Object} Résultat du téléchargement
 */
export function downloadFile(data, fileName = 'budget.toml') {
	try {
		// Sérialiser les données
		const tomlContent = serializeToTOML(data);

		// Créer un blob avec le contenu TOML
		const blob = new Blob([tomlContent], { type: 'text/plain;charset=utf-8' });

		// Créer un lien de téléchargement
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;

		// Déclencher le téléchargement
		document.body.appendChild(link);
		link.click();

		// Nettoyer
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		return {
			success: true,
			message: `✓ Fichier téléchargé : ${fileName}`
		};
	} catch (error) {
		return {
			success: false,
			error: `❌ Erreur lors du téléchargement : ${error.message}`
		};
	}
}

/**
 * Sauvegarde ou télécharge le fichier selon la disponibilité de File System Access API
 *
 * @param {Object} data - Données à sauvegarder
 * @param {FileSystemFileHandle} fileHandle - Handle du fichier (optionnel)
 * @param {string} fileName - Nom du fichier pour le téléchargement (si pas de handle)
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveOrDownload(data, fileHandle = null, fileName = 'budget.toml') {
	// Si on a un handle de fichier, utiliser File System Access API
	if (fileHandle && typeof fileHandle.createWritable === 'function') {
		return await saveToFile(data, fileHandle);
	}

	// Sinon, télécharger le fichier
	return downloadFile(data, fileName);
}

/**
 * Demande à l'utilisateur où sauvegarder le fichier avec File System Access API
 *
 * @param {Object} data - Données à sauvegarder
 * @param {string} suggestedName - Nom suggéré pour le fichier
 * @returns {Promise<Object>} Résultat de la sauvegarde avec le handle
 */
export async function saveFileAs(data, suggestedName = 'budget.toml') {
	try {
		// Vérifier si File System Access API est disponible
		if (!('showSaveFilePicker' in window)) {
			// Fallback sur le téléchargement
			return downloadFile(data, suggestedName);
		}

		// Demander à l'utilisateur où sauvegarder
		const fileHandle = await window.showSaveFilePicker({
			suggestedName,
			types: [
				{
					description: 'Fichiers TOML',
					accept: {
						'text/plain': ['.toml']
					}
				}
			]
		});

		// Sauvegarder avec le nouveau handle
		const result = await saveToFile(data, fileHandle);

		// Retourner le résultat avec le handle pour utilisation future
		return {
			...result,
			fileHandle
		};
	} catch (error) {
		// L'utilisateur a annulé ou une erreur s'est produite
		if (error.name === 'AbortError') {
			return {
				success: false,
				error: 'Sauvegarde annulée',
				cancelled: true
			};
		}

		return {
			success: false,
			error: `❌ Erreur lors de la sauvegarde : ${error.message}`
		};
	}
}
