import { describe, it, expect } from 'vitest';

describe('Example Unit Test', () => {
	it('should pass', () => {
		expect(true).toBe(true);
	});

	it('should add numbers correctly', () => {
		const add = (a, b) => a + b;
		expect(add(2, 3)).toBe(5);
	});
});
