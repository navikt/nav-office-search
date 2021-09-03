import React, { useRef, useState } from 'react';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
import { LocaleString, LocaleStringId } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import { SearchResultProps } from '../../types/searchResult';
import { abortSearchClient, fetchSearchClient } from '../../clientFetch';
import style from './SearchForm.module.css';

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [errorMsg, setErrorMsg] = useState<LocaleStringId | null>();
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInput = (submit: boolean) => {
        const input = inputRef.current?.value;

        if (!input || input.length < 2) {
            setErrorMsg(null);
            setIsLoading(false);
            abortSearchClient();
            return;
        }

        // TODO: handle certain input errors to prevent unnecessary api-calls

        runSearch(input);
    };

    const runSearch = (input: string) => {
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
    };

    return (
        <div className={style.searchForm}>
            <div className={style.searchInput}>
                <TextField
                    label={<LocaleString id={'inputLabel'} />}
                    id={'search-input'}
                    className={style.searchField}
                    ref={inputRef}
                    onChange={() => handleInput(false)}
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
