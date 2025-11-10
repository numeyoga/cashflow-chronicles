<script>
	/**
	 * Liste des comptes avec vue hiérarchique
	 * Implémente EPIC-003 : Gestion des Comptes
	 */
	import {
		accounts,
		accountsByType,
		deleteAccount,
		closeAccount,
		reopenAccount,
		getAccountBalance
	} from '$lib/stores/accountStore.js';
	import { currencies } from '$lib/stores/currencyStore.js';
	import AccountForm from './AccountForm.svelte';

	let { onEdit = () => {} } = $props();

	let expandedType = $state(null);
	let editingAccount = $state(null);
	let filterType = $state('all');
	let filterStatus = $state('active');
	let searchQuery = $state('');

	/**
	 * Toggle l'expansion d'un type de compte
	 */
	function toggleExpand(type) {
		if (expandedType === type) {
			expandedType = null;
		} else {
			expandedType = type;
		}
	}

	/**
	 * Ouvre le formulaire d'édition pour un compte
	 */
	function handleEdit(account) {
		editingAccount = account;
		expandedType = null;
	}

	/**
	 * Callback après édition réussie
	 */
	function handleEditSuccess() {
		editingAccount = null;
	}

	/**
	 * Clôture un compte
	 */
	function handleClose(account) {
		if (confirm(`Voulez-vous vraiment clôturer le compte "${account.name}" ?`)) {
			const result = closeAccount(account.id);
			if (!result.success) {
				alert(result.error);
			}
		}
	}

	/**
	 * Réouvre un compte clôturé
	 */
	function handleReopen(account) {
		if (confirm(`Voulez-vous réouvrir le compte "${account.name}" ?`)) {
			const result = reopenAccount(account.id);
			if (!result.success) {
				alert(result.error);
			}
		}
	}

	/**
	 * Supprime un compte
	 */
	function handleDelete(account) {
		if (confirm(`Voulez-vous vraiment supprimer le compte "${account.name}" ?`)) {
			const result = deleteAccount(account.id);
			if (!result.success) {
				alert(result.error);
			}
		}
	}

	/**
	 * Obtient l'icône pour un type de compte
	 */
	function getTypeIcon(type) {
		const icons = {
			Assets: '🏦',
			Liabilities: '💳',
			Income: '💰',
			Expenses: '💸',
			Equity: '📊'
		};
		return icons[type] || '📁';
	}

	/**
	 * Obtient le label pour un type de compte
	 */
	function getTypeLabel(type) {
		const labels = {
			Assets: 'Actifs',
			Liabilities: 'Passifs',
			Income: 'Revenus',
			Expenses: 'Dépenses',
			Equity: 'Capitaux propres'
		};
		return labels[type] || type;
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
	 * Obtient le symbole de la devise
	 */
	function getCurrencySymbol(code) {
		const currency = $currencies.find(c => c.code === code);
		return currency ? currency.symbol : code;
	}

	/**
	 * Filtre les comptes
	 */
	const filteredAccounts = $derived(() => {
		let result = $accounts;

		// Filtrer par statut
		if (filterStatus === 'active') {
			result = result.filter(a => !a.closed);
		} else if (filterStatus === 'closed') {
			result = result.filter(a => a.closed);
		}

		// Filtrer par recherche
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				a =>
					a.name.toLowerCase().includes(query) ||
					(a.description && a.description.toLowerCase().includes(query))
			);
		}

		// Grouper par type
		const byType = {
			Assets: [],
			Liabilities: [],
			Income: [],
			Expenses: [],
			Equity: []
		};

		result.forEach(account => {
			if (byType[account.type]) {
				byType[account.type].push(account);
			}
		});

		// Filtrer par type si nécessaire
		if (filterType !== 'all') {
			Object.keys(byType).forEach(type => {
				if (type !== filterType) {
					byType[type] = [];
				}
			});
		}

		return byType;
	});

	/**
	 * Compte le nombre total de comptes filtrés
	 */
	const totalFilteredAccounts = $derived(() => {
		return Object.values(filteredAccounts()).reduce((sum, accounts) => sum + accounts.length, 0);
	});
</script>

