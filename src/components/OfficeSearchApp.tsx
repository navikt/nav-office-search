import React from 'react';
import style from './OfficeSearchApp.module.css';
import { SearchForm } from './SearchForm/SearchForm';

export const OfficeSearchApp = () => {
    return (
        <div className={style.appContainer}>
            <SearchForm />
        </div>
    );
};
