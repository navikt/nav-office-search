import React, { useState } from 'react';
import debounce from 'lodash.debounce';
import { Search } from '@navikt/ds-react';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import { Adresse, SearchResultProps } from '../../../../common/types/results';
import { abortSearchClient, fetchGeoidClient, fetchSearchClient } from '../../utils/fetch';
import { LocaleStringId, SearchError } from '../../../../common/localization/types';
import { isValidNameQuery, isValidPostnrQuery } from '../../../../common/validateInput';

import style from './SearchForm.module.css';

const isEmptyInput = (input: string): boolean => input.length === 0;

const isValidInput = (input: string): boolean => input.length >= 2;

export const SearchForm = () => {
    const [inputValue, setInputValue] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [error, setError] = useState<SearchError | null>();

    const setClientError = (id: LocaleStringId) => {
        setError({ id: id, type: 'clientError' });
    };

    const setServerError = (id: LocaleStringId) => {
        setError({ id: id, type: 'serverError' });
    };

    const resetError = () => {
        setError(null);
    };

    const handleInput = (submit: boolean, input: string) => {
        abortSearchClient();
        runSearch.cancel?.();

        if (isEmptyInput(input)) {
            setSearchResult(undefined);
        }

        if (!isValidInput(input)) {
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
        } else if (!isNaN(Number(input))) {
            if (submit) {
                setClientError('errorInputValidationPostnr');
            } else {
                resetError();
            }
            return;
        }

        runSearch(input);
    };

    const runSearch = debounce((input: string) => {
        resetError();

        fetchSearchClient(input).then((result) => {
            if (result.type === 'error') {
                if (result.aborted) {
                    return;
                }
                setSearchResult(undefined);
                setServerError(result.messageId || 'errorServerError');
            } else {
                setSearchResult(result);
            }
        });
    }, 500);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleInput(true, inputValue);
    };

    const handleAddressSelect = (adresse: Adresse) => {
        const {
            adressenavn,
            husnummer,
            husbokstav,
            postnummer,
            poststed,
            bydelsnummer,
            kommunenummer,
        } = adresse.vegadresse;
        const label = `${adressenavn} ${husnummer}${husbokstav ?? ''}, ${postnummer} ${poststed}`;

        setInputValue(label);
        runSearch.cancel?.();
        abortSearchClient();
        resetError();

        const geoid = bydelsnummer ?? kommunenummer;
        fetchGeoidClient(geoid).then((result) => {
            if (result.type === 'error') {
                setSearchResult(undefined);
                setServerError(result.messageId || 'errorServerError');
            } else {
                setSearchResult(result);
            }
        });
    };

    return (
        <div className={style.searchForm}>
            <form onSubmit={handleSubmit} className={style.searchField}>
                <Search
                    variant="primary"
                    hideLabel={false}
                    label={<LocaleString id={'inputLabel'} />}
                    id="search-input"
                    autoComplete="off"
                    value={inputValue}
                    onChange={(val) => {
                        setInputValue(val);
                        handleInput(false, val);
                    }}
                    onClear={() => {
                        setInputValue('');
                        setSearchResult(undefined);
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
            {searchResult && (
                <div className={style.searchResult}>
                    <SearchResult
                        searchResult={searchResult}
                        onAddressSelect={handleAddressSelect}
                    />
                </div>
            )}
        </div>
    );
};
