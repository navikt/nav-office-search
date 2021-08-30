import React, { useRef, useState } from 'react';
import style from './SearchForm.module.css';
import { Button, TextField } from '@navikt/ds-react';
import { ResultDropdown } from './ResultDropdown/ResultDropdown';
import { fetchPostnrResult } from '../../fetch/client/search-postnr';
import { SearchHitProps } from '../../types/searchHitProps';
import { LocaleString } from '../../localization/LocaleString';

const isPostnrFormat = (postnr: string) => {
    return postnr && /\d{4}/.test(postnr);
};

export const SearchForm = () => {
    const [searchHits, setSearchHits] = useState<SearchHitProps[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const onChange = () => {
        const input = inputRef.current?.value;

        if (!input) {
            return;
        }

        if (isPostnrFormat(input)) {
            fetchPostnrResult(input).then((hits) => {
                console.log('response:', hits);
                setSearchHits(hits);
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
            {searchHits.length > 0 && (
                <div className={style.searchResults}>
                    {searchHits.map((hit) => (
                        <div>{hit.hitString}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
