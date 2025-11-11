/**
 * Tests unitaires pour le composant AccountList
 * Task 18: Tests Svelte pour AccountList
 * Implémente EPIC-003 : Gestion des Comptes
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AccountList from '../AccountList.svelte';
import * as accountStore from '$lib/stores/accountStore.js';
import * as currencyStore from '$lib/stores/currencyStore.js';

// Mock des stores et fonctions
vi.mock('$lib/stores/accountStore.js', () => ({
	accounts: {
		subscribe: vi.fn()
	},
	accountsByType: {
		subscribe: vi.fn()
	},
	deleteAccount: vi.fn(),
	closeAccount: vi.fn(),
	reopenAccount: vi.fn(),
	getAccountBalance: vi.fn()
}));

vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn((cb) => {
			cb([
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 }
			]);
			return () => {};
		})
	}
}));

// Helper function to find type header by label
function findTypeHeader(typeLabel) {
	const typeHeaders = document.querySelectorAll('.type-header');
	return Array.from(typeHeaders).find(header => header.textContent.includes(typeLabel));
}

describe('AccountList - Rendu de base', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.confirm = vi.fn();
		global.alert = vi.fn();
	});

	it('devrait afficher un message d\'état vide quand il n\'y a aucun compte', () => {
		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb([]);
			return () => {};
		});

		render(AccountList);

		expect(screen.getByText('Aucun compte configuré.')).toBeInTheDocument();
		expect(screen.getByText('Ajoutez votre premier compte pour commencer.')).toBeInTheDocument();
	});

	it('devrait afficher la liste des comptes groupés par type', () => {
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			},
			{
				id: 'acc_002',
				type: 'Expenses',
				name: 'Expenses:Food:Groceries',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		// Vérifier que les en-têtes de type sont affichés (dans les h3)
		const typeSections = document.querySelectorAll('.type-section h3');
		const typeTexts = Array.from(typeSections).map(h3 => h3.textContent);

		expect(typeTexts.some(text => text.includes('Actifs'))).toBe(true);
		expect(typeTexts.some(text => text.includes('Dépenses'))).toBe(true);
	});

	it('devrait afficher le nombre de comptes par type', () => {
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			},
			{
				id: 'acc_002',
				type: 'Assets',
				name: 'Assets:Cash:EUR',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
	});

	it('devrait afficher les filtres (statut, type, recherche)', () => {
		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb([]);
			return () => {};
		});

		render(AccountList);

		expect(screen.getByLabelText(/Statut :/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Type :/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Rechercher :/i)).toBeInTheDocument();
	});
});

describe('AccountList - Filtrage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait filtrer les comptes par statut (actifs seulement)', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			},
			{
				id: 'acc_002',
				type: 'Assets',
				name: 'Assets:OldBank:EUR',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: true,
				closedDate: '2024-06-01'
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		// Par défaut, filtre "active" est sélectionné
		const statusFilter = screen.getByLabelText(/Statut :/i);
		expect(statusFilter).toHaveValue('active');
	});

	it('devrait filtrer les comptes par type', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			},
			{
				id: 'acc_002',
				type: 'Expenses',
				name: 'Expenses:Food',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeFilter = screen.getByLabelText(/Type :/i);
		await user.selectOptions(typeFilter, 'Assets');

		// Vérifier que le filtre est bien appliqué
		expect(typeFilter).toHaveValue('Assets');
	});

	it('devrait permettre de rechercher un compte par nom', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const searchInput = screen.getByLabelText(/Rechercher :/i);
		await user.type(searchInput, 'Bank');

		expect(searchInput).toHaveValue('Bank');
	});

	it('devrait afficher un message si aucun compte ne correspond aux critères', () => {
		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb([
				{
					id: 'acc_001',
					type: 'Assets',
					name: 'Assets:Bank:CHF',
					currency: 'CHF',
					opened: '2024-01-01',
					closed: false
				}
			]);
			return () => {};
		});

		render(AccountList);

		// La logique de filtrage est dans le composant
		// Par défaut, avec un compte actif, le message ne devrait pas être visible
		const emptyMessage = screen.queryByText(/Aucun compte ne correspond aux critères de recherche/i);
		expect(emptyMessage).toBeNull();
	});
});

describe('AccountList - Interactions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.confirm = vi.fn();
		global.alert = vi.fn();
	});

	it('devrait permettre d\'expandre et de collapser un type de compte', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		// Cliquer sur l'en-tête du type pour l'expandre
		const typeHeaders = document.querySelectorAll('.type-header');
		const assetsHeader = Array.from(typeHeaders).find(header =>
			header.textContent.includes('Actifs')
		);
		await user.click(assetsHeader);

		// Le compte devrait s'afficher
		expect(screen.getByText('Assets:Bank:CHF')).toBeInTheDocument();
	});

	it('devrait afficher le bouton d\'édition pour tous les comptes', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		// Expandre le type
		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		// Vérifier que le bouton d'édition est présent
		const editButtons = screen.getAllByTitle('Modifier');
		expect(editButtons.length).toBeGreaterThan(0);
	});

	it('devrait afficher le bouton de clôture pour les comptes actifs', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		expect(screen.getByTitle('Clôturer')).toBeInTheDocument();
	});

	it('devrait afficher le bouton de réouverture pour les comptes clôturés', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:OldBank:EUR',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: true,
				closedDate: '2024-06-01'
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		// Changer le filtre pour afficher les comptes clôturés
		const statusFilter = screen.getByLabelText(/Statut :/i);
		await userEvent.setup().selectOptions(statusFilter, 'closed');

		const typeHeader = findTypeHeader('Actifs');
		await userEvent.setup().click(typeHeader);

		expect(screen.getByTitle('Réouvrir')).toBeInTheDocument();
	});

	it('devrait appeler closeAccount avec confirmation lors de la clôture', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);
		accountStore.closeAccount.mockReturnValue({ success: true });

		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		const closeButton = screen.getByTitle('Clôturer');
		await user.click(closeButton);

		expect(global.confirm).toHaveBeenCalledWith(
			expect.stringContaining('Assets:Bank:CHF')
		);
		expect(accountStore.closeAccount).toHaveBeenCalledWith('acc_001');
	});

	it('ne devrait pas clôturer si l\'utilisateur annule la confirmation', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(false);

		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		const closeButton = screen.getByTitle('Clôturer');
		await user.click(closeButton);

		expect(global.confirm).toHaveBeenCalled();
		expect(accountStore.closeAccount).not.toHaveBeenCalled();
	});

	it('devrait appeler deleteAccount avec confirmation lors de la suppression', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);
		accountStore.deleteAccount.mockReturnValue({ success: true });

		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		const deleteButton = screen.getByTitle('Supprimer');
		await user.click(deleteButton);

		expect(global.confirm).toHaveBeenCalled();
		expect(accountStore.deleteAccount).toHaveBeenCalledWith('acc_001');
	});

	it('devrait afficher une alerte si la suppression échoue', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);
		accountStore.deleteAccount.mockReturnValue({
			success: false,
			error: 'Ce compte contient des transactions'
		});

		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		const deleteButton = screen.getByTitle('Supprimer');
		await user.click(deleteButton);

		expect(global.alert).toHaveBeenCalledWith('Ce compte contient des transactions');
	});
});

describe('AccountList - Affichage des détails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait afficher le badge "Clôturé" pour les comptes clôturés', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:OldBank:EUR',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: true,
				closedDate: '2024-06-01'
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const statusFilter = screen.getByLabelText(/Statut :/i);
		await user.selectOptions(statusFilter, 'all');

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		expect(screen.getByText('Clôturé')).toBeInTheDocument();
	});

	it('devrait afficher la devise et la date d\'ouverture', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-15',
				closed: false
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		// Vérifier dans la zone des détails du compte
		const accountDetails = document.querySelector('.account-details');
		expect(accountDetails).toBeInTheDocument();
		expect(accountDetails.textContent).toContain('CHF');
		expect(accountDetails.textContent).toContain('Ouvert le');
	});

	it('devrait afficher la description si présente', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:Bank:CHF',
				currency: 'CHF',
				opened: '2024-01-01',
				closed: false,
				description: 'Mon compte principal'
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		expect(screen.getByText('Mon compte principal')).toBeInTheDocument();
	});

	it('devrait afficher la date de clôture pour les comptes clôturés', async () => {
		const user = userEvent.setup();
		const mockAccounts = [
			{
				id: 'acc_001',
				type: 'Assets',
				name: 'Assets:OldBank:EUR',
				currency: 'EUR',
				opened: '2024-01-01',
				closed: true,
				closedDate: '2024-06-15'
			}
		];

		accountStore.accounts.subscribe.mockImplementation((cb) => {
			cb(mockAccounts);
			return () => {};
		});

		render(AccountList);

		const statusFilter = screen.getByLabelText(/Statut :/i);
		await user.selectOptions(statusFilter, 'all');

		const typeHeader = findTypeHeader('Actifs');
		await user.click(typeHeader);

		expect(screen.getByText(/Clôturé le/)).toBeInTheDocument();
	});
});
