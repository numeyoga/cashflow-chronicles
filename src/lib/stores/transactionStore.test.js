/**
 * Tests pour transactionStore - reorderTransactions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { reorderTransactions } from './transactionStore.js';
import { dataStore } from './dataStore.js';

describe('reorderTransactions', () => {
	beforeEach(async () => {
		// Initialiser le dataStore avec des données de test complètes
		const mockData = {
			version: '1.0.0',
			currency: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
			account: [
				{ id: 'acc_1', name: 'Test Account', type: 'Asset', currency: 'EUR' }
			],
			transaction: [
				{ id: 'txn_1', date: '2025-01-01', description: 'Transaction 1', payee: 'Test', tags: [], posting: [{ accountId: 'acc_1', amount: 100, currency: 'EUR' }, { accountId: 'acc_1', amount: -100, currency: 'EUR' }] },
				{ id: 'txn_2', date: '2025-01-02', description: 'Transaction 2', payee: 'Test', tags: [], posting: [{ accountId: 'acc_1', amount: 100, currency: 'EUR' }, { accountId: 'acc_1', amount: -100, currency: 'EUR' }] },
				{ id: 'txn_3', date: '2025-01-03', description: 'Transaction 3', payee: 'Test', tags: [], posting: [{ accountId: 'acc_1', amount: 100, currency: 'EUR' }, { accountId: 'acc_1', amount: -100, currency: 'EUR' }] },
				{ id: 'txn_4', date: '2025-01-04', description: 'Transaction 4', payee: 'Test', tags: [], posting: [{ accountId: 'acc_1', amount: 100, currency: 'EUR' }, { accountId: 'acc_1', amount: -100, currency: 'EUR' }] },
				{ id: 'txn_5', date: '2025-01-05', description: 'Transaction 5', payee: 'Test', tags: [], posting: [{ accountId: 'acc_1', amount: 100, currency: 'EUR' }, { accountId: 'acc_1', amount: -100, currency: 'EUR' }] }
			],
			budget: [],
			recurring: []
		};

		// Charger les données
		await dataStore.loadData(mockData);
	});

	it('devrait déplacer une transaction vers le bas (after)', () => {
		const result = reorderTransactions('txn_1', 'txn_3', 'after');

		expect(result.success).toBe(true);

		// Vérifier le nouvel ordre
		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		// txn_1 devrait être après txn_3
		expect(ids.indexOf('txn_1')).toBeGreaterThan(ids.indexOf('txn_3'));
		expect(ids).toEqual(['txn_2', 'txn_3', 'txn_1', 'txn_4', 'txn_5']);
	});

	it('devrait déplacer une transaction vers le haut (before)', () => {
		const result = reorderTransactions('txn_4', 'txn_2', 'before');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		// txn_4 devrait être avant txn_2
		expect(ids.indexOf('txn_4')).toBeLessThan(ids.indexOf('txn_2'));
		expect(ids).toEqual(['txn_1', 'txn_4', 'txn_2', 'txn_3', 'txn_5']);
	});

	it('devrait déplacer vers le haut avec position after', () => {
		const result = reorderTransactions('txn_5', 'txn_2', 'after');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		expect(ids).toEqual(['txn_1', 'txn_2', 'txn_5', 'txn_3', 'txn_4']);
	});

	it('devrait déplacer vers le bas avec position before', () => {
		const result = reorderTransactions('txn_2', 'txn_4', 'before');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		expect(ids).toEqual(['txn_1', 'txn_3', 'txn_2', 'txn_4', 'txn_5']);
	});

	it('devrait gérer le déplacement au début (before first)', () => {
		const result = reorderTransactions('txn_3', 'txn_1', 'before');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		expect(ids[0]).toBe('txn_3');
		expect(ids).toEqual(['txn_3', 'txn_1', 'txn_2', 'txn_4', 'txn_5']);
	});

	it('devrait gérer le déplacement à la fin (after last)', () => {
		const result = reorderTransactions('txn_2', 'txn_5', 'after');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		expect(ids[ids.length - 1]).toBe('txn_2');
		expect(ids).toEqual(['txn_1', 'txn_3', 'txn_4', 'txn_5', 'txn_2']);
	});

	it('ne devrait rien faire si même position', () => {
		const result = reorderTransactions('txn_2', 'txn_2', 'after');

		expect(result.success).toBe(true);
		expect(result.message).toBe('Aucun changement');

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		// L'ordre ne devrait pas avoir changé
		expect(ids).toEqual(['txn_1', 'txn_2', 'txn_3', 'txn_4', 'txn_5']);
	});

	it('devrait retourner une erreur si fromId n\'existe pas', () => {
		const result = reorderTransactions('txn_invalid', 'txn_2', 'after');

		expect(result.success).toBe(false);
		expect(result.message).toBe('Transaction non trouvée');
	});

	it('devrait retourner une erreur si toId n\'existe pas', () => {
		const result = reorderTransactions('txn_1', 'txn_invalid', 'after');

		expect(result.success).toBe(false);
		expect(result.message).toBe('Transaction non trouvée');
	});

	it('devrait préserver les données des transactions', () => {
		const result = reorderTransactions('txn_1', 'txn_3', 'after');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const txn1 = currentData.transaction.find((t) => t.id === 'txn_1');

		// Les données de la transaction devraient être intactes
		expect(txn1.date).toBe('2025-01-01');
		expect(txn1.description).toBe('Transaction 1');
	});

	it('devrait gérer des transactions adjacentes (swap)', () => {
		const result = reorderTransactions('txn_2', 'txn_3', 'after');

		expect(result.success).toBe(true);

		const currentData = get(dataStore).data;
		const ids = currentData.transaction.map((t) => t.id);

		// txn_2 et txn_3 devraient avoir échangé leurs positions
		expect(ids).toEqual(['txn_1', 'txn_3', 'txn_2', 'txn_4', 'txn_5']);
	});

	it('devrait gérer plusieurs réorganisations successives', async () => {
		// Première réorganisation
		reorderTransactions('txn_1', 'txn_5', 'after');

		let currentData = get(dataStore).data;
		let ids = currentData.transaction.map((t) => t.id);
		expect(ids).toEqual(['txn_2', 'txn_3', 'txn_4', 'txn_5', 'txn_1']);

		// Deuxième réorganisation
		reorderTransactions('txn_3', 'txn_1', 'after');

		currentData = get(dataStore).data;
		ids = currentData.transaction.map((t) => t.id);
		expect(ids).toEqual(['txn_2', 'txn_4', 'txn_5', 'txn_1', 'txn_3']);
	});
});
