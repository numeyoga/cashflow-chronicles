/**
 * Tests unitaires pour le composant TransactionList
 * Task 19: Tests Svelte pour TransactionList
 * Implémente US-004-11 à US-004-16 : Liste et gestion des transactions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import TransactionList from '../TransactionList.svelte';
import * as transactionStore from '$lib/stores/transactionStore.js';
import * as accountStore from '$lib/stores/accountStore.js';

// Mock des stores
const mockTransactions = [
	{
		id: 'txn_001',
		date: '2024-01-15',
		description: 'Courses Migros',
		payee: 'Migros',
		tags: ['groceries', 'food'],
		posting: [
			{ accountId: 'acc_002', amount: 85.5, currency: 'CHF' },
			{ accountId: 'acc_001', amount: -85.5, currency: 'CHF' }
		]
	},
	{
		id: 'txn_002',
		date: '2024-01-16',
		description: 'Essence',
		payee: 'Shell',
		tags: ['car', 'fuel'],
		posting: [
			{ accountId: 'acc_004', amount: 60.0, currency: 'CHF' },
			{ accountId: 'acc_001', amount: -60.0, currency: 'CHF' }
		]
	},
	{
		id: 'txn_003',
		date: '2024-01-17',
		description: 'Salaire',
		payee: 'Company',
		tags: ['salary'],
		posting: [
			{ accountId: 'acc_001', amount: 5000.0, currency: 'CHF' },
			{ accountId: 'acc_005', amount: -5000.0, currency: 'CHF' }
		]
	}
];

const mockAccounts = [
	{ id: 'acc_001', name: 'Assets:Bank:CHF', currency: 'CHF', type: 'Assets' },
	{ id: 'acc_002', name: 'Expenses:Food:Groceries', currency: 'CHF', type: 'Expenses' },
	{ id: 'acc_004', name: 'Expenses:Transport:Fuel', currency: 'CHF', type: 'Expenses' },
	{ id: 'acc_005', name: 'Income:Salary', currency: 'CHF', type: 'Income' }
];

vi.mock('$lib/stores/transactionStore.js', () => ({
	transactions: {
		subscribe: vi.fn((cb) => {
			cb(mockTransactions);
			return () => {};
		})
	},
	searchTransactions: vi.fn((filters) => {
		// Simple filter implementation for tests
		let result = mockTransactions;

		if (filters.search) {
			const query = filters.search.toLowerCase();
			result = result.filter(
				(t) =>
					t.description.toLowerCase().includes(query) ||
					(t.payee && t.payee.toLowerCase().includes(query))
			);
		}

		if (filters.accountId) {
			result = result.filter((t) =>
				t.posting.some((p) => p.accountId === filters.accountId)
			);
		}

		if (filters.tag) {
			result = result.filter((t) => t.tags && t.tags.includes(filters.tag));
		}

		if (filters.startDate) {
			result = result.filter((t) => t.date >= filters.startDate);
		}

		if (filters.endDate) {
			result = result.filter((t) => t.date <= filters.endDate);
		}

		// Sorting
		if (filters.sortBy === 'date-desc') {
			result = [...result].sort((a, b) => b.date.localeCompare(a.date));
		} else if (filters.sortBy === 'date-asc') {
			result = [...result].sort((a, b) => a.date.localeCompare(b.date));
		}

		return result;
	}),
	getAllTags: vi.fn(() => ['groceries', 'food', 'car', 'fuel', 'salary']),
	deleteTransaction: vi.fn()
}));

vi.mock('$lib/stores/accountStore.js', () => ({
	accounts: {
		subscribe: vi.fn((cb) => {
			cb(mockAccounts);
			return () => {};
		})
	}
}));

vi.mock('$lib/domain/transactionValidator.js', () => ({
	isBalanced: vi.fn((transaction) => {
		// Simple balance check for tests
		const balance = {};
		transaction.posting.forEach((p) => {
			if (!balance[p.currency]) balance[p.currency] = 0;
			balance[p.currency] += p.amount;
		});
		return Object.values(balance).every((b) => Math.abs(b) < 0.01);
	})
}));

describe('TransactionList - Rendering & Empty States', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait afficher le header avec le bouton "Nouvelle transaction"', () => {
		render(TransactionList);

		expect(screen.getByText('Transactions')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Nouvelle transaction/ })).toBeInTheDocument();
	});

	it('devrait afficher un état vide quand aucune transaction n\'existe', () => {
		// Override the mock to return empty array
		transactionStore.transactions.subscribe.mockImplementationOnce((cb) => {
			cb([]);
			return () => {};
		});
		transactionStore.searchTransactions.mockReturnValueOnce([]);

		render(TransactionList);

		expect(screen.getByText(/Aucune transaction trouvée/)).toBeInTheDocument();
		expect(screen.getByText(/Commencez par créer votre première transaction/)).toBeInTheDocument();
	});

	it('devrait afficher les transactions dans un tableau quand des données existent', () => {
		render(TransactionList);

		expect(screen.getByText('Courses Migros')).toBeInTheDocument();
		expect(screen.getByText('Essence')).toBeInTheDocument();
		expect(screen.getByText('Salaire')).toBeInTheDocument();
	});
});

describe('TransactionList - Search & Filters', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait filtrer les transactions par texte de recherche', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		const searchInput = screen.getByPlaceholderText(/Rechercher une transaction/);
		await user.type(searchInput, 'Migros');

		await waitFor(() => {
			// searchTransactions should be called with search filter
			expect(transactionStore.searchTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					search: 'Migros'
				})
			);
		});
	});

	it('devrait toggler le panneau de filtres', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		const filterButton = screen.getByRole('button', { name: /Filtres/ });

		// Filtres devraient être cachés par défaut
		expect(screen.queryByLabelText(/Date de début/)).not.toBeInTheDocument();

		// Afficher les filtres
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Date de fin/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Compte/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Tag/)).toBeInTheDocument();
		});

		// Cacher les filtres
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.queryByLabelText(/Date de début/)).not.toBeInTheDocument();
		});
	});

	it('devrait filtrer par plage de dates', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Ouvrir les filtres
		const filterButton = screen.getByRole('button', { name: /Filtres/ });
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		});

		const startDateInput = screen.getByLabelText(/Date de début/);
		const endDateInput = screen.getByLabelText(/Date de fin/);

		await user.type(startDateInput, '2024-01-16');
		await user.type(endDateInput, '2024-01-17');

		await waitFor(() => {
			expect(transactionStore.searchTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					startDate: '2024-01-16',
					endDate: '2024-01-17'
				})
			);
		});
	});

	it('devrait filtrer par compte', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Ouvrir les filtres
		const filterButton = screen.getByRole('button', { name: /Filtres/ });
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Compte/)).toBeInTheDocument();
		});

		const accountFilter = screen.getByLabelText(/Compte/);
		await user.selectOptions(accountFilter, 'acc_001');

		await waitFor(() => {
			expect(transactionStore.searchTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					accountId: 'acc_001'
				})
			);
		});
	});

	it('devrait filtrer par tag', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Ouvrir les filtres
		const filterButton = screen.getByRole('button', { name: /Filtres/ });
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Tag/)).toBeInTheDocument();
		});

		const tagFilter = screen.getByLabelText(/Tag/);
		await user.selectOptions(tagFilter, 'groceries');

		await waitFor(() => {
			expect(transactionStore.searchTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					tag: 'groceries'
				})
			);
		});
	});

	it('devrait réinitialiser tous les filtres', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Ouvrir les filtres
		const filterButton = screen.getByRole('button', { name: /Filtres/ });
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		});

		// Appliquer des filtres
		const searchInput = screen.getByPlaceholderText(/Rechercher une transaction/);
		await user.type(searchInput, 'Migros');

		const startDateInput = screen.getByLabelText(/Date de début/);
		await user.type(startDateInput, '2024-01-16');

		// Réinitialiser
		const resetButton = screen.getByRole('button', { name: /Réinitialiser/ });
		await user.click(resetButton);

		await waitFor(() => {
			expect(searchInput).toHaveValue('');
			expect(startDateInput).toHaveValue('');
		});
	});
});

describe('TransactionList - Display & Formatting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait formater les dates correctement', () => {
		render(TransactionList);

		// French locale formatting: DD/MM/YYYY
		expect(screen.getByText('15/01/2024')).toBeInTheDocument();
		expect(screen.getByText('16/01/2024')).toBeInTheDocument();
		expect(screen.getByText('17/01/2024')).toBeInTheDocument();
	});

	it('devrait afficher les badges de statut équilibré/déséquilibré', () => {
		render(TransactionList);

		// All mock transactions are balanced
		const balancedBadges = screen.getAllByText(/OK/);
		expect(balancedBadges.length).toBeGreaterThan(0);
	});

	it('devrait afficher les tags des transactions', () => {
		render(TransactionList);

		expect(screen.getByText('groceries')).toBeInTheDocument();
		expect(screen.getByText('food')).toBeInTheDocument();
		expect(screen.getByText('car')).toBeInTheDocument();
		expect(screen.getByText('fuel')).toBeInTheDocument();
		expect(screen.getByText('salary')).toBeInTheDocument();
	});
});

describe('TransactionList - Actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait avoir un bouton "Nouvelle transaction" cliquable', async () => {
		const user = userEvent.setup();

		render(TransactionList);

		const newButton = screen.getByRole('button', { name: /Nouvelle transaction/ });
		expect(newButton).toBeInTheDocument();

		// Verify it can be clicked without errors
		await user.click(newButton);
		expect(newButton).toBeInTheDocument();
	});

	it('devrait avoir des boutons d\'édition cliquables', async () => {
		const user = userEvent.setup();

		render(TransactionList);

		const editButtons = screen.getAllByTitle(/Modifier/);
		expect(editButtons.length).toBeGreaterThan(0);

		// Verify first edit button can be clicked without errors
		await user.click(editButtons[0]);
		expect(editButtons[0]).toBeInTheDocument();
	});

	it('devrait afficher le modal de confirmation de suppression', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		const deleteButtons = screen.getAllByTitle(/Supprimer/);
		await user.click(deleteButtons[0]);

		await waitFor(() => {
			expect(screen.getByText(/Confirmer la suppression/)).toBeInTheDocument();
			expect(screen.getByText(/Courses Migros/)).toBeInTheDocument();
		});
	});

	it('devrait afficher et utiliser le modal de suppression', async () => {
		const user = userEvent.setup();

		transactionStore.deleteTransaction.mockReturnValue({
			success: true
		});

		render(TransactionList);

		// Cliquer sur supprimer
		const deleteButtons = screen.getAllByTitle(/Supprimer/);
		await user.click(deleteButtons[0]);

		await waitFor(() => {
			expect(screen.getByText(/Confirmer la suppression/)).toBeInTheDocument();
		});

		// Verify modal appeared with transaction name
		expect(screen.getByText(/Courses Migros/)).toBeInTheDocument();

		// Find the danger button in the modal
		const confirmButton = screen.getByRole('button', { name: /Supprimer/ });
		// There are multiple "Supprimer" buttons, get the one that's a danger button
		const dangerButton = document.querySelector('.btn-danger');
		expect(dangerButton).toBeTruthy();

		await user.click(dangerButton);

		// Give enough time for the deletion to process
		await waitFor(() => {
			expect(transactionStore.deleteTransaction).toHaveBeenCalled();
		}, { timeout: 3000 });
	});

	it('devrait annuler la suppression lors du clic sur Annuler', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Cliquer sur supprimer
		const deleteButtons = screen.getAllByTitle(/Supprimer/);
		await user.click(deleteButtons[0]);

		await waitFor(() => {
			expect(screen.getByText(/Confirmer la suppression/)).toBeInTheDocument();
		});

		// Annuler
		const cancelButton = screen.getByRole('button', { name: /Annuler/ });
		await user.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByText(/Confirmer la suppression/)).not.toBeInTheDocument();
		});

		expect(transactionStore.deleteTransaction).not.toHaveBeenCalled();
	});

	it('devrait afficher les statistiques du nombre total de transactions', () => {
		render(TransactionList);

		expect(screen.getByText(/3 transaction\(s\)/)).toBeInTheDocument();
	});
});

describe('TransactionList - Tri', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait permettre de trier les transactions par date', async () => {
		const user = userEvent.setup();
		render(TransactionList);

		// Ouvrir les filtres
		const filterButton = screen.getByRole('button', { name: /Filtres/ });
		await user.click(filterButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Trier par/)).toBeInTheDocument();
		});

		const sortSelect = screen.getByLabelText(/Trier par/);

		// Changer le tri
		await user.selectOptions(sortSelect, 'date-asc');

		await waitFor(() => {
			expect(transactionStore.searchTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					sortBy: 'date-asc'
				})
			);
		});
	});
});
