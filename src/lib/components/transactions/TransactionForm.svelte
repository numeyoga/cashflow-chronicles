<script>
	/**
	 * TransactionForm Component
	 *
	 * Implémente US-004-01 : Enregistrer une dépense simple
	 * Formulaire de création/modification de transaction avec validation
	 */

	import { accounts } from '$lib/stores/accountStore.js';
	import { currencies } from '$lib/stores/currencyStore.js';
	import { addTransaction, updateTransaction } from '$lib/stores/transactionStore.js';
	import { calculateBalance, isBalanced } from '$lib/domain/transactionValidator.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Props
	export let transaction = null; // Pour l'édition
	export let mode = 'create'; // 'create' ou 'edit'

	// État du formulaire
	let formData = {
		date: transaction?.date || new Date().toISOString().split('T')[0],
		description: transaction?.description || '',
		payee: transaction?.payee || '',
		tags: transaction?.tags ? transaction.tags.join(', ') : '',
		posting: transaction?.posting || [
			{ accountId: '', amount: '', currency: '' },
			{ accountId: '', amount: '', currency: '' }
		]
	};

	// Messages d'erreur
	let errors = {};
	let generalError = '';
	let successMessage = '';

	// État de l'équilibre
	$: balance = calculateTransactionBalance();
	$: balanced = isTransactionBalanced();

	/**
	 * Calcule l'équilibre de la transaction en cours
	 */
	function calculateTransactionBalance() {
		const tempTx = {
			posting: formData.posting.filter(p => p.amount && p.currency)
		};
		return calculateBalance(tempTx);
	}

	/**
	 * Vérifie si la transaction est équilibrée
	 */
	function isTransactionBalanced() {
		const tolerance = 0.01;
		return Object.values(balance).every(b => Math.abs(b) <= tolerance);
	}

	/**
	 * Ajoute un posting vide
	 */
	function addPosting() {
		formData.posting = [...formData.posting, { accountId: '', amount: '', currency: '' }];
	}

	/**
	 * Supprime un posting
	 */
	function removePosting(index) {
		if (formData.posting.length > 2) {
			formData.posting = formData.posting.filter((_, i) => i !== index);
		}
	}

	/**
	 * Met à jour la devise d'un posting quand le compte change
	 */
	function onAccountChange(index) {
		const posting = formData.posting[index];
		if (posting.accountId) {
			const account = $accounts.find(a => a.id === posting.accountId);
			if (account) {
				posting.currency = account.currency;
				formData.posting = [...formData.posting]; // Trigger reactivity
			}
		}
	}

	/**
	 * Calcule automatiquement le dernier posting pour équilibrer
	 */
	function autoBalance() {
		if (formData.posting.length < 2) return;

		// Calculer la somme des postings sauf le dernier
		const balances = {};
		for (let i = 0; i < formData.posting.length - 1; i++) {
			const p = formData.posting[i];
			if (p.amount && p.currency) {
				if (!balances[p.currency]) balances[p.currency] = 0;
				balances[p.currency] += parseFloat(p.amount);
			}
		}

		// Mettre le montant négatif dans le dernier posting
		const lastPosting = formData.posting[formData.posting.length - 1];
		if (lastPosting.currency && balances[lastPosting.currency]) {
			lastPosting.amount = (-balances[lastPosting.currency]).toFixed(2);
			formData.posting = [...formData.posting];
		}
	}

	/**
	 * Soumet le formulaire
	 */
	async function handleSubmit() {
		errors = {};
		generalError = '';
		successMessage = '';

		// Préparer les données
		const transactionData = {
			date: formData.date,
			description: formData.description.trim(),
			payee: formData.payee.trim(),
			tags: formData.tags
				.split(',')
				.map(t => t.trim())
				.filter(t => t.length > 0),
			posting: formData.posting
				.filter(p => p.accountId && p.amount && p.currency)
				.map(p => ({
					accountId: p.accountId,
					amount: parseFloat(p.amount),
					currency: p.currency
				}))
		};

		// Sauvegarder
		let result;
		if (mode === 'edit' && transaction) {
			result = updateTransaction(transaction.id, transactionData);
		} else {
			result = addTransaction(transactionData);
		}

		if (result.success) {
			successMessage = mode === 'edit' ? 'Transaction modifiée avec succès !' : 'Transaction créée avec succès !';
			dispatch('saved', result.transaction);

			// Réinitialiser le formulaire si création
			if (mode === 'create') {
				setTimeout(() => {
					resetForm();
				}, 1000);
			}
		} else {
			// Afficher les erreurs
			if (result.errors && result.errors.length > 0) {
				result.errors.forEach(err => {
					if (err.field) {
						errors[err.field] = err.message;
					} else {
						generalError = err.message;
					}
				});
				errors = { ...errors }; // Trigger reactivity
			}
		}
	}

	/**
	 * Réinitialise le formulaire
	 */
	function resetForm() {
		formData = {
			date: new Date().toISOString().split('T')[0],
			description: '',
			payee: '',
			tags: '',
			posting: [
				{ accountId: '', amount: '', currency: '' },
				{ accountId: '', amount: '', currency: '' }
			]
		};
		errors = {};
		successMessage = '';
		generalError = '';
	}

	/**
	 * Annule et ferme le formulaire
	 */
	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="transaction-form">
	<h2>{mode === 'edit' ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>

	{#if generalError}
		<div class="alert alert-error">{generalError}</div>
	{/if}

	{#if successMessage}
		<div class="alert alert-success">{successMessage}</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit}>
		<!-- Date -->
		<div class="form-group">
			<label for="date">
				Date <span class="required">*</span>
			</label>
			<input
				type="date"
				id="date"
				bind:value={formData.date}
				class:error={errors.date}
				required
			/>
			{#if errors.date}
				<span class="error-message">{errors.date}</span>
			{/if}
		</div>

		<!-- Description -->
		<div class="form-group">
			<label for="description">
				Description <span class="required">*</span>
			</label>
			<input
				type="text"
				id="description"
				bind:value={formData.description}
				placeholder="Ex: Courses au supermarché Migros"
				class:error={errors.description}
				required
			/>
			{#if errors.description}
				<span class="error-message">{errors.description}</span>
			{/if}
		</div>

		<!-- Payee -->
		<div class="form-group">
			<label for="payee">Bénéficiaire</label>
			<input
				type="text"
				id="payee"
				bind:value={formData.payee}
				placeholder="Ex: Migros, Coop, etc."
			/>
		</div>

		<!-- Tags -->
		<div class="form-group">
			<label for="tags">Tags (séparés par des virgules)</label>
			<input
				type="text"
				id="tags"
				bind:value={formData.tags}
				placeholder="Ex: groceries, food, shopping"
			/>
			<small>Utilisez des virgules pour séparer plusieurs tags</small>
		</div>

		<!-- Postings -->
		<div class="postings-section">
			<h3>
				Écritures (Postings) <span class="required">*</span>
				<small>Minimum 2 écritures</small>
			</h3>

			{#each formData.posting as posting, index}
				<div class="posting-row">
					<div class="posting-header">
						<strong>Écriture #{index + 1}</strong>
						{#if formData.posting.length > 2}
							<button
								type="button"
								class="btn-remove"
								on:click={() => removePosting(index)}
								title="Supprimer cette écriture"
							>
								✕
							</button>
						{/if}
					</div>

					<div class="posting-fields">
						<!-- Compte -->
						<div class="form-group">
							<label for="account-{index}">Compte</label>
							<select
								id="account-{index}"
								bind:value={posting.accountId}
								on:change={() => onAccountChange(index)}
								required
							>
								<option value="">Sélectionnez un compte...</option>
								{#each $accounts as account}
									<option value={account.id}>
										{account.name} ({account.currency})
									</option>
								{/each}
							</select>
						</div>

						<!-- Montant -->
						<div class="form-group">
							<label for="amount-{index}">Montant</label>
							<input
								type="number"
								id="amount-{index}"
								bind:value={posting.amount}
								step="0.01"
								placeholder="0.00"
								required
							/>
						</div>

						<!-- Devise (auto-remplie) -->
						<div class="form-group">
							<label for="currency-{index}">Devise</label>
							<input
								type="text"
								id="currency-{index}"
								value={posting.currency}
								readonly
								placeholder="Auto"
							/>
						</div>
					</div>
				</div>
			{/each}

			<div class="posting-actions">
				<button type="button" class="btn-secondary" on:click={addPosting}>
					+ Ajouter une écriture
				</button>
				<button type="button" class="btn-secondary" on:click={autoBalance}>
					⚖️ Équilibrer automatiquement
				</button>
			</div>
		</div>

		<!-- Indicateur d'équilibre -->
		<div class="balance-indicator" class:balanced class:unbalanced={!balanced}>
			<h4>Équilibre de la transaction</h4>
			{#if Object.keys(balance).length === 0}
				<p class="no-data">Aucune donnée</p>
			{:else}
				{#each Object.entries(balance) as [currency, amount]}
					<div class="balance-item">
						<span class="currency">{currency}:</span>
						<span class="amount" class:zero={Math.abs(amount) <= 0.01}>
							{amount.toFixed(2)}
						</span>
						{#if Math.abs(amount) <= 0.01}
							<span class="status ok">✓ Équilibré</span>
						{:else}
							<span class="status error">✗ Non équilibré</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<button type="button" class="btn-secondary" on:click={handleCancel}>Annuler</button>
			<button type="submit" class="btn-primary" disabled={!balanced}>
				{mode === 'edit' ? 'Enregistrer' : 'Créer la transaction'}
			</button>
		</div>
	</form>
</div>

<style>
	.transaction-form {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}

	h3 {
		margin-bottom: 1rem;
		color: #555;
		font-size: 1.1rem;
	}

	h3 small {
		font-weight: normal;
		color: #777;
		font-size: 0.9rem;
		margin-left: 0.5rem;
	}

	.alert {
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 4px;
	}

	.alert-error {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
	}

	.alert-success {
		background-color: #efe;
		border: 1px solid #cfc;
		color: #3c3;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.required {
		color: #c33;
	}

	input,
	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	input.error,
	select.error {
		border-color: #c33;
	}

	.error-message {
		display: block;
		color: #c33;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	small {
		display: block;
		color: #777;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.postings-section {
		margin: 2rem 0;
		padding: 1.5rem;
		background-color: #f9f9f9;
		border-radius: 4px;
	}

	.posting-row {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: white;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.posting-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #eee;
	}

	.posting-fields {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 1rem;
	}

	.btn-remove {
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.25rem 0.75rem;
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
	}

	.btn-remove:hover {
		background-color: #c82333;
	}

	.posting-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.balance-indicator {
		margin: 2rem 0;
		padding: 1.5rem;
		border-radius: 4px;
		border: 2px solid #ddd;
	}

	.balance-indicator.balanced {
		background-color: #e8f5e9;
		border-color: #4caf50;
	}

	.balance-indicator.unbalanced {
		background-color: #ffebee;
		border-color: #f44336;
	}

	.balance-indicator h4 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.balance-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background-color: white;
		border-radius: 4px;
	}

	.balance-item .currency {
		font-weight: 600;
		min-width: 50px;
	}

	.balance-item .amount {
		font-family: 'Courier New', monospace;
		font-size: 1.1rem;
		min-width: 100px;
	}

	.balance-item .amount.zero {
		color: #4caf50;
		font-weight: 600;
	}

	.balance-item .status {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.balance-item .status.ok {
		background-color: #4caf50;
		color: white;
	}

	.balance-item .status.error {
		background-color: #f44336;
		color: white;
	}

	.no-data {
		color: #777;
		font-style: italic;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #ddd;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-primary {
		background-color: #4a90e2;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #357abd;
	}

	.btn-primary:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #5a6268;
	}

	@media (max-width: 768px) {
		.posting-fields {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
