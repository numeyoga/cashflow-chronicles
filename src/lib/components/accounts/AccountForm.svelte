<script>
	/**
	 * Formulaire d'ajout/édition de compte
	 * Implémente US-003-01 : Créer un compte bancaire (Assets)
	 */
	import { addAccount, updateAccount } from '$lib/stores/accountStore.js';
	import { currencies, defaultCurrency } from '$lib/stores/currencyStore.js';
	import { AccountTypes } from '$lib/domain/accountValidator.js';

	let {
		mode = 'add',
		account = null,
		onSuccess = () => {},
		onCancel = () => {}
	} = $props();

	const isEditMode = mode === 'edit' && account !== null;

	// Date du jour au format YYYY-MM-DD
	const today = new Date().toISOString().split('T')[0];

	let form = $state({
		type: isEditMode ? account.type : 'Assets',
		name: isEditMode ? account.name : '',
		currency: isEditMode ? account.currency : ($defaultCurrency?.code || ''),
		opened: isEditMode ? account.opened : today,
		description: isEditMode ? (account.description || '') : ''
	});

	let errors = $state({});
	let nameSegments = $state([]);

	/**
	 * Met à jour le nom du compte basé sur le type sélectionné
	 */
	function handleTypeChange() {
		// Si le nom commence par un autre type, le remplacer
		if (form.name) {
			const segments = form.name.split(':');
			if (segments.length > 0 && AccountTypes.includes(segments[0])) {
				segments[0] = form.type;
				form.name = segments.join(':');
			}
		}
	}

	/**
	 * Suggestions de noms de comptes basées sur le type
	 */
	const accountTemplates = {
		Assets: [
			{ label: '🏦 Compte bancaire', template: 'Assets:Bank:{Devise}:{Banque}', example: 'Assets:Bank:CHF:PostFinance' },
			{ label: '💰 Espèces', template: 'Assets:Cash:{Devise}', example: 'Assets:Cash:CHF' },
			{ label: '📈 Investissements', template: 'Assets:Investments:{Type}:{Nom}', example: 'Assets:Investments:Stocks:SwissQuote' },
			{ label: '🏠 Immobilier', template: 'Assets:RealEstate:{Propriété}', example: 'Assets:RealEstate:Apartment' },
			{ label: '🚗 Véhicules', template: 'Assets:Vehicles:{Véhicule}', example: 'Assets:Vehicles:Car' }
		],
		Liabilities: [
			{ label: '💳 Carte de crédit', template: 'Liabilities:CreditCard:{Banque}', example: 'Liabilities:CreditCard:PostFinance' },
			{ label: '🏦 Prêt bancaire', template: 'Liabilities:Loan:{Type}', example: 'Liabilities:Loan:Mortgage' },
			{ label: '👥 Dette personnelle', template: 'Liabilities:Personal:{Personne}', example: 'Liabilities:Personal:Friend' }
		],
		Income: [
			{ label: '💼 Salaire', template: 'Income:Salary:{Employeur}', example: 'Income:Salary:Company' },
			{ label: '💰 Bonus', template: 'Income:Bonus', example: 'Income:Bonus' },
			{ label: '📈 Dividendes', template: 'Income:Investments:Dividends', example: 'Income:Investments:Dividends' },
			{ label: '🎁 Cadeaux', template: 'Income:Gifts', example: 'Income:Gifts' }
		],
		Expenses: [
			{ label: '🍕 Alimentation', template: 'Expenses:Food:{Type}', example: 'Expenses:Food:Groceries' },
			{ label: '🏠 Logement', template: 'Expenses:Housing:{Type}', example: 'Expenses:Housing:Rent' },
			{ label: '🚗 Transport', template: 'Expenses:Transport:{Type}', example: 'Expenses:Transport:Car' },
			{ label: '🎬 Loisirs', template: 'Expenses:Entertainment', example: 'Expenses:Entertainment' },
			{ label: '💊 Santé', template: 'Expenses:Healthcare', example: 'Expenses:Healthcare' },
			{ label: '📚 Éducation', template: 'Expenses:Education', example: 'Expenses:Education' }
		],
		Equity: [
			{ label: '💰 Capital initial', template: 'Equity:OpeningBalance', example: 'Equity:OpeningBalance' },
			{ label: '📊 Bénéfices reportés', template: 'Equity:RetainedEarnings', example: 'Equity:RetainedEarnings' }
		]
	};

	/**
	 * Applique un template au nom du compte
	 */
	function applyTemplate(template) {
		form.name = template.example;
	}

	/**
	 * Analyse les segments du nom pour afficher l'aide
	 */
	function analyzeNameSegments() {
		if (form.name) {
			nameSegments = form.name.split(':');
		} else {
			nameSegments = [];
		}
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
			result = updateAccount(account.id, form);
		} else {
			// Mode ajout
			result = addAccount(form);
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
					type: 'Assets',
					name: '',
					currency: '',
					opened: today,
					description: ''
				};
				nameSegments = [];
			}
			onSuccess(result.account);
		}
	}

	/**
	 * Annule le formulaire
	 */
	function handleCancel() {
		form = {
			type: 'Assets',
			name: '',
			currency: '',
			opened: today,
			description: ''
		};
		errors = {};
		nameSegments = [];
		onCancel();
	}

	// Mettre à jour les segments quand le nom change
	$effect(() => {
		analyzeNameSegments();
	});
