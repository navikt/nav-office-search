import React, { useRef, useState } from 'react';
import { Button, TextField } from '@navikt/ds-react';
import { fetchPostnrResult } from '../../fetch/client/search-postnr';
import { SearchResultProps } from '../../types/searchResult';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';
import style from './SearchForm.module.css';

const isPostnrFormat = (postnr: string) => {
    return postnr && /\d{4}/.test(postnr);
};

export const SearchForm = () => {
    const [searchResult, setSearchResult] = useState<SearchResultProps>();
    const inputRef = useRef<HTMLInputElement>(null);

    const onChange = () => {
        const input = inputRef.current?.value;

        if (!input) {
            return;
        }

        if (isPostnrFormat(input)) {
            fetchPostnrResult(input).then((result) => {
                console.log('response:', result);
                setSearchResult(result);
            });
            return;
        }
    };

    return (
        <div className={style.searchForm}>
            <div className={style.searchInput}>
                <TextField
                    label={<LocaleString id={'inputLabel'} />}
                    id={'search-input'}
                    className={style.searchField}
                    ref={inputRef}
                    onChange={onChange}
                />
                <Button className={style.searchButton}>
                    <LocaleString id={'inputSubmit'} />
                </Button>
            </div>
            {searchResult && (
                <div className={style.searchResult}>
                    <SearchResult searchResult={searchResult} />
                </div>
            )}
        </div>
    );
};
