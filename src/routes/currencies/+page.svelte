<script>
	/**
	 * Page de gestion des devises
	 * Implémente EPIC-002 : Gestion des Devises et Taux de Change
	 */
	import { currencies } from '$lib/stores/currencyStore.js';
	import { saveMessage } from '$lib/stores/dataStore.js';
	import CurrencyForm from '$lib/components/currencies/CurrencyForm.svelte';
	import CurrencyList from '$lib/components/currencies/CurrencyList.svelte';

	let showForm = $state(false);
	let successMessage = $state(null);

	/**
	 * Affiche le formulaire d'ajout
	 */
	function handleAdd() {
		showForm = true;
	}

	/**
	 * Callback après ajout réussi
	 */
	function handleSuccess(currency) {
		showForm = false;
		successMessage = `Devise ${currency.code} ajoutée avec succès !`;
		setTimeout(() => {
			successMessage = null;
		}, 3000);
	}

	/**
	 * Annule le formulaire
	 */
	function handleCancel() {
		showForm = false;
	}
</script>

<div class="currencies-page">
	<header class="page-header">
		<div class="header-content">
			<h1>💱 Gestion des Devises</h1>
			<p class="subtitle">Gérez vos devises et taux de change</p>
		</div>
		<button class="btn btn-primary btn-add" onclick={handleAdd}>+ Ajouter une devise</button>
	</header>

	{#if successMessage}
		<div class="alert alert-success">
			✓ {successMessage}
		</div>
	{/if}

	{#if $saveMessage}
		<div class="alert alert-{$saveMessage.type}">
			{$saveMessage.text}
		</div>
	{/if}

	{#if showForm}
		<div class="form-section">
			<CurrencyForm onSuccess={handleSuccess} onCancel={handleCancel} />
		</div>
	{/if}

	<div class="list-section">
		<CurrencyList />
	</div>

	{#if $currencies.length === 0}
		<div class="getting-started">
			<h2>Pour commencer</h2>
			<ol>
				<li>Ajoutez votre devise principale (ex: CHF pour la Suisse)</li>
				<li>Marquez-la comme "devise par défaut"</li>
				<li>Ajoutez d'autres devises si nécessaire (EUR, USD, etc.)</li>
				<li>Enregistrez les taux de change pour les devises secondaires</li>
			</ol>
		</div>
	{/if}
</div>

<style>
	.currencies-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 2rem;
	}

	.subtitle {
		margin: 0;
		color: #666;
		font-size: 1.1rem;
	}

	.btn-add {
		white-space: nowrap;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.alert-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.alert-info {
		background-color: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.list-section {
		margin-bottom: 2rem;
	}

	.getting-started {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-top: 2rem;
	}

	.getting-started h2 {
		margin-top: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.getting-started ol {
		color: #555;
		line-height: 1.8;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2980b9;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
	}

	@media (max-width: 768px) {
		.currencies-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
		}

		.btn-add {
			width: 100%;
		}
	}
</style>
