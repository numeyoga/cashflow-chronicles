<script>
	/**
	 * Page Transactions
	 *
	 * Implémente EPIC-004 : Gestion des Transactions Simples
	 * Page principale pour la gestion des transactions
	 */

	import TransactionList from '$lib/components/transactions/TransactionList.svelte';
	import TransactionForm from '$lib/components/transactions/TransactionForm.svelte';
	import { dataStore } from '$lib/stores/dataStore.js';

	// État de la page
	let showForm = false;
	let editingTransaction = null;
	let formMode = 'create';

	/**
	 * Affiche le formulaire de création
	 */
	function handleNew() {
		formMode = 'create';
		editingTransaction = null;
		showForm = true;
	}

	/**
	 * Affiche le formulaire d'édition
	 */
	function handleEdit(event) {
		formMode = 'edit';
		editingTransaction = event.detail;
		showForm = true;
	}

	/**
	 * Ferme le formulaire après sauvegarde
	 */
	function handleSaved() {
		// Attendre un peu pour que l'utilisateur voie le message de succès
		setTimeout(() => {
			showForm = false;
			editingTransaction = null;
		}, 1500);
	}

	/**
	 * Ferme le formulaire sans sauvegarder
	 */
	function handleCancel() {
		showForm = false;
		editingTransaction = null;
	}

	/**
	 * Affiche les détails d'une transaction
	 */
	function handleDetails(event) {
		const transaction = event.detail;
		// TODO: Ouvrir un modal de détails
		console.log('Afficher les détails:', transaction);
	}
</script>

<svelte:head>
	<title>Transactions - Cashflow Chronicles</title>
</svelte:head>

<div class="transactions-page">
	{#if !$dataStore.data}
		<div class="no-data">
			<h2>Aucun fichier chargé</h2>
			<p>Veuillez charger un fichier pour voir vos transactions.</p>
		</div>
	{:else if showForm}
		<!-- Formulaire de création/édition -->
		<TransactionForm
			transaction={editingTransaction}
			mode={formMode}
			on:saved={handleSaved}
			on:cancel={handleCancel}
		/>
	{:else}
		<!-- Liste des transactions -->
		<TransactionList
			on:new={handleNew}
			on:edit={handleEdit}
			on:details={handleDetails}
		/>
	{/if}
</div>

<style>
	.transactions-page {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	.no-data {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
	}

	.no-data h2 {
		margin-bottom: 1rem;
		color: #333;
	}

	.no-data p {
		color: #666;
		font-size: 1.1rem;
	}
</style>
