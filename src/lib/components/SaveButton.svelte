<script>
	/**
	 * Composant SaveButton pour sauvegarder/télécharger le fichier TOML
	 *
	 * @component
	 * @prop {Object} data - Données à sauvegarder
	 * @prop {FileSystemFileHandle} fileHandle - Handle du fichier (optionnel)
	 * @prop {string} fileName - Nom du fichier (par défaut du handle ou 'budget.toml')
	 * @prop {boolean} showLabel - Afficher le label du bouton (défaut: true)
	 * @prop {Function} onSave - Callback appelé après sauvegarde réussie
	 * @prop {Function} onError - Callback appelé en cas d'erreur
	 */

	import { saveOrDownload, saveFileAs } from '$lib/infrastructure/fileStorage.js';

	let {
		data = null,
		fileHandle = null,
		fileName = 'budget.toml',
		showLabel = true,
		onSave = () => {},
		onError = () => {}
	} = $props();

	let saving = $state(false);
	let message = $state(null);
	let messageType = $state('success'); // 'success' | 'error' | 'info'

	// Vérifier si File System Access API est disponible (vérification SSR-safe)
	const supportsFileSystemAccess = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

	/**
	 * Obtient le nom du fichier actuel
	 */
	function getCurrentFileName() {
		if (fileHandle?.name) {
			return fileHandle.name;
		}
		return fileName;
	}

	/**
	 * Sauvegarde le fichier (écrase le fichier existant)
	 */
	async function handleSave() {
		if (!data) {
			showMessage('Aucune donnée à sauvegarder', 'error');
			onError('Aucune donnée à sauvegarder');
			return;
		}

		saving = true;
		message = null;

		try {
			const result = await saveOrDownload(data, fileHandle, getCurrentFileName());

			if (result.success) {
				showMessage(result.message, 'success');
				onSave(result);
			} else {
				showMessage(result.error, 'error');
				onError(result.error);
			}
		} catch (error) {
			const errorMsg = `Erreur : ${error.message}`;
			showMessage(errorMsg, 'error');
			onError(errorMsg);
		} finally {
			saving = false;
		}
	}

	/**
	 * Sauvegarde le fichier sous un nouveau nom/emplacement
	 */
	async function handleSaveAs() {
		if (!data) {
			showMessage('Aucune donnée à sauvegarder', 'error');
			onError('Aucune donnée à sauvegarder');
			return;
		}

		saving = true;
		message = null;

		try {
			const result = await saveFileAs(data, getCurrentFileName());

			if (result.success) {
				showMessage(result.message, 'success');
				// Mettre à jour le fileHandle si on en a reçu un nouveau
				if (result.fileHandle) {
					onSave({ ...result, fileHandle: result.fileHandle });
				} else {
					onSave(result);
				}
			} else if (!result.cancelled) {
				showMessage(result.error, 'error');
				onError(result.error);
			}
		} catch (error) {
			const errorMsg = `Erreur : ${error.message}`;
			showMessage(errorMsg, 'error');
			onError(errorMsg);
		} finally {
			saving = false;
		}
	}

	/**
	 * Affiche un message temporaire
	 */
	function showMessage(text, type = 'success') {
		message = text;
		messageType = type;

		// Masquer le message après 3 secondes
		setTimeout(() => {
			message = null;
		}, 3000);
	}
</script>

<div class="save-button-container">
	<div class="button-group">
		<!-- Bouton Sauvegarder -->
		<button
			class="btn btn-save"
			onclick={handleSave}
			disabled={saving || !data}
			title="Sauvegarder"
		>
			<span class="icon">{saving ? '⏳' : '💾'}</span>
			{#if showLabel}
				<span class="label">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
			{/if}
		</button>

		<!-- Bouton Sauvegarder sous -->
		{#if supportsFileSystemAccess || !fileHandle}
			<button
				class="btn btn-save-as"
				onclick={handleSaveAs}
				disabled={saving || !data}
				title="Sauvegarder sous..."
			>
				<span class="icon">📥</span>
				{#if showLabel}
					<span class="label">Sauvegarder sous...</span>
				{/if}
			</button>
		{/if}
	</div>

	<!-- Message de feedback -->
	{#if message}
		<div class="message message-{messageType}">
			{message}
		</div>
	{/if}
</div>

<style>
	.save-button-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-save {
		background-color: #3498db;
		color: white;
	}

	.btn-save:hover:not(:disabled) {
		background-color: #2980b9;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
	}

	.btn-save:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-save-as {
		background-color: #95a5a6;
		color: white;
	}

	.btn-save-as:hover:not(:disabled) {
		background-color: #7f8c8d;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(149, 165, 166, 0.3);
	}

	.btn-save-as:active:not(:disabled) {
		transform: translateY(0);
	}

	.icon {
		font-size: 1.1rem;
		line-height: 1;
	}

	.label {
		font-size: 0.9rem;
	}

	.message {
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-size: 0.85rem;
		animation: slideIn 0.3s ease;
	}

	.message-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.message-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.message-info {
		background-color: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.button-group {
			flex-direction: column;
			width: 100%;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
