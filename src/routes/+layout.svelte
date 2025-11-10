<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { dataStore } from '$lib/stores/dataStore.js';

	let { children } = $props();

	// Obtenir l'URL actuelle pour la navigation active
	let currentPath = $state('');

	$effect(() => {
		if (typeof window !== 'undefined') {
			currentPath = window.location.pathname;
		}
	});
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
					<a href="/" class="nav-link" class:active={currentPath === '/'}>
						🏠 Accueil
					</a>
					<a href="/currencies" class="nav-link" class:active={currentPath === '/currencies'}>
						💱 Devises
					</a>
					<a href="/accounts" class="nav-link" class:active={currentPath === '/accounts'}>
						🏦 Comptes
					</a>
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
