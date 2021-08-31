import React, { useRef, useState } from 'react';
import style from './SearchForm.module.css';
import { Button, TextField } from '@navikt/ds-react';
import { fetchPostnrResult } from '../../fetch/client/search-postnr';
import { SearchHitProps, SearchResultProps } from '../../types/searchResult';
import { LocaleString } from '../../localization/LocaleString';
import { SearchResult } from '../SearchResult/SearchResult';

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
            fetchPostnrResult(input).then((hits) => {
                console.log('response:', hits);
                setSearchResult({
                    type: 'postnr',
                    postnr: input,
                    poststed: 'test',
                    postnrType: 's',
                    hits,
                });
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
