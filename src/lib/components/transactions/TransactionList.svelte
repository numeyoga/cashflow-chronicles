<script>
	/**
	 * TransactionList Component
	 *
	 * Implémente US-004-11 à US-004-16 : Liste et gestion des transactions
	 * Affiche la liste des transactions avec filtres, recherche et tri
	 */

	import {
		transactions,
		searchTransactions,
		deleteTransaction,
		getAllTags,
		calculateBalance
	} from '$lib/stores/transactionStore.js';
	import { accounts } from '$lib/stores/accountStore.js';
	import { isBalanced } from '$lib/domain/transactionValidator.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Critères de filtrage et tri
	let filters = {
		search: '',
		startDate: '',
		endDate: '',
		accountId: '',
		tag: '',
		sortBy: 'date-desc'
	};

	// État
	let showFilters = false;
	let selectedTransaction = null;
	let showDeleteConfirm = false;

	// Computed: Transactions filtrées
	$: filteredTransactions = searchTransactions(filters);
	$: availableTags = getAllTags();

	/**
	 * Réinitialise les filtres
	 */
	function resetFilters() {
		filters = {
			search: '',
			startDate: '',
			endDate: '',
			accountId: '',
			tag: '',
			sortBy: 'date-desc'
		};
	}

	/**
	 * Gère la modification d'une transaction
	 */
	function handleEdit(transaction) {
		dispatch('edit', transaction);
	}

	/**
	 * Affiche la confirmation de suppression
	 */
	function confirmDelete(transaction) {
		selectedTransaction = transaction;
		showDeleteConfirm = true;
	}

	/**
	 * Supprime une transaction
	 */
	function handleDelete() {
		if (selectedTransaction) {
			const result = deleteTransaction(selectedTransaction.id);
			if (result.success) {
				showDeleteConfirm = false;
				selectedTransaction = null;
			}
		}
	}

	/**
	 * Annule la suppression
	 */
	function cancelDelete() {
		showDeleteConfirm = false;
		selectedTransaction = null;
	}

	/**
	 * Affiche les détails d'une transaction
	 */
	function showDetails(transaction) {
		dispatch('details', transaction);
	}

	/**
	 * Obtient le nom d'un compte par son ID
	 */
	function getAccountName(accountId) {
		const account = $accounts.find(a => a.id === accountId);
		return account ? account.name : accountId;
	}

	/**
	 * Formate une date
	 */
	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	/**
	 * Obtient le montant principal d'une transaction (montant positif)
	 */
	function getMainAmount(transaction) {
		if (!transaction.posting || transaction.posting.length === 0) return 0;

		const positiveAmounts = transaction.posting.filter(p => p.amount > 0);
		if (positiveAmounts.length > 0) {
			return positiveAmounts[0];
		}

		return transaction.posting[0];
	}

	/**
	 * Obtient les comptes impliqués dans une transaction
	 */
	function getInvolvedAccounts(transaction) {
		if (!transaction.posting) return [];
		return transaction.posting.map(p => ({
			name: getAccountName(p.accountId),
			amount: p.amount,
			currency: p.currency
		}));
	}
</script>

