import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppLocale } from '../../common/localization/types';

const root = document.getElementById('maincontent') as HTMLElement;
const app = (
    <React.StrictMode>
        <App locale={document.documentElement.lang as AppLocale} />
    </React.StrictMode>
);

if (root.childNodes.length > 0) {
    ReactDOM.hydrateRoot(root, app);
} else {
    ReactDOM.createRoot(root).render(app);
}
