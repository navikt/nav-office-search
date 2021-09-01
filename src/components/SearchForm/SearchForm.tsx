import React, { useRef, useState } from 'react';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
import { LocaleString, LocaleStringId } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import style from './SearchForm.module.css';
import { SearchResultProps } from '../../types/searchResult';
import { fetchSearchResult } from '../../fetch/client/search';

const isPostnrFormat = (postnr: string) => {
    return postnr && /^\d{4}$/.test(postnr);
};

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<LocaleStringId | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const runSearch = () => {
        const input = inputRef.current?.value;

        if (!input) {
            setErrorMsg(null);
            return;
        }

        if (Number(input) && !isPostnrFormat(input)) {
            setErrorMsg('errorInvalidPostnr');
            return;
        }

        setIsLoading(true);
        setErrorMsg(null);

        fetchSearchResult(input)
            .then((result) => {
                console.log('response:', result);
                if (result.type === 'error') {
                    setSearchResult(undefined);
                    setErrorMsg(result.messageId);
                } else {
                    setSearchResult(result);
                }
            })
            .catch((e) => {
                console.error(e);
                setErrorMsg(e);
            })
            .finally(() => {
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
                    onChange={runSearch}
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
                <Button className={style.searchButton} onClick={runSearch}>
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
