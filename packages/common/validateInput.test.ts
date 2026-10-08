import { describe, expect, test } from 'vitest';
import { isValidNameQuery, isValidPostnrQuery } from './validateInput';

describe('isValidPostnrQuery', () => {
	test.each([
		['0150', true],
		['9170', true],
		[' 0150 ', true],
		['0150\n', true],
		['015', false],
		['01500', false],
		['01 50', false],
		['abcd', false],
		['0150a', false],
		['', false],
		['    ', false],
		// \d without the u flag only matches ASCII digits
		['٠١٥٠', false],
	])('%j → %s', (input, expected) => {
		expect(isValidPostnrQuery(input)).toBe(expected);
	});
});

describe('isValidNameQuery', () => {
	test.each([
		['oslo', true],
		['Tromsø', true],
		['Gáivuotna', true],
		['st. hanshaugen', true],
		['ole b. bergers veg 5', true],
		['evje-og-hornnes', true],
		['storgata 1, 0184 oslo', true],
		['0150', true],
		// Only the whole string is trimmed for the emptiness check; spaces are allowed characters
		[' oslo ', true],
		['', false],
		['   ', false],
		['evje@', false],
		['oslo/sentrum', false],
		['oslo (sentrum)', false],
		["o'hara", false],
		['oslo\tsentrum', false],
		['oslo\nsentrum', false],
	])('%j → %s', (input, expected) => {
		expect(isValidNameQuery(input)).toBe(expected);
	});
});
