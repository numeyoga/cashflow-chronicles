<script>
	/**
	 * BulkTransactionRow - Ligne de transaction avec vue compacte et étendue
	 */
	import { createEventDispatcher } from 'svelte';
	import PostingRow from './PostingRow.svelte';
	import { calculateTransactionSummary, validateInlineEdit } from './bulkTransactionHelpers.js';

	let {
		transaction,
		expanded = false,
		selected = false,
		accounts = [],
		currencies = [],
		draggable = true,
		dragEnabled = true, // Peut être désactivé si tri/filtre actif
		index = 0
	} = $props();

	const dispatch = createEventDispatcher();

	// État local pour l'édition
	let isEditing = $state(false);
	let draftData = $state(null);
	let validationErrors = $state({});

	// État du drag & drop
	let isDragging = $state(false);
	let isDragOver = $state(false);
	let dragOverPosition = $state(null); // 'top' | 'bottom'

	// Calculer le résumé de la transaction
	let summary = $derived(calculateTransactionSummary(transaction));

	// Formater les noms des comptes pour l'affichage compact
	let accountNames = $derived(
		transaction.posting
			.map((p) => {
				const account = accounts.find((acc) => acc.id === p.accountId);
				return account?.name || 'Compte inconnu';
			})
			.join(', ')
	);

	// Formater les montants pour l'affichage compact
	let formattedAmounts = $derived(
		summary.currencies.length > 2
			? `${summary.currencies.length} devises`
			: summary.formattedTotals || 'N/A'
	);

	function handleToggle() {
		if (!expanded && !isEditing) {
			// Lors de l'expansion, initialiser les données d'édition
			draftData = structuredClone(transaction);
		}
		dispatch('toggle', { id: transaction.id });
	}

	function handleSelect(event) {
		dispatch('select', { id: transaction.id, selected: event.target.checked });
	}

	function handleEdit() {
		isEditing = true;
		draftData = structuredClone(transaction);
		validationErrors = {};

		// Auto-expand si pas déjà étendu
		if (!expanded) {
			dispatch('toggle', { id: transaction.id });
		}
	}

	function handleSave() {
		// Valider les données
		const validation = validateInlineEdit(draftData);

		if (!validation.isValid) {
			validationErrors = validation.errors;
			return;
		}

		// Émettre l'événement de sauvegarde
		dispatch('save', { transaction: draftData });

		// Réinitialiser l'état d'édition
		isEditing = false;
		draftData = null;
		validationErrors = {};
	}

	function handleCancel() {
		isEditing = false;
		draftData = null;
		validationErrors = {};
	}

	function handleDuplicate() {
		dispatch('duplicate', { transaction });
	}

	function handleDelete() {
		dispatch('delete', { transaction });
	}

	// Drag & Drop handlers
	function handleDragStart(event) {
		if (!draggable || !dragEnabled || isEditing) {
			event.preventDefault();
			return;
		}

		isDragging = true;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', transaction.id);

		// Créer une image de drag personnalisée
		const dragImage = event.currentTarget.cloneNode(true);
		dragImage.style.opacity = '0.7';
		document.body.appendChild(dragImage);
		event.dataTransfer.setDragImage(dragImage, 0, 0);
		setTimeout(() => document.body.removeChild(dragImage), 0);

		dispatch('dragStart', { transaction, index });
	}

	function handleDragEnd(event) {
		isDragging = false;
		dispatch('dragEnd');
	}

	function handleDragOver(event) {
		if (!draggable || !dragEnabled || isEditing) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';

		// Déterminer si on survole le haut ou le bas de la ligne
		const rect = event.currentTarget.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		dragOverPosition = event.clientY < midpoint ? 'top' : 'bottom';
	}

	function handleDragEnter(event) {
		if (!draggable || !dragEnabled || isEditing) {
			return;
		}

		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event) {
		// Vérifier si on quitte vraiment l'élément (pas un enfant)
		if (!event.currentTarget.contains(event.relatedTarget)) {
			isDragOver = false;
			dragOverPosition = null;
		}
	}

	function handleDrop(event) {
		event.preventDefault();
		isDragOver = false;
		dragOverPosition = null;

		if (!draggable || !dragEnabled || isEditing) {
			return;
		}

		const draggedId = event.dataTransfer.getData('text/plain');
		dispatch('drop', {
			draggedId,
			targetId: transaction.id,
			targetIndex: index,
			position: dragOverPosition
		});
	}

	function handlePostingChange(event) {
		const { index, posting } = event.detail;
		draftData.posting[index] = posting;

		// Recalculer la validation
		const validation = validateInlineEdit(draftData);
		validationErrors = validation.errors;
	}

	function handleAddPosting() {
		const lastPosting = draftData.posting[draftData.posting.length - 1];
		draftData.posting.push({
			accountId: '',
			amount: '',
			currency: lastPosting?.currency || currencies[0]?.code || 'EUR'
		});
	}

	function handleRemovePosting(event) {
		const { index } = event.detail;
		if (draftData.posting.length > 2) {
			draftData.posting = draftData.posting.filter((_, i) => i !== index);
		}
	}

	// Déterminer quelle transaction afficher (draft ou originale)
	let displayTransaction = $derived(isEditing && draftData ? draftData : transaction);
	let displaySummary = $derived(calculateTransactionSummary(displayTransaction));
