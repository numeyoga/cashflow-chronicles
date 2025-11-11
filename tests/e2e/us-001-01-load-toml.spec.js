import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * US-001-01 : Charger un fichier TOML valide
 *
 * Critères d'acceptation :
 * - Le fichier TOML est parsé sans erreur
 * - Toutes les sections obligatoires sont présentes
 * - Les dates sont converties en objets Date JavaScript
 * - Les nombres décimaux sont correctement parsés
 * - Le chargement prend moins de 1 seconde pour 10 000 transactions
 * - Un message de succès détaillé est affiché
 * - Les données sont accessibles en mémoire pour les autres composants
 */

test.describe('US-001-01 : Charger un fichier TOML valide', () => {
	test.beforeEach(async ({ page }) => {
		// Naviguer vers la page d'accueil
		await page.goto('/');

		// Vérifier que nous sommes sur la page d'accueil sans données chargées
		await expect(page.locator('h2:has-text("Pour commencer")')).toBeVisible();
	});

	test('devrait charger un fichier TOML minimal valide', async ({ page }) => {
		// Étape 1 : Préparer le fichier de test
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		// Créer un objet File pour la simulation
		const dataTransfer = await page.evaluateHandle((content) => {
			const dt = new DataTransfer();
			const file = new File([content], 'test-valid-minimal.toml', { type: 'text/plain' });
			dt.items.add(file);
			return dt;
		}, fixtureContent);

		// Étape 2 : Sélectionner le fichier via l'interface
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Étape 3 : Attendre que le fichier soit chargé
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 5000 });

		// Étape 4 : Vérifier que les statistiques sont affichées correctement
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('1');
		await expect(page.locator('.stat-card:has-text("Comptes") .stat-value')).toHaveText('2');
		await expect(page.locator('.stat-card:has-text("Transactions") .stat-value')).toHaveText('1');
		await expect(page.locator('.stat-card:has-text("Budgets") .stat-value')).toHaveText('0');

		// Étape 5 : Vérifier que les liens rapides sont disponibles
		await expect(page.locator('a[href="/currencies"]')).toBeVisible();
		await expect(page.locator('a[href="/accounts"]')).toBeVisible();
		await expect(page.locator('a[href="/transactions"]')).toBeVisible();
	});

	test('devrait charger un fichier avec plusieurs devises', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-multi-currencies.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test-multi-currencies.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Vérifier le chargement
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 5000 });

		// Vérifier les statistiques
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('3');
		await expect(page.locator('.stat-card:has-text("Comptes") .stat-value')).toHaveText('3');

		// Naviguer vers la page des devises pour vérifier le contenu
		await page.click('a[href="/currencies"]');
		await expect(page.locator('h1:has-text("Devises")')).toBeVisible();

		// Vérifier que les 3 devises sont affichées
		await expect(page.locator('text=CHF')).toBeVisible();
		await expect(page.locator('text=EUR')).toBeVisible();
		await expect(page.locator('text=USD')).toBeVisible();
	});

	test('devrait afficher une erreur pour un fichier invalide (sans version)', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-invalid-no-version.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test-invalid-no-version.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Vérifier qu'un message d'erreur est affiché
		await expect(page.locator('.alert-error')).toBeVisible({ timeout: 3000 });

		// Vérifier que le tableau de bord n'est pas affiché
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).not.toBeVisible();
	});

	test('devrait charger le fichier en moins de 1 seconde', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"]');

		// Mesurer le temps de chargement
		const startTime = Date.now();

		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		// Attendre que le dashboard soit visible
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 5000 });

		const endTime = Date.now();
		const loadTime = endTime - startTime;

		// Vérifier que le chargement a pris moins de 1 seconde
		expect(loadTime).toBeLessThan(1000);

		console.log(`Temps de chargement : ${loadTime}ms`);
	});

	test('devrait permettre de créer un nouveau fichier', async ({ page }) => {
		// Cliquer sur le bouton "Créer un nouveau budget"
		await page.click('button:has-text("Créer un nouveau budget")');

		// Vérifier que le tableau de bord est affiché
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 3000 });

		// Vérifier les statistiques par défaut
		await expect(page.locator('.stat-card:has-text("Devises") .stat-value')).toHaveText('1');
		await expect(page.locator('.stat-card:has-text("Comptes") .stat-value')).toHaveText('0');
		await expect(page.locator('.stat-card:has-text("Transactions") .stat-value')).toHaveText('0');
		await expect(page.locator('.stat-card:has-text("Budgets") .stat-value')).toHaveText('0');

		// Vérifier que la devise par défaut CHF est créée
		await page.click('a[href="/currencies"]');
		await expect(page.locator('text=CHF')).toBeVisible();
	});

	test('devrait permettre de naviguer entre les différentes sections après chargement', async ({ page }) => {
		const fixtureContent = readFileSync(
			join(process.cwd(), 'tests/fixtures/test-valid-minimal.toml'),
			'utf-8'
		);

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: 'test-valid-minimal.toml',
			mimeType: 'text/plain',
			buffer: Buffer.from(fixtureContent)
		});

		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 5000 });

		// Naviguer vers les devises
		await page.click('a[href="/currencies"]');
		await expect(page.locator('h1:has-text("Devises")')).toBeVisible();

		// Revenir à l'accueil (via navigation ou breadcrumb)
		await page.goto('/');
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible();

		// Naviguer vers les comptes
		await page.click('a[href="/accounts"]');
		await expect(page.locator('h1:has-text("Comptes")')).toBeVisible();

		// Naviguer vers les transactions
		await page.goto('/');
		await page.click('a[href="/transactions"]');
		await expect(page.locator('h1:has-text("Transactions")')).toBeVisible();
	});

	test('devrait afficher le bouton "Ouvrir un fichier" avec état de chargement', async ({ page }) => {
		const button = page.locator('button:has-text("Ouvrir un fichier")');

		// Vérifier que le bouton est visible initialement
		await expect(button).toBeVisible();
		await expect(button).toHaveText('Ouvrir un fichier');

		// Note: Tester l'état "Chargement..." nécessiterait de ralentir artificiellement le chargement
		// Ce test vérifie simplement que le bouton existe et fonctionne
	});
});
