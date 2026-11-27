import { isAbortError } from '@itsy/corgi';
import React, { type CSSProperties, useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { Loader, Search } from '@navikt/ds-react';
import { LocaleString } from '#client/localization/LocaleString.tsx';
import { ErrorBoundary } from '#client/components/ErrorBoundary/ErrorBoundary.tsx';
import { SearchResult } from '#client/components/SearchResult/SearchResult.tsx';
import { type OfficeInfo, PostnrKategori } from '#shared/types/data.ts';
import type { Adresse, SearchResultAdresseProps, SearchResultPostnrProps } from '#shared/types/results.ts';
import { createSearchApi, errorMessageOf } from '#client/utils/searchApi.ts';
import { useDebouncedCallback } from '#client/hooks/useDebouncedCallback.ts';
import type { AppLocale } from '#shared/localization/types.ts';
import { isValidNameQuery, isValidPostnrQuery } from '#shared/validateInput.ts';
import { localeString } from '#shared/localization/localeString.ts';
import { useLocale } from '#client/localization/useLocale.tsx';
import {
	formatAddressLabel,
	getAddressOptionId,
	getAddressSuggestionsStatusMessage,
} from '#client/components/SearchResult/SearchResultAdresse/addressSuggestions.ts';
import { initialState, type OfficeResult, searchFormReducer, type Status } from './searchFormState.ts';

import style from './SearchForm.module.css';

const isEmptyInput = (input: string): boolean => input.trim().length === 0;

const isValidInput = (input: string): boolean => input.trim().length >= 2;

const focusScrollOffset = 16;
const focusScrollDelayMs = 300;
export const SEARCH_DEBOUNCE_MS = 500;
export const SPINNER_DELAY_MS = 250;

// The office of an address the user picked, shown the way a postnummer's offices are, under the address. Of the
// poststed, only the offices are read then.
const officeResult = (office: OfficeInfo): SearchResultPostnrProps => ({
	type: 'postnr',
	postnr: '',
	poststed: office.name,
	poststedNormalized: '',
	kommuneNavn: '',
	kommunenr: office.geoId,
	kategori: PostnrKategori.Gateadresser,
	officeInfo: [office],
});

const shouldAdjustMobileFocusScroll = () =>
	typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px) and (pointer: coarse)').matches;

const statusText = (status: Status, locale: AppLocale): string => {
	switch (status.kind) {
		case 'loading':
			return localeString('searchLoading', locale) as string;
		case 'suggestions':
			return getAddressSuggestionsStatusMessage(status.result, locale);
		case 'selected':
			return localeString('addressSuggestionSelected', locale, [status.label]) as string;
		case 'none':
			return '';
	}
};

