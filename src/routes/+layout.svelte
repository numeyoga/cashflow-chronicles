<script>
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { dataStore } from '$lib/stores/dataStore.js';
	import SaveButton from '$lib/components/SaveButton.svelte';
	import { page } from '$app/stores';
	import { initDatabase } from '$lib/infrastructure/indexedDbStorage.js';
	import { migrateFromLocalStorageToIndexedDB } from '$lib/infrastructure/migrationHelper.js';

	let { children } = $props();

	/**
	 * Initialise IndexedDB et migre les données au démarrage
	 */
	onMount(async () => {
		try {
			// Initialiser IndexedDB
			await initDatabase();
			console.log('✓ IndexedDB initialisé');

			// Migrer automatiquement depuis localStorage si nécessaire
			const migrationResult = await migrateFromLocalStorageToIndexedDB();

			if (migrationResult.success) {
				if (migrationResult.alreadyMigrated) {
					console.log('✓ Migration déjà effectuée');
				} else if (migrationResult.noData) {
					console.log('✓ Aucune donnée à migrer');
				} else {
					console.log('✓ Migration réussie:', {
						fichier: migrationResult.migratedFile,
						backups: migrationResult.backupsCount
					});
				}
			} else {
				console.warn('⚠️ Erreur de migration:', migrationResult.error);
			}
		} catch (error) {
			console.error('❌ Erreur lors de l\'initialisation:', error);
		}
	});

	/**
	 * Gère la sauvegarde réussie
	 */
	function handleSaveSuccess(result) {
		// Si on a reçu un nouveau fileHandle, mettre à jour le store
		if (result.fileHandle) {
			dataStore.updateData((data) => {
				// Mise à jour du store avec le nouveau handle
				// Note: le dataStore garde le fileHandle séparément des données
				return data;
			});
		}
	}

	/**
	 * Gère les erreurs de sauvegarde
	 */
	function handleSaveError(error) {
		console.error('Erreur de sauvegarde :', error);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	{#if $dataStore.data}
		<nav class="main-nav">
			<div class="nav-content">
				<a href="/" class="nav-brand">💰 Cashflow Chronicles</a>
				<div class="nav-links">
					<a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>
						🏠 Accueil
					</a>
					<a href="/currencies" class="nav-link" class:active={$page.url.pathname === '/currencies'}>
						💱 Devises
					</a>
					<a href="/accounts" class="nav-link" class:active={$page.url.pathname === '/accounts'}>
						🏦 Comptes
					</a>
					<a href="/transactions" class="nav-link" class:active={$page.url.pathname === '/transactions'}>
						💸 Transactions
					</a>
				</div>
				<div class="nav-actions">
					<SaveButton
						data={$dataStore.data}
						fileHandle={$dataStore.fileHandle}
						showLabel={false}
						onSave={handleSaveSuccess}
						onError={handleSaveError}
					/>
				</div>
			</div>
		</nav>
	{/if}

	<main class="main-content">
		{@render children()}
	</main>
</div>

<style>
	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-nav {
		background: white;
		border-bottom: 2px solid #e9ecef;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 60px;
		gap: 1rem;
	}

	.nav-actions {
		display: flex;
		align-items: center;
	}

	.nav-brand {
		font-size: 1.25rem;
		font-weight: bold;
		color: #2c3e50;
		text-decoration: none;
		transition: color 0.2s;
	}

	.nav-brand:hover {
		color: #3498db;
	}

	.nav-links {
		display: flex;
		gap: 0.5rem;
	}

	.nav-link {
		padding: 0.5rem 1rem;
		color: #555;
		text-decoration: none;
		border-radius: 4px;
		transition: all 0.2s;
		font-weight: 500;
	}

	.nav-link:hover {
		background: #f8f9fa;
		color: #3498db;
	}

	.nav-link.active {
		background: #3498db;
		color: white;
	}

	.main-content {
		flex: 1;
	}

	@media (max-width: 1024px) {
		.nav-links {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.nav-content {
			padding: 0 1rem;
		}

		.nav-brand {
			font-size: 1rem;
		}

		.nav-links {
			gap: 0.25rem;
		}

		.nav-link {
			padding: 0.375rem 0.75rem;
			font-size: 0.875rem;
		}
	}
</style>
