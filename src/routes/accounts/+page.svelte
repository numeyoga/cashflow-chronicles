<script>
	/**
	 * Page de gestion des comptes
	 * Implémente EPIC-003 : Gestion des Comptes
	 */
	import { accounts, exportAccountsCSV, downloadCSV } from '$lib/stores/accountStore.js';
	import { saveMessage } from '$lib/stores/dataStore.js';
	import AccountForm from '$lib/components/accounts/AccountForm.svelte';
	import AccountList from '$lib/components/accounts/AccountList.svelte';

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
	function handleSuccess(account) {
		showForm = false;
		successMessage = `Compte "${account.name}" créé avec succès !`;
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

	/**
	 * Exporte les comptes au format CSV
	 */
	function handleExport() {
		const csv = exportAccountsCSV();
		const timestamp = new Date().toISOString().split('T')[0];
		downloadCSV(csv, `comptes_${timestamp}.csv`);
		successMessage = 'Comptes exportés avec succès !';
		setTimeout(() => {
			successMessage = null;
		}, 3000);
	}
</script>

<div class="accounts-page">
	<header class="page-header">
		<div class="header-content">
			<h1>🏦 Gestion des Comptes</h1>
			<p class="subtitle">Gérez vos comptes bancaires, actifs, passifs et plus</p>
		</div>
		<div class="header-actions">
			{#if $accounts.length > 0}
				<button class="btn btn-secondary" onclick={handleExport}>
					📥 Exporter
				</button>
			{/if}
			<button class="btn btn-primary btn-add" onclick={handleAdd}>
				+ Nouveau compte
			</button>
		</div>
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
			<AccountForm onSuccess={handleSuccess} onCancel={handleCancel} />
		</div>
	{/if}

	<div class="list-section">
		<AccountList />
	</div>

	{#if $accounts.length === 0}
		<div class="getting-started">
			<h2>Pour commencer</h2>
			<p>Les comptes sont organisés en 5 types selon le principe de la comptabilité en partie double :</p>
			<div class="account-types">
				<div class="type-card">
					<h3>🏦 Assets (Actifs)</h3>
					<p>Ce que vous possédez</p>
					<ul>
						<li>Comptes bancaires</li>
						<li>Espèces</li>
						<li>Investissements</li>
						<li>Immobilier</li>
					</ul>
				</div>
				<div class="type-card">
					<h3>💳 Liabilities (Passifs)</h3>
					<p>Ce que vous devez</p>
					<ul>
						<li>Cartes de crédit</li>
						<li>Prêts bancaires</li>
						<li>Dettes personnelles</li>
					</ul>
				</div>
				<div class="type-card">
					<h3>💰 Income (Revenus)</h3>
					<p>Vos sources de revenus</p>
					<ul>
						<li>Salaire</li>
						<li>Bonus</li>
						<li>Dividendes</li>
						<li>Cadeaux</li>
					</ul>
				</div>
				<div class="type-card">
					<h3>💸 Expenses (Dépenses)</h3>
					<p>Vos catégories de dépenses</p>
					<ul>
						<li>Alimentation</li>
						<li>Logement</li>
						<li>Transport</li>
						<li>Loisirs</li>
					</ul>
				</div>
				<div class="type-card">
					<h3>📊 Equity (Capitaux propres)</h3>
					<p>Votre situation nette</p>
					<ul>
						<li>Capital initial</li>
						<li>Bénéfices reportés</li>
					</ul>
				</div>
			</div>
			<div class="tips">
				<h3>💡 Conseils</h3>
				<ol>
					<li>Créez d'abord vos comptes d'actifs (Assets) comme votre compte bancaire</li>
					<li>Utilisez une structure hiérarchique : <code>Assets:Bank:CHF:PostFinance</code></li>
					<li>Ajoutez vos catégories de dépenses (Expenses) pour suivre vos finances</li>
					<li>N'oubliez pas de spécifier la devise pour chaque compte</li>
				</ol>
			</div>
		</div>
	{/if}
</div>

<style>
	.accounts-page {
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

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
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

	.getting-started > p {
		color: #555;
		margin-bottom: 1.5rem;
	}

	.account-types {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.type-card {
		background: #f8f9fa;
		padding: 1.25rem;
		border-radius: 6px;
		border-left: 4px solid #3498db;
	}

	.type-card h3 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: #333;
		font-size: 1.1rem;
	}

	.type-card p {
		margin: 0 0 0.75rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.type-card ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #555;
		font-size: 0.875rem;
	}

	.type-card li {
		margin-bottom: 0.25rem;
	}

	.tips {
		background: #fff3cd;
		padding: 1.5rem;
		border-radius: 6px;
		border-left: 4px solid #ffc107;
	}

	.tips h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #856404;
	}

	.tips ol {
		margin: 0;
		padding-left: 1.5rem;
		color: #856404;
		line-height: 1.8;
	}

	.tips code {
		background: #fff;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
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

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #7f8c8d;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
	}

	@media (max-width: 768px) {
		.accounts-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
			flex-direction: column;
		}

		.btn-add,
		.btn-secondary {
			width: 100%;
		}

		.account-types {
			grid-template-columns: 1fr;
		}
	}
</style>
