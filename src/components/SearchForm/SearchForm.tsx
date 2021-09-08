import React, { useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import { SearchResultProps } from '../../types/searchResult';
import { abortSearchClient, fetchSearchClient } from '../../utils/clientFetch';
import { isPostnrQuery } from '../../utils/utils';
import { LocaleStringId } from '../../localization/nb-default';
import style from './SearchForm.module.css';

const validateInput = (input?: string): input is string =>
    !!(
        typeof input === 'string' &&
        input.length >= 2 &&
        (!Number(input) || isPostnrQuery(input))
    );

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [errorMsg, setErrorMsg] = useState<LocaleStringId | null>();
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInput = (submit: boolean) => {
        const input = inputRef.current?.value;

        if (validateInput(input)) {
            runSearch(input);
            return;
        }

        if (submit) {
            setErrorMsg('errorClientSideValidation');
        } else {
            setErrorMsg(null);
        }

        setIsLoading(false);
        abortSearchClient();
    };

    const runSearch = debounce((input: string) => {
        setIsLoading(true);
        setErrorMsg(null);

        fetchSearchClient(input).then((result) => {
            console.log('response:', result);
            if (result.type === 'error') {
                if (result.aborted) {
                    return;
                }
                setSearchResult(undefined);
                setErrorMsg(result.messageId);
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
                    />
                    {isLoading && (
                        <span className={style.loader}>
                            <BodyShort className={style.loaderText}>
                                {'Søker...'}
                            </BodyShort>
                            <Loader
                                size={'l'}
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
            {errorMsg && (
                <div className={style.error}>
                    <LocaleString id={errorMsg} />
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