</script>

<div class="account-form">
	<h2>{isEditMode ? 'Modifier le compte' : 'Nouveau compte'}</h2>

	<form onsubmit={handleSubmit}>
		<!-- Type de compte -->
		<div class="form-group">
			<label for="type">
				Type de compte <span class="required">*</span>
			</label>
			<select
				id="type"
				bind:value={form.type}
				onchange={handleTypeChange}
				class:error={errors.type}
				required
			>
				<option value="Assets">🏦 Assets (Actifs)</option>
				<option value="Liabilities">💳 Liabilities (Passifs)</option>
				<option value="Income">💰 Income (Revenus)</option>
				<option value="Expenses">💸 Expenses (Dépenses)</option>
				<option value="Equity">📊 Equity (Capitaux propres)</option>
			</select>
			{#if errors.type}
				<span class="error-message">{errors.type}</span>
			{/if}
		</div>

		<!-- Modèles suggérés -->
		{#if !isEditMode && accountTemplates[form.type]}
			<div class="templates">
				<label>Modèles suggérés :</label>
				<div class="template-buttons">
					{#each accountTemplates[form.type] as template}
						<button
							type="button"
							class="template-btn"
							onclick={() => applyTemplate(template)}
							title={template.template}
						>
							{template.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Nom du compte -->
		<div class="form-group">
			<label for="name">
				Nom hiérarchique <span class="required">*</span>
			</label>
			<input
				type="text"
				id="name"
				bind:value={form.name}
				placeholder="{form.type}:Category:Subcategory:Name"
				class:error={errors.name}
				required
			/>
			{#if errors.name}
				<span class="error-message">{errors.name}</span>
			{/if}
			<span class="help-text">Format : Type:Catégorie:Sous-catégorie:Nom (min. 2 segments)</span>

			{#if nameSegments.length > 0}
				<div class="name-segments">
					{#each nameSegments as segment, i}
						<span class="segment" class:first={i === 0} class:valid={segment.trim() !== ''}>
							{segment || '(vide)'}
						</span>
						{#if i < nameSegments.length - 1}
							<span class="separator">:</span>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Devise -->
		<div class="form-group">
			<label for="currency">
				Devise <span class="required">*</span>
			</label>
			{#if $currencies.length === 0}
				<div class="warning-message">
					⚠️ Aucune devise disponible. Veuillez d'abord <a href="/currencies">créer une devise</a>.
				</div>
			{:else}
				<select
					id="currency"
					bind:value={form.currency}
					class:error={errors.currency}
					required
				>
					<option value="">-- Sélectionnez une devise --</option>
					{#each $currencies as currency}
						<option value={currency.code}>
							{currency.code} - {currency.name} ({currency.symbol})
						</option>
					{/each}
				</select>
			{/if}
			{#if errors.currency}
				<span class="error-message">{errors.currency}</span>
			{/if}
		</div>

		<!-- Date d'ouverture -->
		<div class="form-group">
			<label for="opened">
				Date d'ouverture <span class="required">*</span>
			</label>
			<input
				type="date"
				id="opened"
				bind:value={form.opened}
				max={today}
				class:error={errors.opened}
				required
			/>
			{#if errors.opened}
				<span class="error-message">{errors.opened}</span>
			{/if}
		</div>

		<!-- Description -->
		<div class="form-group">
			<label for="description">
				Description (optionnel)
			</label>
			<textarea
				id="description"
				bind:value={form.description}
				placeholder="Description du compte..."
				rows="3"
			></textarea>
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<button type="submit" class="btn btn-primary">
				{isEditMode ? 'Enregistrer' : 'Créer le compte'}
			</button>
			<button type="button" class="btn btn-secondary" onclick={handleCancel}>
				Annuler
			</button>
		</div>
	</form>
</div>

<style>
	.account-form {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 700px;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.5rem;
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
	input[type='date'],
	select,
	textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		font-family: inherit;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #3498db;
	}

	input.error,
	select.error,
	textarea.error {
		border-color: #e74c3c;
	}

	.error-message {
		display: block;
		color: #e74c3c;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.warning-message {
		display: block;
		padding: 0.75rem;
		background-color: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		color: #856404;
		font-size: 0.875rem;
	}

	.warning-message a {
		color: #0056b3;
		text-decoration: underline;
	}

	.warning-message a:hover {
		color: #003d82;
	}

	.help-text {
		display: block;
		color: #888;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.templates {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.templates label {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.template-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.template-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.template-btn:hover {
		background: #3498db;
		color: white;
		border-color: #3498db;
	}

	.name-segments {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		font-family: monospace;
	}

	.segment {
		padding: 0.25rem 0.5rem;
		background: #e9ecef;
		border-radius: 3px;
		font-size: 0.875rem;
	}

	.segment.first {
		background: #3498db;
		color: white;
		font-weight: bold;
	}

	.segment.valid {
		background: #2ecc71;
		color: white;
	}

	.segment.first.valid {
		background: #3498db;
	}

	.separator {
		margin: 0 0.25rem;
		color: #888;
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

	textarea {
		resize: vertical;
		min-height: 80px;
	}
</style>
