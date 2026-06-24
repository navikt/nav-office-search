import React, {
    CSSProperties,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import debounce from 'lodash.debounce';
import { Loader, Search } from '@navikt/ds-react';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import { Adresse, SearchResultProps } from '../../../../common/types/results';
import { abortSearchClient, fetchGeoidClient, fetchSearchClient } from '../../utils/fetch';
import { LocaleStringId, SearchError } from '../../../../common/localization/types';
import { isValidNameQuery, isValidPostnrQuery } from '../../../../common/validateInput';
import { localeString } from '../../../../common/localization/localeString';
import { useLocale } from '../../localization/useLocale';
import {
    formatAddressLabel,
    getAddressOptionId,
    getAddressSuggestionsStatusMessage,
} from '../SearchResult/SearchResultAdresse/addressSuggestions';

import style from './SearchForm.module.css';

const isEmptyInput = (input: string): boolean => input.trim().length === 0;

const isValidInput = (input: string): boolean => input.trim().length >= 2;

const focusScrollOffset = 16;
const focusScrollDelayMs = 300;

const shouldAdjustMobileFocusScroll = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(max-width: 768px) and (pointer: coarse)').matches;

export const SearchForm = () => {
    const [inputValue, setInputValue] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [error, setError] = useState<SearchError | null>();
    const [isLoading, setIsLoading] = useState(false);
    const [isAddressPopupOpen, setIsAddressPopupOpen] = useState(false);
    const [activeAddressIndex, setActiveAddressIndex] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [addressLoadingHeight, setAddressLoadingHeight] = useState<number | null>(null);
    const [addressResultInput, setAddressResultInput] = useState<string | null>(null);
    const activeSearchId = useRef(0);
    const searchFormRef = useRef<HTMLDivElement>(null);
    const addressDropdownRef = useRef<HTMLDivElement>(null);
    const activeAddressNavigationSource = useRef<'keyboard' | 'mouse' | null>(null);
    const addressListboxId = useId();
    const locale = useLocale();
    const searchLoadingText = localeString('searchLoading', locale) as string;
    const addressSuggestionsLabel = localeString('addressSuggestionsLabel', locale) as string;
    const isAddressResult = searchResult?.type === 'adresse';
    const addressSuggestions = isAddressResult ? searchResult.adresser : [];
    const hasAddressSuggestions = addressSuggestions.length > 0;
    const hasAddressPopup = isLoading || isAddressResult;
    const isAddressDropdownOpen = isAddressPopupOpen && hasAddressPopup;
    const hasFreshSingleAddressSuggestion =
        isAddressResult &&
        addressSuggestions.length === 1 &&
        inputValue.trim() === searchResult.adresseQuery.trim();
    const activeAddressOptionId =
        isAddressDropdownOpen && activeAddressIndex !== null && hasAddressSuggestions
            ? getAddressOptionId(addressListboxId, activeAddressIndex)
            : undefined;
    const loadingStyle: CSSProperties | undefined =
        addressLoadingHeight === null ? undefined : { height: `${addressLoadingHeight}px` };

    const setClientError = (id: LocaleStringId) => {
        setError({ id: id, type: 'clientError' });
    };

    const setServerError = useCallback((id: LocaleStringId) => {
        setError({ id: id, type: 'serverError' });
    }, []);

    const resetError = () => {
        setError(null);
    };

    const resetAddressState = useCallback(() => {
        setActiveAddressIndex(null);
        setStatusMessage('');
        setAddressLoadingHeight(null);
        setAddressResultInput(null);
    }, []);

    const clearSearchResult = useCallback(() => {
        setIsAddressPopupOpen(false);
        setSearchResult(undefined);
        resetAddressState();
    }, [resetAddressState]);

    useEffect(() => {
        if (!activeAddressOptionId || activeAddressNavigationSource.current !== 'keyboard') {
            return;
        }

        document.getElementById(activeAddressOptionId)?.scrollIntoView?.({ block: 'nearest' });
    }, [activeAddressOptionId]);

    const runSearch = useMemo(
        () =>
            debounce((input: string) => {
                const searchId = activeSearchId.current + 1;
                activeSearchId.current = searchId;
                setError(null);
                setIsLoading(false);
                setAddressResultInput(null);

                fetchSearchClient(input, {
                    onAddressSearchStart: () => {
                        if (searchId === activeSearchId.current) {
                            const currentDropdownHeight =
                                addressDropdownRef.current?.getBoundingClientRect().height;
                            setAddressLoadingHeight(currentDropdownHeight || null);
                            setSearchResult(undefined);
                            setIsLoading(true);
                            setIsAddressPopupOpen(true);
                            setActiveAddressIndex(null);
                            setStatusMessage(searchLoadingText);
                        }
                    },
                }).then((result) => {
                    if (searchId !== activeSearchId.current) {
                        return;
                    }

                    setIsLoading(false);
                    setAddressLoadingHeight(null);

                    if (result.type === 'error') {
                        if (result.aborted) {
                            return;
                        }
                        clearSearchResult();
                        setServerError(result.messageId || 'errorServerError');
                    } else {
                        setSearchResult(result);
                        if (result.type === 'adresse') {
                            setIsAddressPopupOpen(true);
                            setActiveAddressIndex(null);
                            setStatusMessage(getAddressSuggestionsStatusMessage(result, locale));
                        } else {
                            setIsAddressPopupOpen(false);
                            setActiveAddressIndex(null);
                            setStatusMessage('');
                        }
                    }
                });
            }, 500),
        [clearSearchResult, locale, searchLoadingText, setServerError]
    );

    const cancelPendingSearch = useCallback(() => {
        activeSearchId.current += 1;
        abortSearchClient();
        runSearch.cancel?.();
        setIsLoading(false);
        resetAddressState();
    }, [resetAddressState, runSearch]);

    const closeAddressDropdown = useCallback(() => {
        cancelPendingSearch();
        setIsAddressPopupOpen(false);
        setSearchResult(undefined);
    }, [cancelPendingSearch]);

    const hideAddressPopup = useCallback(() => {
        if (isLoading) {
            cancelPendingSearch();
            setIsAddressPopupOpen(false);
            return;
        }

        setIsAddressPopupOpen(false);
        setActiveAddressIndex(null);
    }, [cancelPendingSearch, isLoading]);

    const handleInput = (submit: boolean, input: string) => {
        cancelPendingSearch();

        if (isEmptyInput(input)) {
            clearSearchResult();
        }

        if (!isValidNameQuery(input) && !isValidPostnrQuery(input) && Number.isNaN(Number(input))) {
            setClientError('errorInputValidationName');
            clearSearchResult();
            return;
        }

        if (!isValidInput(input)) {
            clearSearchResult();
            if (submit) {
                setClientError('errorInputValidationLength');
            } else {
                resetError();
            }
            return;
        }

        if (isValidPostnrQuery(input)) {
            runSearch(input);
            return;
        } else if (!Number.isNaN(Number(input))) {
            if (submit) {
                setClientError('errorInputValidationPostnr');
            } else {
                resetError();
            }
            return;
        }

        if (!isValidNameQuery(input)) {
            if (submit) {
                setClientError('errorInputValidationName');
            } else {
                resetError();
            }
            return;
        }

        runSearch(input);
    };

    const selectAddress = useCallback(
        (adresse: Adresse) => {
            const label = formatAddressLabel(adresse);
            const { bydelsnummer, kommunenummer } = adresse;

            setInputValue(label);
            closeAddressDropdown();
            resetError();
            setStatusMessage(localeString('addressSuggestionSelected', locale, [label]) as string);

            const geoid = bydelsnummer ?? kommunenummer;
            if (!geoid) {
                setSearchResult(undefined);
                setAddressResultInput(null);
                setStatusMessage('');
                setServerError('errorServerError');
                return;
            }

            const officeSearch = fetchGeoidClient(geoid);
            const searchId = activeSearchId.current + 1;
            activeSearchId.current = searchId;
            officeSearch.then((result) => {
                if (searchId !== activeSearchId.current) {
                    return;
                }

                setIsLoading(false);

                if (result.type === 'error') {
                    setSearchResult(undefined);
                    setAddressResultInput(null);
                    setStatusMessage('');
                    setServerError(result.messageId || 'errorServerError');
                } else {
                    setAddressResultInput(label);
                    setSearchResult(result);
                }
            });
        },
        [closeAddressDropdown, locale, setServerError]
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleInput(true, inputValue);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape' && isAddressDropdownOpen) {
            event.preventDefault();
            event.stopPropagation();
            hideAddressPopup();
            return;
        }

        if (event.key === 'Tab' && isAddressDropdownOpen) {
            hideAddressPopup();
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

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeAddressNavigationSource.current = 'keyboard';
            setActiveAddressIndex((current) =>
                current === null ? 0 : Math.min(current + 1, addressSuggestions.length - 1)
            );
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeAddressNavigationSource.current = 'keyboard';
            setActiveAddressIndex((current) =>
                current === null ? addressSuggestions.length - 1 : Math.max(current - 1, 0)
            );
        }
    };

    const handleAddressSelect = useCallback(
        (adresse: Adresse) => {
            selectAddress(adresse);
        },
        [selectAddress]
    );

    const handleAddressMouseEnter = useCallback((index: number) => {
        activeAddressNavigationSource.current = 'mouse';
        setActiveAddressIndex(index);
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

    const handleSearchFocus = useCallback(() => {
        scrollSearchFormToViewportTop();
        if (isAddressResult) {
            setIsAddressPopupOpen(true);
        }
    }, [isAddressResult, scrollSearchFormToViewportTop]);

    return (
        <div
            className={style.searchForm}
            ref={searchFormRef}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    hideAddressPopup();
                }
            }}
        >
            <form onSubmit={handleSubmit} className={style.searchField} autoComplete="off">
                <Search
                    variant="primary"
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
                        setInputValue(val);
                        handleInput(false, val);
                    }}
                    onClear={() => {
                        setInputValue('');
                        closeAddressDropdown();
                        resetError();
                    }}
                    error={error?.type === 'clientError' && <LocaleString id={error.id} />}
                />
            </form>
            {error?.type === 'serverError' && (
                <div className={style.error}>
                    <LocaleString id={error.id} />
                </div>
            )}
            {((isLoading && isAddressDropdownOpen) ||
                (searchResult && (!isAddressResult || isAddressDropdownOpen))) && (
                <div
                    ref={
                        searchResult?.type === 'adresse' || isLoading
                            ? addressDropdownRef
                            : undefined
                    }
                    className={style.searchResult}
                    data-result-type={isLoading ? 'adresse' : searchResult?.type}
                >
                    {isLoading ? (
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
                            <SearchResult
                                searchResult={searchResult}
                                onAddressSelect={handleAddressSelect}
                                onAddressMouseEnter={handleAddressMouseEnter}
                                activeAddressIndex={activeAddressIndex}
                                addressListboxId={addressListboxId}
                                addressSuggestionsLabel={addressSuggestionsLabel}
                                addressResultInput={addressResultInput}
                                input={inputValue}
                            />
                        )
                    )}
                </div>
            )}
            <div className="aksel-sr-only" aria-live="polite">
                {statusMessage}
            </div>
        </div>
    );
};
