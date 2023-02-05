import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppLocale } from '../common/localization/types';

ReactDOM.hydrateRoot(
    document.getElementById('app') as HTMLElement,
    <React.StrictMode>
        <App locale={document.documentElement.lang as AppLocale} />
    </React.StrictMode>
);
