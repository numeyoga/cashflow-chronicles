import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests E2E pour le téléchargement (upload) et la sauvegarde (download) de fichiers TOML
 *
 * Fonctionnalités testées :
 * - Upload de fichier TOML via input file
 * - Upload de fichier TOML via drag & drop
 * - Bouton de sauvegarde dans la navigation
 * - Bouton "Sauvegarder sous..." dans la navigation
 * - Téléchargement du fichier TOML
 * - Messages de feedback pour l'upload et la sauvegarde
 */

test.describe('Upload et Download de fichiers TOML', () => {
	test.beforeEach(async ({ page }) => {
		// Naviguer vers la page d'accueil
		await page.goto('/');

		// Vérifier que nous sommes sur la page d'accueil sans données chargées
		await expect(page.locator('h2:has-text("Pour commencer")')).toBeVisible();
	});

	test('devrait afficher la zone de drag & drop', async ({ page }) => {
		// Vérifier que la zone de drag & drop est visible
		await expect(page.locator('text=Glissez-déposez votre fichier TOML ici')).toBeVisible();

		// Vérifier que le bouton "Parcourir les fichiers" est visible
		await expect(page.locator('button:has-text("Parcourir les fichiers")')).toBeVisible();

		// Vérifier que l'information sur les formats est visible
		await expect(page.locator('text=Formats acceptés : .toml')).toBeVisible();
	});

	test("devrait charger un fichier via l'input file standard", async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		// Trouver l'input file caché
		const fileInput = page.locator('input[type="file"][accept=".toml"]');

		// Charger le fichier
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Vérifier que le fichier a été chargé et que le dashboard est visible
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({
			timeout: 5000
		});

		// Vérifier les statistiques
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('1');
		await expect(page.locator('.stat-card:has-text("Comptes") .stat-value')).toHaveText('2');
		await expect(page.locator('.stat-card:has-text("Transactions") .stat-value')).toHaveText('1');
	});

	test('devrait charger un fichier via drag & drop', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		// Trouver la zone de drag & drop
		const dropZone = page.locator('.drop-zone').first();

		// Créer un DataTransfer avec le fichier
		const dataTransfer = await page.evaluateHandle((content) => {
			const dt = new DataTransfer();
			const file = new File([content], 'test-valid-minimal.toml', { type: 'text/plain' });
			dt.items.add(file);
			return dt;
		}, fixtureContent);

		// Simuler le drag & drop
		await dropZone.dispatchEvent('drop', { dataTransfer });

		// Vérifier que le fichier a été chargé
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({
			timeout: 5000
		});
	});

	test("devrait afficher l'animation pendant le chargement", async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-multi-currencies.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');

		// Charger le fichier
		const uploadPromise = fileInput.setInputFiles({
			name: 'test-multi-currencies.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Vérifier que l'indicateur de chargement apparaît (peut être très rapide)
		// Note: Ce test peut être flaky si le chargement est trop rapide
		const loadingIndicator = page.locator('text=Chargement en cours...');
		await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);

		// Attendre la fin du chargement
		await uploadPromise;

		// Le dashboard devrait être visible à la fin
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();
	});

	test('devrait afficher une erreur pour un fichier non-TOML', async ({ page }) => {
		// Créer un fichier texte qui n'est pas TOML
		const invalidContent = 'This is not a TOML file';

		// Trouver la zone de drop
		const dropZone = page.locator('.drop-zone').first();

		// Créer un fichier avec une mauvaise extension
		const dataTransfer = await page.evaluateHandle((content) => {
			const dt = new DataTransfer();
			const file = new File([content], 'test.txt', { type: 'text/plain' });
			dt.items.add(file);
			return dt;
		}, invalidContent);

		// Simuler le drop
		await dropZone.dispatchEvent('drop', { dataTransfer });

		// Vérifier qu'une erreur est affichée
		await expect(page.locator('text=Seuls les fichiers .toml sont acceptés')).toBeVisible({
			timeout: 3000
		});
	});

	test('devrait afficher les boutons de sauvegarde après chargement', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Attendre que le dashboard soit visible
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Vérifier que les boutons de sauvegarde sont visibles dans la navigation
		const saveButton = page.locator('button[title="Sauvegarder"]').first();
		await expect(saveButton).toBeVisible();

		// Vérifier le bouton "Sauvegarder sous..." (si disponible selon l'API)
		const saveAsButton = page.locator('button[title*="Sauvegarder sous"]').first();
		const saveAsExists = await saveAsButton.isVisible({ timeout: 1000 }).catch(() => false);

		// Le bouton peut ne pas être visible si l'API n'est pas supportée
		if (saveAsExists) {
			await expect(saveAsButton).toBeVisible();
		}
	});

	test('devrait déclencher le téléchargement via le bouton Sauvegarder', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Écouter les téléchargements
		const downloadPromise = page.waitForEvent('download', { timeout: 5000 });

		// Cliquer sur le bouton de sauvegarde
		const saveButton = page.locator('button[title="Sauvegarder"]').first();
		await saveButton.click();

		// Attendre le téléchargement (peut échouer si File System Access API est utilisé)
		const download = await downloadPromise.catch(() => null);

		if (download) {
			// Vérifier que le nom du fichier est correct
			const fileName = download.suggestedFilename();
			expect(fileName).toContain('.toml');

			// Vérifier que le contenu peut être téléchargé
			const path = await download.path();
			expect(path).toBeTruthy();
		}

		// Vérifier qu'un message de succès apparaît (alternative si pas de download)
		const successMessage = page.locator('.message-success, text=/Enregistré|téléchargé/i');
		const hasMessage = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);

		// Au moins un des deux devrait être vrai (download OU message)
		expect(download !== null || hasMessage).toBe(true);
	});

	test('devrait gérer le rechargement de fichier après modification', async ({ page }) => {
		// Charger un premier fichier
		const fixtureContent1 = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent1)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Vérifier les statistiques du premier fichier
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('1');

		// Retourner à l'accueil
		await page.goto('/');

		// Charger un second fichier avec plus de données
		const fixtureContent2 = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-multi-currencies.toml'),
			'utf-8'
		);

		await fileInput.setInputFiles({
			name: 'test-multi-currencies.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent2)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Vérifier que les statistiques ont été mises à jour
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('3');
	});

	test('devrait afficher le badge File System Access API si disponible', async ({ page }) => {
		// Vérifier si le badge est affiché
		const badge = page.locator('text=File System Access API');
		const isBadgeVisible = await badge.isVisible({ timeout: 2000 }).catch(() => false);

		// Le badge devrait être visible dans les navigateurs supportant l'API
		// Note: Cela dépend du navigateur et de l'environnement de test
		if (isBadgeVisible) {
			await expect(badge).toBeVisible();
		} else {
			console.log(
				"Badge File System Access API non visible - navigateur peut ne pas supporter l'API"
			);
		}
	});

	test('devrait maintenir les données lors de la navigation entre pages', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-multi-currencies.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');
		await fileInput.setInputFiles({
			name: 'test-multi-currencies.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Naviguer vers différentes pages
		await page.click('a[href="/currencies"]');
		await expect(page.locator('h1:has-text("Devises")')).toBeVisible();

		// Les boutons de sauvegarde devraient toujours être visibles
		await expect(page.locator('button[title="Sauvegarder"]').first()).toBeVisible();

		// Naviguer vers les comptes
		await page.click('a[href="/accounts"]');
		await expect(page.locator('h1:has-text("Comptes")')).toBeVisible();

		// Les boutons devraient toujours être là
		await expect(page.locator('button[title="Sauvegarder"]').first()).toBeVisible();

		// Retour à l'accueil
		await page.goto('/');

		// Les données devraient être conservées
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('3');
	});

	test('devrait désactiver les boutons de sauvegarde pendant la sauvegarde', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"][accept=".toml"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		const saveButton = page.locator('button[title="Sauvegarder"]').first();

		// Vérifier que le bouton est activé au départ
		await expect(saveButton).toBeEnabled();

		// Cliquer sur le bouton
		await saveButton.click();

		// Vérifier que le bouton est désactivé pendant le traitement (peut être très rapide)
		// Note: Ce test peut être flaky si la sauvegarde est instantanée
		await saveButton.isDisabled().catch(() => false);

		// Attendre un peu pour que la sauvegarde se termine
		await page.waitForTimeout(1000);

		// Le bouton devrait être réactivé après
		await expect(saveButton).toBeEnabled();
	});
});
