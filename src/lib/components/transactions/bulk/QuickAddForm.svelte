<script>
	/**
	 * QuickAddForm - Formulaire rapide pour ajouter des transactions simples
	 */
	import { createEventDispatcher } from 'svelte';
	import {
		createEmptyTransaction,
		getAutoCompleteOptions,
		calculateAutoBalance,
		validateInlineEdit
	} from './bulkTransactionHelpers.js';

	let {
		accounts = [],
		currencies = [],
		allTransactions = [],
		defaultCurrency = 'EUR'
	} = $props();

	const dispatch = createEventDispatcher();

	// État du formulaire
	let formData = $state(createEmptyTransaction(defaultCurrency));
	let errors = $state({});
	let isSubmitting = $state(false);

	// Options d'auto-complétion
	let payeeOptions = $derived(getAutoCompleteOptions('payee', allTransactions));
	let descriptionOptions = $derived(getAutoCompleteOptions('description', allTransactions));

	// État du formulaire
	let isValid = $derived.by(() => {
		const validation = validateInlineEdit(formData);
		return validation.isValid;
	});

	function handleSubmit(event) {
		event.preventDefault();

		// Valider
		const validation = validateInlineEdit(formData);
		errors = validation.errors;

		if (!validation.isValid) {
			return;
		}

		// Émettre l'événement
		isSubmitting = true;
		dispatch('add', { transaction: formData });

		// Réinitialiser le formulaire
		setTimeout(() => {
			resetForm();
			isSubmitting = false;
		}, 100);
	}

	function resetForm() {
		formData = createEmptyTransaction(defaultCurrency);
		errors = {};
	}

	function handleAutoBalance() {
		if (formData.posting.length < 2) return;

		// Calculer le montant automatique pour le dernier posting
		const targetIndex = formData.posting.length - 1;
		const autoAmount = calculateAutoBalance(formData.posting, targetIndex);

		formData.posting[targetIndex].amount = autoAmount.toFixed(2);
	}

	function handleAccount1Change(event) {
		formData.posting[0].accountId = event.target.value;

		// Auto-fill currency from account
		const account = accounts.find((acc) => acc.id === event.target.value);
		if (account && account.currency) {
			formData.posting[0].currency = account.currency;
			formData.posting[1].currency = account.currency;
		}
	}

	function handleAccount2Change(event) {
		formData.posting[1].accountId = event.target.value;

		// Auto-fill currency from account if not set
		const account = accounts.find((acc) => acc.id === event.target.value);
		if (account && account.currency && !formData.posting[1].currency) {
			formData.posting[1].currency = account.currency;
		}
	}
</script>

<div class="quick-add-form">
	<h3 class="form-title">⚡ Ajout Rapide</h3>

	<form onsubmit={handleSubmit}>
		<div class="form-row">
			<!-- Date -->
			<div class="form-field">
				<label for="quick-date">Date</label>
				<input
					id="quick-date"
					type="date"
					bind:value={formData.date}
					class:error={errors.date}
					required
				/>
			</div>

			<!-- Description -->
			<div class="form-field">
				<label for="quick-description">Description</label>
				<input
					id="quick-description"
					type="text"
					list="descriptions"
					bind:value={formData.description}
					class:error={errors.description}
					placeholder="Description..."
					required
				/>
				<datalist id="descriptions">
					{#each descriptionOptions as desc}
						<option value={desc}></option>
					{/each}
				</datalist>
			</div>

			<!-- Payee -->
			<div class="form-field">
				<label for="quick-payee">Bénéficiaire</label>
				<input
					id="quick-payee"
					type="text"
					list="payees"
					bind:value={formData.payee}
					placeholder="Bénéficiaire..."
				/>
				<datalist id="payees">
					{#each payeeOptions as payee}
						<option value={payee}></option>
					{/each}
				</datalist>
			</div>

			<!-- Compte 1 -->
			<div class="form-field">
				<label for="quick-account1">Compte 1</label>
				<select
					id="quick-account1"
					value={formData.posting[0].accountId}
					onchange={handleAccount1Change}
					class:error={errors.posting_0_account}
					required
				>
					<option value="">Sélectionner...</option>
					{#each accounts as account}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</div>

			<!-- Montant 1 -->
			<div class="form-field">
				<label for="quick-amount1">Montant 1</label>
				<input
					id="quick-amount1"
					type="number"
					step="0.01"
					bind:value={formData.posting[0].amount}
					class:error={errors.posting_0_amount}
					placeholder="0.00"
					required
				/>
			</div>

			<!-- Compte 2 -->
			<div class="form-field">
				<label for="quick-account2">Compte 2</label>
				<select
					id="quick-account2"
					value={formData.posting[1].accountId}
					onchange={handleAccount2Change}
					class:error={errors.posting_1_account}
					required
				>
					<option value="">Sélectionner...</option>
					{#each accounts as account}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</div>

			<!-- Bouton Auto-Balance -->
			<div class="form-field">
				<label>&nbsp;</label>
				<button
					type="button"
					class="btn btn-auto"
					onclick={handleAutoBalance}
					title="Calculer automatiquement le montant du compte 2"
				>
					⚖️ Auto
				</button>
			</div>

			<!-- Bouton Ajouter -->
			<div class="form-field">
				<label>&nbsp;</label>
				<button
					type="submit"
					class="btn btn-primary"
					disabled={!isValid || isSubmitting}
					title={isValid ? 'Ajouter la transaction' : 'Veuillez remplir tous les champs requis'}
				>
					{isSubmitting ? '...' : '+ Ajouter'}
				</button>
			</div>
		</div>

		<!-- Messages d'erreur -->
		{#if Object.keys(errors).length > 0}
			<div class="form-errors">
				{#each Object.entries(errors) as [field, message]}
					<span class="error-message">{message}</span>
				{/each}
			</div>
		{/if}
	</form>
</div>

<style>
	.quick-add-form {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		margin-bottom: 1rem;
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.form-title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #333;
		font-weight: 600;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-field label {
		font-size: 0.85rem;
		font-weight: 500;
		color: #555;
	}

	.form-field input,
	.form-field select {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.form-field input:focus,
	.form-field select:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.form-field input.error,
	.form-field select.error {
		border-color: #dc3545;
		background-color: #fff5f5;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-auto {
		background-color: #ff9800;
		color: white;
	}

	.btn-auto:hover {
		background-color: #f57c00;
	}

	.btn-primary {
		background-color: #4caf50;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #45a049;
	}

	.btn-primary:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.form-errors {
		margin-top: 1rem;
		padding: 1rem;
		background-color: #fff5f5;
		border: 1px solid #dc3545;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error-message {
		font-size: 0.85rem;
		color: #dc3545;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.form-row {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.quick-add-form {
			position: relative;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.btn {
			width: 100%;
		}
	}
</style>
