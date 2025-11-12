/**
 * Tests pour le composant FileUpload
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FileUpload from '../FileUpload.svelte';

describe('FileUpload Component', () => {
	let onFileLoadedMock;
	let onErrorMock;

	beforeEach(() => {
		onFileLoadedMock = vi.fn();
		onErrorMock = vi.fn();
	});

	it('devrait afficher la zone de drag & drop', () => {
		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		expect(screen.getByText(/Glissez-déposez votre fichier TOML ici/i)).toBeTruthy();
		expect(screen.getByText(/Parcourir les fichiers/i)).toBeTruthy();
	});

	it('devrait afficher le format accepté', () => {
		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		expect(screen.getByText(/Formats acceptés : .toml/i)).toBeTruthy();
	});

	it('devrait afficher le badge File System Access API si disponible', () => {
		// Simuler la disponibilité de l'API
		window.showOpenFilePicker = vi.fn();

		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		expect(screen.getByText(/File System Access API/i)).toBeTruthy();
	});

	it('devrait gérer les fichiers avec une extension invalide lors du drag & drop', async () => {
		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		const dropZone = screen
			.getByText(/Glissez-déposez votre fichier TOML ici/i)
			.closest('.drop-zone');

		// Créer un fichier avec une mauvaise extension
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		const dataTransfer = {
			files: [file]
		};

		// Simuler le drop
		await fireEvent.drop(dropZone, { dataTransfer });

		// Vérifier que l'erreur est appelée
		expect(onErrorMock).toHaveBeenCalledWith('Seuls les fichiers .toml sont acceptés');
	});

	it('devrait afficher un spinner pendant le chargement', async () => {
		const { container } = render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		// Vérifier que le spinner n'est pas visible au début
		expect(container.querySelector('.spinner')).toBeFalsy();

		// TODO: Tester l'état de chargement avec un fichier valide
		// Cela nécessite de mocker l'API File et le parsing TOML
	});

	it('devrait gérer le drag over', async () => {
		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		const dropZone = screen
			.getByText(/Glissez-déposez votre fichier TOML ici/i)
			.closest('.drop-zone');

		// Simuler le drag over
		await fireEvent.dragOver(dropZone);

		// Vérifier que la classe 'dragging' est ajoutée
		expect(dropZone.classList.contains('dragging')).toBe(true);
	});

	it('devrait gérer le drag leave', async () => {
		render(FileUpload, {
			props: {
				onFileLoaded: onFileLoadedMock,
				onError: onErrorMock
			}
		});

		const dropZone = screen
			.getByText(/Glissez-déposez votre fichier TOML ici/i)
			.closest('.drop-zone');

		// Simuler le drag over puis drag leave
		await fireEvent.dragOver(dropZone);
		expect(dropZone.classList.contains('dragging')).toBe(true);

		await fireEvent.dragLeave(dropZone);
		expect(dropZone.classList.contains('dragging')).toBe(false);
	});
});
