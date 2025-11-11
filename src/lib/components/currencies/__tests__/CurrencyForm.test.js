/**
 * Tests unitaires pour le composant CurrencyForm
 * Task 17: Tests Svelte pour CurrencyForm
 * Implémente US-002-01 : Ajouter une nouvelle devise
 * Implémente US-002-03 : Modifier une devise existante
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CurrencyForm from '../CurrencyForm.svelte';
import * as currencyStore from '$lib/stores/currencyStore.js';

// Mock du store de devises
vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn((cb) => {
			cb([
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: true },
				{ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isDefault: false }
			]);
			return () => {};
		})
	},
	addCurrency: vi.fn(),
	updateCurrency: vi.fn()
}));

describe('CurrencyForm - Mode Ajout', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait afficher le formulaire d\'ajout avec tous les champs', () => {
		render(CurrencyForm, { props: { mode: 'add' } });

		expect(screen.getByText('Ajouter une devise')).toBeInTheDocument();
		expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^Nom/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Symbole/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Décimales/i)).toBeInTheDocument();
		expect(screen.getByText(/Définir comme devise par défaut/i)).toBeInTheDocument();
	});

	it('devrait avoir des valeurs par défaut correctes', () => {
		render(CurrencyForm, { props: { mode: 'add' } });

		expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toHaveValue('');
		expect(screen.getByLabelText(/^Nom/i)).toHaveValue('');
		expect(screen.getByLabelText(/Symbole/i)).toHaveValue('');
		expect(screen.getByLabelText(/Décimales/i)).toHaveValue(2);
		expect(screen.getByRole('checkbox')).not.toBeChecked();
	});

	it('devrait permettre la saisie dans tous les champs', async () => {
		const user = userEvent.setup();
		render(CurrencyForm, { props: { mode: 'add' } });

		const codeInput = screen.getByLabelText(/Code \(ISO 4217\)/i);
		const nameInput = screen.getByLabelText(/^Nom/i);
		const symbolInput = screen.getByLabelText(/Symbole/i);
		const decimalInput = screen.getByLabelText(/Décimales/i);

		await user.type(codeInput, 'CHF');
		await user.type(nameInput, 'Swiss Franc');
		await user.type(symbolInput, 'Fr.');
		await user.clear(decimalInput);
		await user.type(decimalInput, '2');

		expect(codeInput).toHaveValue('CHF');
		expect(nameInput).toHaveValue('Swiss Franc');
		expect(symbolInput).toHaveValue('Fr.');
		expect(decimalInput).toHaveValue(2);
	});

	it('devrait afficher les suggestions ISO 4217 lors de la saisie du code', async () => {
		const user = userEvent.setup();
		render(CurrencyForm, { props: { mode: 'add' } });

		const codeInput = screen.getByLabelText(/Code \(ISO 4217\)/i);
		await user.type(codeInput, 'US');

		// Les suggestions devraient apparaître
		await waitFor(() => {
			expect(screen.getByText(/USD/)).toBeInTheDocument();
		});
	});

	it('devrait limiter les suggestions à 5 résultats maximum', async () => {
		const user = userEvent.setup();
		render(CurrencyForm, { props: { mode: 'add' } });

		const codeInput = screen.getByLabelText(/Code \(ISO 4217\)/i);
		// Taper une lettre commune qui retourne beaucoup de résultats
		await user.type(codeInput, 'A');

		await waitFor(() => {
			// Rechercher uniquement les suggestions (boutons avec code de devise en strong)
			const suggestions = screen.queryAllByRole('button', { name: /^\w{3}/ });
			const suggestionsInDiv = Array.from(document.querySelectorAll('.suggestions .suggestion-item'));
			// Maximum 5 suggestions affichées dans le div suggestions
			expect(suggestionsInDiv.length).toBeLessThanOrEqual(5);
		});
	});

	it('devrait remplir automatiquement le formulaire lors de la sélection d\'une suggestion', async () => {
		const user = userEvent.setup();
		render(CurrencyForm, { props: { mode: 'add' } });

		const codeInput = screen.getByLabelText(/Code \(ISO 4217\)/i);
		await user.type(codeInput, 'USD');

		// Attendre que les suggestions apparaissent
		const suggestionButton = await screen.findByRole('button', { name: /USD.*US Dollar/i });
		expect(suggestionButton).toBeInTheDocument();

		// Cliquer sur la suggestion USD
		await user.click(suggestionButton);

		// Vérifier que le formulaire est rempli
		await waitFor(() => {
			expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toHaveValue('USD');
			expect(screen.getByLabelText(/^Nom/i)).toHaveValue('US Dollar');
			expect(screen.getByLabelText(/Symbole/i)).toHaveValue('$');
			expect(screen.getByLabelText(/Décimales/i)).toHaveValue(2);
		});
	});

	it('devrait appeler addCurrency avec les bonnes données lors de la soumission', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		currencyStore.addCurrency.mockReturnValue({
			success: true,
			currency: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.', decimalPlaces: 2, isDefault: false }
		});

		render(CurrencyForm, { props: { mode: 'add', onSuccess } });

		await user.type(screen.getByLabelText(/Code \(ISO 4217\)/i), 'CHF');
		await user.type(screen.getByLabelText(/^Nom/i), 'Swiss Franc');
		await user.type(screen.getByLabelText(/Symbole/i), 'Fr.');

		const submitButton = screen.getByRole('button', { name: /Ajouter/i });
		await user.click(submitButton);

		expect(currencyStore.addCurrency).toHaveBeenCalledWith({
			code: 'CHF',
			name: 'Swiss Franc',
			symbol: 'Fr.',
			decimalPlaces: 2,
			isDefault: false
		});

		expect(onSuccess).toHaveBeenCalled();
	});

	it('devrait afficher les erreurs de validation', async () => {
		const user = userEvent.setup();

		currencyStore.addCurrency.mockReturnValue({
			success: false,
			errors: [
				{ field: 'code', message: 'Le code doit être en majuscules' },
				{ field: 'symbol', message: 'Le symbole est requis' }
			]
		});

		render(CurrencyForm, { props: { mode: 'add' } });

		// Remplir tous les champs requis pour éviter la validation HTML5
		await user.type(screen.getByLabelText(/Code \(ISO 4217\)/i), 'chf');
		await user.type(screen.getByLabelText(/^Nom/i), 'Franc Suisse');
		await user.type(screen.getByLabelText(/Symbole/i), 'Fr.');

		const submitButton = screen.getByRole('button', { name: /Ajouter/i });
		await user.click(submitButton);

		// Vérifier que les erreurs s'affichent
		await waitFor(
			() => {
				const errorMessages = document.querySelectorAll('.error-message');
				expect(errorMessages.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 }
		);
	});

	it('devrait réinitialiser le formulaire après un ajout réussi', async () => {
		const user = userEvent.setup();

		currencyStore.addCurrency.mockReturnValue({
			success: true,
			currency: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.', decimalPlaces: 2, isDefault: false }
		});

		render(CurrencyForm, { props: { mode: 'add' } });

		await user.type(screen.getByLabelText(/Code \(ISO 4217\)/i), 'CHF');
		await user.type(screen.getByLabelText(/^Nom/i), 'Swiss Franc');
		await user.type(screen.getByLabelText(/Symbole/i), 'Fr.');

		const submitButton = screen.getByRole('button', { name: /Ajouter/i });
		await user.click(submitButton);

		// Le formulaire devrait être réinitialisé
		await waitFor(() => {
			expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toHaveValue('');
			expect(screen.getByLabelText(/^Nom/i)).toHaveValue('');
			expect(screen.getByLabelText(/Symbole/i)).toHaveValue('');
		});
	});

	it('devrait appeler onCancel lors du clic sur Annuler', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		render(CurrencyForm, { props: { mode: 'add', onCancel } });

		const cancelButton = screen.getByRole('button', { name: /Annuler/i });
		await user.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});

	it('devrait permettre de cocher la case "Par défaut"', async () => {
		const user = userEvent.setup();
		render(CurrencyForm, { props: { mode: 'add' } });

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).not.toBeChecked();

		await user.click(checkbox);
		expect(checkbox).toBeChecked();
	});

	it('devrait valider que les décimales sont entre 0 et 8', async () => {
		render(CurrencyForm, { props: { mode: 'add' } });

		const decimalInput = screen.getByLabelText(/Décimales/i);
		expect(decimalInput).toHaveAttribute('min', '0');
		expect(decimalInput).toHaveAttribute('max', '8');
	});
});

describe('CurrencyForm - Mode Édition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const currencyToEdit = {
		code: 'USD',
		name: 'US Dollar',
		symbol: '$',
		decimalPlaces: 2,
		isDefault: false
	};

	it('devrait afficher le formulaire d\'édition avec les données existantes', () => {
		render(CurrencyForm, { props: { mode: 'edit', currency: currencyToEdit } });

		expect(screen.getByText('Modifier la devise')).toBeInTheDocument();
		expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toHaveValue('USD');
		expect(screen.getByLabelText(/^Nom/i)).toHaveValue('US Dollar');
		expect(screen.getByLabelText(/Symbole/i)).toHaveValue('$');
		expect(screen.getByLabelText(/Décimales/i)).toHaveValue(2);
	});

	it('devrait désactiver le champ code en mode édition', () => {
		render(CurrencyForm, { props: { mode: 'edit', currency: currencyToEdit } });

		const codeInput = screen.getByLabelText(/Code \(ISO 4217\)/i);
		expect(codeInput).toBeDisabled();
	});

	it('devrait appeler updateCurrency lors de la soumission', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		currencyStore.updateCurrency.mockReturnValue({
			success: true
		});

		render(CurrencyForm, { props: { mode: 'edit', currency: currencyToEdit, onSuccess } });

		await user.clear(screen.getByLabelText(/^Nom/i));
		await user.type(screen.getByLabelText(/^Nom/i), 'United States Dollar');

		const submitButton = screen.getByRole('button', { name: /Enregistrer/i });
		await user.click(submitButton);

		expect(currencyStore.updateCurrency).toHaveBeenCalledWith('USD', {
			name: 'United States Dollar',
			symbol: '$',
			decimalPlaces: 2,
			isDefault: false
		});

		expect(onSuccess).toHaveBeenCalled();
	});

	it('ne devrait pas réinitialiser le formulaire après une édition réussie', async () => {
		const user = userEvent.setup();

		currencyStore.updateCurrency.mockReturnValue({
			success: true
		});

		render(CurrencyForm, { props: { mode: 'edit', currency: currencyToEdit } });

		const submitButton = screen.getByRole('button', { name: /Enregistrer/i });
		await user.click(submitButton);

		// Le formulaire devrait conserver les valeurs
		expect(screen.getByLabelText(/Code \(ISO 4217\)/i)).toHaveValue('USD');
		expect(screen.getByLabelText(/^Nom/i)).toHaveValue('US Dollar');
	});

	it('devrait afficher le bouton "Enregistrer" au lieu de "Ajouter"', () => {
		render(CurrencyForm, { props: { mode: 'edit', currency: currencyToEdit } });

		expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Ajouter/i })).not.toBeInTheDocument();
	});
});
