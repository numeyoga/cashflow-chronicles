<script>
	/**
	 * Formulaire d'ajout/édition de taux de change
	 * Implémente US-002-02 : Enregistrer un taux de change historique
	 */
	import { addExchangeRate } from '$lib/stores/currencyStore.js';

	let { currency, onSuccess = () => {}, onCancel = () => {} } = $props();

	let form = $state({
		date: new Date().toISOString().split('T')[0],
		rate: '',
		source: 'manuel'
	});

	let errors = $state({});

	/**
	 * Soumet le formulaire
	 */
	function handleSubmit(event) {
		event.preventDefault();
		errors = {};

		const result = addExchangeRate(currency.code, {
			...form,
			rate: parseFloat(form.rate)
		});

		if (!result.success) {
			// Mapper les erreurs par champ
			result.errors.forEach(error => {
				if (error.field) {
					errors[error.field] = error.message;
				} else {
					errors.general = error.message;
				}
			});
		} else {
			// Réinitialiser le formulaire
			form = {
				date: new Date().toISOString().split('T')[0],
				rate: '',
				source: 'manuel'
			};
			onSuccess(result.rate);
		}
	}

	/**
	 * Annule le formulaire
	 */
	function handleCancel() {
		form = {
			date: new Date().toISOString().split('T')[0],
			rate: '',
			source: 'manuel'
		};
		errors = {};
		onCancel();
	}
</script>

<div class="exchange-rate-form">
	<h3>Ajouter un taux de change pour {currency.code}</h3>

	{#if errors.general}
		<div class="alert alert-error">
			{errors.general}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="date">
				Date <span class="required">*</span>
			</label>
			<input
				type="date"
				id="date"
				bind:value={form.date}
				class:error={errors.date}
				required
			/>
			{#if errors.date}
				<span class="error-message">{errors.date}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="rate">
				Taux <span class="required">*</span>
			</label>
			<input
				type="number"
				id="rate"
				bind:value={form.rate}
				step="0.000001"
				min="0"
				placeholder="0.95"
				class:error={errors.rate}
				required
			/>
			{#if errors.rate}
				<span class="error-message">{errors.rate}</span>
			{/if}
			<span class="help-text">
				Exemple : 0.95 signifie 1 {currency.code} = 0.95 (devise de référence)
			</span>
		</div>

		<div class="form-group">
			<label for="source">
				Source
			</label>
			<input
				type="text"
				id="source"
				bind:value={form.source}
				placeholder="Banque PostFinance"
			/>
			<span class="help-text">
				Optionnel : Indiquez la source du taux (banque, site web, etc.)
			</span>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">Ajouter</button>
			<button type="button" class="btn btn-secondary" onclick={handleCancel}>Annuler</button>
		</div>
	</form>
</div>

<style>
	.exchange-rate-form {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 500px;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.25rem;
	}

	.alert {
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.alert-error {
		background-color: #fee;
		color: #c00;
		border: 1px solid #fcc;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	.required {
		color: #e74c3c;
	}

	input[type='text'],
	input[type='number'],
	input[type='date'] {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #3498db;
	}

	input.error {
		border-color: #e74c3c;
	}

	.error-message {
		display: block;
		color: #e74c3c;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.help-text {
		display: block;
		color: #888;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2980b9;
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #7f8c8d;
	}
</style>
