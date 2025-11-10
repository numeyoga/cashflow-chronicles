/**
 * Currency Store pour Cashflow Chronicles
 *
 * Implémente EPIC-002 : Gestion des Devises et Taux de Change
 * Implémente US-002-01 : Ajouter une nouvelle devise
 * Implémente US-002-02 : Enregistrer un taux de change historique
 */

import { derived } from 'svelte/store';
import { dataStore } from './dataStore.js';
import { createCurrency, createExchangeRate } from '../domain/models.js';
import { validateNewCurrency, validateNewExchangeRate } from '../domain/currencyValidator.js';

/**
 * Store dérivé pour les devises
 */
export const currencies = derived(dataStore, $dataStore => {
	if (!$dataStore.data || !$dataStore.data.currency) {
		return [];
	}
	return $dataStore.data.currency;
});

/**
 * Store dérivé pour la devise par défaut
 */
export const defaultCurrency = derived(currencies, $currencies => {
	return $currencies.find(c => c.isDefault === true) || null;
});

/**
 * Ajoute une nouvelle devise
 *
 * @param {Object} currencyData - Données de la devise
 * @returns {Object} Résultat { success, errors }
 */
export function addCurrency(currencyData) {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	// Valider la devise
	const validation = validateNewCurrency(currencyData, currentCurrencies);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Créer la devise
	const newCurrency = createCurrency(currencyData);

	// Ajouter au store
	dataStore.updateData(data => {
		if (!data.currency) {
			data.currency = [];
		}

		// Si cette devise est marquée par défaut, retirer le flag des autres
		if (newCurrency.isDefault) {
			data.currency = data.currency.map(c => ({
				...c,
				isDefault: false
			}));

			// Mettre à jour metadata.defaultCurrency
			if (data.metadata) {
				data.metadata.defaultCurrency = newCurrency.code;
			}
		}

		// Ajouter la nouvelle devise
		data.currency.push(newCurrency);

		// Trier par code alphabétique
		data.currency.sort((a, b) => a.code.localeCompare(b.code));

		return data;
	});

	return {
		success: true,
		currency: newCurrency
	};
}

/**
 * Met à jour une devise existante
 *
 * @param {string} code - Code de la devise à modifier
 * @param {Object} updates - Modifications à apporter
 * @returns {Object} Résultat { success, errors }
 */
export function updateCurrency(code, updates) {
	dataStore.updateData(data => {
		if (!data.currency) {
			return data;
		}

		const index = data.currency.findIndex(c => c.code === code);
		if (index === -1) {
			return data;
		}

		// Appliquer les modifications
		const updatedCurrency = {
			...data.currency[index],
			...updates
		};

		// Si cette devise devient la devise par défaut
		if (updates.isDefault === true && !data.currency[index].isDefault) {
			// Retirer le flag des autres devises
			data.currency = data.currency.map(c => ({
				...c,
				isDefault: c.code === code
			}));

			// Mettre à jour metadata.defaultCurrency
			if (data.metadata) {
				data.metadata.defaultCurrency = code;
			}
		}

		data.currency[index] = updatedCurrency;

		return data;
	});

	return { success: true };
}

/**
 * Vérifie si une devise est utilisée dans les comptes
 *
 * @param {string} code - Code de la devise
 * @returns {Object} { used: boolean, count: number }
 */
function isCurrencyUsedInAccounts(code) {
	let usedCount = 0;
	const unsubscribe = dataStore.subscribe(state => {
		if (state.data && state.data.account) {
			usedCount = state.data.account.filter(a => a.currency === code).length;
		}
	});
	unsubscribe();

	return {
		used: usedCount > 0,
		count: usedCount
	};
}

/**
 * Vérifie si une devise est utilisée dans les transactions
 *
 * @param {string} code - Code de la devise
 * @returns {Object} { used: boolean, count: number }
 */
function isCurrencyUsedInTransactions(code) {
	let usedCount = 0;
	const unsubscribe = dataStore.subscribe(state => {
		if (state.data && state.data.transaction) {
			state.data.transaction.forEach(tx => {
				if (tx.posting) {
					tx.posting.forEach(p => {
						if (p.currency === code) {
							usedCount++;
						}
					});
				}
			});
		}
	});
	unsubscribe();

	return {
		used: usedCount > 0,
		count: usedCount
	};
}

