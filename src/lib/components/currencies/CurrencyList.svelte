<script>
	/**
	 * Liste des devises avec historique des taux
	 * Implémente US-002-01 et US-002-02
	 */
	import { currencies, deleteCurrency, deleteExchangeRate } from '$lib/stores/currencyStore.js';
	import ExchangeRateForm from './ExchangeRateForm.svelte';
	import CurrencyForm from './CurrencyForm.svelte';

	let { onEdit = () => {} } = $props();

	let expandedCurrency = $state(null);
	let showRateForm = $state(null);
	let editingCurrency = $state(null);
	let editingRate = $state(null);

	/**
	 * Toggle l'expansion d'une devise
	 */
	function toggleExpand(code) {
		if (expandedCurrency === code) {
			expandedCurrency = null;
			showRateForm = null;
		} else {
			expandedCurrency = code;
			showRateForm = null;
		}
	}

	/**
	 * Affiche le formulaire d'ajout de taux
	 */
	function showAddRateForm(code) {
		showRateForm = code;
	}

	/**
	 * Callback après ajout de taux réussi
	 */
	function handleRateAdded() {
		showRateForm = null;
		editingRate = null;
	}

	/**
	 * Ouvre le formulaire d'édition pour un taux
	 */
	function handleEditRate(currency, rate) {
		editingRate = { currency, rate };
		showRateForm = null;
	}

	/**
	 * Ouvre le formulaire d'édition pour une devise
	 */
	function handleEdit(currency) {
		editingCurrency = currency;
		expandedCurrency = null;
		showRateForm = null;
	}

	/**
	 * Callback après édition réussie
	 */
	function handleEditSuccess() {
		editingCurrency = null;
	}

	/**
	 * Supprime une devise
	 */
	function handleDelete(code) {
		if (confirm(`Voulez-vous vraiment supprimer la devise ${code} ?`)) {
			const result = deleteCurrency(code);
			if (!result.success) {
				alert(result.error);
			}
		}
	}

	/**
	 * Supprime un taux de change
	 */
	function handleDeleteRate(currencyCode, date) {
		if (confirm(`Voulez-vous vraiment supprimer le taux du ${date} ?`)) {
			deleteExchangeRate(currencyCode, date);
		}
	}

	/**
	 * Formate une date
	 */
	function formatDate(date) {
		if (!date) return 'N/A';
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleDateString('fr-CH');
	}

	/**
	 * Formate un nombre avec décimales
	 */
	function formatRate(rate, decimals = 6) {
		return parseFloat(rate).toFixed(decimals);
	}
</script>