export const SearchForm = () => {
	const [{ input: inputValue, results, status, error }, dispatch] = useReducer(searchFormReducer, initialState);
	// This form's own client, so its requests only ever cancel each other
	const [searchApi] = useState(createSearchApi);
	const searchFormRef = useRef<HTMLDivElement>(null);
	const resultHeightRef = useRef<HTMLDivElement>(null);
	const loadingDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activeAddressNavigationSourceRef = useRef<'keyboard' | 'mouse' | null>(null);
	const addressListboxId = useId();
	const locale = useLocale();
	const searchLoadingText = localeString('searchLoading', locale) as string;
	const addressSuggestionsLabel = localeString('addressSuggestionsLabel', locale) as string;
	const isLoading = results.view === 'loading';
	const isAddressResult = results.view === 'addresses';
	const searchResult = results.view === 'offices' || results.view === 'addresses' ? results.result : undefined;
	const addressSuggestions = isAddressResult ? results.result.adresser : [];
	const activeAddressIndex = isAddressResult ? results.activeIndex : null;
	const hasAddressSuggestions = addressSuggestions.length > 0;
	const isPostnrLoading = results.view === 'loading' && results.kind === 'postnr';
	const isAddressDropdownOpen = 'open' in results && results.open;
	const hasFreshSingleAddressSuggestion =
		isAddressResult && addressSuggestions.length === 1 && inputValue.trim() === results.result.adresseQuery.trim();
	const activeAddressOptionId =
		isAddressDropdownOpen && activeAddressIndex !== null && hasAddressSuggestions
			? getAddressOptionId(addressListboxId, activeAddressIndex)
			: undefined;
	const loadingStyle: CSSProperties | undefined =
		isLoading && results.height !== null ? { height: `${results.height}px` } : undefined;

	const clearLoadingDelay = useCallback(() => {
		if (loadingDelayTimeoutRef.current !== null) {
			clearTimeout(loadingDelayTimeoutRef.current);
			loadingDelayTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => clearLoadingDelay, [clearLoadingDelay]);

	// Nobody is waiting for the request in flight once the form is gone
	useEffect(() => searchApi.cancel, [searchApi]);

	useEffect(() => {
		if (!activeAddressOptionId || activeAddressNavigationSourceRef.current !== 'keyboard') {
			return;
		}

		document.getElementById(activeAddressOptionId)?.scrollIntoView?.({ block: 'nearest' });
	}, [activeAddressOptionId]);

	// Swaps the results for a spinner with the right height
	// The dropdown only keeps the height of addresses it showed
	const showLoading = (kind: 'postnr' | 'addresses') => {
		const shown = resultHeightRef.current;
		const keepsHeight = kind === 'postnr' || shown?.dataset.resultType === 'adresse';
		dispatch({ type: 'loading', kind, height: (keepsHeight && shown?.getBoundingClientRect().height) || null });
	};

	const showFound = (result: OfficeResult | SearchResultAdresseProps) => {
		clearLoadingDelay();
		dispatch({ type: 'found', result });
	};

	const runSearch = useDebouncedCallback(async (input: string) => {
		clearLoadingDelay();
		dispatch({ type: 'searchStarted' });
		// The spinner only if the answer takes a moment, so a quick one doesn't flicker. It goes where the answer most
		// likely will: a postnummer's offices below the field, and anything else in the dropdown, since what takes a
		// moment to find is addresses.
		loadingDelayTimeoutRef.current = setTimeout(
			() => showLoading(isValidPostnrQuery(input) ? 'postnr' : 'addresses'),
			SPINNER_DELAY_MS,
		);

		try {
			showFound(await searchApi.search(input));
		} catch (e) {
			// An AbortError means a newer search took over, or the user moved on: nothing to show
			if (!isAbortError(e)) {
				clearLoadingDelay();
				dispatch({ type: 'failed', messageId: errorMessageOf(e) });
			}
		}
	}, SEARCH_DEBOUNCE_MS);

	const cancelSearch = useCallback(() => {
		searchApi.cancel();
		runSearch.cancel();
		clearLoadingDelay();
		dispatch({ type: 'searchCancelled' });
	}, [clearLoadingDelay, runSearch, searchApi]);

	const closeResults = useCallback(() => {
		cancelSearch();
		dispatch({ type: 'resultsCleared' });
	}, [cancelSearch]);

	// Escape stops the search whose spinner is in the dropdown. Leaving the field only closes the dropdown: the search
	// carries on, since what it finds may be offices, which don't go in the dropdown. Addresses wait in it, closed.
	const hideAddressPopup = (stopsSearch: boolean) => {
		if (stopsSearch && results.view === 'loading' && results.kind === 'addresses') {
			cancelSearch();
		} else {
			dispatch({ type: 'dropdownClosed' });
		}
	};

	const handleInput = (submit: boolean, input: string) => {
		cancelSearch();

		if (isEmptyInput(input)) {
			dispatch({ type: 'resultsCleared' });
		}

		if (!isValidNameQuery(input) && !isValidPostnrQuery(input) && Number.isNaN(Number(input))) {
			dispatch({ type: 'invalid', messageId: 'errorInputValidationName' });
			dispatch({ type: 'resultsCleared' });
			return;
		}

		if (!isValidInput(input)) {
			dispatch({ type: 'resultsCleared' });
			dispatch(submit ? { type: 'invalid', messageId: 'errorInputValidationLength' } : { type: 'errorCleared' });
			return;
		}

		if (isValidPostnrQuery(input)) {
			runSearch(input);
			return;
		} else if (!Number.isNaN(Number(input))) {
			// A number that isn't a postnummer isn't searched, so what's shown is for something else
			dispatch({ type: 'resultsCleared' });
			dispatch(submit ? { type: 'invalid', messageId: 'errorInputValidationPostnr' } : { type: 'errorCleared' });
			return;
		}

		runSearch(input);
	};

	// An address comes with its office, so picking one asks for nothing
	const selectAddress = useCallback(
		(adresse: Adresse) => {
			const label = formatAddressLabel(adresse);
			cancelSearch();
			dispatch({ type: 'addressSelected', label });

			if (adresse.officeInfo) {
				dispatch({ type: 'officeFound', result: officeResult(adresse.officeInfo), label });
			} else {
				// Its bydel or kommune has no office
				dispatch({ type: 'failed', messageId: 'errorAddressWithoutOffice' });
			}
		},
		[cancelSearch],
	);

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		handleInput(true, inputValue);
	};

	const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape' && isAddressDropdownOpen) {
			event.preventDefault();
			event.stopPropagation();
			hideAddressPopup(true);
			return;
		}

		if (event.key === 'Tab' && isAddressDropdownOpen) {
			hideAddressPopup(false);
			return;
		}

		if (event.key === 'Enter' && isAddressDropdownOpen) {
			event.preventDefault();
			if (activeAddressIndex !== null && hasAddressSuggestions) {
				selectAddress(addressSuggestions[activeAddressIndex]);
			} else if (hasFreshSingleAddressSuggestion) {
				selectAddress(addressSuggestions[0]);
			}
			return;
		}

		if (!hasAddressSuggestions) {
			return;
		}

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			activeAddressNavigationSourceRef.current = 'keyboard';
			dispatch({ type: 'activeMoved', by: event.key === 'ArrowDown' ? 1 : -1 });
		}
	};

	const handleAddressMouseEnter = useCallback((index: number) => {
		activeAddressNavigationSourceRef.current = 'mouse';
		dispatch({ type: 'activeSet', index });
	}, []);

	const scrollSearchFormToViewportTop = useCallback(() => {
		if (!shouldAdjustMobileFocusScroll()) {
			return;
		}

		window.setTimeout(() => {
			const searchForm = searchFormRef.current;
			if (!searchForm) {
				return;
			}

			const top = searchForm.getBoundingClientRect().top + window.scrollY - focusScrollOffset;
			window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
		}, focusScrollDelayMs);
	}, []);

	const handleSearchFocus = () => {
		scrollSearchFormToViewportTop();
		dispatch({ type: 'dropdownOpened' });
	};

	return (
		<div
			className={style.searchForm}
			ref={searchFormRef}
			onFocus={() => dispatch({ type: 'focusEntered' })}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					dispatch({ type: 'focusLeft' });
					hideAddressPopup(false);
				}
			}}
		>
			<form onSubmit={handleSubmit} className={style.searchField} autoComplete="off">
				<Search
					variant="simple"
					hideLabel={false}
					label={<LocaleString id={'inputLabel'} />}
					id="search-input"
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="none"
					spellCheck={false}
					value={inputValue}
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={isAddressDropdownOpen}
					aria-controls={isAddressDropdownOpen ? addressListboxId : undefined}
					aria-activedescendant={activeAddressOptionId}
					onFocus={handleSearchFocus}
					onKeyDown={handleSearchKeyDown}
					onChange={(val) => {
						dispatch({ type: 'typed', input: val });
						handleInput(false, val);
					}}
					onClear={() => {
						dispatch({ type: 'typed', input: '' });
						closeResults();
						dispatch({ type: 'errorCleared' });
					}}
					error={error?.type === 'clientError' && <LocaleString id={error.id} />}
				/>
			</form>
			<div className={style.resultRegion}>
				{error?.type === 'serverError' && (
					<div className={style.error}>
						<LocaleString id={error.id} />
					</div>
				)}
				{isPostnrLoading && (
					<div className={style.searchResult}>
						<div className={style.loading} aria-busy="true" aria-label={searchLoadingText} style={loadingStyle}>
							<div className={style.loadingStatus}>
								<Loader size="small" title={searchLoadingText} />
								<span>{searchLoadingText}</span>
							</div>
						</div>
					</div>
				)}
				{((isLoading && isAddressDropdownOpen) || (searchResult && (!isAddressResult || isAddressDropdownOpen))) && (
					<div
						ref={resultHeightRef}
						className={style.searchResult}
						data-result-type={isLoading && isAddressDropdownOpen ? 'adresse' : searchResult?.type}
					>
						{isLoading && isAddressDropdownOpen ? (
							<div
								className={style.loading}
								id={addressListboxId}
								role="listbox"
								aria-label={addressSuggestionsLabel}
								aria-busy="true"
								style={loadingStyle}
							>
								<div
									className={style.loadingStatus}
									role="option"
									aria-disabled="true"
									aria-selected="false"
									aria-label={searchLoadingText}
								>
									<Loader size="small" title={searchLoadingText} />
									<span>{searchLoadingText}</span>
								</div>
							</div>
						) : (
							searchResult && (
								<ErrorBoundary
									resetKey={searchResult}
									fallback={
										<div className={style.error}>
											<LocaleString id={'errorInvalidResult'} />
										</div>
									}
								>
									<SearchResult
										searchResult={searchResult}
										onAddressSelect={selectAddress}
										onAddressMouseEnter={handleAddressMouseEnter}
										activeAddressIndex={activeAddressIndex}
										addressListboxId={addressListboxId}
										addressSuggestionsLabel={addressSuggestionsLabel}
										addressResultInput={results.view === 'offices' ? results.selectedAddress : null}
									/>
								</ErrorBoundary>
							)
						)}
					</div>
				)}
			</div>
			<div className="aksel-sr-only" aria-live="polite">
				{statusText(status, locale)}
			</div>
		</div>
	);
};
