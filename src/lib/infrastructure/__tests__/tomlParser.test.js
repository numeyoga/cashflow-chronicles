/**
 * Tests pour le parser TOML
 * Tests pour US-001-01 et US-001-02
 */

import { describe, it, expect } from 'vitest';
import { parseTOML, loadTOMLFile, convertDates } from '../tomlParser.js';

describe('parseTOML', () => {
	it('devrait parser un fichier TOML valide', () => {
		const toml = `
version = "1.0.0"

[metadata]
created = "2025-01-01T00:00:00Z"
lastModified = "2025-01-01T00:00:00Z"
defaultCurrency = "CHF"

[[currency]]
code = "CHF"
name = "Swiss Franc"
symbol = "CHF"
decimalPlaces = 2
isDefault = true
`;

		const result = parseTOML(toml);
		expect(result).toBeDefined();
		expect(result.version).toBe('1.0.0');
		expect(result.metadata).toBeDefined();
		expect(result.currency).toBeInstanceOf(Array);
		expect(result.currency[0].code).toBe('CHF');
	});

	it('devrait lancer une erreur pour un fichier vide', () => {
		expect(() => parseTOML('')).toThrow('Le fichier TOML est vide');
	});

	it('devrait lancer une erreur pour une syntaxe TOML invalide', () => {
		const invalidTOML = `
version = "1.0.0
[metadata
`;
		expect(() => parseTOML(invalidTOML)).toThrow('parsing TOML');
	});
});

describe('loadTOMLFile', () => {
	it('devrait charger un fichier TOML valide avec statistiques', () => {
		const toml = `
version = "1.0.0"

[metadata]
created = "2025-01-01T00:00:00Z"
lastModified = "2025-01-01T00:00:00Z"
defaultCurrency = "CHF"

[[currency]]
code = "CHF"
name = "Swiss Franc"
symbol = "CHF"
decimalPlaces = 2
isDefault = true

[[account]]
id = "acc_001"
name = "Assets:Bank:CHF"
type = "Assets"
currency = "CHF"
opened = "2025-01-01"

[[transaction]]
id = "txn_001"
date = "2025-01-15"
description = "Test transaction"
`;

		const result = loadTOMLFile(toml);

		expect(result.success).toBe(true);
		expect(result.data).toBeDefined();
		expect(result.stats).toBeDefined();
		expect(result.stats.currencies).toBe(1);
		expect(result.stats.accounts).toBe(1);
		expect(result.stats.transactions).toBe(1);
		expect(result.loadTime).toBeGreaterThanOrEqual(0);
		expect(result.message).toContain('✓ Fichier chargé avec succès');
	});

	it('devrait retourner une erreur pour un fichier invalide', () => {
		const invalidTOML = 'invalid toml syntax [[[';

		const result = loadTOMLFile(invalidTOML);

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe('convertDates', () => {
	it('devrait convertir les chaînes ISO en objets Date', () => {
		const data = {
			created: '2025-01-01T00:00:00Z',
			lastModified: '2025-01-15T14:30:00Z',
			someDate: '2025-01-20'
		};

		const converted = convertDates(data);

		expect(converted.created).toBeInstanceOf(Date);
		expect(converted.lastModified).toBeInstanceOf(Date);
		expect(converted.someDate).toBeInstanceOf(Date);
	});

	it('devrait gérer les objets imbriqués', () => {
		const data = {
			metadata: {
				created: '2025-01-01T00:00:00Z',
				nested: {
					date: '2025-01-15T00:00:00Z'
				}
			}
		};

		const converted = convertDates(data);

		expect(converted.metadata.created).toBeInstanceOf(Date);
		expect(converted.metadata.nested.date).toBeInstanceOf(Date);
	});

	it('devrait gérer les tableaux', () => {
		const data = {
			transactions: [
				{ date: '2025-01-01T00:00:00Z' },
				{ date: '2025-01-15T00:00:00Z' }
			]
		};

		const converted = convertDates(data);

		expect(converted.transactions[0].date).toBeInstanceOf(Date);
		expect(converted.transactions[1].date).toBeInstanceOf(Date);
	});
});