<div class="currency-list">
	<h2>Devises configurées</h2>

	{#if editingCurrency}
		<div class="edit-form-container">
			<CurrencyForm
				mode="edit"
				currency={editingCurrency}
				onSuccess={handleEditSuccess}
				onCancel={() => (editingCurrency = null)}
			/>
		</div>
	{/if}

	{#if $currencies.length === 0}
		<div class="empty-state">
			<p>Aucune devise configurée.</p>
			<p>Ajoutez votre première devise pour commencer.</p>
		</div>
	{:else}
		<div class="currencies">
			{#each $currencies as currency (currency.code)}
				<div class="currency-card" class:expanded={expandedCurrency === currency.code}>
					<div class="currency-header" onclick={() => toggleExpand(currency.code)}>
						<div class="currency-info">
							<h3>
								{currency.code} - {currency.name}
								{#if currency.isDefault}
									<span class="badge badge-default">Par défaut</span>
								{/if}
							</h3>
							<p class="currency-details">
								{currency.symbol} • {currency.decimalPlaces} décimales
								{#if currency.exchangeRate && currency.exchangeRate.length > 0}
									• {currency.exchangeRate.length} taux de change
								{/if}
							</p>
						</div>
						<div class="currency-actions">
							<button
								class="btn-icon btn-edit"
								onclick={(e) => {
									e.stopPropagation();
									handleEdit(currency);
								}}
								title="Modifier"
							>
								✏️
							</button>
							{#if !currency.isDefault}
								<button
									class="btn-icon btn-delete"
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(currency.code);
									}}
									title="Supprimer"
								>
									🗑️
								</button>
							{/if}
							<button class="btn-icon btn-expand" title="Détails">
								{expandedCurrency === currency.code ? '▲' : '▼'}
							</button>
						</div>
					</div>

					{#if expandedCurrency === currency.code}
						<div class="currency-details-panel">
							<div class="rates-section">
								<div class="rates-header">
									<h4>Historique des taux de change</h4>
									{#if !currency.isDefault}
										<button
											class="btn btn-sm btn-primary"
											onclick={() => showAddRateForm(currency.code)}
										>
											+ Ajouter un taux
										</button>
									{/if}
								</div>

								{#if showRateForm === currency.code}
									<div class="rate-form-container">
										<ExchangeRateForm
											{currency}
											onSuccess={handleRateAdded}
											onCancel={() => (showRateForm = null)}
										/>
									</div>
								{/if}

								{#if editingRate && editingRate.currency.code === currency.code}
									<div class="rate-form-container">
										<ExchangeRateForm
											currency={editingRate.currency}
											mode="edit"
											exchangeRate={editingRate.rate}
											onSuccess={handleRateAdded}
											onCancel={() => (editingRate = null)}
										/>
									</div>
								{/if}

								{#if currency.isDefault}
									<p class="info-message">
										La devise par défaut ne peut pas avoir de taux de change.
									</p>
								{:else if !currency.exchangeRate || currency.exchangeRate.length === 0}
									<p class="info-message">Aucun taux de change défini.</p>
								{:else}
									<table class="rates-table">
										<thead>
											<tr>
												<th>Date</th>
												<th>Taux</th>
												<th>Source</th>
												<th style="width: 100px;">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each currency.exchangeRate as rate (rate.date)}
												<tr>
													<td>{formatDate(rate.date)}</td>
													<td>{formatRate(rate.rate)}</td>
													<td>{rate.source || 'N/A'}</td>
													<td>
														<button
															class="btn-icon btn-edit-small"
															onclick={() => handleEditRate(currency, rate)}
															title="Modifier"
														>
															✏️
														</button>
														<button
															class="btn-icon btn-delete-small"
															onclick={() => handleDeleteRate(currency.code, rate.date)}
															title="Supprimer"
														>
															🗑️
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.currency-list {
		width: 100%;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #888;
	}

	.edit-form-container {
		margin-bottom: 2rem;
	}

	.currencies {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.currency-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		transition: box-shadow 0.2s;
	}

	.currency-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.currency-card.expanded {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.currency-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.currency-header:hover {
		background-color: #f8f9fa;
	}

	.currency-info h3 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.currency-details {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge-default {
		background-color: #3498db;
		color: white;
	}

	.currency-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.25rem;
		padding: 0.25rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
	}

	.btn-delete {
		color: #e74c3c;
	}

	.currency-details-panel {
		padding: 1.25rem;
		background-color: #f8f9fa;
		border-top: 1px solid #ddd;
	}

	.rates-section {
		margin-top: 0;
	}

	.rates-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.rates-header h4 {
		margin: 0;
		color: #333;
		font-size: 1.1rem;
	}

	.rate-form-container {
		margin-bottom: 1.5rem;
	}

	.info-message {
		padding: 1rem;
		background-color: #e3f2fd;
		border-left: 4px solid #2196f3;
		color: #1976d2;
		margin: 0;
	}

	.rates-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
	}

	.rates-table th {
		text-align: left;
		padding: 0.75rem;
		background-color: #f0f0f0;
		color: #555;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.rates-table td {
		padding: 0.75rem;
		border-top: 1px solid #ddd;
	}

	.rates-table tbody tr:hover {
		background-color: #f8f9fa;
	}

	.btn-delete-small,
	.btn-edit-small {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.btn-delete-small:hover,
	.btn-edit-small:hover {
		opacity: 1;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2980b9;
	}
</style>
