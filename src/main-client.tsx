import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppLocale } from '../common/localization/types';

const container = document.getElementById('maincontent') as HTMLElement;
const app = (
    <React.StrictMode>
        <App locale={document.documentElement.lang as AppLocale} />
    </React.StrictMode>
);

if (container.hasChildNodes()) {
    ReactDOM.hydrateRoot(container, app);
} else {
    ReactDOM.createRoot(container).render(app);
}
