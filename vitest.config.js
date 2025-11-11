import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/lib/test-utils/setup.js'],
		// Exclure les tests E2E Playwright
		exclude: [
			'node_modules/**',
			'dist/**',
			'.svelte-kit/**',
			'build/**',
			'tests/e2e/**',
			'**/*.spec.js'
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'node_modules/',
				'dist/',
				'.svelte-kit/',
				'build/',
				'tests/',
				'**/*.test.js',
				'**/*.spec.js',
				'**/+*.svelte',
				'**/+*.js',
				'**/app.html'
			],
			// Configurer les seuils de couverture à 80%
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80
			}
		}
	}
});
