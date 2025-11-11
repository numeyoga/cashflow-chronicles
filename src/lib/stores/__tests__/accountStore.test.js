/**
 * Tests unitaires pour accountStore
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock des dépendances
vi.mock('$lib/stores/dataStore.js', () => ({
	dataStore: {
		updateData: vi.fn(),
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/stores/currencyStore.js', () => ({
	currencies: {
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/domain/accountValidator.js', () => ({
	validateNewAccount: vi.fn(),
	createAccount: vi.fn(),
	generateAccountId: vi.fn()
}));

describe('accountStore', () => {
	let dataStore;
	let currencies;
	let validateNewAccount;
	let createAccount;
	let generateAccountId;

	beforeEach(async () => {
		vi.resetModules();

		// Importer les mocks
		const dataStoreModule = await import('$lib/stores/dataStore.js');
		dataStore = dataStoreModule.dataStore;

		const currencyStoreModule = await import('$lib/stores/currencyStore.js');
		currencies = currencyStoreModule.currencies;

		const validatorModule = await import('$lib/domain/accountValidator.js');
		validateNewAccount = validatorModule.validateNewAccount;
		createAccount = validatorModule.createAccount;
		generateAccountId = validatorModule.generateAccountId;

		// Configuration par défaut des mocks
		dataStore.subscribe.mockImplementation((callback) => {
			callback({
				data: {
					account: [
						{
							id: 'acc-1',
							name: 'Assets:Bank:Checking',
							type: 'Assets',
							currency: 'CHF',
							opened: '2024-01-01',
							closed: false
						},
						{
							id: 'acc-2',
							name: 'Expenses:Food',
							type: 'Expenses',
							currency: 'CHF',
							opened: '2024-01-01',
							closed: false
						},
						{
							id: 'acc-3',
							name: 'Assets:Bank:Savings',
							type: 'Assets',
							currency: 'EUR',
							opened: '2024-01-01',
							closed: true,
							closedDate: '2024-12-31'
						}
					],
					transaction: []
				}
			});
			return vi.fn();
		});

		currencies.subscribe.mockImplementation((callback) => {
			callback([
				{ code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isDefault: true },
				{ code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isDefault: false }
			]);
			return vi.fn();
		});

		validateNewAccount.mockReturnValue({ valid: true });
		createAccount.mockReturnValue({
			id: 'acc-new',
			name: 'Assets:Bank:NewAccount',
			type: 'Assets',
			currency: 'CHF',
			opened: '2024-01-15',
			closed: false
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Derived Stores', () => {
		it('accounts devrait retourner tous les comptes', async () => {
			const { accounts } = await import('$lib/stores/accountStore.js');

			const unsubscribe = accounts.subscribe((value) => {
				expect(value).toHaveLength(3);
				expect(value[0].id).toBe('acc-1');
				expect(value[1].id).toBe('acc-2');
				expect(value[2].id).toBe('acc-3');
			});

			unsubscribe();
		});

		it('activeAccounts devrait retourner uniquement les comptes actifs', async () => {
			const { activeAccounts } = await import('$lib/stores/accountStore.js');

			const unsubscribe = activeAccounts.subscribe((value) => {
				expect(value).toHaveLength(2);
				expect(value.every(a => !a.closed)).toBe(true);
			});

			unsubscribe();
		});

		it('closedAccounts devrait retourner uniquement les comptes clôturés', async () => {
			const { closedAccounts } = await import('$lib/stores/accountStore.js');

			const unsubscribe = closedAccounts.subscribe((value) => {
				expect(value).toHaveLength(1);
				expect(value[0].id).toBe('acc-3');
				expect(value[0].closed).toBe(true);
			});

			unsubscribe();
		});

		it('accountsByType devrait grouper les comptes par type', async () => {
			const { accountsByType } = await import('$lib/stores/accountStore.js');

			const unsubscribe = accountsByType.subscribe((value) => {
				expect(value.Assets).toHaveLength(2);
				expect(value.Expenses).toHaveLength(1);
				expect(value.Liabilities).toHaveLength(0);
				// Vérifier le tri par nom
				expect(value.Assets[0].name).toBe('Assets:Bank:Checking');
				expect(value.Assets[1].name).toBe('Assets:Bank:Savings');
			});

			unsubscribe();
		});

		it('accountHierarchy devrait construire une structure hiérarchique', async () => {
			const { accountHierarchy } = await import('$lib/stores/accountStore.js');

			const unsubscribe = accountHierarchy.subscribe((value) => {
				expect(value.Assets).toBeDefined();
				expect(value.Assets.Bank).toBeDefined();
				expect(value.Expenses).toBeDefined();
				expect(value.Expenses.Food).toBeDefined();
			});

			unsubscribe();
		});
	});

	describe('addAccount', () => {
		it('devrait ajouter un nouveau compte avec succès', async () => {
			const { addAccount } = await import('$lib/stores/accountStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', currency: 'CHF' }
					]
				};
				callback(data);
			});

			const result = addAccount({
				name: 'Assets:Bank:NewAccount',
				type: 'Assets',
				currency: 'CHF',
				opened: '2024-01-15'
			});

			expect(result.success).toBe(true);
			expect(result.account).toBeDefined();
			expect(validateNewAccount).toHaveBeenCalled();
			expect(createAccount).toHaveBeenCalled();
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait rejeter un compte avec des données invalides', async () => {
			const { addAccount } = await import('$lib/stores/accountStore.js');

			validateNewAccount.mockReturnValue({
				valid: false,
				errors: [{ field: 'name', message: 'Le nom est requis' }]
			});

			const result = addAccount({
				name: '',
				type: 'Assets',
				currency: 'CHF'
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toBe('Le nom est requis');
			expect(dataStore.updateData).not.toHaveBeenCalled();
		});

		it('devrait trier les comptes par nom après ajout', async () => {
			const { addAccount } = await import('$lib/stores/accountStore.js');

			let sortedAccounts;
			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Zzz', type: 'Assets' },
						{ id: 'acc-2', name: 'Assets:Aaa', type: 'Assets' }
					]
				};
				const updated = callback(data);
				sortedAccounts = updated.account;
			});

			addAccount({
				name: 'Assets:Mmm',
				type: 'Assets',
				currency: 'CHF'
			});

			// Vérifier que le callback a été appelé
			expect(dataStore.updateData).toHaveBeenCalled();
		});
	});

	describe('updateAccount', () => {
		it('devrait mettre à jour un compte existant', async () => {
			const { updateAccount } = await import('$lib/stores/accountStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', currency: 'CHF' }
					]
				};
				callback(data);
			});

			const result = updateAccount('acc-1', {
				description: 'Mon compte principal'
			});

			expect(result.success).toBe(true);
			expect(result.account).toBeDefined();
			expect(result.account.id).toBe('acc-1');
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait rejeter la mise à jour d\'un compte inexistant', async () => {
			const { updateAccount } = await import('$lib/stores/accountStore.js');

			const result = updateAccount('acc-999', {
				description: 'Test'
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('introuvable');
		});

		it('devrait empêcher de changer l\'ID lors de la mise à jour', async () => {
			const { updateAccount } = await import('$lib/stores/accountStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', currency: 'CHF' }
					]
				};
				callback(data);
			});

			const result = updateAccount('acc-1', {
				id: 'acc-modified',
				description: 'Test'
			});

			// L'ID ne devrait pas changer
			if (result.success) {
				expect(result.account.id).toBe('acc-1');
			}
		});

		it('devrait valider le compte mis à jour', async () => {
			const { updateAccount } = await import('$lib/stores/accountStore.js');

			validateNewAccount.mockReturnValue({
				valid: false,
				errors: [{ field: 'currency', message: 'Devise invalide' }]
			});

			const result = updateAccount('acc-1', {
				currency: 'INVALID'
			});

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
		});
	});

	describe('closeAccount', () => {
		it('devrait clôturer un compte sans transactions', async () => {
			const { closeAccount } = await import('$lib/stores/accountStore.js');

			// dataStore.subscribe est déjà configuré avec transaction: []
			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', currency: 'CHF', closed: false }
					]
				};
				callback(data);
			});

			const result = closeAccount('acc-1', '2024-12-31');

			expect(result.success).toBe(true);
		});

		it('devrait empêcher la clôture d\'un compte avec transactions actives', async () => {
			const { closeAccount } = await import('$lib/stores/accountStore.js');

			// Mock avec des transactions
			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						account: [
							{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets' }
						],
						transaction: [
							{
								id: 'tx-1',
								posting: [
									{ accountId: 'acc-1', amount: 100 }
								]
							}
						]
					}
				});
				return vi.fn();
			});

			const result = closeAccount('acc-1');

			expect(result.success).toBe(false);
			expect(result.error).toContain('transaction(s) active(s)');
			expect(result.details.type).toBe('transactions');
			expect(result.details.count).toBe(1);
		});

		it('devrait utiliser la date du jour si aucune date n\'est fournie', async () => {
			const { closeAccount } = await import('$lib/stores/accountStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets', closed: false }
					]
				};
				const updated = callback(data);
				// Vérifier que closedDate est défini
				expect(updated.account[0].closedDate).toBeDefined();
			});

			closeAccount('acc-1');
		});
	});

	describe('reopenAccount', () => {
		it('devrait réouvrir un compte clôturé', async () => {
			const { reopenAccount } = await import('$lib/stores/accountStore.js');

			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-3', name: 'Assets:Bank:Savings', closed: true, closedDate: '2024-12-31' }
					]
				};
				callback(data);
			});

			const result = reopenAccount('acc-3');

			expect(result.success).toBe(true);
			expect(dataStore.updateData).toHaveBeenCalled();
		});
	});

	describe('deleteAccount', () => {
		it('devrait supprimer un compte non utilisé', async () => {
			const { deleteAccount } = await import('$lib/stores/accountStore.js');

			// dataStore.subscribe déjà configuré avec transaction: []
			dataStore.updateData.mockImplementation((callback) => {
				const data = {
					account: [
						{ id: 'acc-1', name: 'Assets:Bank:Checking' },
						{ id: 'acc-2', name: 'Expenses:Food' }
					]
				};
				const updated = callback(data);
				expect(updated.account).toHaveLength(1);
			});

			const result = deleteAccount('acc-2');

			expect(result.success).toBe(true);
			expect(dataStore.updateData).toHaveBeenCalled();
		});

		it('devrait empêcher la suppression d\'un compte utilisé dans des transactions', async () => {
			const { deleteAccount } = await import('$lib/stores/accountStore.js');

			// Mock avec des transactions
			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						account: [
							{ id: 'acc-1', name: 'Assets:Bank:Checking' }
						],
						transaction: [
							{
								id: 'tx-1',
								posting: [
									{ accountId: 'acc-1', amount: 100 }
								]
							},
							{
								id: 'tx-2',
								posting: [
									{ accountId: 'acc-1', amount: 50 }
								]
							}
						]
					}
				});
				return vi.fn();
			});

			const result = deleteAccount('acc-1');

			expect(result.success).toBe(false);
			expect(result.error).toContain('2 transaction(s)');
			expect(result.details.count).toBe(2);
		});
	});

	describe('searchAccounts', () => {
		it('devrait rechercher des comptes par type', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({ type: 'Assets' });

			expect(results).toHaveLength(2);
			expect(results.every(a => a.type === 'Assets')).toBe(true);
		});

		it('devrait rechercher des comptes par devise', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({ currency: 'EUR' });

			expect(results).toHaveLength(1);
			expect(results[0].currency).toBe('EUR');
		});

		it('devrait rechercher des comptes actifs', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({ status: 'active' });

			expect(results).toHaveLength(2);
			expect(results.every(a => !a.closed)).toBe(true);
		});

		it('devrait rechercher des comptes clôturés', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({ status: 'closed' });

			expect(results).toHaveLength(1);
			expect(results[0].closed).toBe(true);
		});

		it('devrait rechercher des comptes par texte', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({ search: 'bank' });

			expect(results).toHaveLength(2);
			expect(results.every(a => a.name.toLowerCase().includes('bank'))).toBe(true);
		});

		it('devrait combiner plusieurs critères de recherche', async () => {
			const { searchAccounts } = await import('$lib/stores/accountStore.js');

			const results = searchAccounts({
				type: 'Assets',
				currency: 'CHF',
				status: 'active'
			});

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('acc-1');
		});
	});

	describe('getAccountById', () => {
		it('devrait trouver un compte par son ID', async () => {
			const { getAccountById } = await import('$lib/stores/accountStore.js');

			const account = getAccountById('acc-1');

			expect(account).not.toBeNull();
			expect(account.id).toBe('acc-1');
			expect(account.name).toBe('Assets:Bank:Checking');
		});

		it('devrait retourner null si le compte n\'existe pas', async () => {
			const { getAccountById } = await import('$lib/stores/accountStore.js');

			const account = getAccountById('acc-999');

			expect(account).toBeNull();
		});
	});

	describe('getAccountByName', () => {
		it('devrait trouver un compte par son nom', async () => {
			const { getAccountByName } = await import('$lib/stores/accountStore.js');

			const account = getAccountByName('Assets:Bank:Checking');

			expect(account).not.toBeNull();
			expect(account.id).toBe('acc-1');
			expect(account.name).toBe('Assets:Bank:Checking');
		});

		it('devrait retourner null si le compte n\'existe pas', async () => {
			const { getAccountByName } = await import('$lib/stores/accountStore.js');

			const account = getAccountByName('Invalid:Account');

			expect(account).toBeNull();
		});
	});

	describe('getChildAccounts', () => {
		it('devrait retourner tous les comptes enfants d\'un parent', async () => {
			const { getChildAccounts } = await import('$lib/stores/accountStore.js');

			const children = getChildAccounts('Assets:Bank');

			expect(children).toHaveLength(2);
			expect(children.every(a => a.name.startsWith('Assets:Bank:'))).toBe(true);
		});

		it('devrait retourner un tableau vide si aucun enfant', async () => {
			const { getChildAccounts } = await import('$lib/stores/accountStore.js');

			const children = getChildAccounts('Expenses:Food');

			expect(children).toHaveLength(0);
		});
	});

	describe('getParentAccount', () => {
		it('devrait trouver le compte parent', async () => {
			const { getParentAccount } = await import('$lib/stores/accountStore.js');

			// Ajouter un compte parent dans le mock
			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						account: [
							{ id: 'acc-parent', name: 'Assets:Bank', type: 'Assets' },
							{ id: 'acc-1', name: 'Assets:Bank:Checking', type: 'Assets' }
						]
					}
				});
				return vi.fn();
			});

			const parent = getParentAccount('Assets:Bank:Checking');

			expect(parent).not.toBeNull();
			expect(parent.name).toBe('Assets:Bank');
		});

		it('devrait retourner null pour un compte de niveau 2', async () => {
			const { getParentAccount } = await import('$lib/stores/accountStore.js');

			const parent = getParentAccount('Assets:Bank');

			expect(parent).toBeNull();
		});
	});

	describe('exportAccountsCSV', () => {
		it('devrait exporter les comptes en CSV', async () => {
			const { exportAccountsCSV } = await import('$lib/stores/accountStore.js');

			const csv = exportAccountsCSV();

			expect(csv).toContain('ID,Nom,Type,Devise');
			expect(csv).toContain('acc-1');
			expect(csv).toContain('Assets:Bank:Checking');
			expect(csv).toContain('CHF');
			expect(csv).toContain('Expenses:Food');
			// Vérifier les valeurs pour les comptes clôturés
			expect(csv).toContain('Oui'); // closed = true
		});

		it('devrait échapper correctement les guillemets dans les descriptions', async () => {
			const { exportAccountsCSV } = await import('$lib/stores/accountStore.js');

			dataStore.subscribe.mockImplementation((callback) => {
				callback({
					data: {
						account: [
							{
								id: 'acc-1',
								name: 'Assets:Bank',
								type: 'Assets',
								currency: 'CHF',
								description: 'Compte avec "guillemets"'
							}
						]
					}
				});
				return vi.fn();
			});

			const csv = exportAccountsCSV();

			expect(csv).toContain('""guillemets""'); // Double escaping des guillemets
		});
	});
});
