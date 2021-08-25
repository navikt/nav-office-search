import React, { useRef } from 'react';
import style from './SearchForm.module.css';
import { Button, TextField } from '@navikt/ds-react';
import { objectToQueryString } from '../../fetch/utils';

const apiUrl = `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/search`;

export const SearchForm = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const onChange = () => {
        fetch(
            `${apiUrl}${objectToQueryString({
                postnr: inputRef.current?.value,
            })}`
        )
            .then((res) => res.json())
            .then((json) => console.log(json));
    };

    return (
        <div className={style.searchForm}>
            <TextField
                label={'Søk etter NAV-kontor:'}
                id={'search-input'}
                className={style.searchField}
                ref={inputRef}
                onChange={onChange}
            />
            <Button className={style.searchButton}>{'Søk'}</Button>
        </div>
    );
};
