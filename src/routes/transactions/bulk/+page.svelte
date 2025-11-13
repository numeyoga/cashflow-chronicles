<script>
	/**
	 * Page de saisie en masse de transactions
	 * Route: /transactions/bulk
	 */
	import BulkTransactionView from '$lib/components/transactions/bulk/BulkTransactionView.svelte';
</script>

<svelte:head>
	<title>Saisie en Masse - Cashflow Chronicles</title>
	<meta
		name="description"
		content="Interface de saisie en masse pour gérer rapidement vos transactions"
	/>
</svelte:head>

<BulkTransactionView />
