/**
 * Tests unitaires pour le composant ExchangeRateForm
 * Task 20: Tests Svelte pour ExchangeRateForm
 * Implémente US-002-02 : Enregistrer un taux de change historique
 * Implémente US-002-06 : Mettre à jour un taux de change existant
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ExchangeRateForm from '../ExchangeRateForm.svelte';
import * as currencyStore from '$lib/stores/currencyStore.js';

// Mock du store
vi.mock('$lib/stores/currencyStore.js', () => ({
	addExchangeRate: vi.fn(),
	updateExchangeRate: vi.fn()
}));

describe('ExchangeRateForm - Mode Add', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockCurrency = {
		code: 'USD',
		name: 'US Dollar',
		symbol: '$',
		decimalPlaces: 2
	};

	it('devrait afficher le formulaire d\'ajout avec le titre correct', () => {
		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		expect(screen.getByText(/Ajouter un taux de change pour USD/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Taux/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Source/)).toBeInTheDocument();
	});

	it('devrait avoir des valeurs par défaut correctes', () => {
		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		const today = new Date().toISOString().split('T')[0];
		expect(screen.getByLabelText(/Date/)).toHaveValue(today);
		expect(screen.getByLabelText(/Taux/)).toHaveValue(null); // Empty number input
		expect(screen.getByLabelText(/Source/)).toHaveValue('manuel');
	});

	it('devrait avoir le champ date enabled en mode add', () => {
		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		const dateInput = screen.getByLabelText(/Date/);
		expect(dateInput).not.toBeDisabled();
	});

	it('devrait appeler addExchangeRate avec les bonnes données lors de la soumission', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		currencyStore.addExchangeRate.mockReturnValue({
			success: true,
			rate: {
				date: '2024-01-15',
				rate: 0.95,
				source: 'Banque PostFinance'
			}
		});

		render(ExchangeRateForm, {
			props: { currency: mockCurrency, mode: 'add', onSuccess }
		});

		// Remplir le formulaire
		const dateInput = screen.getByLabelText(/Date/);
		await user.clear(dateInput);
		await user.type(dateInput, '2024-01-15');

		const rateInput = screen.getByLabelText(/Taux/);
		await user.clear(rateInput);
		await user.type(rateInput, '0.95');

		const sourceInput = screen.getByLabelText(/Source/);
		await user.clear(sourceInput);
		await user.type(sourceInput, 'Banque PostFinance');

		// Soumettre
		const submitButton = screen.getByRole('button', { name: /Ajouter/ });
		await user.click(submitButton);

		await waitFor(() => {
			expect(currencyStore.addExchangeRate).toHaveBeenCalledWith('USD', {
				date: '2024-01-15',
				rate: 0.95,
				source: 'Banque PostFinance'
			});
		});

		expect(onSuccess).toHaveBeenCalled();
	});

	it('devrait réinitialiser le formulaire après un ajout réussi', async () => {
		const user = userEvent.setup();

		currencyStore.addExchangeRate.mockReturnValue({
			success: true,
			rate: { date: '2024-01-15', rate: 0.95, source: 'manuel' }
		});

		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		// Remplir et soumettre
		const rateInput = screen.getByLabelText(/Taux/);
		await user.clear(rateInput);
		await user.type(rateInput, '0.95');

		const submitButton = screen.getByRole('button', { name: /Ajouter/ });
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Taux/)).toHaveValue(null);
			expect(screen.getByLabelText(/Source/)).toHaveValue('manuel');
		});
	});

	it('devrait afficher les erreurs de validation', async () => {
		const user = userEvent.setup();

		currencyStore.addExchangeRate.mockReturnValue({
			success: false,
			errors: [{ field: 'rate', message: 'Le taux doit être supérieur à 0' }]
		});

		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		// Soumettre avec un taux invalide
		const rateInput = screen.getByLabelText(/Taux/);
		await user.clear(rateInput);
		await user.type(rateInput, '0');

		const submitButton = screen.getByRole('button', { name: /Ajouter/ });
		await user.click(submitButton);

		await waitFor(() => {
			const errorMessages = document.querySelectorAll('.error-message');
			expect(errorMessages.length).toBeGreaterThan(0);
		});
	});
});

describe('ExchangeRateForm - Mode Edit', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockCurrency = {
		code: 'USD',
		name: 'US Dollar',
		symbol: '$',
		decimalPlaces: 2
	};

	const mockExchangeRate = {
		date: '2024-01-15',
		rate: 0.95,
		source: 'Banque PostFinance'
	};

	it('devrait afficher les données existantes du taux en mode édition', () => {
		render(ExchangeRateForm, {
			props: {
				currency: mockCurrency,
				mode: 'edit',
				exchangeRate: mockExchangeRate
			}
		});

		expect(screen.getByText(/Modifier le taux de change/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date/)).toHaveValue('2024-01-15');
		expect(screen.getByLabelText(/Taux/)).toHaveValue(0.95);
		expect(screen.getByLabelText(/Source/)).toHaveValue('Banque PostFinance');
	});

	it('devrait avoir le champ date disabled en mode edit', () => {
		render(ExchangeRateForm, {
			props: {
				currency: mockCurrency,
				mode: 'edit',
				exchangeRate: mockExchangeRate
			}
		});

		const dateInput = screen.getByLabelText(/Date/);
		expect(dateInput).toBeDisabled();
	});

	it('devrait appeler updateExchangeRate lors de la soumission en mode édition', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		currencyStore.updateExchangeRate.mockReturnValue({
			success: true
		});

		render(ExchangeRateForm, {
			props: {
				currency: mockCurrency,
				mode: 'edit',
				exchangeRate: mockExchangeRate,
				onSuccess
			}
		});

		// Modifier le taux
		const rateInput = screen.getByLabelText(/Taux/);
		await user.clear(rateInput);
		await user.type(rateInput, '0.98');

		const submitButton = screen.getByRole('button', { name: /Enregistrer/ });
		await user.click(submitButton);

		await waitFor(() => {
			expect(currencyStore.updateExchangeRate).toHaveBeenCalledWith(
				'USD',
				'2024-01-15',
				{
					rate: 0.98,
					source: 'Banque PostFinance'
				}
			);
		});

		expect(onSuccess).toHaveBeenCalled();
	});
});

describe('ExchangeRateForm - Annulation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockCurrency = {
		code: 'USD',
		name: 'US Dollar',
		symbol: '$',
		decimalPlaces: 2
	};

	it('devrait appeler onCancel lors du clic sur Annuler', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		render(ExchangeRateForm, {
			props: { currency: mockCurrency, mode: 'add', onCancel }
		});

		const cancelButton = screen.getByRole('button', { name: /Annuler/ });
		await user.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});
});

describe('ExchangeRateForm - Helpers & UI', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockCurrency = {
		code: 'EUR',
		name: 'Euro',
		symbol: '€',
		decimalPlaces: 2
	};

	it('devrait afficher le texte d\'aide pour le taux avec le code devise', () => {
		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		expect(screen.getByText(/1 EUR = 0.95/)).toBeInTheDocument();
	});

	it('devrait permettre de laisser la source vide (optionnelle)', async () => {
		const user = userEvent.setup();

		currencyStore.addExchangeRate.mockReturnValue({
			success: true,
			rate: { date: '2024-01-15', rate: 1.0, source: 'manuel' }
		});

		render(ExchangeRateForm, { props: { currency: mockCurrency, mode: 'add' } });

		// Remplir seulement la date et le taux
		const rateInput = screen.getByLabelText(/Taux/);
		await user.clear(rateInput);
		await user.type(rateInput, '1.0');

		// Ne pas remplir la source
		const sourceInput = screen.getByLabelText(/Source/);
		await user.clear(sourceInput);

		const submitButton = screen.getByRole('button', { name: /Ajouter/ });
		await user.click(submitButton);

		await waitFor(() => {
			expect(currencyStore.addExchangeRate).toHaveBeenCalled();
		});
	});
});
