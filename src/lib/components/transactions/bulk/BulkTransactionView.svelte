<script>
	/**
	 * BulkTransactionView - Composant principal orchestrant la vue de saisie en masse
	 */
	import { onMount } from 'svelte';
	import BulkToolbar from './BulkToolbar.svelte';
	import QuickAddForm from './QuickAddForm.svelte';
	import BulkTransactionTable from './BulkTransactionTable.svelte';
	import {
		filterTransactions,
		sortTransactions,
		duplicateTransaction,
		exportToCSV
	} from './bulkTransactionHelpers.js';

	// Import des stores
	import {
		transactions as transactionsStore,
		addTransaction,
		updateTransaction,
		deleteTransaction,
		getAllTags,
		getAllPayees
	} from '$lib/stores/transactionStore.js';
	import { accounts as accountsStore } from '$lib/stores/accountStore.js';
	import { currencies as currenciesStore, defaultCurrency } from '$lib/stores/currencyStore.js';

	// État global de la vue
	let filters = $state({
		search: '',
		dateFrom: '',
		dateTo: '',
		accounts: [],
		tags: [],
		balanceStatus: 'all'
	});

	let sortConfig = $state({ field: 'date', direction: 'desc' });
	let expandedRows = $state(new Set());
	let selectedTransactions = $state(new Set());
	let currentPage = $state(1);
	let itemsPerPage = $state(50);
	let notification = $state(null);

	// Données des stores
	let allTransactions = $derived($transactionsStore || []);
	let accounts = $derived($accountsStore || []);
	let currencies = $derived($currenciesStore || []);
	let allTags = $derived(getAllTags());
	let allPayees = $derived(getAllPayees());

	// Transactions filtrées et triées
	let filteredTransactions = $derived(filterTransactions(allTransactions, filters));
	let sortedTransactions = $derived(sortTransactions(filteredTransactions, sortConfig));

	// Fonctions de notification
	function showNotification(message, type = 'success') {
		notification = { message, type };
		setTimeout(() => {
			notification = null;
		}, 3000);
	}

	// Handlers du Toolbar
	function handleFilterChange(event) {
		filters = event.detail.filters;
		currentPage = 1; // Réinitialiser à la page 1 lors du filtrage
	}

	function handleBulkDelete() {
		const selectedIds = Array.from(selectedTransactions);

		selectedIds.forEach((id) => {
			deleteTransaction(id);
		});

		selectedTransactions.clear();
		showNotification(`${selectedIds.length} transaction(s) supprimée(s)`, 'success');
	}

	function handleExportCSV() {
		const transactionsToExport =
			selectedTransactions.size > 0
				? allTransactions.filter((txn) => selectedTransactions.has(txn.id))
				: filteredTransactions;

		const csvContent = exportToCSV(transactionsToExport, accounts, 'compact');

		// Télécharger le fichier
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		showNotification('Export CSV réussi', 'success');
	}

	function handleClearSelection() {
		selectedTransactions.clear();
	}

	// Handlers du QuickAddForm
	function handleQuickAdd(event) {
		const { transaction } = event.detail;

		try {
			addTransaction(transaction);
			showNotification('Transaction ajoutée avec succès', 'success');
		} catch (error) {
			showNotification(`Erreur: ${error.message}`, 'error');
		}
	}

	// Handlers du Table
	function handleSort(event) {
		sortConfig = event.detail;
	}

	function handleSelectionChange(event) {
		selectedTransactions = event.detail.selectedTransactions;
	}

	function handleExpandChange(event) {
		expandedRows = event.detail.expandedRows;
	}

	function handleSave(event) {
		const { transaction } = event.detail;

		try {
			updateTransaction(transaction.id, transaction);
			showNotification('Transaction mise à jour', 'success');
		} catch (error) {
			showNotification(`Erreur: ${error.message}`, 'error');
		}
	}

	function handleDuplicate(event) {
		const { transaction } = event.detail;

		try {
			const newTransaction = duplicateTransaction(transaction);
			addTransaction(newTransaction);
			showNotification('Transaction dupliquée', 'success');
		} catch (error) {
			showNotification(`Erreur: ${error.message}`, 'error');
		}
	}

	function handleDelete(event) {
		const { transaction } = event.detail;

		if (confirm(`Supprimer la transaction "${transaction.description}" ?`)) {
			try {
				deleteTransaction(transaction.id);
				selectedTransactions.delete(transaction.id);
				showNotification('Transaction supprimée', 'success');
			} catch (error) {
				showNotification(`Erreur: ${error.message}`, 'error');
			}
		}
	}

	function handlePageChange(event) {
		currentPage = event.detail.page;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleItemsPerPageChange(event) {
		itemsPerPage = event.detail.itemsPerPage;
		currentPage = 1; // Réinitialiser à la page 1
	}

	// Raccourcis clavier
	function handleKeyDown(event) {
		// Ctrl/Cmd + N : Focus sur le formulaire d'ajout rapide
		if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
			event.preventDefault();
			document.getElementById('quick-description')?.focus();
		}

		// Ctrl/Cmd + A : Sélectionner tout (si focus dans le tableau)
		if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
			// Laisser le comportement par défaut du navigateur
		}
	}

	onMount(() => {
		// Ajouter les écouteurs d'événements clavier
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<svelte:head>
	<title>Saisie en Masse - Cashflow Chronicles</title>
</svelte:head>

<div class="bulk-transaction-view">
	<!-- En-tête -->
	<header class="page-header">
		<h1 class="page-title">📊 Transactions - Saisie en Masse</h1>
		<p class="page-subtitle">
			Visualisez et éditez vos transactions rapidement avec l'interface de saisie en masse
		</p>
	</header>

	<!-- Notification -->
	{#if notification}
		<div class="notification notification-{notification.type}">
			{notification.message}
		</div>
	{/if}

	<!-- Toolbar -->
	<BulkToolbar
		{filters}
		selectedCount={selectedTransactions.size}
		totalCount={sortedTransactions.length}
		{accounts}
		{allTransactions}
		{allTags}
		on:filterChange={handleFilterChange}
		on:bulkDelete={handleBulkDelete}
		on:exportCSV={handleExportCSV}
		on:clearSelection={handleClearSelection}
	/>

	<!-- Formulaire d'ajout rapide -->
	<QuickAddForm
		{accounts}
		{currencies}
		{allTransactions}
		defaultCurrency={$defaultCurrency}
		on:add={handleQuickAdd}
	/>

	<!-- Tableau des transactions -->
	<BulkTransactionTable
		transactions={sortedTransactions}
		{accounts}
		{currencies}
		{sortConfig}
		{expandedRows}
		{selectedTransactions}
		{currentPage}
		{itemsPerPage}
		on:sort={handleSort}
		on:selectionChange={handleSelectionChange}
		on:expandChange={handleExpandChange}
		on:save={handleSave}
		on:duplicate={handleDuplicate}
		on:delete={handleDelete}
		on:pageChange={handlePageChange}
		on:itemsPerPageChange={handleItemsPerPageChange}
	/>

	<!-- Aide sur les raccourcis clavier -->
	<div class="keyboard-shortcuts">
		<details>
			<summary>⌨️ Raccourcis clavier</summary>
			<ul>
				<li><kbd>Ctrl/Cmd + N</kbd> : Nouvelle transaction (focus sur le formulaire rapide)</li>
				<li><kbd>Ctrl/Cmd + A</kbd> : Sélectionner tout</li>
				<li><kbd>Enter</kbd> : Soumettre le formulaire rapide</li>
			</ul>
		</details>
	</div>
</div>

<style>
	.bulk-transaction-view {
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		color: #333;
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		font-size: 1rem;
		color: #666;
		margin: 0;
	}

	/* Notification */
	.notification {
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
		font-weight: 500;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.notification-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.notification-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	/* Raccourcis clavier */
	.keyboard-shortcuts {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		font-size: 0.9rem;
	}

	.keyboard-shortcuts details {
		cursor: pointer;
	}

	.keyboard-shortcuts summary {
		font-weight: 600;
		color: #555;
		user-select: none;
	}

	.keyboard-shortcuts ul {
		margin-top: 0.5rem;
		padding-left: 1.5rem;
		color: #666;
	}

	.keyboard-shortcuts li {
		margin-bottom: 0.25rem;
	}

	kbd {
		padding: 0.2rem 0.5rem;
		background-color: #fff;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.85rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.bulk-transaction-view {
			padding: 1rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.notification {
			left: 10px;
			right: 10px;
			top: 10px;
		}
	}
</style>