<div class="account-list">
	<div class="list-header">
		<h2>Comptes</h2>
		<div class="filters">
			<div class="filter-group">
				<label for="filter-status">Statut :</label>
				<select id="filter-status" bind:value={filterStatus}>
					<option value="all">Tous</option>
					<option value="active">Actifs</option>
					<option value="closed">Clôturés</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="filter-type">Type :</label>
				<select id="filter-type" bind:value={filterType}>
					<option value="all">Tous les types</option>
					<option value="Assets">🏦 Actifs</option>
					<option value="Liabilities">💳 Passifs</option>
					<option value="Income">💰 Revenus</option>
					<option value="Expenses">💸 Dépenses</option>
					<option value="Equity">📊 Capitaux propres</option>
				</select>
			</div>

			<div class="filter-group search-group">
				<label for="search">Rechercher :</label>
				<input
					type="text"
					id="search"
					bind:value={searchQuery}
					placeholder="Nom ou description..."
				/>
			</div>
		</div>
	</div>

	{#if editingAccount}
		<div class="edit-form-container">
			<AccountForm
				mode="edit"
				account={editingAccount}
				onSuccess={handleEditSuccess}
				onCancel={() => (editingAccount = null)}
			/>
		</div>
	{/if}

	{#if $accounts.length === 0}
		<div class="empty-state">
			<p>Aucun compte configuré.</p>
			<p>Ajoutez votre premier compte pour commencer.</p>
		</div>
	{:else if totalFilteredAccounts() === 0}
		<div class="empty-state">
			<p>Aucun compte ne correspond aux critères de recherche.</p>
		</div>
	{:else}
		<div class="accounts-by-type">
			{#each Object.entries(filteredAccounts()) as [type, typeAccounts]}
				{#if typeAccounts.length > 0}
					<div class="type-section" class:expanded={expandedType === type}>
						<div class="type-header" onclick={() => toggleExpand(type)}>
							<h3>
								{getTypeIcon(type)} {getTypeLabel(type)}
								<span class="count">({typeAccounts.length})</span>
							</h3>
							<button class="btn-icon btn-expand" title="Afficher/Masquer">
								{expandedType === type ? '▲' : '▼'}
							</button>
						</div>

						{#if expandedType === type}
							<div class="accounts-list">
								{#each typeAccounts as account (account.id)}
									<div class="account-card" class:closed={account.closed}>
										<div class="account-info">
											<div class="account-name">
												<strong>{account.name}</strong>
												{#if account.closed}
													<span class="badge badge-closed">Clôturé</span>
												{/if}
											</div>
											<div class="account-details">
												<span class="detail-item">
													💱 {account.currency} ({getCurrencySymbol(account.currency)})
												</span>
												<span class="detail-item">
													📅 Ouvert le {formatDate(account.opened)}
												</span>
												{#if account.closed && account.closedDate}
													<span class="detail-item">
														🔒 Clôturé le {formatDate(account.closedDate)}
													</span>
												{/if}
											</div>
											{#if account.description}
												<div class="account-description">
													{account.description}
												</div>
											{/if}
										</div>
										<div class="account-actions">
											<button
												class="btn-icon btn-edit"
												onclick={() => handleEdit(account)}
												title="Modifier"
											>
												✏️
											</button>
											{#if account.closed}
												<button
													class="btn-icon btn-reopen"
													onclick={() => handleReopen(account)}
													title="Réouvrir"
												>
													🔓
												</button>
											{:else}
												<button
													class="btn-icon btn-close"
													onclick={() => handleClose(account)}
													title="Clôturer"
												>
													🔒
												</button>
											{/if}
											<button
												class="btn-icon btn-delete"
												onclick={() => handleDelete(account)}
												title="Supprimer"
											>
												🗑️
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.account-list {
		width: 100%;
	}

	.list-header {
		margin-bottom: 1.5rem;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
		font-size: 1.75rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		color: #555;
		font-weight: 500;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.search-group {
		flex: 1;
		min-width: 200px;
	}

	.search-group input {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #888;
	}

	.edit-form-container {
		margin-bottom: 2rem;
	}

	.accounts-by-type {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.type-section {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
	}

	.type-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: #f8f9fa;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.type-header:hover {
		background: #e9ecef;
	}

	.type-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count {
		color: #888;
		font-size: 0.9rem;
		font-weight: normal;
	}

	.accounts-list {
		padding: 0.5rem;
	}

	.account-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem;
		margin-bottom: 0.5rem;
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.account-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: #ddd;
	}

	.account-card.closed {
		opacity: 0.7;
		background: #f8f9fa;
	}

	.account-info {
		flex: 1;
	}

	.account-name {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		color: #333;
	}

	.account-details {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #666;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.account-description {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-left: 3px solid #3498db;
		font-size: 0.9rem;
		color: #555;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge-closed {
		background-color: #95a5a6;
		color: white;
	}

	.account-actions {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
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

	.btn-close {
		color: #95a5a6;
	}

	.btn-reopen {
		color: #27ae60;
	}

	.btn-expand {
		font-size: 1rem;
	}
</style>
