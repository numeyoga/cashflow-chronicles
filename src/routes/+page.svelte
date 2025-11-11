<script>
	/**
	 * Page d'accueil de Cashflow Chronicles
	 */
	import { dataStore, stats } from '$lib/stores/dataStore.js';
	import { loadTOMLFile } from '$lib/infrastructure/tomlParser.js';

	let fileInput;
	let loading = $state(false);
	let error = $state(null);

	/**
	 * Charge un fichier TOML
	 */
	async function handleFileSelect() {
		error = null;
		const file = fileInput.files[0];
		if (!file) return;

		loading = true;

		try {
			const text = await file.text();
			const result = loadTOMLFile(text);

			if (result.success) {
				// Créer un handle de fichier simulé pour le store
				const fileHandle = { name: file.name };
				dataStore.loadData(result.data, fileHandle);
			} else {
				error = result.error;
			}
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	/**
	 * Crée un nouveau fichier avec données par défaut
	 */
	function createNewFile() {
		const defaultData = {
			version: '1.0.0',
			metadata: {
				created: new Date().toISOString(),
				lastModified: new Date().toISOString(),
				defaultCurrency: 'CHF',
				owner: '',
				description: 'Mon budget personnel'
			},
			currency: [
				{
					code: 'CHF',
					name: 'Swiss Franc',
					symbol: 'CHF',
					decimalPlaces: 2,
					isDefault: true
				}
			],
			account: [],
			transaction: [],
			budget: [],
			recurring: []
		};

		const fileHandle = { name: 'nouveau-budget.toml' };
		dataStore.loadData(defaultData, fileHandle);
	}
</script>

<svelte:head>
	<title>Cashflow Chronicles - Gestion de budget personnel</title>
</svelte:head>

<div class="home-page">
	<header class="hero">
		<h1>💰 Cashflow Chronicles</h1>
		<p class="tagline">Gestion de budget personnel multi-devises</p>
		<p class="description">
			Une application moderne inspirée de Plain Text Accounting pour gérer votre budget avec
			rigueur et précision
		</p>
	</header>

	{#if $dataStore.data}
		<div class="dashboard">
			<h2>📊 Tableau de bord</h2>

			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{$stats.currencies}</div>
					<div class="stat-label">Devises</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{$stats.accounts}</div>
					<div class="stat-label">Comptes</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{$stats.transactions}</div>
					<div class="stat-label">Transactions</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{$stats.budgets}</div>
					<div class="stat-label">Budgets</div>
				</div>
			</div>

			<div class="quick-links">
				<h3>Actions rapides</h3>
				<div class="links-grid">
					<a href="/currencies" class="quick-link">
						<span class="icon">💱</span>
						<span class="link-text">Gérer les devises</span>
					</a>
					<a href="/accounts" class="quick-link">
						<span class="icon">🏦</span>
						<span class="link-text">Gérer les comptes</span>
					</a>
					<a href="/transactions" class="quick-link">
						<span class="icon">📝</span>
						<span class="link-text">Transactions</span>
					</a>
					<div class="quick-link disabled">
						<span class="icon">📊</span>
						<span class="link-text">Rapports</span>
					</div>
				</div>
			</div>

			{#if $dataStore.saveMessage}
				<div class="alert alert-{$dataStore.saveMessage.type}">
					{$dataStore.saveMessage.text}
				</div>
			{/if}
		</div>
	{:else}
		<div class="getting-started">
			<h2>Pour commencer</h2>

			<div class="options">
				<div class="option-card">
					<h3>📄 Nouveau fichier</h3>
					<p>Créez un nouveau fichier de budget avec une structure par défaut</p>
					<button class="btn btn-primary" onclick={createNewFile}>Créer un nouveau budget</button>
				</div>

				<div class="option-card">
					<h3>📂 Ouvrir un fichier</h3>
					<p>Chargez un fichier TOML existant</p>
					<input
						type="file"
						accept=".toml"
						bind:this={fileInput}
						onchange={handleFileSelect}
						style="display: none"
					/>
					<button class="btn btn-secondary" onclick={() => fileInput.click()}>
						{loading ? 'Chargement...' : 'Ouvrir un fichier'}
					</button>
				</div>
			</div>

			{#if error}
				<div class="alert alert-error">
					<strong>Erreur :</strong> {error}
				</div>
			{/if}
		</div>

		<div class="features">
			<h2>Fonctionnalités</h2>
			<div class="features-grid">
				<div class="feature">
					<div class="feature-icon">💰</div>
					<h3>Multi-devises</h3>
					<p>Gérez vos comptes dans différentes devises avec taux de change historiques</p>
				</div>
				<div class="feature">
					<div class="feature-icon">📊</div>
					<h3>Comptabilité en partie double</h3>
					<p>Garantit la cohérence et l'exactitude de vos données financières</p>
				</div>
				<div class="feature">
					<div class="feature-icon">💾</div>
					<h3>Format TOML</h3>
					<p>Données lisibles, Git-friendly avec support des commentaires</p>
				</div>
				<div class="feature">
					<div class="feature-icon">🔒</div>
					<h3>Données locales</h3>
					<p>Vos données restent sur votre machine</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.home-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.hero {
		text-align: center;
		padding: 3rem 0;
	}

	.hero h1 {
		margin: 0 0 1rem 0;
		font-size: 3rem;
		color: #2c3e50;
	}

	.tagline {
		font-size: 1.5rem;
		color: #3498db;
		margin: 0 0 1rem 0;
	}

	.description {
		font-size: 1.1rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
	}

	.dashboard {
		margin-top: 2rem;
	}

	.dashboard h2 {
		color: #2c3e50;
		margin-bottom: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: bold;
		color: #3498db;
	}

	.stat-label {
		color: #666;
		margin-top: 0.5rem;
	}

	.quick-links {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.quick-links h3 {
		margin-top: 0;
		color: #2c3e50;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.quick-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
		text-decoration: none;
		color: #333;
		transition: all 0.2s;
	}

	.quick-link:not(.disabled):hover {
		background: #3498db;
		color: white;
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
	}

	.quick-link.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.quick-link .icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.link-text {
		font-weight: 500;
	}

	.getting-started {
		margin-top: 3rem;
	}

	.getting-started h2 {
		text-align: center;
		color: #2c3e50;
		margin-bottom: 2rem;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.option-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.option-card h3 {
		margin-top: 0;
		color: #2c3e50;
	}

	.option-card p {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.features {
		margin-top: 4rem;
	}

	.features h2 {
		text-align: center;
		color: #2c3e50;
		margin-bottom: 2rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.feature {
		text-align: center;
		padding: 2rem;
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature h3 {
		color: #2c3e50;
		margin-bottom: 0.5rem;
	}

	.feature p {
		color: #666;
		line-height: 1.6;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1.5rem;
	}

	.alert-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.alert-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert-info {
		background-color: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
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
		.home-page {
			padding: 1rem;
		}

		.hero h1 {
			font-size: 2rem;
		}

		.tagline {
			font-size: 1.25rem;
		}
	}
</style>
