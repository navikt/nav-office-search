import { describe, expect, test } from 'vitest';
import {
	addressResult,
	geoidResult,
	nameHit,
	nameResult,
	offices,
	storgataAdresser,
} from '#client/__tests__/support/fixtures.ts';
import { initialState, type SearchFormAction, searchFormReducer, type SearchFormState } from './searchFormState.ts';

const run = (...actions: SearchFormAction[]) => actions.reduce(searchFormReducer, initialState);

const addresses = addressResult('storgata', storgataAdresser(3));
const names = nameResult('oslo', [nameHit('OSLO', [offices.alna])]);
const office = geoidResult('030105', offices.frogner);

const showingAddresses = run({ type: 'found', result: addresses });

describe('a search', () => {
	test('keeps the old results while it runs', () => {
		const state = run({ type: 'found', result: names }, { type: 'searchStarted' });

		expect(state.results).toEqual({ view: 'offices', result: names, selectedAddress: null });
	});

	test('shows addresses in an open dropdown, and says so', () => {
		expect(showingAddresses.results).toEqual({ view: 'addresses', result: addresses, open: true, activeIndex: null });
		expect(showingAddresses.status).toEqual({ kind: 'suggestions', result: addresses });
	});

	test('replaces what was shown with a spinner, until the answer comes', () => {
		const loading = run({ type: 'found', result: names }, { type: 'loading', inDropdown: true, height: 120 });
		expect(loading.results).toEqual({ view: 'loading', inDropdown: true, height: 120 });
		expect(loading.status).toEqual({ kind: 'loading' });

		const done = searchFormReducer(loading, { type: 'found', result: names });
		expect(done.results).toEqual({ view: 'offices', result: names, selectedAddress: null });
		expect(done.status).toEqual({ kind: 'none' });
	});

	test('that fails clears the results and shows the error', () => {
		const state = run({ type: 'found', result: names }, { type: 'failed', messageId: 'errorServerError' });

		expect(state).toEqual({
			...initialState,
			error: { id: 'errorServerError', type: 'serverError' },
		});
	});

	test('clears the error it starts with', () => {
		const state = run({ type: 'invalid', messageId: 'errorInputValidationLength' }, { type: 'searchStarted' });

		expect(state.error).toBeNull();
	});
});

describe('cancelling', () => {
	test('drops a spinner', () => {
		expect(run({ type: 'loading', inDropdown: false, height: null }, { type: 'searchCancelled' }).results).toEqual({
			view: 'none',
		});
	});

	test('keeps the addresses, but forgets the position in them and the status', () => {
		const state = run(
			{ type: 'found', result: addresses },
			{ type: 'activeMoved', by: 1 },
			{ type: 'searchCancelled' },
		);

		expect(state.results).toEqual({ view: 'addresses', result: addresses, open: true, activeIndex: null });
		expect(state.status).toEqual({ kind: 'none' });
	});

	test('keeps an office found for an address, without the address (bug)', () => {
		const state = run(
			{ type: 'addressSelected', label: 'Storgata 1, 0184 OSLO' },
			{ type: 'officeFound', result: office, label: 'Storgata 1, 0184 OSLO' },
			{ type: 'searchCancelled' },
		);

		expect(state.results).toEqual({ view: 'offices', result: office, selectedAddress: null });
	});
});

describe('picking an address', () => {
	test('puts it in the field, clears any error, and says it was picked while its office is looked up', () => {
		const withError = searchFormReducer(showingAddresses, {
			type: 'invalid',
			messageId: 'errorInputValidationPostnr',
		});
		const state = searchFormReducer(withError, { type: 'addressSelected', label: 'Storgata 1, 0184 OSLO' });

		expect(state).toEqual({
			input: 'Storgata 1, 0184 OSLO',
			results: { view: 'none' },
			status: { kind: 'selected', label: 'Storgata 1, 0184 OSLO' },
			error: null,
		});
	});

	test("shows the office for it, and keeps saying it's picked", () => {
		const state = run(
			{ type: 'addressSelected', label: 'Storgata 1, 0184 OSLO' },
			{ type: 'officeFound', result: office, label: 'Storgata 1, 0184 OSLO' },
		);

		expect(state.results).toEqual({ view: 'offices', result: office, selectedAddress: 'Storgata 1, 0184 OSLO' });
		expect(state.status).toEqual({ kind: 'selected', label: 'Storgata 1, 0184 OSLO' });
	});
});

describe('the address dropdown', () => {
	const position = (state: SearchFormState) => (state.results.view === 'addresses' ? state.results.activeIndex : 'n/a');

	test('moves down from the top and stops at the bottom', () => {
		const down = (times: number) =>
			Array.from({ length: times }, (): SearchFormAction => ({ type: 'activeMoved', by: 1 }));

		expect(position(run({ type: 'found', result: addresses }, ...down(1)))).toBe(0);
		expect(position(run({ type: 'found', result: addresses }, ...down(5)))).toBe(2);
	});

	test('moves up from the bottom and stops at the top', () => {
		const up = (times: number) =>
			Array.from({ length: times }, (): SearchFormAction => ({ type: 'activeMoved', by: -1 }));

		expect(position(run({ type: 'found', result: addresses }, ...up(1)))).toBe(2);
		expect(position(run({ type: 'found', result: addresses }, ...up(5)))).toBe(0);
	});

	test('has no position without addresses', () => {
		const empty = addressResult('ukjent', []);

		expect(position(run({ type: 'found', result: empty }, { type: 'activeMoved', by: 1 }))).toBeNull();
	});

	test('closes, forgetting the position, and opens again', () => {
		const closed = run(
			{ type: 'found', result: addresses },
			{ type: 'activeSet', index: 1 },
			{ type: 'dropdownClosed' },
		);
		expect(closed.results).toMatchObject({ open: false, activeIndex: null });

		expect(searchFormReducer(closed, { type: 'dropdownOpened' }).results).toMatchObject({ open: true });
	});

	test("isn't there for other results", () => {
		const shown = run({ type: 'found', result: names });

		for (const action of [
			{ type: 'dropdownOpened' },
			{ type: 'dropdownClosed' },
			{ type: 'activeMoved', by: 1 },
			{ type: 'activeSet', index: 0 },
		] satisfies SearchFormAction[]) {
			expect(searchFormReducer(shown, action)).toBe(shown);
		}
	});
});
