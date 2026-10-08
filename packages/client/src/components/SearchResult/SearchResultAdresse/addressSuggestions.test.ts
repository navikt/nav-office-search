import { describe, expect, test } from 'vitest';
import type { SearchResultAdresseProps } from '../../../../../common/types/results';
import { adresse, storgataAdresser } from '../../../__tests__/support/fixtures';
import {
	formatAddressLabel,
	getAddressOptionId,
	getAddressSuggestionCounts,
	getAddressSuggestionsStatusMessage,
	maxVisibleAddressOptions,
} from './addressSuggestions';

const result = (visible: number, totalHits = visible): SearchResultAdresseProps => ({
	type: 'adresse',
	adresseQuery: 'storgata',
	adresser: storgataAdresser(visible),
	totalHits,
});

describe('formatAddressLabel', () => {
	test.each([
		[adresse(), 'Storgata 1, 0184 OSLO'],
		[adresse({ husnummer: 12, husbokstav: 'B' }), 'Storgata 12B, 0184 OSLO'],
		[
			adresse({ adressenavn: 'Vei 230', husnummer: 4, postnummer: '9170', poststed: 'LONGYEARBYEN' }),
			'Vei 230 4, 9170 LONGYEARBYEN',
		],
	])('%j → %s', (input, expected) => {
		expect(formatAddressLabel(input)).toBe(expected);
	});
});

test('getAddressOptionId', () => {
	expect(getAddressOptionId(':r1:', 3)).toBe(':r1:-option-3');
});

describe('getAddressSuggestionCounts', () => {
	test.each([
		[0, 0, { visibleHits: 0, totalHits: 0, hasMoreThanVisibleRows: false }],
		[
			maxVisibleAddressOptions,
			maxVisibleAddressOptions,
			{ visibleHits: 6, totalHits: 6, hasMoreThanVisibleRows: false },
		],
		[7, 7, { visibleHits: 7, totalHits: 7, hasMoreThanVisibleRows: true }],
		[2, 412, { visibleHits: 2, totalHits: 412, hasMoreThanVisibleRows: true }],
		// A totalHits below the number of hits is raised to it
		[3, 1, { visibleHits: 3, totalHits: 3, hasMoreThanVisibleRows: false }],
	])('%i visible, totalHits %i', (visible, totalHits, expected) => {
		expect(getAddressSuggestionCounts(result(visible, totalHits))).toEqual(expected);
	});
});

describe('getAddressSuggestionsStatusMessage', () => {
	test.each([
		['nb', 0, 0, 'Ingen resultater for "storgata"'],
		['nb', 6, 6, '6 adresseforslag tilgjengelig. Bruk piltastene for å velge.'],
		[
			'nb',
			30,
			412,
			'30 adresseforslag tilgjengelig. Bruk piltastene for å velge. Viser 30 av 412 adresseforslag. Skriv mer av adressen for å avgrense søket.',
		],
		['nn', 2, 2, '2 adresseforslag tilgjengeleg. Bruk piltastane for å velje.'],
		[
			'en',
			7,
			7,
			'7 address suggestions available. Use the arrow keys to choose. Showing 7 of 7 address suggestions. Enter more of the address to narrow the search.',
		],
	] as const)('%s, %i visible of %i', (locale, visible, totalHits, expected) => {
		expect(getAddressSuggestionsStatusMessage(result(visible, totalHits), locale)).toBe(expected);
	});
});
