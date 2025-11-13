<script>
	/**
	 * PostingRow - Composant pour afficher/éditer une ligne de posting
	 * Utilisé dans la vue étendue d'une transaction
	 */
	import { createEventDispatcher } from 'svelte';

	let {
		posting = $bindable({
			accountId: '',
			amount: '',
			currency: ''
		}),
		index = 0,
		accounts = [],
		currencies = [],
		canRemove = false,
		errors = {}
	} = $props();

	const dispatch = createEventDispatcher();

	// Options de devises pour le select
	let currencyOptions = $derived(currencies.map((c) => c.code));

	// Filtrage des comptes avec recherche
	let accountSearchTerm = $state('');
	let filteredAccounts = $derived(
		accounts.filter(
			(acc) =>
				acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
				acc.id.toLowerCase().includes(accountSearchTerm.toLowerCase())
		)
	);

	function handleChange() {
		dispatch('change', { index, posting });
	}

	function handleRemove() {
		if (canRemove) {
			dispatch('remove', { index });
		}
	}

	function handleAccountChange(event) {
		posting.accountId = event.target.value;

		// Auto-fill currency from account if not set
		const selectedAccount = accounts.find((acc) => acc.id === posting.accountId);
		if (selectedAccount && selectedAccount.currency && !posting.currency) {
			posting.currency = selectedAccount.currency;
		}

		handleChange();
	}

	function handleAmountChange(event) {
		posting.amount = event.target.value;
		handleChange();
	}

	function handleCurrencyChange(event) {
		posting.currency = event.target.value;
		handleChange();
	}
</script>

<tr class="posting-row" class:has-errors={Object.keys(errors).length > 0}>
	<!-- Indentation visuelle -->
	<td colspan="2" class="indent"></td>

	<!-- Compte -->
	<td class="posting-account">
		<select
			value={posting.accountId}
			onchange={handleAccountChange}
			class:error={errors.account}
			title={errors.account}
		>
			<option value="">Sélectionner un compte...</option>
			{#each accounts as account}
				<option value={account.id}>
					{account.name}
				</option>
			{/each}
		</select>
		{#if errors.account}
			<span class="error-text">{errors.account}</span>
		{/if}
	</td>

	<!-- Montant -->
	<td class="posting-amount">
		<input
			type="number"
			step="0.01"
			value={posting.amount}
			oninput={handleAmountChange}
			class:error={errors.amount}
			title={errors.amount}
			placeholder="0.00"
		/>
		{#if errors.amount}
			<span class="error-text">{errors.amount}</span>
		{/if}
	</td>

	<!-- Devise -->
	<td class="posting-currency">
		<select
			value={posting.currency}
			onchange={handleCurrencyChange}
			class:error={errors.currency}
			title={errors.currency}
		>
			<option value="">Devise...</option>
			{#each currencyOptions as curr}
				<option value={curr}>{curr}</option>
			{/each}
		</select>
		{#if errors.currency}
			<span class="error-text">{errors.currency}</span>
		{/if}
	</td>

	<!-- Actions -->
	<td class="posting-actions">
		{#if canRemove}
			<button type="button" class="btn-remove" onclick={handleRemove} title="Supprimer ce posting">
				🗑️
			</button>
		{/if}
	</td>
</tr>

<style>
	.posting-row {
		background-color: #f8f9fa;
		border-left: 3px solid #dee2e6;
	}

	.posting-row:hover {
		background-color: #e9ecef;
	}

	.posting-row.has-errors {
		background-color: #fff5f5;
		border-left-color: #dc3545;
	}

	.indent {
		width: 40px;
		padding: 0;
	}

	.posting-account select {
		width: 100%;
		max-width: 300px;
	}

	.posting-amount input {
		width: 120px;
		text-align: right;
	}

	.posting-currency select {
		width: 100px;
	}

	.posting-actions {
		text-align: center;
		width: 60px;
	}

	select,
	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	select:focus,
	input:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	select.error,
	input.error {
		border-color: #dc3545;
		background-color: #fff5f5;
	}

	.error-text {
		display: block;
		font-size: 0.75rem;
		color: #dc3545;
		margin-top: 0.25rem;
	}

	.btn-remove {
		padding: 0.25rem 0.5rem;
		border: 1px solid #dc3545;
		background-color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-remove:hover {
		background-color: #dc3545;
		transform: scale(1.1);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.posting-account select {
			max-width: 200px;
		}

		.posting-amount input {
			width: 100px;
		}

		.posting-currency select {
			width: 80px;
		}
	}
</style>
