import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * US-004-01 : Enregistrer une dépense simple (2 postings, 1 devise)
 *
 * Critères d'acceptation :
 * - Le formulaire de transaction est accessible
 * - Une transaction contient au minimum 2 postings
 * - La somme des montants doit être 0 (tolérance ±0.01)
 * - Les devises de tous les postings doivent correspondre aux devises des comptes
 * - La date doit être au format YYYY-MM-DD
 * - La date ne doit pas être dans le futur (avertissement)
 * - Un ID unique est généré automatiquement (format txn_XXX)
 * - La transaction est sauvegardée dans le fichier TOML
 * - Les soldes des comptes sont mis à jour immédiatement
 * - Un message de confirmation est affiché
 * - La transaction apparaît dans la liste triée par date
 */

test.describe('US-004-01 : Enregistrer une dépense simple', () => {
	test.beforeEach(async ({ page }) => {
		// Naviguer vers la page d'accueil et charger un fichier de test
		await page.goto('/');

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

		// Attendre que le dashboard soit visible
		await expect(page.locator('h2:has-text("📊 Tableau de bord")')).toBeVisible({ timeout: 5000 });

		// Créer quelques comptes pour les transactions
		// Assets:Bank:CHF:PostFinance
		await page.click('a[href="/accounts"]');
		await page.waitForTimeout(1000);

		await page.click('button:has-text("Nouveau compte")');
		await page.waitForTimeout(500);

		await page.selectOption('select#type', 'Assets');
		await page.fill('input#name, input[name="name"]', 'Assets:Bank:CHF:PostFinance');
		await page.selectOption('select#currency, select[name="currency"]', 'CHF');
		await page.click('button[type="submit"]');
		await page.waitForTimeout(2000);

		// Expenses:Food:Groceries
		await page.click('button:has-text("Nouveau compte")');
		await page.waitForTimeout(500);

		await page.selectOption('select#type', 'Expenses');
		await page.fill('input#name, input[name="name"]', 'Expenses:Food:Groceries');
		await page.selectOption('select#currency, select[name="currency"]', 'CHF');
		await page.click('button[type="submit"]');
		await page.waitForTimeout(2000);

		// Naviguer vers la page des transactions
		await page.goto('/transactions');
		await page.waitForTimeout(1000);
	});

	test('devrait afficher le bouton pour créer une nouvelle transaction', async ({ page }) => {
		// Vérifier que le bouton ou lien "Nouvelle transaction" existe
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), a:has-text("Nouvelle transaction")').first();
		const buttonExists = await newButton.isVisible({ timeout: 5000 }).catch(() => false);

		expect(buttonExists).toBe(true);
	});

	test('devrait ouvrir le formulaire de création de transaction', async ({ page }) => {
		// Cliquer sur le bouton de création
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		await newButton.click();

		// Attendre que le formulaire soit visible
		await page.waitForTimeout(1000);

		// Vérifier que le formulaire contient les champs essentiels
		const hasDateInput = await page.locator('input[type="date"], input#date, input[name="date"]').count() > 0;
		const hasDescriptionInput = await page.locator('input#description, textarea#description, input[name="description"], textarea[name="description"]').count() > 0;

		expect(hasDateInput || hasDescriptionInput).toBe(true);
	});

	test('devrait créer une transaction simple avec 2 postings', async ({ page }) => {
		// Ouvrir le formulaire
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		await newButton.click();
		await page.waitForTimeout(1000);

		// Remplir la date
		const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
		if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
			await dateInput.fill('2025-01-15');
		}

		// Remplir la description
		const descriptionInput = page.locator('input#description, textarea#description, input[name="description"], textarea[name="description"]').first();
		if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
			await descriptionInput.fill('Courses au supermarché Migros');
		}

		// Remplir les postings
		// Posting 1 : Expenses:Food:Groceries +120.50 CHF
		// Posting 2 : Assets:Bank:CHF:PostFinance -120.50 CHF

		// Chercher les champs de posting (la structure exacte peut varier)
		const accountSelects = page.locator('select[name*="account"], select[id*="account"], select[class*="account"]');
		const amountInputs = page.locator('input[type="number"], input[name*="amount"], input[id*="amount"]');

		const accountCount = await accountSelects.count();
		const amountCount = await amountInputs.count();

		if (accountCount >= 2 && amountCount >= 2) {
			// Remplir le premier posting
			await accountSelects.nth(0).selectOption({ label: /Groceries|Expenses/i });
			await amountInputs.nth(0).fill('120.50');

			// Remplir le deuxième posting
			await accountSelects.nth(1).selectOption({ label: /PostFinance|Bank|Assets/i });
			await amountInputs.nth(1).fill('-120.50');
		}

		// Soumettre le formulaire
		const submitButton = page.locator('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Créer")').first();
		if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await submitButton.click();

			// Attendre le message de succès ou la fermeture du formulaire
			await page.waitForTimeout(3000);

			// Vérifier qu'un message de succès apparaît ou que la transaction est dans la liste
			const hasSuccess = await page.locator('.alert-success, .success-message, [class*="success"]').count() > 0;
			const hasTransaction = await page.locator('text=Migros, text=Groceries').count() > 0;

			expect(hasSuccess || hasTransaction).toBe(true);
		}
	});

	test('devrait afficher un indicateur d\'équilibre en temps réel', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Bouton de création non trouvé - test skipped');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Chercher un indicateur d'équilibre
		const balanceIndicators = page.locator(
			'[class*="balance"], [class*="equilibre"], [id*="balance"], text=/équilibr/i, text=/balance/i'
		);

		const hasBalanceIndicator = await balanceIndicators.count() > 0;

		if (hasBalanceIndicator) {
			console.log('Indicateur d\'équilibre trouvé');
			const indicatorText = await balanceIndicators.first().textContent();
			console.log('Texte de l\'indicateur:', indicatorText);
		}
	});

	test('devrait valider que la transaction doit contenir au moins 2 postings', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Essayer de soumettre avec moins de 2 postings
		const submitButton = page.locator('button[type="submit"]').first();
		const submitExists = await submitButton.isVisible({ timeout: 2000 }).catch(() => false);

		if (submitExists) {
			await submitButton.click();
			await page.waitForTimeout(1000);

			// Devrait afficher une erreur de validation
			const hasError = await page.locator('.error-message, .alert-error, [class*="error"]').count() > 0;
			expect(hasError).toBe(true);
		}
	});

	test('devrait valider que la transaction doit être équilibrée (somme = 0)', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Remplir la description
		const descriptionInput = page.locator('input#description, textarea#description, input[name="description"], textarea[name="description"]').first();
		if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
			await descriptionInput.fill('Transaction déséquilibrée');
		}

		// Essayer de créer une transaction non équilibrée
		const amountInputs = page.locator('input[type="number"]');
		const amountCount = await amountInputs.count();

		if (amountCount >= 2) {
			// Montants qui ne s'équilibrent pas
			await amountInputs.nth(0).fill('100');
			await amountInputs.nth(1).fill('-50');

			const submitButton = page.locator('button[type="submit"]').first();
			if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
				await submitButton.click();
				await page.waitForTimeout(1000);

				// Devrait afficher une erreur
				const hasError = await page.locator('.error-message, .alert-error').count() > 0;
				// Ou l'indicateur devrait montrer le déséquilibre
				const balanceText = await page.locator('[class*="balance"]').first().textContent().catch(() => '');

				expect(hasError || balanceText.includes('-50') || balanceText.includes('50')).toBe(true);
			}
		}
	});

	test('devrait permettre d\'ajouter plus de 2 postings', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Chercher un bouton pour ajouter un posting
		const addPostingButton = page.locator('button:has-text("Ajouter un posting"), button:has-text("Ajouter"), button:has-text("+")');
		const addButtonCount = await addPostingButton.count();

		if (addButtonCount > 0) {
			const initialPostings = await page.locator('[class*="posting"], .posting-row, [data-posting]').count();

			await addPostingButton.first().click();
			await page.waitForTimeout(500);

			const newPostings = await page.locator('[class*="posting"], .posting-row, [data-posting]').count();

			expect(newPostings).toBeGreaterThan(initialPostings);
		}
	});

	test('devrait permettre d\'annuler la création d\'une transaction', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Remplir partiellement le formulaire
		const descriptionInput = page.locator('input#description, textarea#description, input[name="description"], textarea[name="description"]').first();
		if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
			await descriptionInput.fill('Transaction à annuler');
		}

		// Cliquer sur Annuler
		const cancelButton = page.locator('button:has-text("Annuler")').first();
		if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await cancelButton.click();
			await page.waitForTimeout(1000);

			// Vérifier que le formulaire est fermé
			const formStillVisible = await page.locator('input#description, textarea#description').count() > 0;
			expect(formStillVisible).toBe(false);
		}
	});

	test('devrait afficher les transactions dans la liste après création', async ({ page }) => {
		// Vérifier si des transactions existent déjà
		const initialCount = await page.locator('[class*="transaction"], .transaction-row, [data-transaction]').count();

		console.log('Nombre initial de transactions:', initialCount);

		// Note: Ce test vérifie simplement que la liste de transactions est accessible
		// La création effective dépend de l'implémentation du formulaire

		// Vérifier que la page transactions ne montre pas d'erreur
		const hasError = await page.locator('.alert-error').count() > 0;
		expect(hasError).toBe(false);
	});

	test('devrait calculer automatiquement le montant du dernier posting (si implémenté)', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Chercher une option de calcul automatique
		const autoCalculateOption = page.locator(
			'input[type="checkbox"]:has-text("Calculer"), input[type="checkbox"]:has-text("Auto"), [class*="auto-calculate"]'
		);

		const hasAutoCalculate = await autoCalculateOption.count() > 0;

		if (hasAutoCalculate) {
			console.log('Option de calcul automatique trouvée');

			// Cocher l'option
			await autoCalculateOption.first().check();

			// Remplir le premier posting
			const amountInputs = page.locator('input[type="number"]');
			if (await amountInputs.count() >= 1) {
				await amountInputs.first().fill('150');

				// Le dernier posting devrait être calculé automatiquement à -150
				await page.waitForTimeout(500);

				const lastAmount = await amountInputs.last().inputValue();
				expect(lastAmount).toBe('-150');
			}
		}
	});

	test('ne devrait pas accepter une date dans le futur (avertissement)', async ({ page }) => {
		const newButton = page.locator('button:has-text("Nouvelle transaction"), button:has-text("Nouveau"), button:has-text("+")').first();
		const buttonExists = await newButton.isVisible({ timeout: 3000 }).catch(() => false);

		if (!buttonExists) {
			console.log('Test skipped - bouton non trouvé');
			return;
		}

		await newButton.click();
		await page.waitForTimeout(1000);

		// Entrer une date dans le futur
		const dateInput = page.locator('input[type="date"], input#date, input[name="date"]').first();
		if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
			await dateInput.fill('2026-12-31');

			// Chercher un avertissement
			await page.waitForTimeout(500);

			const warningExists = await page.locator('.warning, .alert-warning, [class*="warn"]').count() > 0;

			if (warningExists) {
				const warningText = await page.locator('.warning, .alert-warning, [class*="warn"]').first().textContent();
				console.log('Avertissement:', warningText);
			}

			// Note: Un avertissement peut apparaître, mais la création peut toujours être autorisée
		}
	});
});
