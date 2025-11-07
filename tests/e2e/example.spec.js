import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
	test('should load the homepage', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/SvelteKit/);
	});

	test('should have welcome message', async ({ page }) => {
		await page.goto('/');
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
	});
});
