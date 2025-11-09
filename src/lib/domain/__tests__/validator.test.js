/**
 * Tests pour le validateur
 * Tests pour US-001-05
 */

import { describe, it, expect } from 'vitest';
import { validateTOMLStructure, ValidationCode, ValidationSeverity } from '../validator.js';

describe('validateTOMLStructure', () => {
	it('devrait valider un fichier TOML correct', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				lastModified: '2025-01-01T00:00:00Z',
				defaultCurrency: 'CHF'
			},
			currency: [
				{
					code: 'CHF',
					name: 'Swiss Franc',
					symbol: 'CHF',
					decimalPlaces: 2,
					isDefault: true
				}
			],
			account: [],
			transaction: []
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
		expect(result.report).toContain('✓ Structure TOML valide');
	});

	it('devrait détecter l\'absence de version', () => {
		const data = {
			metadata: {
				created: '2025-01-01T00:00:00Z',
				lastModified: '2025-01-01T00:00:00Z'
			},
			currency: []
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].code).toBe(ValidationCode.FILE_003);
	});

	it('devrait détecter un format de version invalide', () => {
		const data = {
			version: '1.0', // Devrait être 1.0.0
			metadata: {
				created: '2025-01-01T00:00:00Z',
				lastModified: '2025-01-01T00:00:00Z'
			},
			currency: []
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(false);
		const versionError = result.errors.find(e => e.code === ValidationCode.FILE_004);
		expect(versionError).toBeDefined();
		expect(versionError.message).toContain('semver');
	});

	it('devrait détecter les sections manquantes', () => {
		const data = {
			version: '1.0.0'
			// metadata et currency manquants
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(false);
		const sectionError = result.errors.find(e => e.code === ValidationCode.FILE_005);
		expect(sectionError).toBeDefined();
		expect(sectionError.message).toContain('metadata');
		expect(sectionError.message).toContain('currency');
	});

	it('devrait détecter un code devise invalide', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				lastModified: '2025-01-01T00:00:00Z'
			},
			currency: [
				{
					code: 'SWISS', // Invalide, devrait être CHF
					name: 'Swiss Franc'
				}
			]
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(false);
		const currencyError = result.errors.find(e => e.code === ValidationCode.CUR_001);
		expect(currencyError).toBeDefined();
		expect(currencyError.message).toContain('SWISS');
	});

	it('devrait détecter une date invalide dans metadata', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '01/01/2025', // Format invalide
				lastModified: '2025-01-01T00:00:00Z'
			},
			currency: []
		};

		const result = validateTOMLStructure(data);

		expect(result.valid).toBe(false);
		const dateError = result.errors.find(e => e.code === ValidationCode.META_001);
		expect(dateError).toBeDefined();
		expect(dateError.message).toContain('ISO 8601');
	});

	it('devrait générer des statistiques correctes', () => {
		const data = {
			version: '1.0.0',
			metadata: {
				created: '2025-01-01T00:00:00Z',
				lastModified: '2025-01-01T00:00:00Z'
			},
			currency: [{ code: 'CHF', name: 'Swiss Franc' }],
			account: [
				{ id: 'acc_001', name: 'Bank' },
				{ id: 'acc_002', name: 'Cash' }
			],
			transaction: [{ id: 'txn_001' }]
		};

		const result = validateTOMLStructure(data);

		expect(result.stats.currencies).toBe(1);
		expect(result.stats.accounts).toBe(2);
		expect(result.stats.transactions).toBe(1);
	});
});
