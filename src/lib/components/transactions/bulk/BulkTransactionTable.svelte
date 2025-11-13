<script>
	/**
	 * BulkTransactionTable - Tableau principal avec header, lignes et pagination
	 */
	import { createEventDispatcher } from 'svelte';
	import BulkTableHeader from './BulkTableHeader.svelte';
	import BulkTransactionRow from './BulkTransactionRow.svelte';
	import { paginateTransactions } from './bulkTransactionHelpers.js';

	let {
		transactions = [],
		accounts = [],
		currencies = [],
		sortConfig = { field: 'date', direction: 'desc' },
		expandedRows = new Set(),
		selectedTransactions = new Set(),
		currentPage = 1,
		itemsPerPage = 50
	} = $props();

	const dispatch = createEventDispatcher();

	// Pagination
	let paginationData = $derived(paginateTransactions(transactions, currentPage, itemsPerPage));
	let displayedTransactions = $derived(paginationData.items);
	let totalPages = $derived(paginationData.totalPages);

	// État de sélection globale
	let allSelected = $derived(
		displayedTransactions.length > 0 &&
			displayedTransactions.every((txn) => selectedTransactions.has(txn.id))
	);

	let partialSelection = $derived(
		displayedTransactions.some((txn) => selectedTransactions.has(txn.id)) && !allSelected
	);

	function handleSort(event) {
		dispatch('sort', event.detail);
	}

	function handleSelectAll(event) {
		const { selected } = event.detail;

		if (selected) {
			// Sélectionner toutes les transactions affichées
			displayedTransactions.forEach((txn) => {
				selectedTransactions.add(txn.id);
			});
		} else {
			// Désélectionner toutes les transactions affichées
			displayedTransactions.forEach((txn) => {
				selectedTransactions.delete(txn.id);
			});
		}

		dispatch('selectionChange', { selectedTransactions });
	}

	function handleToggle(event) {
		const { id } = event.detail;

		if (expandedRows.has(id)) {
			expandedRows.delete(id);
		} else {
			expandedRows.add(id);
		}

		dispatch('expandChange', { expandedRows });
	}

	function handleSelect(event) {
		const { id, selected } = event.detail;

		if (selected) {
			selectedTransactions.add(id);
		} else {
			selectedTransactions.delete(id);
		}

		dispatch('selectionChange', { selectedTransactions });
	}

	function handleSave(event) {
		dispatch('save', event.detail);
	}

	function handleDuplicate(event) {
		dispatch('duplicate', event.detail);
	}

	function handleDelete(event) {
		dispatch('delete', event.detail);
	}

	function handlePageChange(newPage) {
		if (newPage >= 1 && newPage <= totalPages) {
			dispatch('pageChange', { page: newPage });
		}
	}

	function handleItemsPerPageChange(event) {
		const newItemsPerPage = parseInt(event.target.value, 10);
		dispatch('itemsPerPageChange', { itemsPerPage: newItemsPerPage });
	}
</script>

<div class="bulk-transaction-table-container">
	{#if transactions.length === 0}
		<div class="empty-state">
			<p class="empty-message">Aucune transaction à afficher</p>
			<p class="empty-hint">Utilisez le formulaire rapide pour ajouter votre première transaction</p>
		</div>
	{:else}
		<div class="table-wrapper">
			<table class="bulk-transaction-table">
				<BulkTableHeader
					{sortConfig}
					{allSelected}
					{partialSelection}
					on:sort={handleSort}
					on:selectAll={handleSelectAll}
				/>

				<tbody>
					{#each displayedTransactions as transaction (transaction.id)}
						<BulkTransactionRow
							{transaction}
							expanded={expandedRows.has(transaction.id)}
							selected={selectedTransactions.has(transaction.id)}
							{accounts}
							{currencies}
							on:toggle={handleToggle}
							on:select={handleSelect}
							on:save={handleSave}
							on:duplicate={handleDuplicate}
							on:delete={handleDelete}
						/>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				<div class="pagination-info">
					Affichage {paginationData.startIndex + 1} à {paginationData.endIndex} sur {transactions.length}
					transaction(s)
				</div>

				<div class="pagination-controls">
					<button
						type="button"
						class="btn-page"
						onclick={() => handlePageChange(1)}
						disabled={currentPage === 1}
						title="Première page"
					>
						⏮
					</button>

					<button
						type="button"
						class="btn-page"
						onclick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						title="Page précédente"
					>
						◀
					</button>

					<span class="page-indicator">
						Page {currentPage} / {totalPages}
					</span>

					<button
						type="button"
						class="btn-page"
						onclick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						title="Page suivante"
					>
						▶
					</button>

					<button
						type="button"
						class="btn-page"
						onclick={() => handlePageChange(totalPages)}
						disabled={currentPage === totalPages}
						title="Dernière page"
					>
						⏭
					</button>

					<select
						class="items-per-page"
						value={itemsPerPage}
						onchange={handleItemsPerPageChange}
						title="Transactions par page"
					>
						<option value="25">25</option>
						<option value="50">50</option>
						<option value="100">100</option>
					</select>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.bulk-transaction-table-container {
		width: 100%;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.table-wrapper {
		overflow-x: auto;
		max-height: 70vh;
		overflow-y: auto;
	}

	.bulk-transaction-table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
	}

	/* Empty State */
	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-message {
		font-size: 1.25rem;
		font-weight: 600;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.empty-hint {
		font-size: 1rem;
		color: #999;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-top: 1px solid #dee2e6;
		background-color: #f8f9fa;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.pagination-info {
		font-size: 0.9rem;
		color: #666;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-page {
		padding: 0.5rem 0.75rem;
		border: 1px solid #dee2e6;
		background-color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.btn-page:hover:not(:disabled) {
		background-color: #e3f2fd;
		border-color: #4a90e2;
	}

	.btn-page:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-indicator {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
	}

	.items-per-page {
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		background-color: white;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.items-per-page:focus {
		outline: none;
		border-color: #4a90e2;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.table-wrapper {
			max-height: 60vh;
		}

		.pagination {
			flex-direction: column;
			align-items: flex-start;
		}

		.pagination-controls {
			width: 100%;
			justify-content: space-between;
			flex-wrap: wrap;
		}

		.page-indicator {
			width: 100%;
			text-align: center;
			padding: 0.5rem 0;
		}
	}
</style>
