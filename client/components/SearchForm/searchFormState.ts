import type { LocaleStringId, SearchError } from '#shared/localization/types.ts';
import type {
	SearchResultAdresseProps,
	SearchResultNameProps,
	SearchResultPostnrProps,
} from '#shared/types/results.ts';

export type OfficeResult = SearchResultPostnrProps | SearchResultNameProps;

/** What's below the search field */
export type Results =
	| { view: 'none' }
	/** A postnummer search's spinner, where the results go, as tall as what it replaced */
	| { view: 'loading'; kind: 'postnr'; height: number | null }
	/** Any other search's spinner, in the address dropdown, as tall as the addresses it replaced */
	| { view: 'loading'; kind: 'addresses'; open: boolean; height: number | null }
	/**
	 * Offices for a postnummer or a name, or for the address the user picked (selectedAddress). The address stays with
	 * its offices, so their heading is right until other results replace them.
	 */
	| { view: 'offices'; result: OfficeResult; selectedAddress: string | null }
	/** Address suggestions, in a dropdown the user can close and open again */
	| { view: 'addresses'; result: SearchResultAdresseProps; open: boolean; activeIndex: number | null };

type Dropdown = Extract<Results, { open: boolean }>;

/** What the live region tells screen reader users, in whatever language the page is in */
export type Status =
	| { kind: 'none' }
	| { kind: 'loading' }
	| { kind: 'suggestions'; result: SearchResultAdresseProps }
	| { kind: 'selected'; label: string };

export type SearchFormState = {
	input: string;
	results: Results;
	status: Status;
	error: SearchError | null;
	/** Focus is in the form. The address dropdown only opens then, so it never pops up in a field the user left. */
	focused: boolean;
};

export type SearchFormAction =
	| { type: 'typed'; input: string }
	/** The user moved on: the search in flight and its spinner go, and so do the address list's position and the status */
	| { type: 'searchCancelled' }
	| { type: 'resultsCleared' }
	| { type: 'searchStarted' }
	| { type: 'loading'; kind: 'postnr' | 'addresses'; height: number | null }
	| { type: 'found'; result: OfficeResult | SearchResultAdresseProps }
	| { type: 'failed'; messageId: LocaleStringId }
	| { type: 'invalid'; messageId: LocaleStringId }
	| { type: 'errorCleared' }
	| { type: 'addressSelected'; label: string }
	| { type: 'officeFound'; result: SearchResultPostnrProps; label: string }
	| { type: 'dropdownOpened' }
	/** The dropdown closes, whether it holds addresses or a search's spinner. The search carries on. */
	| { type: 'dropdownClosed' }
	| { type: 'activeMoved'; by: 1 | -1 }
	| { type: 'activeSet'; index: number }
	| { type: 'focusEntered' }
	| { type: 'focusLeft' };

export const initialState: SearchFormState = {
	input: '',
	results: { view: 'none' },
	status: { kind: 'none' },
	error: null,
	focused: false,
};

const none: Results = { view: 'none' };

// The address list's position, one step down or up. From none, down starts at the top and up at the bottom.
const moveActive = (current: number | null, by: 1 | -1, count: number) => {
	if (current === null) {
		return by === 1 ? 0 : count - 1;
	}
	return Math.min(Math.max(current + by, 0), count - 1);
};

const updateAddresses = (
	state: SearchFormState,
	update: (results: Extract<Results, { view: 'addresses' }>) => Partial<Extract<Results, { view: 'addresses' }>>,
): SearchFormState =>
	state.results.view === 'addresses' ? { ...state, results: { ...state.results, ...update(state.results) } } : state;

// The address dropdown, whether it holds addresses or their spinner
const isDropdown = (results: Results): results is Dropdown => 'open' in results;

export const searchFormReducer = (state: SearchFormState, action: SearchFormAction): SearchFormState => {
	switch (action.type) {
		case 'typed':
			return { ...state, input: action.input };

		case 'searchCancelled': {
			const { results } = state;
			const kept: Results =
				results.view === 'loading' ? none : results.view === 'addresses' ? { ...results, activeIndex: null } : results;
			return { ...state, results: kept, status: { kind: 'none' } };
		}

		case 'resultsCleared':
			return { ...state, results: none, status: { kind: 'none' } };

		// The old results stay until the new ones arrive
		case 'searchStarted':
			return { ...state, error: null, results: state.results.view === 'loading' ? none : state.results };

		case 'loading':
			return {
				...state,
				results:
					action.kind === 'postnr'
						? { view: 'loading', kind: 'postnr', height: action.height }
						: { view: 'loading', kind: 'addresses', open: state.focused, height: action.height },
				status: { kind: 'loading' },
			};

		case 'found':
			return action.result.type === 'adresse'
				? {
						...state,
						results: {
							view: 'addresses',
							result: action.result,
							// A dropdown that was closed while the addresses loaded stays closed, until the user comes back to it
							open: state.results.view === 'loading' && isDropdown(state.results) ? state.results.open : state.focused,
							activeIndex: null,
						},
						status: { kind: 'suggestions', result: action.result },
					}
				: {
						...state,
						results: { view: 'offices', result: action.result, selectedAddress: null },
						status: { kind: 'none' },
					};

		case 'failed':
			return {
				...state,
				results: none,
				status: { kind: 'none' },
				error: { id: action.messageId, type: 'serverError' },
			};

		case 'invalid':
			return { ...state, error: { id: action.messageId, type: 'clientError' } };

		case 'errorCleared':
			return { ...state, error: null };

		case 'addressSelected':
			return {
				...state,
				input: action.label,
				results: none,
				status: { kind: 'selected', label: action.label },
				error: null,
			};

		case 'officeFound':
			return { ...state, results: { view: 'offices', result: action.result, selectedAddress: action.label } };

		case 'dropdownOpened':
			return isDropdown(state.results) ? { ...state, results: { ...state.results, open: true } } : state;

		case 'dropdownClosed':
			return state.results.view === 'loading' && isDropdown(state.results)
				? { ...state, results: { ...state.results, open: false } }
				: updateAddresses(state, () => ({ open: false, activeIndex: null }));

		case 'activeMoved':
			return updateAddresses(state, ({ result, activeIndex }) =>
				result.adresser.length > 0 ? { activeIndex: moveActive(activeIndex, action.by, result.adresser.length) } : {},
			);

		case 'activeSet':
			return updateAddresses(state, () => ({ activeIndex: action.index }));

		case 'focusEntered':
			return { ...state, focused: true };

		case 'focusLeft':
			return { ...state, focused: false };
	}
};