/**
 * Supprime une devise
 *
 * @param {string} code - Code de la devise à supprimer
 * @returns {Object} Résultat { success, error, details }
 */
export function deleteCurrency(code) {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	// Vérifier que ce n'est pas la devise par défaut
	const currency = currentCurrencies.find(c => c.code === code);
	if (currency && currency.isDefault) {
		return {
			success: false,
			error: 'Impossible de supprimer la devise par défaut.'
		};
	}

	// Vérifier si utilisée dans les comptes
	const accountUsage = isCurrencyUsedInAccounts(code);
	if (accountUsage.used) {
		return {
			success: false,
			error: `Impossible de supprimer la devise ${code}. Elle est utilisée dans ${accountUsage.count} compte(s).`,
			details: {
				type: 'accounts',
				count: accountUsage.count
			}
		};
	}

	// Vérifier si utilisée dans les transactions
	const transactionUsage = isCurrencyUsedInTransactions(code);
	if (transactionUsage.used) {
		return {
			success: false,
			error: `Impossible de supprimer la devise ${code}. Elle est utilisée dans ${transactionUsage.count} écriture(s) de transaction.`,
			details: {
				type: 'transactions',
				count: transactionUsage.count
			}
		};
	}

	dataStore.updateData(data => {
		if (!data.currency) {
			return data;
		}

		data.currency = data.currency.filter(c => c.code !== code);
		return data;
	});

	return { success: true };
}

/**
 * Ajoute un taux de change à une devise
 *
 * @param {string} currencyCode - Code de la devise
 * @param {Object} rateData - Données du taux de change
 * @returns {Object} Résultat { success, errors }
 */
export function addExchangeRate(currencyCode, rateData) {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	const currency = currentCurrencies.find(c => c.code === currencyCode);
	if (!currency) {
		return {
			success: false,
			errors: [{ message: 'Devise introuvable.' }]
		};
	}

	// Valider le taux de change
	const validation = validateNewExchangeRate(rateData, currency);
	if (!validation.valid) {
		return {
			success: false,
			errors: validation.errors
		};
	}

	// Créer le taux de change
	const newRate = createExchangeRate(rateData);

	// Ajouter au store
	dataStore.updateData(data => {
		if (!data.currency) {
			return data;
		}

		const index = data.currency.findIndex(c => c.code === currencyCode);
		if (index === -1) {
			return data;
		}

		if (!data.currency[index].exchangeRate) {
			data.currency[index].exchangeRate = [];
		}

		// Ajouter le nouveau taux
		data.currency[index].exchangeRate.push(newRate);

		// Trier par date décroissante
		data.currency[index].exchangeRate.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateB - dateA;
		});

		return data;
	});

	return {
		success: true,
		rate: newRate
	};
}

/**
 * Met à jour un taux de change existant
 *
 * @param {string} currencyCode - Code de la devise
 * @param {string} date - Date du taux à modifier
 * @param {Object} updates - Modifications à apporter
 * @returns {Object} Résultat { success, errors }
 */
export function updateExchangeRate(currencyCode, date, updates) {
	dataStore.updateData(data => {
		if (!data.currency) {
			return data;
		}

		const currencyIndex = data.currency.findIndex(c => c.code === currencyCode);
		if (currencyIndex === -1) {
			return data;
		}

		if (!data.currency[currencyIndex].exchangeRate) {
			return data;
		}

		const rateIndex = data.currency[currencyIndex].exchangeRate.findIndex(
			r => r.date.toString() === date.toString()
		);

		if (rateIndex === -1) {
			return data;
		}

		// Appliquer les modifications
		data.currency[currencyIndex].exchangeRate[rateIndex] = {
			...data.currency[currencyIndex].exchangeRate[rateIndex],
			...updates
		};

		return data;
	});

	return { success: true };
}

/**
 * Vérifie si un taux de change est utilisé dans des transactions
 *
 * @param {string} currencyCode - Code de la devise
 * @param {string} date - Date du taux
 * @returns {Object} { used: boolean, count: number, transactions: Array }
 */
