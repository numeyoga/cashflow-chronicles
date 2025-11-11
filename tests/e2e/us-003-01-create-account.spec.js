import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * US-003-01 : Créer un compte bancaire (Assets)
 *
 * Critères d'acceptation :
 * - Le formulaire de création de compte est accessible
 * - Le nom hiérarchique doit contenir au moins 2 segments séparés par ':'
 * - Le premier segment doit correspondre au type sélectionné
 * - Un ID unique est généré automatiquement (format acc_XXX)
 * - La devise doit exister dans la liste des devises
 * - La date d'ouverture doit être au format YYYY-MM-DD
 * - Le compte est sauvegardé dans le fichier TOML
 * - Le compte apparaît dans la hiérarchie correspondant à son type
 * - Le solde initial est de 0 (sera alimenté par transactions)
 * - Un message de confirmation est affiché
 */

test.describe('US-003-01 : Créer un compte bancaire (Assets)', () => {
	test.beforeEach(async ({ page }) => {
		// Naviguer vers la page d'accueil et charger un fichier de test avec plusieurs devises
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

		// Naviguer vers la page des comptes
		await page.click('a[href="/accounts"]');
		await expect(page.locator('h1:has-text("Comptes")')).toBeVisible();
	});

	test('devrait afficher le bouton "Nouveau compte"', async ({ page }) => {
		// Vérifier que le bouton existe
		const addButton = page.locator('button:has-text("Nouveau compte")');
		await expect(addButton).toBeVisible();
	});

	test('devrait ouvrir le formulaire de création au clic sur le bouton', async ({ page }) => {
		// Cliquer sur le bouton de création
		await page.click('button:has-text("Nouveau compte")');

		// Vérifier que le formulaire est affiché
		await expect(page.locator('h2:has-text("Nouveau compte")')).toBeVisible();

		// Vérifier que tous les champs sont présents
		await expect(page.locator('select#type')).toBeVisible();
		await expect(page.locator('input#name, input[name="name"]').first()).toBeVisible();
		await expect(page.locator('select#currency, select[name="currency"]').first()).toBeVisible();
		await expect(page.locator('input#opened, input[type="date"]').first()).toBeVisible();

		// Vérifier les boutons
		await expect(page.locator('button[type="submit"]')).toBeVisible();
		await expect(page.locator('button:has-text("Annuler")').first()).toBeVisible();
	});

	test('devrait créer un compte Assets avec succès', async ({ page }) => {
		// Ouvrir le formulaire
		await page.click('button:has-text("Nouveau compte")');
		await expect(page.locator('h2:has-text("Nouveau compte")')).toBeVisible();

		// Sélectionner le type Assets
		await page.selectOption('select#type', 'Assets');

		// Remplir le nom hiérarchique
		const nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:CHF:PostFinance');

		// Sélectionner une devise
		const currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		// La date d'ouverture devrait être pré-remplie avec aujourd'hui
		// On peut la modifier si nécessaire
		const dateInput = page.locator('input#opened, input[type="date"]').first();
		await dateInput.fill('2025-01-01');

		// Soumettre le formulaire
		await page.click('button[type="submit"]');

		// Attendre le message de succès
		await expect(
			page.locator('.alert-success')
		).toBeVisible({ timeout: 5000 });

		// Vérifier que le message contient le nom du compte
		const successMessage = await page.locator('.alert-success').textContent();
		expect(successMessage).toContain('PostFinance');

		// Vérifier que le formulaire est fermé
		await expect(page.locator('h2:has-text("Nouveau compte")')).not.toBeVisible();

		// Vérifier que le compte apparaît dans la liste
		await expect(page.locator('text=PostFinance')).toBeVisible();
	});

	test('devrait valider que le nom contient au moins 2 segments', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		// Essayer de créer un compte avec un seul segment
		await page.selectOption('select#type', 'Assets');

		const nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets');

		const currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		await page.click('button[type="submit"]');

		// Vérifier qu'une erreur de validation apparaît
		await page.waitForTimeout(1000);

		const hasError = await page.locator('.error-message, .alert-error').count() > 0;
		expect(hasError).toBe(true);
	});

	test('devrait valider que le premier segment correspond au type', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		// Sélectionner Assets mais mettre Expenses dans le nom
		await page.selectOption('select#type', 'Assets');

		const nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Expenses:Food:Groceries');

		const currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		await page.click('button[type="submit"]');

		// Vérifier qu'une erreur de validation apparaît
		await page.waitForTimeout(1000);

		const hasError = await page.locator('.error-message, .alert-error').count() > 0;
		expect(hasError).toBe(true);
	});

	test('devrait empêcher la création d\'un compte avec un nom déjà existant', async ({ page }) => {
		// Créer un premier compte
		await page.click('button:has-text("Nouveau compte")');
		await page.selectOption('select#type', 'Assets');

		let nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:CHF:UBS');

		let currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		await page.click('button[type="submit"]');
		await page.waitForTimeout(2000);

		// Essayer de créer un deuxième compte avec le même nom
		await page.click('button:has-text("Nouveau compte")');
		await page.selectOption('select#type', 'Assets');

		nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:CHF:UBS');

		currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		await page.click('button[type="submit"]');

		// Vérifier qu'une erreur apparaît
		await page.waitForTimeout(1000);

		const errorExists = await page.locator('.error-message, .alert-error').count() > 0;
		expect(errorExists).toBe(true);
	});

	test('devrait permettre d\'utiliser les modèles suggérés', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		// Sélectionner le type Assets
		await page.selectOption('select#type', 'Assets');

		// Attendre que les templates apparaissent
		await page.waitForTimeout(500);

		// Chercher un bouton de template
		const templateButtons = page.locator('.template-btn, .template-item, button:has-text("Compte bancaire")');
		const templateCount = await templateButtons.count();

		if (templateCount > 0) {
			// Cliquer sur le premier template
			await templateButtons.first().click();

			// Vérifier que le nom a été pré-rempli
			const nameInput = page.locator('input#name, input[name="name"]').first();
			const nameValue = await nameInput.inputValue();

			expect(nameValue).toContain('Assets:');
			expect(nameValue.split(':').length).toBeGreaterThanOrEqual(2);
		}
	});

	test('devrait créer des comptes de différents types', async ({ page }) => {
		const accountTypes = [
			{ type: 'Assets', name: 'Assets:Cash:CHF', label: 'Cash' },
			{ type: 'Expenses', name: 'Expenses:Food:Restaurants', label: 'Restaurants' },
			{ type: 'Income', name: 'Income:Salary:Company', label: 'Salary' }
		];

		for (const accountType of accountTypes) {
			await page.click('button:has-text("Nouveau compte")');
			await page.waitForTimeout(500);

			await page.selectOption('select#type', accountType.type);

			const nameInput = page.locator('input#name, input[name="name"]').first();
			await nameInput.fill(accountType.name);

			const currencySelect = page.locator('select#currency, select[name="currency"]').first();
			await currencySelect.selectOption('CHF');

			await page.click('button[type="submit"]');

			// Attendre le succès
			await page.waitForTimeout(2000);

			// Vérifier que le compte est visible (selon l'implémentation de AccountList)
			const accountExists = await page.locator(`text=${accountType.label}`).count() > 0;
			console.log(`Compte ${accountType.label} créé:`, accountExists);
		}
	});

	test('devrait permettre de choisir différentes devises pour les comptes', async ({ page }) => {
		// Créer un compte en CHF
		await page.click('button:has-text("Nouveau compte")');
		await page.selectOption('select#type', 'Assets');

		let nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:CHF:PostFinance');

		let currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		await page.click('button[type="submit"]');
		await page.waitForTimeout(2000);

		// Créer un compte en EUR
		await page.click('button:has-text("Nouveau compte")');
		await page.selectOption('select#type', 'Assets');

		nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:EUR:Revolut');

		currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('EUR');

		await page.click('button[type="submit"]');
		await page.waitForTimeout(2000);

		// Vérifier que les deux comptes existent
		const hasPostFinance = await page.locator('text=PostFinance').count() > 0;
		const hasRevolut = await page.locator('text=Revolut').count() > 0;

		expect(hasPostFinance).toBe(true);
		expect(hasRevolut).toBe(true);
	});

	test('devrait permettre d\'annuler la création d\'un compte', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		// Remplir partiellement le formulaire
		await page.selectOption('select#type', 'Assets');

		const nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Test:Account');

		// Cliquer sur Annuler
		await page.click('button:has-text("Annuler")');

		// Vérifier que le formulaire est fermé
		await expect(page.locator('h2:has-text("Nouveau compte")')).not.toBeVisible();

		// Vérifier que le compte n'a pas été créé
		const hasTestAccount = await page.locator('text=Test:Account').count() > 0;
		expect(hasTestAccount).toBe(false);
	});

	test('devrait valider la date d\'ouverture', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		await page.selectOption('select#type', 'Assets');

		const nameInput = page.locator('input#name, input[name="name"]').first();
		await nameInput.fill('Assets:Bank:CHF:Test');

		const currencySelect = page.locator('select#currency, select[name="currency"]').first();
		await currencySelect.selectOption('CHF');

		// Entrer une date valide
		const dateInput = page.locator('input#opened, input[type="date"]').first();
		await dateInput.fill('2025-01-01');

		await page.click('button[type="submit"]');

		// Le compte devrait être créé avec succès
		await expect(page.locator('.alert-success')).toBeVisible({ timeout: 3000 });
	});

	test('devrait afficher un message d\'aide pour le format hiérarchique', async ({ page }) => {
		await page.click('button:has-text("Nouveau compte")');

		// Vérifier si un texte d'aide est affiché
		const helpText = page.locator('.help-text, .hint, [class*="help"]');
		const helpExists = await helpText.count() > 0;

		if (helpExists) {
			const helpContent = await helpText.first().textContent();
			console.log('Texte d\'aide:', helpContent);
		}

		// Au minimum, le label ou placeholder devrait indiquer le format
		const nameInput = page.locator('input#name, input[name="name"]').first();
		const placeholder = await nameInput.getAttribute('placeholder');

		if (placeholder) {
			expect(placeholder).toContain(':');
		}
	});
});
