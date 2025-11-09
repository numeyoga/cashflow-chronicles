/**
 * File Storage pour Cashflow Chronicles
 *
 * Implémente US-001-03 : Sauvegarder les données en fichier TOML
 * Implémente US-001-04 : Créer un backup automatique avant modification
 */

import TOML from 'smol-toml';

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
		// Sérialiser les données
		const tomlContent = serializeToTOML(data);

		// Créer un backup avant de sauvegarder
		if (fileHandle) {
			await createBackup(fileHandle, tomlContent);
		}

		// Écrire dans le fichier
		if (fileHandle) {
			const writable = await fileHandle.createWritable();
			await writable.write(tomlContent);
			await writable.close();
		}

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

		// Dans un environnement navigateur, on pourrait stocker les backups
		// dans IndexedDB ou proposer un téléchargement
		// Pour l'instant, on simule avec localStorage
		const backups = getBackups();
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

		saveBackups(backups);
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
 * Récupère la liste des backups
 *
 * @returns {Array} Liste des backups
 */
export function getBackups() {
	try {
		const backupsJSON = localStorage.getItem('cashflow-backups');
		return backupsJSON ? JSON.parse(backupsJSON) : [];
	} catch (error) {
		console.error('Erreur lors de la récupération des backups:', error);
		return [];
	}
}

/**
 * Sauvegarde la liste des backups
 *
 * @param {Array} backups - Liste des backups
 */
function saveBackups(backups) {
	try {
		localStorage.setItem('cashflow-backups', JSON.stringify(backups));
	} catch (error) {
		console.error('Erreur lors de la sauvegarde des backups:', error);
	}
}

/**
 * Restaure un backup
 *
 * @param {string} backupName - Nom du backup à restaurer
 * @returns {Object|null} Contenu du backup ou null
 */
export function restoreBackup(backupName) {
	const backups = getBackups();
	const backup = backups.find(b => b.name === backupName);

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
 * Supprime un backup
 *
 * @param {string} backupName - Nom du backup à supprimer
 * @returns {boolean} True si supprimé avec succès
 */
export function deleteBackup(backupName) {
	try {
		const backups = getBackups();
		const filteredBackups = backups.filter(b => b.name !== backupName);
		saveBackups(filteredBackups);
		return true;
	} catch (error) {
		console.error('Erreur lors de la suppression du backup:', error);
		return false;
	}
}

/**
 * Nettoie les anciens backups
 *
 * @param {number} maxBackups - Nombre maximum de backups à conserver
 */
export function cleanupOldBackups(maxBackups = 10) {
	try {
		const backups = getBackups();

		if (backups.length > maxBackups) {
			// Trier par date (plus récent en premier)
			backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

			// Garder seulement les N plus récents
			const keptBackups = backups.slice(0, maxBackups);
			saveBackups(keptBackups);

			return backups.length - keptBackups.length; // Nombre de backups supprimés
		}

		return 0;
	} catch (error) {
		console.error('Erreur lors du nettoyage des backups:', error);
		return 0;
	}
}