</script>

{#if !expanded}
	<!-- Vue Compacte -->
	<tr
		class="transaction-row compact"
		class:selected
		class:balanced={summary.isBalanced}
		class:unbalanced={!summary.isBalanced}
		class:dragging={isDragging}
		class:drag-over={isDragOver}
		class:drag-over-top={isDragOver && dragOverPosition === 'top'}
		class:drag-over-bottom={isDragOver && dragOverPosition === 'bottom'}
		class:draggable={draggable && dragEnabled && !isEditing}
		draggable={draggable && dragEnabled && !isEditing}
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondragover={handleDragOver}
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<td class="col-checkbox">
			<input type="checkbox" checked={selected} onchange={handleSelect} />
		</td>

		<td class="col-date">{transaction.date}</td>

		<td class="col-description">{transaction.description}</td>

		<td class="col-payee">{transaction.payee || '-'}</td>

		<td class="col-accounts" title={accountNames}>
			{transaction.posting.length} compte(s)
		</td>

		<td class="col-amount">{formattedAmounts}</td>

		<td class="col-balance">
			{#if summary.isBalanced}
				<span class="badge badge-success" title="Transaction équilibrée">✓</span>
			{:else}
				<span class="badge badge-error" title={summary.balanceErrors}>✗</span>
			{/if}
		</td>

		<td class="col-actions">
			<div class="action-buttons">
				<button
					type="button"
					class="btn-icon btn-expand"
					onclick={handleToggle}
					title="Développer"
				>
					▶
				</button>
				<button type="button" class="btn-icon btn-duplicate" onclick={handleDuplicate} title="Dupliquer">
					📋
				</button>
				<button type="button" class="btn-icon btn-delete" onclick={handleDelete} title="Supprimer">
					🗑️
				</button>
			</div>
		</td>
	</tr>
{:else}
	<!-- Vue Étendue -->
	<tr
		class="transaction-row expanded"
		class:selected
		class:editing={isEditing}
		class:dragging={isDragging}
		class:drag-over={isDragOver}
		class:drag-over-top={isDragOver && dragOverPosition === 'top'}
		class:drag-over-bottom={isDragOver && dragOverPosition === 'bottom'}
		class:draggable={draggable && dragEnabled && !isEditing}
		draggable={draggable && dragEnabled && !isEditing}
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondragover={handleDragOver}
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<td class="col-checkbox">
			<input type="checkbox" checked={selected} onchange={handleSelect} />
		</td>

		<td class="col-date">
			{#if isEditing}
				<input
					type="date"
					bind:value={draftData.date}
					class:error={validationErrors.date}
					title={validationErrors.date}
				/>
			{:else}
				{displayTransaction.date}
			{/if}
		</td>

		<td class="col-description">
			{#if isEditing}
				<input
					type="text"
					bind:value={draftData.description}
					class:error={validationErrors.description}
					title={validationErrors.description}
					placeholder="Description..."
				/>
			{:else}
				{displayTransaction.description}
			{/if}
		</td>

		<td class="col-payee">
			{#if isEditing}
				<input
					type="text"
					bind:value={draftData.payee}
					placeholder="Bénéficiaire..."
				/>
			{:else}
				{displayTransaction.payee || '-'}
			{/if}
		</td>

		<td colspan="2" class="col-postings-info">
			{#if isEditing}
				<span class="editing-label">✏️ Édition en cours...</span>
			{:else}
				{displayTransaction.posting.length} posting(s)
			{/if}
		</td>

		<td class="col-balance">
			{#if displaySummary.isBalanced}
				<span class="badge badge-success" title="Transaction équilibrée">✓</span>
			{:else if isEditing}
				<span class="badge badge-warning" title={displaySummary.balanceErrors}>⚠️</span>
			{:else}
				<span class="badge badge-error" title={displaySummary.balanceErrors}>✗</span>
			{/if}
		</td>

		<td class="col-actions">
			<div class="action-buttons">
				<button
					type="button"
					class="btn-icon btn-collapse"
					onclick={handleToggle}
					title="Réduire"
				>
					▼
				</button>
				{#if isEditing}
					<button
						type="button"
						class="btn-icon btn-save"
						onclick={handleSave}
						disabled={!displaySummary.isBalanced}
						title="Sauvegarder"
					>
						💾
					</button>
					<button type="button" class="btn-icon btn-cancel" onclick={handleCancel} title="Annuler">
						✖
					</button>
				{:else}
					<button type="button" class="btn-icon btn-edit" onclick={handleEdit} title="Éditer">
						✏️
					</button>
				{/if}
			</div>
		</td>
	</tr>

	<!-- Lignes de Postings (Vue Étendue) -->
	{#if isEditing && draftData}
		{#each draftData.posting as posting, index}
			<PostingRow
				bind:posting={draftData.posting[index]}
				{index}
				{accounts}
				{currencies}
				canRemove={draftData.posting.length > 2}
				errors={{
					account: validationErrors[`posting_${index}_account`],
					amount: validationErrors[`posting_${index}_amount`],
					currency: validationErrors[`posting_${index}_currency`]
				}}
				on:change={handlePostingChange}
				on:remove={handleRemovePosting}
			/>
		{/each}

		<!-- Bouton Ajouter Posting -->
		<tr class="posting-add-row">
			<td colspan="7">
				<button type="button" class="btn-add-posting" onclick={handleAddPosting}>
					+ Ajouter un posting
				</button>
			</td>
		</tr>
	{:else}
		<!-- Affichage des postings en lecture seule -->
		{#each displayTransaction.posting as posting, index}
			<tr class="posting-row readonly">
				<td colspan="2" class="indent"></td>
				<td class="posting-account">
					{accounts.find((acc) => acc.id === posting.accountId)?.name || posting.accountId}
				</td>
				<td class="posting-amount">{posting.amount}</td>
				<td class="posting-currency">{posting.currency}</td>
				<td colspan="2"></td>
			</tr>
		{/each}
	{/if}
{/if}

<style>
	.transaction-row {
		transition: background-color 0.2s;
	}

	.transaction-row:hover {
		background-color: #f8f9fa;
	}

	.transaction-row.selected {
		background-color: #e3f2fd;
	}

	.transaction-row.balanced {
		border-left: 3px solid #4caf50;
	}

	.transaction-row.unbalanced {
		border-left: 3px solid #dc3545;
	}

	.transaction-row.editing {
		background-color: #fff9e6;
		border-left: 3px solid #ff9800;
	}

	/* Drag & Drop styles */
	.transaction-row.draggable {
		cursor: grab;
	}

	.transaction-row.dragging {
		opacity: 0.5;
		background-color: #e3f2fd;
		cursor: grabbing;
	}

	.transaction-row.drag-over {
		background-color: #c8e6c9;
	}

	.transaction-row.drag-over-top {
		border-top: 3px dashed #4a90e2;
	}

	.transaction-row.drag-over-bottom {
		border-bottom: 3px dashed #4a90e2;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid #e9ecef;
		vertical-align: middle;
	}

	.col-checkbox {
		width: 40px;
		text-align: center;
	}

	.col-checkbox input[type='checkbox'] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.col-date {
		min-width: 120px;
	}

	.col-date input {
		width: 140px;
	}

	.col-description {
		min-width: 200px;
		max-width: 300px;
	}

	.col-description input {
		width: 100%;
	}

	.col-payee {
		min-width: 150px;
	}

	.col-payee input {
		width: 100%;
	}

	.col-accounts {
		min-width: 120px;
		font-size: 0.9rem;
		color: #666;
	}

	.col-amount {
		text-align: right;
		font-weight: 500;
	}

	.col-balance {
		text-align: center;
		width: 80px;
	}

	.col-postings-info {
		font-size: 0.9rem;
		color: #666;
		font-style: italic;
	}

	.editing-label {
		color: #ff9800;
		font-weight: 500;
	}

	.col-actions {
		text-align: center;
		width: 120px;
	}

	.action-buttons {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn-icon {
		padding: 0.25rem 0.5rem;
		border: 1px solid #dee2e6;
		background-color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-icon:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.btn-icon:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-expand:hover {
		border-color: #4a90e2;
		background-color: #e3f2fd;
	}

	.btn-collapse:hover {
		border-color: #4a90e2;
		background-color: #e3f2fd;
	}

	.btn-edit:hover {
		border-color: #ff9800;
		background-color: #fff3e0;
	}

	.btn-save {
		border-color: #4caf50;
	}

	.btn-save:hover:not(:disabled) {
		background-color: #4caf50;
		color: white;
	}

	.btn-cancel:hover {
		border-color: #dc3545;
		background-color: #ffebee;
	}

	.btn-duplicate:hover {
		border-color: #607d8b;
		background-color: #eceff1;
	}

	.btn-delete:hover {
		border-color: #dc3545;
		background-color: #ffebee;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.badge-success {
		background-color: #d4edda;
		color: #155724;
	}

	.badge-error {
		background-color: #f8d7da;
		color: #721c24;
	}

	.badge-warning {
		background-color: #fff3cd;
		color: #856404;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	input:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	input.error {
		border-color: #dc3545;
		background-color: #fff5f5;
	}

	/* Posting rows (readonly) */
	.posting-row.readonly {
		background-color: #f8f9fa;
		font-size: 0.9rem;
	}

	.indent {
		width: 40px;
	}

	.posting-account {
		color: #555;
	}

	.posting-amount {
		text-align: right;
		font-weight: 500;
	}

	.posting-currency {
		color: #666;
	}

	/* Posting add row */
	.posting-add-row {
		background-color: #f8f9fa;
	}

	.btn-add-posting {
		width: 100%;
		padding: 0.75rem;
		border: 2px dashed #ccc;
		background-color: white;
		border-radius: 4px;
		cursor: pointer;
		color: #4a90e2;
		font-weight: 500;
		transition: all 0.2s;
	}

	.btn-add-posting:hover {
		border-color: #4a90e2;
		background-color: #e3f2fd;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.transaction-row {
			display: block;
		}

		td {
			display: block;
			text-align: left;
			padding: 0.5rem;
		}

		.action-buttons {
			justify-content: flex-start;
		}
	}
</style>
