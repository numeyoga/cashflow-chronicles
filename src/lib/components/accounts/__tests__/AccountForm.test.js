/**
 * Tests unitaires pour le composant AccountForm
 * Task 18: Tests Svelte pour AccountForm
 * Implémente US-003-01 : Créer un compte bancaire
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AccountForm from '../AccountForm.svelte';
import * as accountStore from '$lib/stores/accountStore.js';
import * as currencyStore from '$lib/stores/currencyStore.js';

// Mock des stores
vi.mock('$lib/stores/accountStore.js', () => ({
	addAccount: vi.fn(),
	updateAccount: vi.fn()
}));

vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn((cb) => {
			cb([
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: true },
				{ code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isDefault: false },
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: false }
			]);
			return () => {};
		})
	}
}));

describe('AccountForm - Mode Ajout', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait afficher le formulaire d\'ajout avec tous les champs', () => {
		render(AccountForm, { props: { mode: 'add' } });

		expect(screen.getByText('Nouveau compte')).toBeInTheDocument();
		expect(screen.getByLabelText(/Type de compte/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Nom hiérarchique/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Devise/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date d'ouverture/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
	});

	it('devrait avoir des valeurs par défaut correctes', () => {
		render(AccountForm, { props: { mode: 'add' } });

		expect(screen.getByLabelText(/Type de compte/i)).toHaveValue('Assets');
		expect(screen.getByLabelText(/Nom hiérarchique/i)).toHaveValue('');
		expect(screen.getByLabelText(/Devise/i)).toHaveValue('');
	});

	it('devrait permettre de sélectionner différents types de comptes', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		const typeSelect = screen.getByLabelText(/Type de compte/i);

		await user.selectOptions(typeSelect, 'Expenses');
		expect(typeSelect).toHaveValue('Expenses');

		await user.selectOptions(typeSelect, 'Income');
		expect(typeSelect).toHaveValue('Income');
	});

	it('devrait afficher les modèles suggérés en mode ajout', () => {
		render(AccountForm, { props: { mode: 'add' } });

		expect(screen.getByText('Modèles suggérés :')).toBeInTheDocument();
		expect(screen.getByText(/Compte bancaire/i)).toBeInTheDocument();
		expect(screen.getByText(/Espèces/i)).toBeInTheDocument();
	});

	it('devrait changer les modèles suggérés selon le type sélectionné', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		// Par défaut, type Assets
		expect(screen.getByText(/Compte bancaire/i)).toBeInTheDocument();

		// Changer pour Expenses
		const typeSelect = screen.getByLabelText(/Type de compte/i);
		await user.selectOptions(typeSelect, 'Expenses');

		await waitFor(() => {
			expect(screen.getByText(/Alimentation/i)).toBeInTheDocument();
			expect(screen.getByText(/Logement/i)).toBeInTheDocument();
		});
	});

	it('devrait appliquer un modèle au nom du compte', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		// Cliquer sur le modèle "Espèces"
		const cashButton = screen.getByText(/Espèces/i);
		await user.click(cashButton);

		const nameInput = screen.getByLabelText(/Nom hiérarchique/i);
		expect(nameInput).toHaveValue('Assets:Cash:CHF');
	});

	it('devrait visualiser les segments du nom hiérarchique', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		const nameInput = screen.getByLabelText(/Nom hiérarchique/i);
		await user.type(nameInput, 'Assets:Bank:EUR:PostFinance');

		await waitFor(() => {
			expect(screen.getByText('Assets')).toBeInTheDocument();
			expect(screen.getByText('Bank')).toBeInTheDocument();
			expect(screen.getByText('EUR')).toBeInTheDocument();
			expect(screen.getByText('PostFinance')).toBeInTheDocument();
		});
	});

	it('devrait permettre de sélectionner une devise', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		const currencySelect = screen.getByLabelText(/Devise/i);
		await user.selectOptions(currencySelect, 'CHF');

		expect(currencySelect).toHaveValue('CHF');
	});

	it('devrait limiter la date d\'ouverture à aujourd\'hui maximum', () => {
		render(AccountForm, { props: { mode: 'add' } });

		const dateInput = screen.getByLabelText(/Date d'ouverture/i);
		const today = new Date().toISOString().split('T')[0];

		expect(dateInput).toHaveAttribute('max', today);
	});

	it('devrait appeler addAccount avec les bonnes données lors de la soumission', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		accountStore.addAccount.mockReturnValue({
			success: true,
			account: {
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF:PostFinance',
				currency: 'CHF',
				opened: '2024-01-01'
			}
		});

		render(AccountForm, { props: { mode: 'add', onSuccess } });

		await user.type(screen.getByLabelText(/Nom hiérarchique/i), 'Assets:Bank:CHF:PostFinance');
		await user.selectOptions(screen.getByLabelText(/Devise/i), 'CHF');

		// La date est déjà remplie par défaut (today), donc on peut soumettre directement

		const submitButton = screen.getByRole('button', { name: /Créer le compte/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(accountStore.addAccount).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'Assets',
					name: 'Assets:Bank:CHF:PostFinance',
					currency: 'CHF'
				})
			);
		});

		expect(onSuccess).toHaveBeenCalled();
	});

	it('devrait afficher les erreurs de validation', async () => {
		const user = userEvent.setup();

		accountStore.addAccount.mockReturnValue({
			success: false,
			errors: [{ field: 'name', message: 'Le nom doit contenir au moins 2 segments' }]
		});

		render(AccountForm, { props: { mode: 'add' } });

		await user.type(screen.getByLabelText(/Nom hiérarchique/i), 'InvalidName');
		await user.selectOptions(screen.getByLabelText(/Devise/i), 'CHF');

		const submitButton = screen.getByRole('button', { name: /Créer le compte/i });
		await user.click(submitButton);

		await waitFor(() => {
			const errorMessages = document.querySelectorAll('.error-message');
			expect(errorMessages.length).toBeGreaterThan(0);
		});
	});

	it('devrait réinitialiser le formulaire après un ajout réussi', async () => {
		const user = userEvent.setup();

		accountStore.addAccount.mockReturnValue({
			success: true,
			account: { id: 'acc_001', type: 'Assets', name: 'Assets:Bank:CHF', currency: 'CHF' }
		});

		render(AccountForm, { props: { mode: 'add' } });

		await user.type(screen.getByLabelText(/Nom hiérarchique/i), 'Assets:Bank:CHF');
		await user.selectOptions(screen.getByLabelText(/Devise/i), 'CHF');

		const submitButton = screen.getByRole('button', { name: /Créer le compte/i });
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Nom hiérarchique/i)).toHaveValue('');
			expect(screen.getByLabelText(/Devise/i)).toHaveValue('');
		});
	});

	it('devrait appeler onCancel lors du clic sur Annuler', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		render(AccountForm, { props: { mode: 'add', onCancel } });

		const cancelButton = screen.getByRole('button', { name: /Annuler/i });
		await user.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});

	it('devrait mettre à jour le premier segment du nom lors du changement de type', async () => {
		const user = userEvent.setup();
		render(AccountForm, { props: { mode: 'add' } });

		// Remplir un nom avec le type Assets
		const nameInput = screen.getByLabelText(/Nom hiérarchique/i);
		await user.type(nameInput, 'Assets:Bank:CHF');

		// Changer le type pour Expenses
		const typeSelect = screen.getByLabelText(/Type de compte/i);
		await user.selectOptions(typeSelect, 'Expenses');

		// Le nom devrait être mis à jour automatiquement
		await waitFor(() => {
			expect(nameInput).toHaveValue('Expenses:Bank:CHF');
		});
	});
});

describe('AccountForm - Mode Édition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const accountToEdit = {
		id: 'acc_001',
		type: 'Assets',
		name: 'Assets:Bank:CHF:PostFinance',
		currency: 'CHF',
		opened: '2024-01-01',
		description: 'Mon compte PostFinance'
	};

	it('devrait afficher le formulaire d\'édition avec les données existantes', () => {
		render(AccountForm, { props: { mode: 'edit', account: accountToEdit } });

		expect(screen.getByText('Modifier le compte')).toBeInTheDocument();
		expect(screen.getByLabelText(/Type de compte/i)).toHaveValue('Assets');
		expect(screen.getByLabelText(/Nom hiérarchique/i)).toHaveValue('Assets:Bank:CHF:PostFinance');
		expect(screen.getByLabelText(/Devise/i)).toHaveValue('CHF');
		expect(screen.getByLabelText(/Date d'ouverture/i)).toHaveValue('2024-01-01');
		expect(screen.getByLabelText(/Description/i)).toHaveValue('Mon compte PostFinance');
	});

	it('ne devrait pas afficher les modèles suggérés en mode édition', () => {
		render(AccountForm, { props: { mode: 'edit', account: accountToEdit } });

		expect(screen.queryByText('Modèles suggérés :')).not.toBeInTheDocument();
	});

	it('devrait appeler updateAccount lors de la soumission', async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();

		accountStore.updateAccount.mockReturnValue({
			success: true
		});

		render(AccountForm, { props: { mode: 'edit', account: accountToEdit, onSuccess } });

		await user.clear(screen.getByLabelText(/Description/i));
		await user.type(screen.getByLabelText(/Description/i), 'Compte principal PostFinance');

		const submitButton = screen.getByRole('button', { name: /Enregistrer/i });
		await user.click(submitButton);

		expect(accountStore.updateAccount).toHaveBeenCalledWith(
			'acc_001',
			expect.objectContaining({
				description: 'Compte principal PostFinance'
			})
		);

		expect(onSuccess).toHaveBeenCalled();
	});

	it('devrait afficher le bouton "Enregistrer" au lieu de "Créer le compte"', () => {
		render(AccountForm, { props: { mode: 'edit', account: accountToEdit } });

		expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Créer le compte/i })).not.toBeInTheDocument();
	});

	it('ne devrait pas réinitialiser le formulaire après une édition réussie', async () => {
		const user = userEvent.setup();

		accountStore.updateAccount.mockReturnValue({
			success: true
		});

		render(AccountForm, { props: { mode: 'edit', account: accountToEdit } });

		const submitButton = screen.getByRole('button', { name: /Enregistrer/i });
		await user.click(submitButton);

		// Le formulaire devrait conserver les valeurs
		expect(screen.getByLabelText(/Nom hiérarchique/i)).toHaveValue(
			'Assets:Bank:CHF:PostFinance'
		);
		expect(screen.getByLabelText(/Devise/i)).toHaveValue('CHF');
	});
});
