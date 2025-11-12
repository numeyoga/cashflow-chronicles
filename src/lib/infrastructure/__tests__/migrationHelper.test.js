/**
 * Tests pour migrationHelper - Migration localStorage vers IndexedDB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
	isMigrationCompleted,
	hasLocalStorageData,
	migrateFromLocalStorageToIndexedDB,
	cleanupLocalStorage,
	resetMigrationFlag,
	getMigrationStatus
} from '../migrationHelper.js';
import { getFromIndexedDB, getBackupsFromIndexedDB } from '../indexedDbStorage.js';

describe('migrationHelper - Vérifications', () => {
	beforeEach(() => {
		// Nettoyer localStorage
		localStorage.clear();
	});

	afterEach(async () => {
		// Nettoyer IndexedDB
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
		// Nettoyer localStorage
		localStorage.clear();
	});

	it('devrait vérifier si la migration est complétée', () => {
		expect(isMigrationCompleted()).toBe(false);

		localStorage.setItem('cashflow-migrated-to-indexeddb', 'true');

		expect(isMigrationCompleted()).toBe(true);
	});

	it('devrait vérifier si des données existent dans localStorage', () => {
		expect(hasLocalStorageData()).toBe(false);

		localStorage.setItem('cashflow-current-file', JSON.stringify({ fileName: 'test.toml' }));

		expect(hasLocalStorageData()).toBe(true);
	});

	it('devrait détecter des backups dans localStorage', () => {
		expect(hasLocalStorageData()).toBe(false);

		localStorage.setItem('cashflow-backups', JSON.stringify([{ name: 'backup1.toml' }]));

		expect(hasLocalStorageData()).toBe(true);
	});
});

describe('migrationHelper - Migration', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
		localStorage.clear();
	});

	it('devrait migrer un fichier depuis localStorage', async () => {
		const fileData = {
			fileName: 'test.toml',
			content: 'version = "1.0.0"',
			data: {
				version: '1.0.0',
				metadata: { created: '2025-01-01T00:00:00Z' }
			},
			lastModified: '2025-01-01T10:00:00Z',
			size: 100
		};

		localStorage.setItem('cashflow-current-file', JSON.stringify(fileData));

		const result = await migrateFromLocalStorageToIndexedDB();

		expect(result.success).toBe(true);
		expect(result.migratedFile).toBe(true);

		// Vérifier que les données sont dans IndexedDB
		const indexedDBFile = await getFromIndexedDB();
		expect(indexedDBFile).toBeDefined();
		expect(indexedDBFile.fileName).toBe('test.toml');
	});

	it('devrait migrer les backups depuis localStorage', async () => {
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

		localStorage.setItem('cashflow-backups', JSON.stringify(backups));

		const result = await migrateFromLocalStorageToIndexedDB();

		expect(result.success).toBe(true);
		expect(result.migratedBackups).toBe(true);
		expect(result.backupsCount).toBe(2);

		// Vérifier que les backups sont dans IndexedDB
		const indexedDBBackups = await getBackupsFromIndexedDB();
		expect(indexedDBBackups).toHaveLength(2);
	});

	it('devrait migrer fichier et backups ensemble', async () => {
		const fileData = {
			fileName: 'test.toml',
			content: 'version = "1.0.0"',
			data: {
				version: '1.0.0',
				metadata: { created: '2025-01-01T00:00:00Z' }
			}
		};

		const backups = [
			{
				name: 'backup1.toml',
				timestamp: '2025-01-01T10:00:00Z',
				content: 'version = "1.0.0"',
				size: 100
			}
		];

		localStorage.setItem('cashflow-current-file', JSON.stringify(fileData));
		localStorage.setItem('cashflow-backups', JSON.stringify(backups));

		const result = await migrateFromLocalStorageToIndexedDB();

		expect(result.success).toBe(true);
		expect(result.migratedFile).toBe(true);
		expect(result.migratedBackups).toBe(true);
		expect(result.backupsCount).toBe(1);
	});

	it('ne devrait pas migrer si déjà migré', async () => {
		localStorage.setItem('cashflow-migrated-to-indexeddb', 'true');

		const result = await migrateFromLocalStorageToIndexedDB();

		expect(result.success).toBe(true);
		expect(result.alreadyMigrated).toBe(true);
	});

	it('devrait retourner succès si aucune donnée à migrer', async () => {
		const result = await migrateFromLocalStorageToIndexedDB();

		expect(result.success).toBe(true);
		expect(result.noData).toBe(true);

		// Vérifier que le flag de migration est quand même défini
		expect(isMigrationCompleted()).toBe(true);
	});

	it('devrait marquer la migration comme complétée', async () => {
		expect(isMigrationCompleted()).toBe(false);

		await migrateFromLocalStorageToIndexedDB();

		expect(isMigrationCompleted()).toBe(true);
	});

	it('devrait gérer les erreurs de données corrompues', async () => {
		// Données localStorage invalides
		localStorage.setItem('cashflow-current-file', 'invalid json');

		const result = await migrateFromLocalStorageToIndexedDB();

		// La migration devrait quand même réussir mais avec des erreurs
		expect(result.success).toBe(true);
		expect(result.errors).toBeDefined();
	});
});

describe('migrationHelper - Nettoyage', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
		localStorage.clear();
	});

	it('devrait nettoyer localStorage après migration', async () => {
		const fileData = {
			fileName: 'test.toml',
			data: { version: '1.0.0' }
		};

		localStorage.setItem('cashflow-current-file', JSON.stringify(fileData));
		localStorage.setItem('cashflow-backups', JSON.stringify([]));

		await migrateFromLocalStorageToIndexedDB();

		const cleanupResult = cleanupLocalStorage();

		expect(cleanupResult.success).toBe(true);
		expect(localStorage.getItem('cashflow-current-file')).toBeNull();
		expect(localStorage.getItem('cashflow-backups')).toBeNull();
	});

	it('ne devrait pas nettoyer si migration non complétée', () => {
		const result = cleanupLocalStorage();

		expect(result.success).toBe(false);
		expect(result.error).toContain('Migration non complétée');
	});

	it('devrait réinitialiser le flag de migration', async () => {
		await migrateFromLocalStorageToIndexedDB();
		expect(isMigrationCompleted()).toBe(true);

		resetMigrationFlag();

		expect(isMigrationCompleted()).toBe(false);
	});
});

describe('migrationHelper - Statut', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(async () => {
		const dbs = await indexedDB.databases();
		for (const db of dbs) {
			indexedDB.deleteDatabase(db.name);
		}
		localStorage.clear();
	});

	it('devrait retourner le statut initial', async () => {
		const status = await getMigrationStatus();

		expect(status.migrationCompleted).toBe(false);
		expect(status.hasLocalStorageData).toBe(false);
		expect(status.indexedDBAvailable).toBe(true);
		expect(status.indexedDBHasData).toBe(false);
		expect(status.localStorageSize).toBe(0);
		expect(status.indexedDBSize).toBe(0);
	});

	it('devrait retourner le statut avec données localStorage', async () => {
		const fileData = {
			fileName: 'test.toml',
			data: { version: '1.0.0' }
		};

		localStorage.setItem('cashflow-current-file', JSON.stringify(fileData));

		const status = await getMigrationStatus();

		expect(status.hasLocalStorageData).toBe(true);
		expect(status.localStorageSize).toBeGreaterThan(0);
	});

	it('devrait retourner le statut après migration', async () => {
		const fileData = {
			fileName: 'test.toml',
			data: { version: '1.0.0' }
		};

		localStorage.setItem('cashflow-current-file', JSON.stringify(fileData));

		await migrateFromLocalStorageToIndexedDB();

		const status = await getMigrationStatus();

		expect(status.migrationCompleted).toBe(true);
		expect(status.indexedDBHasData).toBe(true);
		expect(status.indexedDBSize).toBeGreaterThan(0);
	});
});