function isExchangeRateUsed(currencyCode, date) {
	let usedCount = 0;
	let transactionIds = [];

	const unsubscribe = dataStore.subscribe(state => {
		if (state.data && state.data.transaction) {
			state.data.transaction.forEach(tx => {
				if (tx.posting) {
					const hasRate = tx.posting.some(p => {
						// Vérifier si ce posting utilise cette devise et a un taux de change
						if (p.currency === currencyCode && p.exchangeRate) {
							// Comparer les dates (convertir en string pour comparaison)
							const rateDate = p.exchangeRate.date || tx.date;
							return rateDate.toString() === date.toString();
						}
						return false;
					});

					if (hasRate) {
						usedCount++;
						transactionIds.push(tx.id || tx.description);
					}
				}
			});
		}
	});
	unsubscribe();

	return {
		used: usedCount > 0,
		count: usedCount,
		transactions: transactionIds
	};
}

/**
 * Supprime un taux de change
 *
 * @param {string} currencyCode - Code de la devise
 * @param {string} date - Date du taux à supprimer
 * @returns {Object} Résultat { success, error, details }
 */
export function deleteExchangeRate(currencyCode, date) {
	// Vérifier si le taux est utilisé dans des transactions
	const usage = isExchangeRateUsed(currencyCode, date);
	if (usage.used) {
		return {
			success: false,
			error: `Impossible de supprimer ce taux de change. Il est utilisé dans ${usage.count} transaction(s).`,
			details: {
				type: 'transactions',
				count: usage.count,
				transactions: usage.transactions
			}
		};
	}

	dataStore.updateData(data => {
		if (!data.currency) {
			return data;
		}

		const currencyIndex = data.currency.findIndex(c => c.code === currencyCode);
		if (currencyIndex === -1) {
			return data;
		}

		if (!data.currency[currencyIndex].exchangeRate) {
			return data;
		}

		data.currency[currencyIndex].exchangeRate = data.currency[currencyIndex].exchangeRate.filter(
			r => r.date.toString() !== date.toString()
		);

		return data;
	});

	return { success: true };
}

/**
 * Récupère le taux de change applicable pour une devise à une date donnée
 *
 * @param {string} currencyCode - Code de la devise
 * @param {Date|string} date - Date de référence
 * @returns {number|null} Taux de change ou null si non trouvé
 */
export function getExchangeRate(currencyCode, date) {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	const currency = currentCurrencies.find(c => c.code === currencyCode);
	if (!currency || !currency.exchangeRate) {
		return null;
	}

	const targetDate = date instanceof Date ? date : new Date(date);

	// Trouver le taux le plus récent <= date de référence
	const applicableRates = currency.exchangeRate
		.filter(r => {
			const rateDate = new Date(r.date);
			return rateDate <= targetDate;
		})
		.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateB - dateA;
		});

	return applicableRates.length > 0 ? applicableRates[0].rate : null;
}

/**
 * Exporte les devises au format CSV
 *
 * @returns {string} Contenu CSV
 */
export function exportCurrenciesCSV() {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	// En-têtes
	const headers = ['Code', 'Nom', 'Symbole', 'Décimales', 'Par défaut'];
	let csv = headers.join(',') + '\n';

	// Données
	currentCurrencies.forEach(currency => {
		const row = [
			currency.code,
			`"${currency.name}"`,
			`"${currency.symbol}"`,
			currency.decimalPlaces,
			currency.isDefault ? 'Oui' : 'Non'
		];
		csv += row.join(',') + '\n';
	});

	return csv;
}

/**
 * Exporte tous les taux de change au format CSV
 *
 * @returns {string} Contenu CSV
 */
export function exportExchangeRatesCSV() {
	let currentCurrencies = [];
	const unsubscribe = currencies.subscribe(value => {
		currentCurrencies = value;
	});
	unsubscribe();

	// En-têtes
	const headers = ['Code Devise', 'Nom Devise', 'Date', 'Taux', 'Source'];
	let csv = headers.join(',') + '\n';

	// Données
	currentCurrencies.forEach(currency => {
		if (currency.exchangeRate && currency.exchangeRate.length > 0) {
			currency.exchangeRate.forEach(rate => {
				const row = [
					currency.code,
					`"${currency.name}"`,
					rate.date,
					rate.rate,
					rate.source ? `"${rate.source}"` : ''
				];
				csv += row.join(',') + '\n';
			});
		}
	});

	return csv;
}

/**
 * Télécharge un fichier CSV
 *
 * @param {string} content - Contenu CSV
 * @param {string} filename - Nom du fichier
 */
export function downloadCSV(content, filename) {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}
