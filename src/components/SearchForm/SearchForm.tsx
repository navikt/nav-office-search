import React, { useRef, useState } from 'react';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
import { fetchPostnrResult } from '../../fetch/client/search-postnr';
import { SearchResultProps } from '../../types/searchResult';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import style from './SearchForm.module.css';

const isPostnrFormat = (postnr: string) => {
    return postnr && /^\d{4}$/.test(postnr);
};

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const runSearch = () => {
        const input = inputRef.current?.value;

        if (!input) {
            setErrorMsg('');
            return;
        }

        if (isPostnrFormat(input)) {
            setIsLoading(true);
            setErrorMsg('');
            fetchPostnrResult(input)
                .then((result) => {
                    console.log('response:', result);
                    if (result.error) {
                        setSearchResult(undefined);
                        setErrorMsg(result.message);
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
            return;
        }

        if (!isNaN(Number(input)) || input.length < 2) {
            setErrorMsg(
                'Skriv inn minst to bokstaver eller et postnummer (fire siffer)'
            );
            return;
        }

        setErrorMsg('');
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
            {errorMsg && <div className={style.error}>{errorMsg}</div>}
            {searchResult && (
                <div className={style.searchResult}>
                    <SearchResult searchResult={searchResult} />
                </div>
            )}
        </div>
    );
};
