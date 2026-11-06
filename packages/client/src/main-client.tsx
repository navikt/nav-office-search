import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { isAppLocale } from '../../common/localization/types';

const root = document.getElementById('maincontent') as HTMLElement;
const { lang } = document.documentElement;
const app = (
	<React.StrictMode>
		<App locale={isAppLocale(lang) ? lang : 'nb'} />
	</React.StrictMode>
);

// An element means the server rendered the app; whitespace or a comment alone would fail to hydrate
if (root.firstElementChild) {
	ReactDOM.hydrateRoot(root, app);
} else {
	ReactDOM.createRoot(root).render(app);
}
