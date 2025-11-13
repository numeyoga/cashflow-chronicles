<script>
	/**
	 * BulkToolbar - Barre d'outils avec recherche, filtres et actions en masse
	 */
	import { createEventDispatcher } from 'svelte';
	import { getAutoCompleteOptions, exportToCSV } from './bulkTransactionHelpers.js';

	let {
		filters = {
			search: '',
			dateFrom: '',
			dateTo: '',
			accounts: [],
			tags: [],
			balanceStatus: 'all'
		},
		selectedCount = 0,
		totalCount = 0,
		accounts = [],
		allTransactions = [],
		allTags = []
	} = $props();

	const dispatch = createEventDispatcher();

	// État local
	let showFilters = $state(false);
	let searchDebounceTimer = $state(null);

	// Options d'auto-complétion
	let availableTags = $derived(allTags || []);

	function handleSearchInput(event) {
		const value = event.target.value;

		// Debounce la recherche
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			filters.search = value;
			dispatch('filterChange', { filters });
		}, 300);
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

	function handleFilterChange() {
		dispatch('filterChange', { filters });
	}

	function handleClearFilters() {
		filters.search = '';
		filters.dateFrom = '';
		filters.dateTo = '';
		filters.accounts = [];
		filters.tags = [];
		filters.balanceStatus = 'all';

		dispatch('filterChange', { filters });
	}

	function handleBulkDelete() {
		if (selectedCount === 0) return;

		if (
			confirm(
				`Êtes-vous sûr de vouloir supprimer ${selectedCount} transaction(s) sélectionnée(s) ?`
			)
		) {
			dispatch('bulkDelete');
		}
	}

	function handleExportCSV() {
		dispatch('exportCSV');
	}

	function handleClearSelection() {
		dispatch('clearSelection');
	}

	function handleAccountFilterChange(event) {
		const options = event.target.selectedOptions;
		filters.accounts = Array.from(options).map((option) => option.value);
		handleFilterChange();
	}

	function handleTagFilterChange(event) {
		const options = event.target.selectedOptions;
		filters.tags = Array.from(options).map((option) => option.value);
		handleFilterChange();
	}
</script>

<div class="bulk-toolbar">
	<!-- Ligne principale -->
	<div class="toolbar-main">
		<!-- Recherche -->
		<div class="search-box">
			<input
				type="text"
				placeholder="🔍 Rechercher (description, payee, tags)..."
				value={filters.search}
				oninput={handleSearchInput}
				class="search-input"
			/>
		</div>

		<!-- Bouton Filtres -->
		<button
			type="button"
			class="btn btn-secondary"
			class:active={showFilters}
			onclick={toggleFilters}
		>
			🎯 Filtres
			{#if showFilters}▲{:else}▼{/if}
		</button>

		<!-- Actions en masse -->
		<div class="bulk-actions">
			{#if selectedCount > 0}
				<span class="selection-badge">
					{selectedCount} sélectionnée(s)
					<button
						type="button"
						class="btn-clear-selection"
						onclick={handleClearSelection}
						title="Effacer la sélection"
					>
						✖
					</button>
				</span>

				<button
					type="button"
					class="btn btn-danger"
					onclick={handleBulkDelete}
					title="Supprimer les transactions sélectionnées"
				>
					🗑️ Supprimer ({selectedCount})
				</button>
			{/if}

			<!-- Export -->
			<button type="button" class="btn btn-secondary" onclick={handleExportCSV}>
				📥 Exporter CSV
			</button>
		</div>
	</div>

	<!-- Panneau de filtres (extensible) -->
	{#if showFilters}
		<div class="filters-panel">
			<div class="filters-grid">
				<!-- Date de début -->
				<div class="filter-group">
					<label for="filter-date-from">Date de début</label>
					<input
						id="filter-date-from"
						type="date"
						bind:value={filters.dateFrom}
						onchange={handleFilterChange}
					/>
				</div>

				<!-- Date de fin -->
				<div class="filter-group">
					<label for="filter-date-to">Date de fin</label>
					<input
						id="filter-date-to"
						type="date"
						bind:value={filters.dateTo}
						onchange={handleFilterChange}
					/>
				</div>

				<!-- Comptes -->
				<div class="filter-group">
					<label for="filter-accounts">Comptes</label>
					<select
						id="filter-accounts"
						multiple
						size="4"
						onchange={handleAccountFilterChange}
					>
						{#each accounts as account}
							<option value={account.id} selected={filters.accounts.includes(account.id)}>
								{account.name}
							</option>
						{/each}
					</select>
					<span class="filter-hint">Maintenez Ctrl/Cmd pour sélection multiple</span>
				</div>

				<!-- Tags -->
				<div class="filter-group">
					<label for="filter-tags">Tags</label>
					<select
						id="filter-tags"
						multiple
						size="4"
						onchange={handleTagFilterChange}
					>
						{#each availableTags as tag}
							<option value={tag} selected={filters.tags.includes(tag)}>
								{tag}
							</option>
						{/each}
					</select>
					<span class="filter-hint">Maintenez Ctrl/Cmd pour sélection multiple</span>
				</div>

				<!-- État de balance -->
				<div class="filter-group">
					<label for="filter-balance">État de balance</label>
					<select
						id="filter-balance"
						bind:value={filters.balanceStatus}
						onchange={handleFilterChange}
					>
						<option value="all">Toutes</option>
						<option value="balanced">Équilibrées ✓</option>
						<option value="unbalanced">Déséquilibrées ✗</option>
					</select>
				</div>
			</div>

			<!-- Boutons d'action -->
			<div class="filters-actions">
				<button type="button" class="btn btn-secondary" onclick={handleClearFilters}>
					✖ Effacer les filtres
				</button>

				<span class="filter-result">
					{totalCount} transaction(s) affichée(s)
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.bulk-toolbar {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.toolbar-main {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 300px;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.bulk-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.selection-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #e3f2fd;
		color: #1976d2;
		border-radius: 4px;
		font-weight: 500;
	}

	.btn-clear-selection {
		padding: 0.25rem 0.5rem;
		border: none;
		background-color: transparent;
		cursor: pointer;
		font-size: 1rem;
		color: #1976d2;
		transition: transform 0.2s;
	}

	.btn-clear-selection:hover {
		transform: scale(1.2);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #5a6268;
	}

	.btn-secondary.active {
		background-color: #4a90e2;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background-color: #c82333;
	}

	/* Panneau de filtres */
	.filters-panel {
		padding: 1rem;
		background-color: #f8f9fa;
		border-top: 1px solid #dee2e6;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 500px;
		}
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #555;
		font-size: 0.9rem;
	}

	.filter-group input,
	.filter-group select {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.filter-hint {
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
	}

	.filters-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	.filter-result {
		font-weight: 500;
		color: #555;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.toolbar-main {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: 100%;
		}

		.bulk-actions {
			width: 100%;
			justify-content: space-between;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.filters-actions {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
	}
</style>
