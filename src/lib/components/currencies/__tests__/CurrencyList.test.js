/**
 * Tests unitaires pour le composant CurrencyList
 * Task 17: Tests Svelte pour CurrencyList
 * Implémente US-002-01 et US-002-02
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CurrencyList from '../CurrencyList.svelte';
import * as currencyStore from '$lib/stores/currencyStore.js';

// Mock des stores et fonctions
vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn()
	},
	deleteCurrency: vi.fn(),
	deleteExchangeRate: vi.fn()
}));

describe('CurrencyList - Rendu de base', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock window.confirm et alert
		global.confirm = vi.fn();
		global.alert = vi.fn();
	});

	it('devrait afficher un message d\'état vide quand il n\'y a aucune devise', () => {
		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb([]);
			return () => {};
		});

		render(CurrencyList);

		expect(screen.getByText('Aucune devise configurée.')).toBeInTheDocument();
		expect(screen.getByText('Ajoutez votre première devise pour commencer.')).toBeInTheDocument();
	});

	it('devrait afficher la liste des devises', () => {
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			},
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		expect(screen.getByText('EUR - Euro')).toBeInTheDocument();
		expect(screen.getByText('USD - US Dollar')).toBeInTheDocument();
	});

	it('devrait afficher le badge "Par défaut" pour la devise par défaut', () => {
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			},
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		// Le badge "Par défaut" devrait être présent pour EUR
		const eurCard = screen.getByText('EUR - Euro').closest('.currency-card');
		expect(within(eurCard).getByText('Par défaut')).toBeInTheDocument();

		// Le badge ne devrait pas être présent pour USD
		const usdCard = screen.getByText('USD - US Dollar').closest('.currency-card');
		expect(within(usdCard).queryByText('Par défaut')).not.toBeInTheDocument();
	});

	it('devrait afficher les détails de la devise (symbole, décimales)', () => {
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		expect(screen.getByText(/€.*2 décimales/)).toBeInTheDocument();
	});

	it('devrait afficher le nombre de taux de change', () => {
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: [
					{ date: '2024-01-01', rate: 1.08, source: 'ECB' },
					{ date: '2024-01-02', rate: 1.09, source: 'ECB' }
				]
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		expect(screen.getByText(/2 taux de change/)).toBeInTheDocument();
	});
});

describe('CurrencyList - Interactions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.confirm = vi.fn();
		global.alert = vi.fn();
	});

	it('devrait permettre de basculer l\'expansion d\'une devise', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		// Cliquer sur la carte pour l'agrandir
		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		// Le panel de détails devrait s'afficher
		expect(screen.getByText('Historique des taux de change')).toBeInTheDocument();
	});

	it('devrait afficher le bouton d\'édition pour toutes les devises', () => {
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const editButtons = screen.getAllByTitle('Modifier');
		expect(editButtons.length).toBeGreaterThan(0);
	});

	it('ne devrait pas afficher le bouton de suppression pour la devise par défaut', () => {
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			},
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		// EUR (par défaut) ne devrait pas avoir de bouton de suppression
		const eurCard = screen.getByText('EUR - Euro').closest('.currency-card');
		expect(within(eurCard).queryByTitle('Supprimer')).not.toBeInTheDocument();

		// USD devrait avoir un bouton de suppression
		const usdCard = screen.getByText('USD - US Dollar').closest('.currency-card');
		expect(within(usdCard).getByTitle('Supprimer')).toBeInTheDocument();
	});

	it('devrait appeler deleteCurrency avec confirmation lors de la suppression', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);
		currencyStore.deleteCurrency.mockReturnValue({ success: true });

		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const deleteButton = screen.getByTitle('Supprimer');
		await user.click(deleteButton);

		expect(global.confirm).toHaveBeenCalledWith(expect.stringContaining('USD'));
		expect(currencyStore.deleteCurrency).toHaveBeenCalledWith('USD');
	});

	it('ne devrait pas supprimer si l\'utilisateur annule la confirmation', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(false);

		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const deleteButton = screen.getByTitle('Supprimer');
		await user.click(deleteButton);

		expect(global.confirm).toHaveBeenCalled();
		expect(currencyStore.deleteCurrency).not.toHaveBeenCalled();
	});

	it('devrait afficher une alerte si la suppression échoue', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);
		currencyStore.deleteCurrency.mockReturnValue({
			success: false,
			error: 'Cette devise est utilisée par des comptes'
		});

		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const deleteButton = screen.getByTitle('Supprimer');
		await user.click(deleteButton);

		expect(global.alert).toHaveBeenCalledWith('Cette devise est utilisée par des comptes');
	});
});

describe('CurrencyList - Historique des taux de change', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.confirm = vi.fn();
	});

	it('devrait afficher un message pour la devise par défaut (pas de taux)', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('EUR - Euro').closest('.currency-header');
		await user.click(currencyHeader);

		expect(
			screen.getByText('La devise par défaut ne peut pas avoir de taux de change.')
		).toBeInTheDocument();
	});

	it('devrait afficher un message si aucun taux de change n\'est défini', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		expect(screen.getByText('Aucun taux de change défini.')).toBeInTheDocument();
	});

	it('devrait afficher le tableau des taux de change', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: [
					{ date: '2024-01-01', rate: 1.08, source: 'ECB' },
					{ date: '2024-01-02', rate: 1.09, source: 'Manual' }
				]
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		// Vérifier les en-têtes du tableau
		expect(screen.getByText('Date')).toBeInTheDocument();
		expect(screen.getByText('Taux')).toBeInTheDocument();
		expect(screen.getByText('Source')).toBeInTheDocument();

		// Vérifier les données
		expect(screen.getByText('1.080000')).toBeInTheDocument();
		expect(screen.getByText('1.090000')).toBeInTheDocument();
		expect(screen.getByText('ECB')).toBeInTheDocument();
		expect(screen.getByText('Manual')).toBeInTheDocument();
	});

	it('devrait afficher le bouton "Ajouter un taux" pour les devises non-défaut', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		expect(screen.getByText('+ Ajouter un taux')).toBeInTheDocument();
	});

	it('ne devrait pas afficher le bouton "Ajouter un taux" pour la devise par défaut', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'EUR',
				name: 'Euro',
				symbol: '€',
				decimalPlaces: 2,
				isDefault: true,
				exchangeRate: []
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('EUR - Euro').closest('.currency-header');
		await user.click(currencyHeader);

		expect(screen.queryByText('+ Ajouter un taux')).not.toBeInTheDocument();
	});

	it('devrait permettre de supprimer un taux de change avec confirmation', async () => {
		const user = userEvent.setup();
		global.confirm.mockReturnValue(true);

		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: [{ date: '2024-01-01', rate: 1.08, source: 'ECB' }]
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		// Trouver le bouton de suppression du taux (dans le tableau)
		const deleteButtons = screen.getAllByTitle('Supprimer');
		// Le dernier bouton devrait être celui du taux (le premier est pour la devise)
		const deleteRateButton = deleteButtons[deleteButtons.length - 1];
		await user.click(deleteRateButton);

		expect(global.confirm).toHaveBeenCalledWith(expect.stringContaining('2024-01-01'));
		expect(currencyStore.deleteExchangeRate).toHaveBeenCalledWith('USD', '2024-01-01');
	});
});

describe('CurrencyList - Formatage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devrait formater les taux avec 6 décimales', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: [{ date: '2024-01-01', rate: 1.085432, source: 'ECB' }]
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		expect(screen.getByText('1.085432')).toBeInTheDocument();
	});

	it('devrait afficher "N/A" pour les sources manquantes', async () => {
		const user = userEvent.setup();
		const mockCurrencies = [
			{
				code: 'USD',
				name: 'US Dollar',
				symbol: '$',
				decimalPlaces: 2,
				isDefault: false,
				exchangeRate: [{ date: '2024-01-01', rate: 1.08 }]
			}
		];

		currencyStore.currencies.subscribe.mockImplementation((cb) => {
			cb(mockCurrencies);
			return () => {};
		});

		render(CurrencyList);

		const currencyHeader = screen.getByText('USD - US Dollar').closest('.currency-header');
		await user.click(currencyHeader);

		expect(screen.getByText('N/A')).toBeInTheDocument();
	});
});
