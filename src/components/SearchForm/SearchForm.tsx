import React, { useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import { SearchResultProps } from '../../../common/types/results';
import { abortSearchClient, fetchSearchClient } from '../../utils/fetch';
import {
    LocaleStringId,
    SearchError,
} from '../../../common/localization/types';
import {
    isValidNameQuery,
    isValidPostnrQuery,
} from '../../../common/validateInput';

import style from './SearchForm.module.css';

const isValidInput = (input?: string): input is string =>
    typeof input === 'string' && input.length >= 2;

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [error, setError] = useState<SearchError | null>();
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const setClientError = (id: LocaleStringId) => {
        setError({ id: id, type: 'clientError' });
    };

    const setServerError = (id: LocaleStringId) => {
        setError({ id: id, type: 'serverError' });
    };

    const resetError = () => {
        setError(null);
    };

    const handleInput = (submit: boolean) => {
        const input = inputRef.current?.value;

        setIsLoading(false);
        abortSearchClient();

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

        if (!isValidNameQuery(input)) {
            setClientError('errorInputValidationName');
            return;
        }

        runSearch(input);
    };

    const runSearch = debounce((input: string) => {
        setIsLoading(true);
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

            setIsLoading(false);
        });
    }, 500);

    return (
        <div className={style.searchForm}>
            <div className={style.searchInput}>
                <div className={style.searchFieldContainer}>
                    <TextField
                        label={<LocaleString id={'inputLabel'} />}
                        id={'search-input'}
                        className={style.searchField}
                        ref={inputRef}
                        onChange={() => handleInput(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleInput(true);
                            }
                        }}
                        error={
                            error?.type === 'clientError' && (
                                <LocaleString id={error.id} />
                            )
                        }
                    />
                    {isLoading && (
                        <span className={style.loader}>
                            <BodyShort className={style.loaderText}>
                                {'Søker...'}
                            </BodyShort>
                            <Loader
                                size={'large'}
                                variant={'interaction'}
                                title={'Søker...'}
                            />
                        </span>
                    )}
                </div>
                <Button
                    className={style.searchButton}
                    onClick={() => handleInput(true)}
                >
                    <LocaleString id={'inputSubmit'} />
                </Button>
            </div>
            {error?.type === 'serverError' && (
                <div className={style.error}>
                    <LocaleString id={error.id} />
                </div>
            )}
            {searchResult && (
                <div className={style.searchResult}>
                    <SearchResult searchResult={searchResult} />
                </div>
            )}
        </div>
    );
};
