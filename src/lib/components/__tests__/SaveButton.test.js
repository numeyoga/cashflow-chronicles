/**
 * Tests pour le composant SaveButton
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SaveButton from '../SaveButton.svelte';
import * as fileStorage from '../../infrastructure/fileStorage.js';

describe('SaveButton Component', () => {
	let onSaveMock;
	let onErrorMock;

	beforeEach(() => {
		onSaveMock = vi.fn();
		onErrorMock = vi.fn();

		// Mock des fonctions de fileStorage
		vi.spyOn(fileStorage, 'saveOrDownload');
		vi.spyOn(fileStorage, 'saveFileAs');
	});

	it('devrait afficher les boutons de sauvegarde', () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		// Bouton Sauvegarder visible
		expect(screen.getByTitle('Sauvegarder')).toBeTruthy();
	});

	it('devrait afficher le bouton "Sauvegarder sous" si API disponible', () => {
		window.showSaveFilePicker = vi.fn();

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		expect(screen.getByTitle('Sauvegarder sous...')).toBeTruthy();
	});

	it('devrait afficher les labels si showLabel est true', () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				showLabel: true,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		expect(screen.getByText('Sauvegarder')).toBeTruthy();
	});

	it('devrait cacher les labels si showLabel est false', () => {
		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		const { container } = render(SaveButton, {
			props: {
				data,
				showLabel: false,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		// Le texte "Sauvegarder" ne devrait pas être visible
		const labels = container.querySelectorAll('.label');
		expect(labels.length).toBe(0);
	});

	it('devrait désactiver les boutons si pas de données', () => {
		render(SaveButton, {
			props: {
				data: null,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		const saveButton = screen.getByTitle('Sauvegarder');
		expect(saveButton.disabled).toBe(true);
	});

	it('devrait appeler saveOrDownload lors du clic sur Sauvegarder', async () => {
		fileStorage.saveOrDownload.mockResolvedValue({
			success: true,
			message: 'Sauvegarde réussie'
		});

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				fileHandle: null,
				fileName: 'test.toml',
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		const saveButton = screen.getByTitle('Sauvegarder');
		await fireEvent.click(saveButton);

		expect(fileStorage.saveOrDownload).toHaveBeenCalledWith(data, null, 'test.toml');
		expect(onSaveMock).toHaveBeenCalled();
	});

	it('devrait appeler saveFileAs lors du clic sur "Sauvegarder sous"', async () => {
		window.showSaveFilePicker = vi.fn();

		fileStorage.saveFileAs.mockResolvedValue({
			success: true,
			message: 'Sauvegarde réussie',
			fileHandle: { name: 'test.toml' }
		});

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				fileName: 'test.toml',
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		const saveAsButton = screen.getByTitle('Sauvegarder sous...');
		await fireEvent.click(saveAsButton);

		expect(fileStorage.saveFileAs).toHaveBeenCalledWith(data, 'test.toml');
		expect(onSaveMock).toHaveBeenCalled();
	});

	it("devrait appeler onError en cas d'erreur", async () => {
		fileStorage.saveOrDownload.mockResolvedValue({
			success: false,
			error: 'Erreur de sauvegarde'
		});

		const data = {
			version: '1.0.0',
			metadata: { created: '2025-01-01T00:00:00Z' }
		};

		render(SaveButton, {
			props: {
				data,
				onSave: onSaveMock,
				onError: onErrorMock
			}
		});

		const saveButton = screen.getByTitle('Sauvegarder');
		await fireEvent.click(saveButton);

		expect(onErrorMock).toHaveBeenCalledWith('Erreur de sauvegarde');
	});
});
