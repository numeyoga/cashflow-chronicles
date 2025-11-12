/**
 * Tests pour indexedDbStorage - Stockage IndexedDB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
	initDatabase,
	saveToIndexedDB,
	getFromIndexedDB,
	clearFromIndexedDB,
	saveBackupsToIndexedDB,
	getBackupsFromIndexedDB,
	deleteBackupFromIndexedDB,
	cleanupOldBackupsFromIndexedDB,
	getDatabaseStats,
	isIndexedDBAvailable
} from '../indexedDbStorage.js';

describe('indexedDbStorage - Initialisation', () => {
	afterEach(async () => {
		// Nettoyer la base de données après chaque test
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
	});

	it('devrait initialiser la base de données', async () => {
		const db = await initDatabase();
		expect(db).toBeDefined();
		expect(db.name).toBe('cashflow-chronicles');
		expect(db.version).toBe(1);
		expect(db.objectStoreNames.contains('currentFile')).toBe(true);
		expect(db.objectStoreNames.contains('backups')).toBe(true);
		db.close();
	});

	it('devrait vérifier la disponibilité d\'IndexedDB', () => {
		expect(isIndexedDBAvailable()).toBe(true);
	});
});

describe('indexedDbStorage - Fichier actuel', () => {
	beforeEach(async () => {
		await initDatabase();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
	});

	it('devrait sauvegarder un fichier dans IndexedDB', async () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				defaultCurrency: 'CHF'
			}
		};

		const result = await saveToIndexedDB(data, 'test.toml');

		expect(result.success).toBe(true);
		expect(result.message).toContain('IndexedDB');
	});

	it('devrait récupérer un fichier depuis IndexedDB', async () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				defaultCurrency: 'CHF'
			}
		};

		await saveToIndexedDB(data, 'test.toml');
		const retrieved = await getFromIndexedDB();

		expect(retrieved).toBeDefined();
		expect(retrieved.fileName).toBe('test.toml');
		expect(retrieved.data.version).toBe('1.0.0');
		expect(retrieved.data.metadata.defaultCurrency).toBe('CHF');
	});

	it('devrait retourner null si aucun fichier n\'existe', async () => {
		const retrieved = await getFromIndexedDB();
		expect(retrieved).toBeNull();
	});

	it('devrait mettre à jour un fichier existant', async () => {
		const data1 = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const data2 = {
			version: '2.0.0',
			metadata: { created: '2025-01-02T00:00:00Z' }
		};

		await saveToIndexedDB(data1, 'test.toml');
		await saveToIndexedDB(data2, 'test-updated.toml');

		const retrieved = await getFromIndexedDB();

		expect(retrieved.fileName).toBe('test-updated.toml');
		expect(retrieved.data.version).toBe('2.0.0');
	});

	it('devrait supprimer un fichier de IndexedDB', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		await saveToIndexedDB(data, 'test.toml');
		const result = await clearFromIndexedDB();

		expect(result.success).toBe(true);

		const retrieved = await getFromIndexedDB();
		expect(retrieved).toBeNull();
	});

	it('devrait inclure la taille du fichier', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		await saveToIndexedDB(data, 'test.toml');
		const retrieved = await getFromIndexedDB();

		expect(retrieved.size).toBeGreaterThan(0);
	});

	it('devrait inclure lastModified', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		await saveToIndexedDB(data, 'test.toml');
		const retrieved = await getFromIndexedDB();

		expect(retrieved.lastModified).toBeDefined();
		expect(new Date(retrieved.lastModified)).toBeInstanceOf(Date);
	});
});

describe('indexedDbStorage - Backups', () => {
	beforeEach(async () => {
		await initDatabase();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
	});

	it('devrait sauvegarder des backups dans IndexedDB', async () => {
		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			},
			{
				name: 'backup2.toml',
				timestamp: '2025-01-01T11:00:00Z',
				content: 'version = "1.1.0"',
				size: 150
			}
		];

		const result = await saveBackupsToIndexedDB(backups);

		expect(result.success).toBe(true);
		expect(result.count).toBe(2);
	});

	it('devrait récupérer les backups depuis IndexedDB', async () => {
		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			},
			{
				name: 'backup2.toml',
				timestamp: '2025-01-01T11:00:00Z',
				content: 'version = "1.1.0"',
				size: 150
			}
		];

		await saveBackupsToIndexedDB(backups);
		const retrieved = await getBackupsFromIndexedDB();

		expect(retrieved).toHaveLength(2);
		expect(retrieved[0].name).toBe('backup1.toml');
		expect(retrieved[1].name).toBe('backup2.toml');
	});

	it('devrait retourner un tableau vide si aucun backup', async () => {
		const retrieved = await getBackupsFromIndexedDB();
		expect(retrieved).toEqual([]);
	});

	it('devrait remplacer les backups existants', async () => {
		const backups1 = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			}
		];

		const backups2 = [
			{
				name: 'backup2.toml',
				timestamp: '2025-01-01T11:00:00Z',
				content: 'version = "2.0.0"',
				size: 200
			},
			{
				name: 'backup3.toml',
				timestamp: '2025-01-01T12:00:00Z',
				content: 'version = "3.0.0"',
				size: 300
			}
		];

		await saveBackupsToIndexedDB(backups1);
		await saveBackupsToIndexedDB(backups2);

		const retrieved = await getBackupsFromIndexedDB();

		expect(retrieved).toHaveLength(2);
		expect(retrieved[0].name).toBe('backup2.toml');
		expect(retrieved[1].name).toBe('backup3.toml');
	});

	it('devrait supprimer un backup spécifique', async () => {
		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			},
			{
				name: 'backup2.toml',
				timestamp: '2025-01-01T11:00:00Z',
				content: 'version = "1.1.0"',
				size: 150
			}
		];

		await saveBackupsToIndexedDB(backups);
		const deleted = await deleteBackupFromIndexedDB('backup1.toml');

		expect(deleted).toBe(true);

		const retrieved = await getBackupsFromIndexedDB();
		expect(retrieved).toHaveLength(1);
		expect(retrieved[0].name).toBe('backup2.toml');
	});

	it('devrait retourner false si le backup n\'existe pas', async () => {
		const deleted = await deleteBackupFromIndexedDB('nonexistent.toml');
		expect(deleted).toBe(false);
	});

	it('devrait nettoyer les anciens backups', async () => {
		const backups = [];
		for (let i = 0; i < 15; i++) {
			backups.push({
				name: `backup${i}.toml`,
				timestamp: new Date(2025, 0, i + 1).toISOString(),
				content: `version = "${i}.0.0"`,
				size: 100
			});
		}

		await saveBackupsToIndexedDB(backups);
		const deletedCount = await cleanupOldBackupsFromIndexedDB(10);

		expect(deletedCount).toBe(5);

		const retrieved = await getBackupsFromIndexedDB();
		expect(retrieved).toHaveLength(10);

		// Vérifier que ce sont les plus récents qui sont gardés
		const timestamps = retrieved.map((b) => new Date(b.timestamp).getTime());
		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
		}
	});

	it('ne devrait rien supprimer si moins de backups que le max', async () => {
		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			}
		];

		await saveBackupsToIndexedDB(backups);
		const deletedCount = await cleanupOldBackupsFromIndexedDB(10);

		expect(deletedCount).toBe(0);

		const retrieved = await getBackupsFromIndexedDB();
		expect(retrieved).toHaveLength(1);
	});

	it('devrait gérer un tableau de backups vide', async () => {
		const result = await saveBackupsToIndexedDB([]);

		expect(result.success).toBe(true);
		expect(result.count).toBe(0);

		const retrieved = await getBackupsFromIndexedDB();
		expect(retrieved).toEqual([]);
	});
});

describe('indexedDbStorage - Statistiques', () => {
	beforeEach(async () => {
		await initDatabase();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
	});

	it('devrait retourner des statistiques vides initialement', async () => {
		const stats = await getDatabaseStats();

		expect(stats.currentFile.exists).toBe(false);
		expect(stats.backups.count).toBe(0);
		expect(stats.totalSize).toBe(0);
	});

	it('devrait retourner des statistiques avec fichier et backups', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		await saveToIndexedDB(data, 'test.toml');

		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			},
			{
				name: 'backup2.toml',
				timestamp: '2025-01-01T11:00:00Z',
				content: 'version = "1.1.0"',
				size: 150
			}
		];

		await saveBackupsToIndexedDB(backups);

		const stats = await getDatabaseStats();

		expect(stats.currentFile.exists).toBe(true);
		expect(stats.currentFile.fileName).toBe('test.toml');
		expect(stats.currentFile.size).toBeGreaterThan(0);
		expect(stats.backups.count).toBe(2);
		expect(stats.backups.totalSize).toBe(250);
		expect(stats.totalSize).toBeGreaterThan(250);
	});

	it('devrait inclure les timestamps des backups', async () => {
		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			},
			{
				name: 'backup2.toml',
				timestamp: '2025-01-02T10:00:00Z',
				content: 'version = "1.1.0"',
				size: 150
			}
		];

		await saveBackupsToIndexedDB(backups);

		const stats = await getDatabaseStats();

		expect(stats.backups.oldestBackup).toBeDefined();
		expect(stats.backups.newestBackup).toBeDefined();
	});
});