<div class="transaction-list">
	<!-- En-tête avec filtres -->
	<div class="list-header">
		<div class="header-top">
			<h2>Transactions</h2>
			<button class="btn-primary" on:click={() => dispatch('new')}>
				+ Nouvelle transaction
			</button>
		</div>

		<div class="search-bar">
			<input
				type="text"
				bind:value={filters.search}
				placeholder="Rechercher une transaction (description, bénéficiaire)..."
				class="search-input"
			/>
			<button class="btn-filter" on:click={() => (showFilters = !showFilters)}>
				{showFilters ? '▲' : '▼'} Filtres
			</button>
		</div>

		{#if showFilters}
			<div class="filters-panel">
				<div class="filters-grid">
					<!-- Date de début -->
					<div class="filter-item">
						<label for="start-date">Date de début</label>
						<input type="date" id="start-date" bind:value={filters.startDate} />
					</div>

					<!-- Date de fin -->
					<div class="filter-item">
						<label for="end-date">Date de fin</label>
						<input type="date" id="end-date" bind:value={filters.endDate} />
					</div>

					<!-- Compte -->
					<div class="filter-item">
						<label for="account-filter">Compte</label>
						<select id="account-filter" bind:value={filters.accountId}>
							<option value="">Tous les comptes</option>
							{#each $accounts as account}
								<option value={account.id}>{account.name}</option>
							{/each}
						</select>
					</div>

					<!-- Tag -->
					<div class="filter-item">
						<label for="tag-filter">Tag</label>
						<select id="tag-filter" bind:value={filters.tag}>
							<option value="">Tous les tags</option>
							{#each availableTags as tag}
								<option value={tag}>{tag}</option>
							{/each}
						</select>
					</div>

					<!-- Tri -->
					<div class="filter-item">
						<label for="sort-by">Trier par</label>
						<select id="sort-by" bind:value={filters.sortBy}>
							<option value="date-desc">Date (récente → ancienne)</option>
							<option value="date-asc">Date (ancienne → récente)</option>
							<option value="amount-desc">Montant (grand → petit)</option>
							<option value="amount-asc">Montant (petit → grand)</option>
						</select>
					</div>
				</div>

				<div class="filter-actions">
					<button class="btn-secondary" on:click={resetFilters}>Réinitialiser</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Statistiques -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-label">Total :</span>
			<span class="stat-value">{filteredTransactions.length} transaction(s)</span>
		</div>
	</div>

	<!-- Liste des transactions -->
	{#if filteredTransactions.length === 0}
		<div class="empty-state">
			<p>Aucune transaction trouvée.</p>
			{#if $transactions.length === 0}
				<p>Commencez par créer votre première transaction !</p>
			{:else}
				<p>Essayez de modifier vos critères de recherche.</p>
			{/if}
		</div>
	{:else}
		<div class="transactions-table">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Description</th>
						<th>Bénéficiaire</th>
						<th>Montant</th>
						<th>Comptes</th>
						<th>Tags</th>
						<th>État</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredTransactions as transaction}
						{@const mainAmount = getMainAmount(transaction)}
						{@const involvedAccounts = getInvolvedAccounts(transaction)}
						{@const balanced = isBalanced(transaction)}
						<tr>
							<td>{formatDate(transaction.date)}</td>
							<td>
								<strong>{transaction.description}</strong>
							</td>
							<td>{transaction.payee || '-'}</td>
							<td class="amount">
								{mainAmount.amount > 0 ? '+' : ''}{mainAmount.amount.toFixed(2)} {mainAmount.currency}
							</td>
							<td>
								<div class="accounts-list">
									{#each involvedAccounts as acc}
										<div class="account-item">
											{acc.name.split(':').pop()}
											<span class="account-amount"
												>{acc.amount > 0 ? '+' : ''}{acc.amount.toFixed(2)}</span
											>
										</div>
									{/each}
								</div>
							</td>
							<td>
								<div class="tags-list">
									{#if transaction.tags && transaction.tags.length > 0}
										{#each transaction.tags as tag}
											<span class="tag">{tag}</span>
										{/each}
									{:else}
										<span class="no-tags">-</span>
									{/if}
								</div>
							</td>
							<td>
								{#if balanced}
									<span class="status-badge balanced">✓ OK</span>
								{:else}
									<span class="status-badge unbalanced">✗ Déséquilibré</span>
								{/if}
							</td>
							<td>
								<div class="actions">
									<button
										class="btn-icon"
										on:click={() => showDetails(transaction)}
										title="Voir les détails"
									>
										📄
									</button>
									<button
										class="btn-icon"
										on:click={() => handleEdit(transaction)}
										title="Modifier"
									>
										✏️
									</button>
									<button
										class="btn-icon delete"
										on:click={() => confirmDelete(transaction)}
										title="Supprimer"
									>
										🗑️
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Modal de confirmation de suppression -->
{#if showDeleteConfirm}
	<div class="modal-overlay" on:click={cancelDelete}>
		<div class="modal" on:click|stopPropagation>
			<h3>Confirmer la suppression</h3>
			<p>
				Êtes-vous sûr de vouloir supprimer cette transaction ?
				<br />
				<strong>{selectedTransaction?.description}</strong>
			</p>
			<div class="modal-actions">
				<button class="btn-secondary" on:click={cancelDelete}>Annuler</button>
				<button class="btn-danger" on:click={handleDelete}>Supprimer</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.transaction-list {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.list-header {
		margin-bottom: 2rem;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h2 {
		margin: 0;
		color: #333;
	}

	.search-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.btn-filter {
		padding: 0.75rem 1.5rem;
		background-color: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-filter:hover {
		background-color: #5a6268;
	}

	.filters-panel {
		padding: 1.5rem;
		background-color: #f9f9f9;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-item label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.filter-item input,
	.filter-item select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
	}

	.stats-bar {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stat-label {
		font-weight: 500;
		color: #666;
	}

	.stat-value {
		font-weight: 600;
		color: #333;
		font-size: 1.1rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #777;
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 1.1rem;
	}

	.transactions-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	thead {
		background-color: #f8f9fa;
	}

	th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #555;
		border-bottom: 2px solid #dee2e6;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #e9ecef;
		vertical-align: top;
	}

	tr:hover {
		background-color: #f8f9fa;
	}

	.amount {
		font-family: 'Courier New', monospace;
		font-weight: 600;
		white-space: nowrap;
	}

	.accounts-list {
		font-size: 0.9rem;
	}

	.account-item {
		margin-bottom: 0.25rem;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.account-amount {
		font-family: 'Courier New', monospace;
		color: #666;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.tag {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: #e7f3ff;
		color: #1976d2;
		border-radius: 3px;
		font-size: 0.85rem;
	}

	.no-tags {
		color: #999;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.status-badge.balanced {
		background-color: #4caf50;
		color: white;
	}

	.status-badge.unbalanced {
		background-color: #f44336;
		color: white;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0.25rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.btn-icon:hover {
		opacity: 1;
	}

	.btn-icon.delete:hover {
		filter: brightness(1.2);
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-primary {
		background-color: #4a90e2;
		color: white;
	}

	.btn-primary:hover {
		background-color: #357abd;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #5a6268;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background-color: #c82333;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal h3 {
		margin-top: 0;
		color: #333;
	}

	.modal p {
		margin: 1rem 0;
		color: #666;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.header-top {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.transactions-table {
			font-size: 0.9rem;
		}

		th,
		td {
			padding: 0.5rem;
		}
	}
</style>
