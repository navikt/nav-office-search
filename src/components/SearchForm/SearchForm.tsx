import React, { useRef, useState } from 'react';
import { BodyShort, Button, Loader, TextField } from '@navikt/ds-react';
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
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const onChange = () => {
        const input = inputRef.current?.value;

        if (!input) {
            return;
        }

        if (isPostnrFormat(input)) {
            setIsLoading(true);
            fetchPostnrResult(input)
                .then((result) => {
                    console.log('response:', result);
                    setSearchResult(result);
                    setIsLoading(false);
                })
                .catch((e) => {
                    console.error(e);
                })
                .finally(() => {
                    setIsLoading(false);
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
