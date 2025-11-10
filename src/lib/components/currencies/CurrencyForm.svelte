<script>
	/**
	 * Formulaire d'ajout/édition de devise
	 * Implémente US-002-01 : Ajouter une nouvelle devise
	 * Implémente US-002-03 : Modifier une devise existante
	 */
	import { addCurrency, updateCurrency } from '$lib/stores/currencyStore.js';
	import { currencies } from '$lib/stores/currencyStore.js';
	import { ISO_4217_CURRENCIES, searchCurrency } from '$lib/domain/models.js';

	let {
		mode = 'add',
		currency = null,
		onSuccess = () => {},
		onCancel = () => {}
	} = $props();

	const isEditMode = mode === 'edit' && currency !== null;

	let form = $state({
		code: isEditMode ? currency.code : '',
		name: isEditMode ? currency.name : '',
		symbol: isEditMode ? currency.symbol : '',
		decimalPlaces: isEditMode ? currency.decimalPlaces : 2,
		isDefault: isEditMode ? currency.isDefault : false
	});

	let errors = $state({});
	let searchResults = $state([]);
	let showSuggestions = $state(false);

	/**
	 * Recherche de devises pour auto-complétion
	 */
	function handleCodeInput() {
		if (form.code.length > 0) {
			searchResults = searchCurrency(form.code);
			showSuggestions = searchResults.length > 0;
		} else {
			searchResults = [];
			showSuggestions = false;
		}
	}

	/**
	 * Sélection d'une devise suggérée
	 */
	function selectSuggestion(currency) {
		form.code = currency.code;
		form.name = currency.name;
		form.symbol = currency.symbol;
		form.decimalPlaces = currency.decimalPlaces;
		showSuggestions = false;
		searchResults = [];
	}

	/**
	 * Soumet le formulaire
	 */
	function handleSubmit(event) {
		event.preventDefault();
		errors = {};

		let result;

		if (isEditMode) {
			// Mode édition
			result = updateCurrency(currency.code, {
				name: form.name,
				symbol: form.symbol,
				decimalPlaces: form.decimalPlaces,
				isDefault: form.isDefault
			});
		} else {
			// Mode ajout
			result = addCurrency(form);
		}

		if (!result.success) {
			// Mapper les erreurs par champ
			if (result.errors) {
				result.errors.forEach(error => {
					if (error.field) {
						errors[error.field] = error.message;
					}
				});
			}
		} else {
			// Réinitialiser le formulaire en mode ajout
			if (!isEditMode) {
				form = {
					code: '',
					name: '',
					symbol: '',
					decimalPlaces: 2,
					isDefault: false
				};
			}
			onSuccess(isEditMode ? { ...currency, ...form } : result.currency);
		}
	}

	/**
	 * Annule le formulaire
	 */
	function handleCancel() {
		form = {
			code: '',
			name: '',
			symbol: '',
			decimalPlaces: 2,
			isDefault: false
		};
		errors = {};
		onCancel();
	}
</script>

<div class="currency-form">
	<h2>{isEditMode ? 'Modifier la devise' : 'Ajouter une devise'}</h2>

	<form onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="code">
				Code (ISO 4217) <span class="required">*</span>
			</label>
			<input
				type="text"
				id="code"
				bind:value={form.code}
				oninput={handleCodeInput}
				placeholder="EUR"
				maxlength="3"
				class:error={errors.code}
				disabled={isEditMode}
				required
			/>
			{#if errors.code}
				<span class="error-message">{errors.code}</span>
			{/if}

			{#if showSuggestions && searchResults.length > 0}
				<div class="suggestions">
					{#each searchResults.slice(0, 5) as suggestion}
						<button
							type="button"
							class="suggestion-item"
							onclick={() => selectSuggestion(suggestion)}
						>
							<strong>{suggestion.code}</strong> - {suggestion.name} ({suggestion.symbol})
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="form-group">
			<label for="name">
				Nom <span class="required">*</span>
			</label>
			<input
				type="text"
				id="name"
				bind:value={form.name}
				placeholder="Euro"
				class:error={errors.name}
				required
			/>
			{#if errors.name}
				<span class="error-message">{errors.name}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="symbol">
				Symbole <span class="required">*</span>
			</label>
			<input
				type="text"
				id="symbol"
				bind:value={form.symbol}
				placeholder="€"
				class:error={errors.symbol}
				required
			/>
			{#if errors.symbol}
				<span class="error-message">{errors.symbol}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="decimalPlaces">
				Décimales <span class="required">*</span>
			</label>
			<input
				type="number"
				id="decimalPlaces"
				bind:value={form.decimalPlaces}
				min="0"
				max="8"
				class:error={errors.decimalPlaces}
				required
			/>
			{#if errors.decimalPlaces}
				<span class="error-message">{errors.decimalPlaces}</span>
			{/if}
			<span class="help-text">Généralement 2 pour la plupart des devises</span>
		</div>

		<div class="form-group checkbox-group">
			<label>
				<input type="checkbox" bind:checked={form.isDefault} />
				Définir comme devise par défaut
			</label>
			<span class="help-text">La devise par défaut est utilisée comme référence pour les taux de change</span>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">
				{isEditMode ? 'Enregistrer' : 'Ajouter'}
			</button>
			<button type="button" class="btn btn-secondary" onclick={handleCancel}>Annuler</button>
		</div>
	</form>
</div>

<style>
	.currency-form {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 600px;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
		position: relative;
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
	input[type='number'] {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input[type='text']:focus,
	input[type='number']:focus {
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

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		z-index: 10;
		max-height: 200px;
		overflow-y: auto;
	}

	.suggestion-item {
		display: block;
		width: 100%;
		padding: 0.75rem;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 0.9rem;
	}

	.suggestion-item:hover {
		background-color: #f0f0f0;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.checkbox-group input[type='checkbox'] {
		width: auto;
		margin: 0;
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
