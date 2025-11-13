<script>
	/**
	 * BulkTableHeader - En-tête du tableau avec tri et sélection globale
	 */
	import { createEventDispatcher } from 'svelte';

	let {
		sortConfig = { field: 'date', direction: 'desc' },
		allSelected = false,
		partialSelection = false
	} = $props();

	const dispatch = createEventDispatcher();

	const sortableColumns = [
		{ field: 'date', label: 'Date' },
		{ field: 'description', label: 'Description' },
		{ field: 'payee', label: 'Bénéficiaire' },
		{ field: 'amount', label: 'Montant' }
	];

	function handleSort(field) {
		let direction = 'asc';

		// Si on clique sur le même champ, inverser la direction
		if (sortConfig.field === field) {
			direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
		}

		dispatch('sort', { field, direction });
	}

	function handleSelectAll(event) {
		dispatch('selectAll', { selected: event.target.checked });
	}

	function getSortIcon(field) {
		if (sortConfig.field !== field) return '↕';
		return sortConfig.direction === 'asc' ? '▲' : '▼';
	}
</script>

<thead class="bulk-table-header">
	<tr>
		<!-- Checkbox sélection globale -->
		<th class="col-checkbox">
			<input
				type="checkbox"
				checked={allSelected}
				indeterminate={partialSelection && !allSelected}
				onchange={handleSelectAll}
				title={allSelected
					? 'Désélectionner tout'
					: partialSelection
						? 'Sélection partielle'
						: 'Sélectionner tout'}
			/>
		</th>

		<!-- Colonnes triables -->
		{#each sortableColumns as column}
			<th
				class="col-sortable"
				class:sorted={sortConfig.field === column.field}
				onclick={() => handleSort(column.field)}
				title={`Trier par ${column.label}`}
			>
				<span class="header-content">
					{column.label}
					<span class="sort-icon">{getSortIcon(column.field)}</span>
				</span>
			</th>
		{/each}

		<!-- Colonnes non triables -->
		<th class="col-accounts">Comptes</th>
		<th class="col-balance">Balance</th>
		<th class="col-actions">Actions</th>
	</tr>
</thead>

<style>
	.bulk-table-header {
		background-color: #f8f9fa;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	th {
		padding: 1rem 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #555;
		border-bottom: 2px solid #dee2e6;
		white-space: nowrap;
	}

	.col-checkbox {
		width: 40px;
		text-align: center;
	}

	.col-checkbox input[type='checkbox'] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.col-sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s;
	}

	.col-sortable:hover {
		background-color: #e9ecef;
	}

	.col-sortable.sorted {
		background-color: #e3f2fd;
		color: #1976d2;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-icon {
		font-size: 0.85rem;
		color: #999;
		transition: color 0.2s;
	}

	.col-sortable.sorted .sort-icon {
		color: #1976d2;
	}

	.col-accounts {
		min-width: 150px;
	}

	.col-balance {
		width: 100px;
		text-align: center;
	}

	.col-actions {
		width: 120px;
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		th {
			padding: 0.75rem 0.5rem;
			font-size: 0.9rem;
		}

		.col-accounts {
			min-width: 100px;
		}
	}

	@media (max-width: 768px) {
		/* Sur mobile, le tableau sera remplacé par des cards */
		.bulk-table-header {
			display: none;
		}
	}
</style>
