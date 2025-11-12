<script>
	/**
	 * Composant FileUpload avec drag & drop et File System Access API
	 *
	 * @component
	 * @prop {Function} onFileLoaded - Callback appelé après le chargement réussi du fichier
	 * @prop {Function} onError - Callback appelé en cas d'erreur
	 */

	import { loadTOMLFile } from '$lib/infrastructure/tomlParser.js';

	let { onFileLoaded = () => {}, onError = () => {} } = $props();

	let fileInput = $state(null);
	let isDragging = $state(false);
	let loading = $state(false);
	let error = $state(null);

	// Vérifier si File System Access API est disponible (vérification SSR-safe)
	const supportsFileSystemAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

	/**
	 * Ouvre le sélecteur de fichier avec File System Access API si disponible
	 */
	async function openFilePicker() {
		error = null;
		loading = true;

		try {
			if (supportsFileSystemAccess) {
				// Utiliser File System Access API pour avoir un vrai handle
				const [fileHandle] = await window.showOpenFilePicker({
					types: [
						{
							description: 'Fichiers TOML',
							accept: {
								'text/plain': ['.toml']
							}
						}
					],
					multiple: false
				});

				const file = await fileHandle.getFile();
				await processFile(file, fileHandle);
			} else {
				// Fallback sur l'input file classique
				fileInput?.click();
			}
		} catch (err) {
			// L'utilisateur a annulé ou une erreur s'est produite
			if (err.name !== 'AbortError') {
				const errorMessage = `Erreur lors de l'ouverture du fichier : ${err.message}`;
				error = errorMessage;
				onError(errorMessage);
			}
			loading = false;
		}
	}

	/**
	 * Traite le fichier sélectionné
	 */
	async function handleFileSelect() {
		error = null;
		const file = fileInput.files[0];
		if (!file) return;

		loading = true;
		await processFile(file, null);
	}

	/**
	 * Traite un fichier (lecture et parsing)
	 */
	async function processFile(file, fileHandle = null) {
		try {
			const text = await file.text();
			const result = loadTOMLFile(text);

			if (result.success) {
				// Créer un handle de fichier (vrai ou simulé)
				const handle = fileHandle || { name: file.name };
				onFileLoaded(result, handle);
				error = null;
			} else {
				error = result.error;
				onError(result.error);
			}
		} catch (err) {
			const errorMessage = `Erreur lors de la lecture du fichier : ${err.message}`;
			error = errorMessage;
			onError(errorMessage);
		} finally {
			loading = false;
		}
	}

	/**
	 * Gère le drag over
	 */
	function handleDragOver(e) {
		e.preventDefault();
		isDragging = true;
	}

	/**
	 * Gère le drag leave
	 */
	function handleDragLeave(e) {
		e.preventDefault();
		isDragging = false;
	}

	/**
	 * Gère le drop
	 */
	async function handleDrop(e) {
		e.preventDefault();
		isDragging = false;
		error = null;

		const files = e.dataTransfer.files;
		if (files.length === 0) return;

		const file = files[0];

		// Vérifier l'extension
		if (!file.name.endsWith('.toml')) {
			const errorMessage = 'Seuls les fichiers .toml sont acceptés';
			error = errorMessage;
			onError(errorMessage);
			return;
		}

		loading = true;
		await processFile(file, null);
	}
</script>

<div class="file-upload">
	<!-- Zone de drag & drop -->
	<div
		class="drop-zone"
		class:dragging={isDragging}
		class:loading
		role="button"
		tabindex="0"
		aria-label="Zone de téléchargement de fichier TOML"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		{#if loading}
			<div class="loading-indicator">
				<div class="spinner"></div>
				<p>Chargement en cours...</p>
			</div>
		{:else}
			<div class="drop-zone-content">
				<div class="icon">📂</div>
				<h3>Glissez-déposez votre fichier TOML ici</h3>
				<p class="hint">ou</p>
				<button class="btn btn-primary" onclick={openFilePicker}> Parcourir les fichiers </button>
				<p class="info">
					Formats acceptés : .toml
					{#if supportsFileSystemAccess}
						<span class="badge">✓ File System Access API</span>
					{/if}
				</p>
			</div>
		{/if}
	</div>

	<!-- Input file caché (fallback) -->
	<input
		type="file"
		accept=".toml"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none"
	/>

	<!-- Message d'erreur -->
	{#if error}
		<div class="alert alert-error">
			<strong>Erreur :</strong>
			<pre>{error}</pre>
		</div>
	{/if}
</div>

<style>
	.file-upload {
		width: 100%;
	}

	.drop-zone {
		border: 2px dashed #cbd5e0;
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		background-color: #f7fafc;
		transition: all 0.3s ease;
		cursor: pointer;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.drop-zone:hover {
		border-color: #3498db;
		background-color: #eef6fc;
	}

	.drop-zone.dragging {
		border-color: #3498db;
		background-color: #d6ecf9;
		transform: scale(1.02);
		box-shadow: 0 8px 16px rgba(52, 152, 219, 0.2);
	}

	.drop-zone.loading {
		cursor: wait;
		opacity: 0.8;
	}

	.drop-zone-content {
		width: 100%;
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.drop-zone h3 {
		margin: 0 0 1rem 0;
		color: #2c3e50;
		font-size: 1.5rem;
	}

	.hint {
		color: #718096;
		margin: 1rem 0;
		font-style: italic;
	}

	.info {
		margin-top: 1.5rem;
		color: #718096;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-block;
		background-color: #48bb78;
		color: white;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-weight: 600;
	}

	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #e2e8f0;
		border-top-color: #3498db;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-indicator p {
		color: #4a5568;
		font-weight: 500;
	}

	.btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2980b9;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.alert {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: 8px;
	}

	.alert-error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.alert pre {
		margin: 0.5rem 0 0 0;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.drop-zone {
			padding: 2rem 1rem;
			min-height: 250px;
		}

		.icon {
			font-size: 3rem;
		}

		.drop-zone h3 {
			font-size: 1.25rem;
		}
	}
</style>
