/**
 * Tests pour fileStorage - Fonctions de sauvegarde et téléchargement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serializeToTOML, downloadFile, saveOrDownload, saveFileAs } from '../fileStorage.js';

describe('fileStorage - Serialize', () => {
	it('devrait sérialiser les données en TOML', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				defaultCurrency: 'CHF'
			}
		};

		const result = serializeToTOML(data);

		expect(result).toContain('version = "1.0.0"');
		expect(result).toContain('[metadata]');
		expect(result).toContain('defaultCurrency = "CHF"');
	});

	it('devrait mettre à jour le timestamp lastModified', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z'
			}
		};

		const result = serializeToTOML(data);

		expect(result).toContain('lastModified');
	});

	it('devrait gérer les erreurs de sérialisation', () => {
		// Données avec des références circulaires (non supporté par TOML)
		const circular = {};
		circular.self = circular;

		expect(() => serializeToTOML(circular)).toThrow();
	});
});

describe('fileStorage - Download', () => {
	beforeEach(() => {
		// Mock de URL.createObjectURL et URL.revokeObjectURL
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();

		// Mock de document.createElement et appendChild
		document.createElement = vi.fn((tag) => {
			if (tag === 'a') {
				return {
					href: '',
					download: '',
					click: vi.fn(),
					remove: vi.fn()
				};
			}
			return {};
		});

		document.body.appendChild = vi.fn();
		document.body.removeChild = vi.fn();
	});

	it('devrait télécharger un fichier TOML', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				defaultCurrency: 'CHF'
			}
		};

		const result = downloadFile(data, 'test.toml');

		expect(result.success).toBe(true);
		expect(result.message).toContain('test.toml');
		expect(global.URL.createObjectURL).toHaveBeenCalled();
		expect(global.URL.revokeObjectURL).toHaveBeenCalled();
	});

	it('devrait utiliser le nom de fichier par défaut', () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const result = downloadFile(data);

		expect(result.success).toBe(true);
		expect(result.message).toContain('budget.toml');
	});
});

describe('fileStorage - SaveOrDownload', () => {
	beforeEach(() => {
		// Mock pour downloadFile
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		document.createElement = vi.fn(() => ({
			href: '',
			download: '',
			click: vi.fn(),
			remove: vi.fn()
		}));
		document.body.appendChild = vi.fn();
		document.body.removeChild = vi.fn();
	});

	it('devrait télécharger si aucun fileHandle', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const result = await saveOrDownload(data, null, 'test.toml');

		expect(result.success).toBe(true);
		expect(result.message).toContain('téléchargé');
	});

	it('devrait télécharger si fileHandle invalide', async () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		// FileHandle sans createWritable
		const invalidHandle = { name: 'test.toml' };

		const result = await saveOrDownload(data, invalidHandle, 'test.toml');

		expect(result.success).toBe(true);
		expect(result.message).toContain('téléchargé');
	});
});

describe('fileStorage - SaveFileAs', () => {
	beforeEach(() => {
		// Mock pour downloadFile (fallback)
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		document.createElement = vi.fn(() => ({
			href: '',
			download: '',
			click: vi.fn(),
			remove: vi.fn()
		}));
		document.body.appendChild = vi.fn();
		document.body.removeChild = vi.fn();
	});

	it('devrait utiliser downloadFile comme fallback si API non disponible', async () => {
		// Simuler l'absence de File System Access API
		delete window.showSaveFilePicker;

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const result = await saveFileAs(data, 'budget.toml');

		expect(result.success).toBe(true);
		expect(result.message).toContain('téléchargé');
	});

	it("devrait gérer l'annulation par l'utilisateur", async () => {
		// Simuler la présence de l'API
		window.showSaveFilePicker = vi.fn(() => {
			const error = new Error('User cancelled');
			error.name = 'AbortError';
			throw error;
		});

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const result = await saveFileAs(data, 'budget.toml');

		expect(result.success).toBe(false);
		expect(result.cancelled).toBe(true);
	});
});
